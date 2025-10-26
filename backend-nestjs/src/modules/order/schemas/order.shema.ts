import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus } from '../enums/order-status.enum';
import { PaymentMethod } from '../enums/payment-method.enum';


// Interface for pending items
export interface IOrderPendingItem {
  productId: Types.ObjectId;
  productName: string;
  size: string;
  quantity: number;
  price: number;
  image?: string;
}

// Subdocument schema for pending items
@Schema({ _id: false })
export class OrderPendingItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: String, required: true })
  productName: string;

  @Prop({ type: String, required: true })
  size: string;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ type: String })
  image?: string;
}

export const OrderPendingItemSchema = SchemaFactory.createForClass(OrderPendingItem);

export type OrderDocument = Order & Document;

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

  @Prop({ type: [OrderPendingItemSchema], default: [] })
  pendingItems: OrderPendingItem[];

  @Prop({ type: Types.ObjectId, ref: 'Payment' })
  payment?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AddressDelivery', required: true })
  addressDelivery: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Coupon' })
  coupon?: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: Object.values(PaymentMethod), 
    required: true 
  })
  paymentMethod: PaymentMethod;

  @Prop({ type: Boolean, default: false })
  isPaid: boolean;

  @Prop({ type: Date })
  paidAt?: Date;

  @Prop({ type: Number, required: true })
  calculatedSubtotal: number;

  @Prop({ type: Number, required: true, default: 0 })
  calculatedDiscountValue: number;

  @Prop({ type: Number, required: true, default: 0 })
  calculatedCoinsApplied: number;

  @Prop({ type: Number, required: true, default: 0 })
  calculatedCoinValue: number;

  @Prop({ type: Number, required: true })
  calculatedTotalPrice: number;

  @Prop({ type: String })
  vnpTransactionNo?: string;

  @Prop({ type: String, required: false })
  cancellationReason?: string;
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