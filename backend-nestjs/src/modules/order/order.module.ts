import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.shema';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Payment, PaymentSchema } from '../payment/schemas/payment.shema';
import { OrderItem, OrderItemSchema } from '../orderItem/schemas/order-item.shema';
import { AddressDelivery } from '../addressDelivery/schemas/address-delivery.schema';
import { Product, ProductSchema } from '../product/schemas/product.schema';
import { ProductSize, ProductSizeSchema } from '../productSize/schemas/product-size.schema';
import { CoinUsage, CoinUsageSchema } from '../coinUsage/schemas/coin-usage.schema';
import { Coin, CoinSchema } from '../coin/schemas/coin.shema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Product.name, schema: ProductSchema },
      { name: ProductSize.name, schema: ProductSizeSchema },
      { name: CoinUsage.name, schema: CoinUsageSchema },
       { name: Coin.name, schema: CoinSchema },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
