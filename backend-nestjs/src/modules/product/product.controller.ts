import { Controller, Get } from '@nestjs/common';
import { ProductService } from './product.service';
import { Product } from './schemas/product.schema';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('')
  async getAllProducts(): Promise<Product[]> {
    return this.productService.findAll();
  }
}
