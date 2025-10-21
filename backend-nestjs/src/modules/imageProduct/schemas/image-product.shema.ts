import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ImageProduct extends Document {
  @Prop({ type: String })
  imageProduct: string;

  @Prop({ type: Types.ObjectId, ref: 'Product' })
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

