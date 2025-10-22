import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus } from '../enums/order-status.enum';
@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: [{ type: Types.ObjectId, ref: 'OrderItem' }] })
  orderItems: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.ORDERED,
  })
  orderStatus: OrderStatus;

  @Prop({ type: Date, default: Date.now })
  orderDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'AddressDelivery', required: true })
  addressDelivery: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Coupon' })
  coupon: Types.ObjectId;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.virtual('id').get(function (this: any) {
  return this._id.toString();
});

OrderSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
  },
});
