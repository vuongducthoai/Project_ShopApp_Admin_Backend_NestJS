import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query, Delete, Body, Post, Patch, Res } from "@nestjs/common";
import { UserService } from "./user.service";
import {User} from './schemas/user.schema';
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import  type { Response } from 'express';

@Controller('users')
export class UserController{
    constructor(private readonly userService: UserService){}

    @Get()
    async findAll(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('search') search?: string,
        @Query('role') role?: string,
        @Query('status') status?: string,
    ){
        return this.userService.findAll({page, limit, search, role, status});
    }

     @Get('export')
    async export (
       @Res() res: Response, // Inject response object
       @Query('search') search?: string,
       @Query('role') role?: string,
       @Query('status') status?: string,
    ){
        const csvData = await this.userService.export({ search, role, status });
        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', 'attachment; filename="users.csv"');

         res.send(csvData);
    }
    

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<User> {
        return this.userService.findOne(id);
    }

    @Delete(':id')
    async softDelete(@Param('id') id: string) {
        return this.userService.softDelete(id);
    }

    @Post()
    async create(@Body() CreateUserDto: CreateUserDto){
        return this.userService.create(CreateUserDto);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto){
        return this.userService.update(id, updateUserDto);
    }

   
}