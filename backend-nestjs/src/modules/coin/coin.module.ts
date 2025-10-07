import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Coin, CoinSchema } from './schemas/coin.shema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Coin.name, schema: CoinSchema }]),
  ],
  exports: [MongooseModule],
})
export class CoinModule {}
