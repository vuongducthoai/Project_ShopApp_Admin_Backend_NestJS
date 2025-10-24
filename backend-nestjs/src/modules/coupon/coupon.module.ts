import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { Coupon, CouponSchema } from'./schemas/coupon.schema';
import { NotificationModule } from '../notification/notification.module';
import { Order, OrderSchema } from '../order/schemas/order.shema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Coupon.name, schema: CouponSchema }, 
      { name: Order.name, schema: OrderSchema }
    ]),
    
    NotificationModule
  ],
  controllers: [CouponController],
  providers: [CouponService],
  exports: [CouponService],
})
export class CouponModule {}
