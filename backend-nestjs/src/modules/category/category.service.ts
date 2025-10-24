import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.shema';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  // ✅ Lấy tất cả category (không phân trang)
// ✅ Lấy tất cả category (chỉ trả về id và categoryName)
    async findAll() {
    return this.categoryModel
        .find({}, 'categoryName',)  // chỉ chọn trường categoryName
        .sort({ createdAt: -1 })   // sắp xếp theo thời gian tạo (mới nhất trước)               // bỏ metadata Mongoose, trả object JS thường
        .exec();                   // thực thi truy vấn
    }
    
    async findAlls(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const totalCategories = await this.categoryModel.countDocuments(); // Đếm tổng số danh mục
    const categories = await this.categoryModel
      .find({}, 'categoryName')  // Chỉ lấy trường categoryName
      .skip(skip)               // Bỏ qua các mục trước đó
      .limit(limit)             // Giới hạn số mục
      .sort({ createdAt: -1 })   // Sắp xếp theo thời gian tạo (mới nhất trước)
      .exec();                  // Thực thi truy vấn

    return { categories, totalPages: Math.ceil(totalCategories / limit) };
  }

}
