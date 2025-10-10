import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document; 

@Schema({ timestamps: true }) 
export class Category {
  @Prop({ required: true }) 
  categoryName: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }] }) 
  listProduct: Types.ObjectId[];
  @Prop({ type: Boolean, default: true }) 
  isActive: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category); 

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
