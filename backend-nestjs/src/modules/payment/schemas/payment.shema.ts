import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentMethod } from '../enums/payment-method.enum';
export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  order: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(PaymentMethod), required: true })
  paymentMethod: PaymentMethod;

  @Prop({ type: Date, default: Date.now })
  paymentDate: Date;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: Boolean, default: false })
  status: boolean;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.virtual('id').get(function (this: any) {
  return this._id.toString();
});

PaymentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc: any, ret: any) => {
    delete ret._id;
  },
});
