// src/user/user.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

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
  ) {}

  async findAll(options: PaginationOptions) {
    const { page, limit, search, role, status } = options;
    const skip = (page - 1) * limit
    const query: FilterQuery<UserDocument> = {};

    if(search){
        //Case-insensitive search across multiple fields
        query.$or = [
            { firstName: { $regex: search, $options: 'i' } },
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
        .select('firstName lastName email phoneNumber gender role status')
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
      .select('firstName lastName email phoneNumber gender role image status')
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }
}