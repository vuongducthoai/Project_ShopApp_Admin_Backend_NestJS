import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { UserService } from "./user.service";
import {User} from './schemas/user.schema';

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

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<User> {
        return this.userService.findOne(id);
    }
}