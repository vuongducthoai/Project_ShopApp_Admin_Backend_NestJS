import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document; //Dùng trong Service/Repository để chỉ rõ kiểu trả về khi query.

@Schema({ timestamps: true }) //Tự động thêm 2 field createdAt và updatedAt.
export class Category {
  @Prop({ required: true }) // Bắt buộc phải có tên danh mục (categoryName)
  categoryName: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }] }) // tham chiếu (ref) đến bảng (collection) Product
  listProduct: Types.ObjectId[];
}

export const CategorySchema = SchemaFactory.createForClass(Category); // Biến class Category thành Mongoose Schema.

// Virtual id
CategorySchema.virtual('id').get(function (this: any) {
  return this._id.toString();
});

// Tùy chỉnh JSON
CategorySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: any) => {
    delete ret._id;
  },
});
