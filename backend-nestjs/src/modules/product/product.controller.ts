import { Controller, Get,Put, Post, Query, Body,Param, UploadedFiles, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { ProductRequestDTO } from './dto/requestDTO/productRequestDTO';
import { Product } from './schemas/product.schema';
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  
   @Get("/all")
  async getAllProduct(
    @Query('page') page: string = '1', // mặc định page = 1
    @Query('limit') limit: string = '10', // mặc định limit = 10
    @Query('searchTerm') searchTerm: string = '', // Tìm kiếm theo từ khóa
    @Query('filterStatus') filterStatus: string = 'all', // Bộ lọc trạng thái
  ): Promise<any> {
    return this.productService.findAllPage(
      Number(page),
      Number(limit),
      searchTerm,
      filterStatus
    );
  }
  // ✅ Create product
  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Chỉ cho phép file ảnh'), false);
        }
        cb(null, true);
      },
    }),
  )
  async createProduct(@Body() body: any, @UploadedFiles() images: Express.Multer.File[]) {
    // ✅ LOG AN TOÀN
    console.log('🧾 BODY:', body);
    console.log(
      '📷 FILES:',
      (images || []).map(f => ({
        fieldname: f.fieldname,
        originalname: f.originalname,
        size: f.size,
        mimetype: f.mimetype,
      }))
    );

    if (!body.productName) throw new BadRequestException('Thiếu productName');
    if (!body.categoryId) throw new BadRequestException('Thiếu categoryId');
    if (body.price === undefined) throw new BadRequestException('Thiếu price');

    let productSizesParsed: any[] | undefined;
    if (body.productSizes) {
      try {
        productSizesParsed = JSON.parse(body.productSizes);
        if (!Array.isArray(productSizesParsed)) throw new Error();
      } catch {
        throw new BadRequestException('productSizes không hợp lệ (JSON array)');
      }
    }

    const dto: ProductRequestDTO = {
      productName: body.productName,
      categoryId: body.categoryId,
      description: body.description || '',
      price: Number(body.price) || 0,
      productSizes: productSizesParsed,
    };

    console.log('✅ DTO:', dto);

    // ✅ PHẢI RETURN để Nest trả response
    return this.productService.create(dto, images || []);
  }
   // Lấy thông tin sản phẩm theo ID
  @Get(':id')
  async getProductById(@Param('id') id: string): Promise<any> {
    return this.productService.findById(id);
  }

  
   @Put(':id')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      limits: { fileSize: 5 * 1024 * 1024 }, // Max file size 5MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async updateProduct(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
     console.log('BODY:', body);
    console.log(
      'FILES:',
      (images || []).map(f => ({
        fieldname: f.fieldname,
        originalname: f.originalname,
        size: f.size,
        mimetype: f.mimetype,
      }))
    );
    const deletedImageIds = body.deletedImageIds ? JSON.parse(body.deletedImageIds) : [];
    const productSizes = body.productSizes ? JSON.parse(body.productSizes) : [];

    const dto: ProductRequestDTO = {
      productName: body.productName,
      categoryId: body.categoryId,
      description: body.description || '',
      price: Number(body.price) || 0,
      productSizes: productSizes,
      deletedImageIds: deletedImageIds,
    };
    console.log("dto: "+ dto)
    console.log("id: "+ id)
    return this.productService.update(id, dto, images);
  }
 //PUT endpoint to update the status




  @Put(':id/status')
  async updateProductStatus(@Param('id') id: string, @Body() body: { status: boolean }) {
    const updatedProduct = await this.productService.updateProductStatus(id);
    return updatedProduct;
  }

  @Get('')
  async getAllProducts(): Promise<Product[]> {
    return this.productService.findAll();
  }
}
