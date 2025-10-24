import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Feedback extends Document {
  @Prop({ type: Types.ObjectId, ref: 'OrderItem', required: true })
  OrderItem: Types.ObjectId;

  @Prop({ type: Number, min: 1, max: 5, required: true })
  rating: number;

  @Prop({ type: String, trim: true })
  comment: string;

  @Prop({ type: Date, default: Date.now })
  date: Date;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'ImageFeedback' }] }) // tham chiếu (ref) đến bảng (collection) Product
  listImageFeedback: Types.ObjectId[];
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);

FeedbackSchema.virtual('id').get(function (this: any) {
  return this._id.toString();
});

FeedbackSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
  },
});
