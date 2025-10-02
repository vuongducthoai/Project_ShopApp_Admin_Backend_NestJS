import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderItem, OrderItemSchema } from './schemas/order-item.shema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: OrderItem.name, schema: OrderItemSchema }]),
  ],
  exports: [MongooseModule],
})
export class OrderItemModule {}
