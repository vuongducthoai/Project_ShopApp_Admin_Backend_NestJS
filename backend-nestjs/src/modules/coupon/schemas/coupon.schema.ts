import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CounponDocument = Coupon & DocumentFragment;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true, trim: true })
  code: string;

  @Prop({ required: true })
  discountValue: number;

  @Prop()
  maxDiscount?: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  usedCount: number;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  order: Types.ObjectId;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

// Virtual id
CouponSchema.virtual('id').get(function (this: any) {
  return this._id.toString();
});

//JSON transform
CouponSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: any) => {
    delete ret._id;
  },
});
