import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from 'src/modules/product/schemas/product.schema';
import { Size } from '../enums/size.enum';

export type ProductSizeDocument = ProductSize & Document;

@Schema({ timestamps: true })
export class ProductSize {
  @Prop({ type: Types.ObjectId, ref: Product.name, required: true })
  product: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(Size), required: true })
  size: Size;

  @Prop({ type: Number, required: true, min: 0 })
  quantity: number;
}

// Create schema from class
export const ProductSizeSchema = SchemaFactory.createForClass(ProductSize);

ProductSizeSchema.virtual('id').get(function (this: any) {
  return this._id.toString();
});

ProductSizeSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: any) => {
    delete ret._id;
  },
});
