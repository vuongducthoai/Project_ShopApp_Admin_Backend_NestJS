import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ImageProduct extends Document {
  @Prop({ type: String, required: true })
  imageProduct: string;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;
}

export const ImageProductSchema = SchemaFactory.createForClass(ImageProduct);

ImageProductSchema.virtual('id').get(function (this: any) {
  return this._id.toString();
});

ImageProductSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
  },
});

