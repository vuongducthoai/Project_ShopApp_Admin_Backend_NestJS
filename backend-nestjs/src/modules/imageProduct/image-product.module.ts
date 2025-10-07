import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ImageProduct,
  ImageProductSchema,
} from './schemas/image-product.shema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ImageProduct.name, schema: ImageProductSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class ImageProductModule {}
