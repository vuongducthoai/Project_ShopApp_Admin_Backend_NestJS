import { Body, Controller, Get, Post, Query, BadRequestException,Patch,Param } from '@nestjs/common';
import { CategoryService } from './category.service';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async getAlls(@Query('page') page: string = '1', @Query('limit') limit: string = '10') {
    const categories = await this.categoryService.findAlls(Number(page), Number(limit));
    return categories;
  }

}
