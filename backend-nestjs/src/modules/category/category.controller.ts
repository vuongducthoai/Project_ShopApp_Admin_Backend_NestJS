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
   // ✅ Thêm mới category
  @Post()
  async createCategory(@Body('categoryName') categoryName: string) {
    // Validate FE có rồi, nhưng BE vẫn phải kiểm tra
    if (!categoryName?.trim()) {
      throw new BadRequestException('Category name is required');
    }

    // regex chỉ cho phép chữ cái, số, khoảng trắng
    const regex = /^[a-zA-Z0-9\sÀ-ỹ]+$/;
    if (!regex.test(categoryName)) {
      throw new BadRequestException('Category name contains invalid characters');
    }

    return this.categoryService.create({ categoryName });
  }
  // ✅ Thêm API cập nhật danh mục
  @Patch(':id')
  async updateCategory(
    @Param('id') id: string,
    @Body('categoryName') categoryName: string,
  ) {
    if (!categoryName?.trim()) {
      throw new BadRequestException('Category name is required');
    }
    const regex = /^[a-zA-Z0-9\sÀ-ỹ]+$/;
    if (!regex.test(categoryName)) {
      throw new BadRequestException('Category name contains invalid characters');
    }

    const updated = await this.categoryService.update(id, { categoryName });
    if (!updated) throw new BadRequestException('Category not found');
    return { message: 'Category updated successfully' };
  }
}
