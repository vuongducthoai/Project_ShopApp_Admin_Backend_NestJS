// product-size.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductSize, ProductSizeSchema } from './schemas/product-size.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductSize.name, schema: ProductSizeSchema },
    ]),
  ],
exports: [MongooseModule],
})
export class ProductSizeModule {}
