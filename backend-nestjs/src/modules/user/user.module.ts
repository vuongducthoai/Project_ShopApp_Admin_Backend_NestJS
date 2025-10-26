import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { Coin, CoinSchema } from '../coin/schemas/coin.shema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema },
      { name: Coin.name, schema: CoinSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
