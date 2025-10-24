import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CoinUsage, CoinUsageSchema } from './schemas/coin-usage.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CoinUsage.name, schema: CoinUsageSchema }]),
  ],
  exports: [MongooseModule],
})
export class CoinModule {}
