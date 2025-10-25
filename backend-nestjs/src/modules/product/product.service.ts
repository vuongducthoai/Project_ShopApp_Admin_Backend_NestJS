import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Fuse from 'fuse.js';

import { Product } from './schemas/product.schema';
import { ImageProduct } from '../imageProduct/schemas/image-product.shema';
import { ProductSize } from '../productSize/schemas/product-size.schema';
import { Category } from '../category/schemas/category.shema'; // hoặc .schema nếu file bạn dùng .schema
import { ProductResponseDTO } from './dto/responseDTO/productResponseDTO';
import { ProductRequestDTO } from './dto/requestDTO/productRequestDTO';
import { UploadService } from '../uploadImage/upload.service';

@Injectable()
export class ProductService {
  
   constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(ImageProduct.name) private readonly imageProductModel: Model<ImageProduct>,
    @InjectModel(ProductSize.name) private readonly productSizeModel: Model<ProductSize>,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    private readonly uploadService: UploadService,
  ) {}
   // Tìm sản phẩm theo ID
  async findById(id: string): Promise<any> {
    const product = await this.productModel
      .findById(id)
      .populate('category')
      .populate('productSizes')
      .populate('listImage')
      .exec();

    if (!product) throw new BadRequestException('Sản phẩm không tồn tại');
    return product;
  }

  async update(id: string, dto: ProductRequestDTO, images: Express.Multer.File[]): Promise<any> {
  // Tìm sản phẩm theo id
  const product = await this.productModel.findById(id).exec();
  if (!product) throw new BadRequestException('Product not found');

  // Cập nhật thông tin sản phẩm
  product.productName = dto.productName || product.productName;
  product.description = dto.description || product.description;
  product.price = dto.price || product.price;
  product.category = new Types.ObjectId(dto.categoryId) || product.category;

  // Xử lý cập nhật kích thước sản phẩm
  const productSizeIds: Types.ObjectId[] = [];
  if (dto.productSizes && dto.productSizes.length > 0) {
    const createdProductSizes = await Promise.all(
      dto.productSizes.map((size) =>
        this.productSizeModel.create({
          product: product._id,
          size: size.size,
          quantity: size.quantity || 0,
        }),
      ),
    );
    productSizeIds.push(...createdProductSizes.map((size) => size._id));
  }
  product.productSizes = productSizeIds.length > 0 ? productSizeIds : product.productSizes;

  // Kiểm tra và xử lý xóa ảnh (nếu có ảnh bị xóa)
  if (dto.deletedImageIds && Array.isArray(dto.deletedImageIds) && dto.deletedImageIds.length > 0) {
    // Lọc các ảnh đã bị xóa khỏi danh sách ảnh của sản phẩm
// Kiểm tra xem dto.deletedImageIds có phải là mảng không, nếu không thì dùng mảng rỗng
product.listImage = (product.listImage || []).filter(
  (imageId: Types.ObjectId) => 
    !Array.isArray(dto.deletedImageIds) || !dto.deletedImageIds.includes(imageId.toString())
);

    // Xóa các ảnh trong cơ sở dữ liệu
    await this.imageProductModel.deleteMany({ _id: { $in: dto.deletedImageIds } });
  }

  // Xử lý thêm ảnh mới và liên kết chúng với sản phẩm
  const imgIds: Types.ObjectId[] = [];
  for (const file of images || []) {
    // Tạo một tài liệu ảnh mới
    const imgDoc = await this.imageProductModel.create({
      imageProduct: '', // Chưa có URL ảnh
      product: product._id,
    });

    // Tạo khóa đối tượng cho ảnh trên Google Cloud Storage
    const objectKey = `products/${imgDoc.id}-${file.originalname}`;

    // Tải ảnh lên Google Cloud Storage và nhận lại URL
    const url = await this.uploadService.uploadBufferWithKey(file.buffer, file.mimetype, objectKey);

    // Cập nhật URL cho ảnh
    imgDoc.imageProduct = url;
    await imgDoc.save();

    // Thêm ID của ảnh mới vào danh sách ảnh của sản phẩm
    imgIds.push(imgDoc._id as Types.ObjectId);
  }

  // Cập nhật danh sách ảnh của sản phẩm với ảnh mới
  product.listImage = [...(product.listImage || []), ...imgIds];

  // Lưu sản phẩm đã được cập nhật
  await product.save();

  // Trả về sản phẩm đã được cập nhật với các trường được liên kết
  const populated = await this.productModel
    .findById(product._id)
    .populate('category')
    .populate('productSizes')
    .populate('listImage')
    .exec();

  return { message: 'Product updated successfully', product: populated };
}

async findAllPage(page: number = 1, limit: number = 10, searchTerm: string = '', filterStatus: string = 'all'): Promise<any> {
    const skip = (page - 1) * limit;

    // Tạo query để tìm kiếm và lọc
    const query: any = {};

    // Tìm kiếm fuzzy với Fuse.js
    const products = await this.productModel
      .find(query)
      .populate('category')
      .populate('productSizes')  // Đảm bảo populate các productSizes với đầy đủ thông tin
      .populate('listImage')
      .exec();

    // Sử dụng Fuse.js để tìm kiếm với `productName`, `categoryName` và `description`
    const fuse = new Fuse(products, {
      keys: ['productName', 'categoryName', 'description'],
      threshold: 0.3, // Độ chính xác của tìm kiếm
    });

    let results = products;

    // Fuzzy search
    if (searchTerm.trim()) {
      const fuzzyResults = fuse.search(searchTerm);
      results = fuzzyResults.map((r) => r.item);
    }
console.log("trang thai lo:  "+ filterStatus);
 // Lọc theo trạng thái
if (filterStatus !== 'all') {
  results = results.filter((p) => {
    // Populate productSizes để lấy thông tin chi tiết về size và quantity
    const productSizes = p.productSizes as any;

      // Tính tổng quantity của tất cả size
     const totalQuantity  = 
        productSizes && productSizes.length > 0
          ? productSizes.reduce((total, size) => total + (size.quantity || 0), 0)
          : 0;
    if (filterStatus === 'selling') return p.status && totalQuantity > 0;
    if (filterStatus === 'out') return totalQuantity === 0;
    if (filterStatus === 'stopped') return !p.status;
    return true;
  });
}


    // Tính tổng số trang
    const totalProducts = results.length;
    const totalPages = Math.ceil(totalProducts / limit);

    // Cập nhật phân trang
    results = results.slice(skip, skip + limit);

    // Chuyển các sản phẩm thành DTO
    const productResponseDTOs = results.map((product) => {
      const productResponse = new ProductResponseDTO();
      productResponse.id = product.id;
      productResponse.productName = product.productName;

      const listImage = product.listImage as any;
      productResponse.imageProduct = listImage && listImage.length > 0 ? listImage[0].imageProduct : "";

      const category = product.category as any;
      productResponse.categoryName = category && category.categoryName ? category.categoryName : '';

      // Tính tổng quantity từ tất cả phần tử trong productSizes
      const productSizes = product.productSizes as any;

      // Tính tổng quantity của tất cả size
      productResponse.quantity = 
        productSizes && productSizes.length > 0
          ? productSizes.reduce((total, size) => total + (size.quantity || 0), 0)
          : 0;

      // Trả về danh sách các size (chỉ lấy tên size)
      productResponse.productSizes =
        productSizes && productSizes.length > 0
          ? productSizes.map((s) => s.size)
          : [];

      productResponse.description = product.description || '';
      productResponse.price = product.price;
      productResponse.status = product.status;

      return productResponse;
    });

    return { products: productResponseDTOs, totalPages };
  }

async create(dto: ProductRequestDTO, images: Express.Multer.File[]) {
    const category = await this.categoryModel.findById(dto.categoryId).exec();
    if (!category) throw new BadRequestException('Category không tồn tại');

    const product = await this.productModel.create({
      productName: dto.productName,
      description: dto.description,
      price: dto.price,
      category: new Types.ObjectId(dto.categoryId),
      status: true,
      createDate: new Date(),
      updateDate: new Date(),
      productSizes: [],
      listImage: [],
    });

    // sizes
    const sizeIds: Types.ObjectId[] = [];
    if (dto.productSizes?.length) {
      const created = await Promise.all(
        dto.productSizes.map((sq) =>
          this.productSizeModel.create({
            product: product._id,
            size: sq.size,
            quantity: Number(sq.quantity) || 0,
          }),
        ),
      );
      sizeIds.push(...created.map((s) => s._id as Types.ObjectId));
    }

    // images
    const imgIds: Types.ObjectId[] = [];
    for (const file of images || []) {
      const imgDoc = await this.imageProductModel.create({
        imageProduct: '',
        product: product._id,
      });

      const objectKey = `products/${imgDoc.id}-${file.originalname}`;
      const url = await this.uploadService.uploadBufferWithKey(
        file.buffer,
        file.mimetype,
        objectKey,
      );

      imgDoc.imageProduct = url;
      await imgDoc.save();
      imgIds.push(imgDoc._id as Types.ObjectId);
    }

    product.productSizes = sizeIds;
    product.listImage = imgIds;
    await product.save();

    const populated = await this.productModel
      .findById(product._id)
      .populate('category')
      .populate('productSizes')
      .populate('listImage')
      .exec();

    return { message: 'Created', product: populated };
  }

  async updateProductStatus(id: string): Promise<any> {
    // Find the product by its ID
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new BadRequestException('Product not found');
    }

    // Toggle the product's status (true to false or false to true)
    product.status = !product.status;

    // Save the updated product
    await product.save();

    // Return the updated product and its new status
    return {
      message: `Product status updated to ${product.status}`,
      product,
    };
  }

  async findAll(): Promise<Product[]> { 
    return this.productModel.find().populate('category').exec(); // populate để lấy dữ liệu category

  }
}
