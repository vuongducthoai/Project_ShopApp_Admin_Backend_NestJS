import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductModule } from './modules/product/product.module';
import { CategoryModule } from './modules/category/category.module';
import { CoinModule } from './modules/coin/coin.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { ImageFeedbackModule } from './modules/imageFeedback/image-feedback.module';
import { ImageProductModule } from './modules/imageProduct/image-product.module';
import { OrderItemModule } from './modules/orderItem/orderItem.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ProductSizeModule } from './modules/productSize/product-size.module';
import { UserModule } from './modules/user/user.module';
import { NotificationModule } from './modules/notification/notification.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
    }),
    UserModule,
    ProductModule,
    CategoryModule,
    CoinModule,
    CouponModule,
    FeedbackModule,
    ImageFeedbackModule,
    ImageProductModule,
    OrderItemModule,
    PaymentModule,
    ProductSizeModule,
    NotificationModule
  ],
})
export class AppModule {}