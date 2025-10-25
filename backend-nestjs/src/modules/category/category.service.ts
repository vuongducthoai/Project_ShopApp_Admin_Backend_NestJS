
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.shema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';


@Injectable()
export class CategoryService {
  constructor(

    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  // ✅ Lấy tất cả category (không phân trang)
// ✅ Lấy tất cả category (chỉ trả về id và categoryName)
    async findAll1() {
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



  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const newCategory = new this.categoryModel(createCategoryDto);
    return await newCategory.save();
  }

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find().populate('listProduct').exec();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).populate('listProduct').exec();
    if (!category) throw new NotFoundException(`Category with id ${id} not found`);
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {

    const updated = await this.categoryModel.findByIdAndUpdate(
      id,
      { $set: updateCategoryDto },
      { new: true },
    );
    if (!updated) throw new NotFoundException(`Category with id ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.categoryModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException(`Category with id ${id} not found`);
    return { message: 'Category deleted successfully' };
  }


  async changeTheState(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id);
    if (!category) throw new NotFoundException('Category not found')
    category.isActive = !category.isActive;
    return await category.save();
  }

}
