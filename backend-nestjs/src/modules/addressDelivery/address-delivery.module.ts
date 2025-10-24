// feedback.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AddressDelivery, AddressDeliverySchema } from './schemas/address-delivery.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AddressDelivery.name, schema: AddressDeliverySchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class FeedbackModule {}
