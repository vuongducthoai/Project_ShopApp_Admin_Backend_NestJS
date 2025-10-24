// src/order/order.service.ts

import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  Logger             
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Product, ProductDocument } from '../product/schemas/product.schema';
import { Payment, PaymentDocument } from '../payment/schemas/payment.shema';
import { ProductSize, ProductSizeDocument } from '../productSize/schemas/product-size.schema';
import { Model, PipelineStage, FilterQuery, Types } from 'mongoose';
import { Order, OrderDocument } from '../order/schemas/order.shema';
import { OrderStatus } from "./enums/order-status.enum";
import { PaymentMethod } from "../payment/enums/payment-method.enum"; 
import { StatusFlow } from "./enums/order-status-flow";
import {Coin, CoinDocument} from '../coin/schemas/coin.shema';
import {CoinUsage, CoinUsageDocument} from '../coinUsage/schemas/coin-usage.schema';
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";


interface FindAllOptions {
  page: number;
  limit: number;
  search?: string;
  orderStatus?: OrderStatus;
  paymentMethod?: PaymentMethod;
  startDate?: string; 
  endDate?: string;   
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(ProductSize.name) private productSizeModel: Model<ProductSizeDocument>,
    @InjectModel(Coin.name) private coinModel: Model<CoinDocument>,
    @InjectModel(CoinUsage.name) private coinUsageModel: Model<CoinUsageDocument>,
  ) {}

  async findAll(options: FindAllOptions) {
  const { page, limit, search, orderStatus, paymentMethod, startDate, endDate } = options;

  // --- XÂY DỰNG AGGREGATION PIPELINE ---

  // Pipeline ban đầu sẽ join tất cả các bảng và tính tổng tiền
  const initialPipeline: PipelineStage[] = [
    // 1. Join với payments và addressdeliveries
    { $lookup: { from: 'payments', localField: '_id', foreignField: 'order', as: 'payment' } },
    { $unwind: { path: '$payment', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'addressdeliveries', localField: 'addressDelivery', foreignField: '_id', as: 'addressDelivery' } },
    { $unwind: { path: '$addressDelivery', preserveNullAndEmptyArrays: true } },

    // 2. MỚI: Join với orderitems để tính tổng
    { $lookup: { from: 'orderitems', localField: 'orderItems', foreignField: '_id', as: 'items' } },
    { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } }, // Mở mảng items ra để tính toán

    // 3. MỚI: Nhóm lại theo Order và tính tổng
    {
      $group: {
        _id: '$_id', // Nhóm lại theo ID của Order
        orderDate: { $first: '$orderDate' },
        orderStatus: { $first: '$orderStatus' },
        payment: { $first: '$payment' }, // Giữ lại thông tin payment
        addressDelivery: { $first: '$addressDelivery' }, // Giữ lại thông tin address
        // Tính tổng tiền bằng cách nhân số lượng với giá của từng item rồi cộng dồn
        total: {
          $sum: {
            $multiply: ['$items.price', '$items.quantity']
          }
        }
      }
    }
  ];
  
  // 4. Xây dựng đối tượng $match động (giữ nguyên)
  const matchQuery: FilterQuery<any> = {};

  if (search) {
    matchQuery.$or = [
      { "addressDelivery.phoneNumber": { $regex: search, $options: 'i' } },
      { "addressDelivery.address": { $regex: search, $options: 'i' } },
    ];
  }
  if (orderStatus) {
    matchQuery.orderStatus = orderStatus;
  }
  if (paymentMethod) {
    matchQuery['payment.paymentMethod'] = paymentMethod;
  }
  if (startDate || endDate) {
    matchQuery.orderDate = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      matchQuery.orderDate.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchQuery.orderDate.$lte = end;
    }
  }
  
  // Pipeline để lấy dữ liệu (áp dụng $match sau khi đã group)
  const dataPipeline: PipelineStage[] = [
    ...initialPipeline,
    { $match: matchQuery },
    { $sort: { orderDate: -1 } },
  ];

  // Pipeline để đếm (áp dụng $match sau khi đã group)
  const countPipeline: PipelineStage[] = [ ...initialPipeline, { $match: matchQuery }, { $count: 'total' } ];
  
  // Pipeline chính bao gồm phân trang và định hình lại output
  const mainPipeline: PipelineStage[] = [
    ...dataPipeline,
    { $skip: (page - 1) * limit },
    { $limit: limit },
    {
      // 5. SỬA LẠI: $project để định hình output cuối cùng
      $project: { 
        _id: 0, // Bỏ _id
        id: '$_id',
        orderDate: { // Định dạng lại ngày tháng cho đẹp
            $dateToString: {
              format: "%d/%m/%Y - %H:%M",
              date: "$orderDate",
              timezone: "Asia/Ho_Chi_Minh"
            }
        },
        orderStatus: 1,
        total: '$total', // Lấy total đã được tính toán ở bước $group
        
        // Tạo lại cấu trúc object cho addressDelivery
        addressDelivery: {
          address: '$addressDelivery.address',
          phoneNumber: '$addressDelivery.phoneNumber'
        },

        // Tạo lại cấu trúc object cho payment
        payment: {
          paymentMethod: '$payment.paymentMethod',
          status: '$payment.status'
        }
      },
    },
  ];

  const [data, totalResult] = await Promise.all([
    this.orderModel.aggregate(mainPipeline),
    this.orderModel.aggregate(countPipeline),
  ]);

  const total = totalResult.length > 0 ? totalResult[0].total : 0;

  return { data, total, page, totalPages: Math.ceil(total / limit) };
}

 async findOne(id: string): Promise<any> {
    const pipeline: PipelineStage[] = [
      // === GIAI ĐOẠN 1: TÌM ĐƠN HÀNG CHÍNH ===
      {
        $match: { _id: new Types.ObjectId(id) },
      },

      // === GIAI ĐOẠN 2: KẾT NỐI (LOOKUP) VỚI CÁC COLLECTION KHÁC ===
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
      { $lookup: { from: 'addressdeliveries', localField: 'addressDelivery', foreignField: '_id', as: 'addressDelivery' } },
      { $lookup: { from: 'payments', localField: '_id', foreignField: 'order', as: 'payment' } },
      { $lookup: { from: 'coupons', localField: 'coupon', foreignField: '_id', as: 'coupon' } },
      { $lookup: { from: 'coinusages', localField: '_id', foreignField: 'order', as: 'coinUsage' } },
      { $lookup: { from: 'orderitems', localField: 'orderItems', foreignField: '_id', as: 'orderItems' } },
      
      // "Mở" các kết quả lookup (là mảng) thành object để dễ truy cập
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$addressDelivery', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$payment', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$coupon', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$coinUsage', preserveNullAndEmptyArrays: true } },

      // === GIAI ĐOẠN 3: XỬ LÝ MẢNG orderItems ===
      {
        $addFields: {
          // Tính tổng tiền cho từng item trong mảng
          orderItems: {
            $map: {
              input: '$orderItems',
              as: 'item',
              in: {
                // Giữ lại các trường cũ của item và thêm trường `itemTotal`
                _id: '$$item._id',
                quantity: '$$item.quantity',
                price: '$$item.price',
                size: '$$item.size',
                product: '$$item.product',
                itemTotal: { $multiply: ['$$item.price', '$$item.quantity'] },
              },
            },
          },
        },
      },
      // Lookup lần nữa để lấy productName cho từng item
      { $unwind: { path: '$orderItems', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'products',
          localField: 'orderItems.product',
          foreignField: '_id',
          as: 'orderItems.productData',
        },
      },
      { $unwind: { path: '$orderItems.productData', preserveNullAndEmptyArrays: true } },
      // Nhóm lại thành một document order duy nhất
      {
        $group: {
          _id: '$_id',
          orderDate: { $first: '$orderDate' },
          orderStatus: { $first: '$orderStatus' },
          user: { $first: '$user' },
          addressDelivery: { $first: '$addressDelivery' },
          payment: { $first: '$payment' },
          coupon: { $first: '$coupon' },
          coinUsage: { $first: '$coinUsage' },
          // Gom các item đã xử lý vào lại một mảng
          items: {
            $push: {
              productId: '$orderItems.product',
              productName: '$orderItems.productData.productName',
              quantity: '$orderItems.quantity',
              price: '$orderItems.price',
              size: '$orderItems.size',
              itemTotal: '$orderItems.itemTotal',
            },
          },
        },
      },

      // === GIAI ĐOẠN 4: TÍNH TOÁN TỔNG TIỀN CUỐI CÙNG (ĐÃ SỬA THEO CÔNG THỨC MỚI) ===
      {
        $addFields: {
          // Tính tổng tiền hàng (chưa giảm giá)
          subTotal: { $sum: '$items.itemTotal' },
          
          // Lấy giá trị % giảm giá của coupon (ví dụ: 25), nếu không có thì là 0
          discountPercentage: { $ifNull: ['$coupon.discountValue', 0] },
          
          // Lấy giá trị coin đã sử dụng, mặc định là 0
          coinsUsed: { $ifNull: ['$coinUsage.coinsUsed', 0] },
        },
      },
      {
        $addFields: {
          // 1. Chuyển đổi % thành số thập phân (25 -> 0.25)
          discountRate: { 
            $divide: ['$discountPercentage', 100] 
          },
          // 2. Tính giá trị tiền được giảm từ coin (1 coin = 1000 VND)
          coinsUsedValue: { 
            $multiply: ['$coinsUsed', 1000] 
          },
        },
      },
      {
        $addFields: {
          // 3. Tính số tiền được giảm từ coupon = subTotal * discountRate
          discountAmount: { 
            $multiply: ['$subTotal', '$discountRate'] 
          },
        },
      },
      {
        $addFields: {
          // 4. Thành tiền = Tổng tiền hàng - Tiền giảm từ coupon - Tiền giảm từ coin
          finalTotal: { 
            $subtract: [
              '$subTotal',
              { $add: ['$discountAmount', '$coinsUsedValue'] },
            ],
          },
        },
      },

      // === GIAI ĐOẠN 5: ĐỊNH HÌNH LẠI OUTPUT JSON CUỐI CÙNG ===
      {
        $project: {
          _id: 0, // Bỏ trường _id
          id: '$_id',
         orderDate: {
            $dateToString: {
              format: "%d/%m/%Y - %H:%M",
              date: "$orderDate",
              timezone: "Asia/Ho_Chi_Minh"
            }
          },
          orderStatus: '$orderStatus',
          customer: {
            fullName: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
            phoneNumber: '$user.phoneNumber',
          },
          delivery: {
            fullName: '$addressDelivery.fullName',
            phoneNumber: '$addressDelivery.phoneNumber',
            address: '$addressDelivery.address',
          },
          items: '$items',
          pricing: {
            subTotal: '$subTotal',
            discountPercentage: '$discountPercentage',
            discountAmount: '$discountAmount',
            couponCode: '$coupon.code',
            coinsUsed: '$coinUsage.coinsUsed',
            coinsUsedValue: '$coinsUsedValue',
            finalTotal: '$finalTotal',
            paymentAmount: '$payment.amount', // Amount từ bảng Payment
          },
          paymentInfo: {
            method: '$payment.paymentMethod',
            date: {
              $dateToString: {
                format: "%d/%m/%Y - %H:%M",
                date: "$payment.paymentDate",
                timezone: "Asia/Ho_Chi_Minh"
              }
            },
          },
        },
      },
    ];

    const results = await this.orderModel.aggregate(pipeline);

    if (results.length === 0) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }

    const orderDetail = results[0];

    if (orderDetail) {
      const currentStatus = orderDetail.orderStatus;
      const nextStatuses = StatusFlow[currentStatus] || []; 
      orderDetail.nextStatuses = nextStatuses; 
    }

    return orderDetail
  }



 async updateStatus(id: string, payload: UpdateOrderStatusDto): Promise<Order> {
    const { status: newStatus, cancellationReason } = payload;
    this.logger.debug(`Received payload for order ${id}: ${JSON.stringify(payload)}`);

    // 1. Tìm đơn hàng GỐC để kiểm tra trạng thái và lấy thông tin
    const order = await this.orderModel.findById(id).populate('orderItems').exec();
    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }

    // 2. Tìm payment tương ứng
    const payment = await this.paymentModel.findOne({ order: order._id }).exec();

    // 3. Kiểm tra logic chuyển trạng thái
    const currentStatus = order.orderStatus;
    const allowedNextStatuses = StatusFlow[currentStatus];
    if (!allowedNextStatuses || !allowedNextStatuses.includes(newStatus)) {
      throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    // --- XỬ LÝ CÁC LOGIC NGHIỆP VỤ (SIDE EFFECTS) ---
    // (Thực hiện các thay đổi phụ thuộc vào newStatus TRƯỚC khi cập nhật order chính)

    // 4. LOGIC KHI ĐƠN HÀNG HOÀN THÀNH (COMPLETED)
    if (newStatus === OrderStatus.COMPLETED) {
      if (payment && payment.paymentMethod === PaymentMethod.COD && !payment.status) {
        await this.paymentModel.findByIdAndUpdate(payment._id, { status: true });
      }
      for (const item of order.orderItems as any[]) {
        await this.productModel.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } });
        await this.productSizeModel.findOneAndUpdate(
          { product: item.product, size: item.size },
          { $inc: { quantity: -item.quantity } },
        );
      }
    }

    // 5. LOGIC KHI ĐƠN HÀNG BỊ HỦY (CANCELLED)
    if (newStatus === OrderStatus.CANCELLED) {
      // Hoàn kho
      for (const item of order.orderItems as any[]) {
        await this.productModel.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
        await this.productSizeModel.findOneAndUpdate(
          { product: item.product, size: item.size },
          { $inc: { quantity: item.quantity } },
        );
      }
      // Hoàn coin (luôn thực hiện nếu có)
      const coinUsage = await this.coinUsageModel.findOne({ order: order._id }).exec();
      if (coinUsage && coinUsage.coinsUsed > 0) {
        await this.coinModel.findOneAndUpdate(
          { User: order.user },
          { $inc: { value: coinUsage.coinsUsed } }
        );
        this.logger.log(`Refunded ${coinUsage.coinsUsed} coins to user ${order.user}`);
      }
      // Cập nhật payment (nếu đã thanh toán)
      if (payment && payment.status === true) {
        await this.paymentModel.findByIdAndUpdate(payment._id, { status: false });
        if (payment.paymentMethod !== PaymentMethod.COD) {
          this.logger.log(`[REFUND] Initiating refund for non-COD payment ID: ${payment._id}`);
          // TODO: Gọi API hoàn tiền bên thứ ba
        }
      }
    }

    // --- 6. CẬP NHẬT TRẠNG THÁI ORDER VÀ LÝ DO HỦY ---
    const updatePayload: any = { orderStatus: newStatus };
    if (newStatus === OrderStatus.CANCELLED && cancellationReason) {
      updatePayload.cancellationReason = cancellationReason; // Gộp lý do vào payload
    }

    this.logger.debug(`Updating order ${id} with: ${JSON.stringify(updatePayload)}`);

    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true } // Trả về document sau khi cập nhật
    ).exec();

    if (!updatedOrder) {
      // Lỗi này không nên xảy ra nếu findById ban đầu thành công
      throw new Error(`Failed to update order status for ID "${id}"`);
    }

    this.logger.debug(`Order ${id} updated successfully.`);
    return updatedOrder;
  }
}