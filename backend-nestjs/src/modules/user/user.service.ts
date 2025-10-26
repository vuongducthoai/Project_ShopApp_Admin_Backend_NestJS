// src/user/user.service.ts

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { User, UserDocument  } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as Papa from 'papaparse'
import { Coin, CoinDocument } from '../coin/schemas/coin.shema';

interface PaginationOptions {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  status?: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Coin.name) private coinModel: Model<CoinDocument>,
  ) {}

  async findAll(options: PaginationOptions) {
    const { page, limit, search, role, status } = options;
    const skip = (page - 1) * limit
    const query: FilterQuery<UserDocument> = {};

    if(search){
        //Case-insensitive search across multiple fields
        query.$or = [
            { firstName: { $regex: search, $options: 'i' } }, // i (case-insensitive)
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      query.status = status;
    }

    const [data, total] = await Promise.all([
    this.userModel
        .find(query)
        .select('id firstName lastName email phoneNumber gender role status')
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments().exec(),
    ]);

     return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  
  async findOne(id: string): Promise<User> {
    const user = await this.userModel
      .findById(id)
      .select('id firstName lastName email phoneNumber gender role image status')
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async softDelete(id: string): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { status: false }, 
      { new: true }, 
    );

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }


  async create(createUserDto: CreateUserDto) : Promise<User>{
    try{
     
      const newUser = new this.userModel(createUserDto);
      
      const coin = new this.coinModel({User: newUser._id,
      value: 0,})
      await coin.save();
      return await newUser.save();
    }catch(error){
      if(error.code === 11000){
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }


  async update(id: string, UpdateUserDto: UpdateUserDto) : Promise<User>{
    const updateUser = await this.userModel.findByIdAndUpdate(id, UpdateUserDto, {new: true});
    if(!updateUser){
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return updateUser;
  }

  async export(options: {search?: string; role?: string; status?:string}){
    const {search, role, status} = options;
    const query: FilterQuery<UserDocument> = {};

    if(search){
        query.$or = [
          {firstName: {$regex: search, $option:'i'}},
          {lastName: {$regex: search, $option: 'i'}},
          {email: {$regres: search, $option: 'i'}}
        ]
    }
    if(role) {
      query.role = role;
    }

    if(status){
      query.status = status;
    }

    const users = await this.userModel.find(query)
      .select('id firstName lastName email phoneNumber gender role status')
      .lean()
      .exec();

  if(users.length === 0){
    return '';
  }

  //Bien doi du lieu
  const transformedUsers = users.map(user => {
    //Return object new with field gender changed
    return {
      ...user, 
      gender: user.gender ? 'Male' : 'Female',
      status: user.status ? 'Active' : 'Banned'
    }
  })

  const csv = Papa.unparse(transformedUsers); // Convert array JSON into CSV
  return csv;

  }
}