import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Product, ProductSchema } from './schemas/product.schema';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

import { ImageProduct, ImageProductSchema } from '../imageProduct/schemas/image-product.shema';
import { ProductSize, ProductSizeSchema } from '../productSize/schemas/product-size.schema';
import { Category, CategorySchema } from '../category/schemas/category.shema';
import { UploadImageModule } from '../uploadImage/uploadImage.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name,      schema: ProductSchema },
      { name: ImageProduct.name, schema: ImageProductSchema },
      { name: ProductSize.name,  schema: ProductSizeSchema },
      { name: Category.name,     schema: CategorySchema },
    ]),
    forwardRef(() => UploadImageModule),
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
