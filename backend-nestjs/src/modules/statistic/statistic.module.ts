import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatisticService } from './statistic.service';
import { StatisticController } from './statistic.controller';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Order, OrderSchema } from '../order/schemas/order.shema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [StatisticController],
  providers: [StatisticService],
})
export class StatisticModule {}
