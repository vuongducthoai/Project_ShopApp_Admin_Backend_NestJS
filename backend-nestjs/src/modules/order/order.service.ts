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

  // Pipeline ban đầu sẽ join tất cả các bảng
  const initialPipeline: PipelineStage[] = [
    // 1. Join với payments và addressdeliveries
    { $lookup: { from: 'payments', localField: 'payment', foreignField: '_id', as: 'payment' } },
    { $unwind: { path: '$payment', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'addressdeliveries', localField: 'addressDelivery', foreignField: '_id', as: 'addressDelivery' } },
    { $unwind: { path: '$addressDelivery', preserveNullAndEmptyArrays: true } },
  ];
  
  // 2. Xây dựng đối tượng $match động
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
    matchQuery.paymentMethod = paymentMethod; // Lấy từ order.paymentMethod
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
  
  // Pipeline để lấy dữ liệu
  const dataPipeline: PipelineStage[] = [
    ...initialPipeline,
    { $match: matchQuery },
    { $sort: { orderDate: -1 } },
  ];

  // Pipeline để đếm
  const countPipeline: PipelineStage[] = [ 
    ...initialPipeline, 
    { $match: matchQuery }, 
    { $count: 'total' } 
  ];
  
  // Pipeline chính bao gồm phân trang và định hình lại output
  const mainPipeline: PipelineStage[] = [
    ...dataPipeline,
    { $skip: (page - 1) * limit },
    { $limit: limit },
    {
      $project: { 
        _id: 0,
        id: '$_id',
        orderDate: {
          $dateToString: {
            format: "%d/%m/%Y - %H:%M",
            date: "$orderDate",
            timezone: "Asia/Ho_Chi_Minh"
          }
        },
        orderStatus: 1,
        total: '$payment.amount', // Lấy từ payment.amount
        
        // Tạo lại cấu trúc object cho addressDelivery
        addressDelivery: {
          address: '$addressDelivery.address',
          phoneNumber: '$addressDelivery.phoneNumber'
        },

        // Tạo lại cấu trúc object cho payment
        payment: {
          paymentMethod: '$paymentMethod', // Lấy từ order.paymentMethod
          status: '$isPaid' // Lấy từ order.isPaid
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
      { $lookup: { from: 'payments', localField: 'payment', foreignField: '_id', as: 'payment' } },
      { $lookup: { from: 'coupons', localField: 'coupon', foreignField: '_id', as: 'coupon' } },
      { $lookup: { from: 'orderitems', localField: 'orderItems', foreignField: '_id', as: 'orderItems' } },
      
      // "Mở" các kết quả lookup (là mảng) thành object để dễ truy cập
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$addressDelivery', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$payment', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$coupon', preserveNullAndEmptyArrays: true } },

      // === GIAI ĐOẠN 3: XỬ LÝ MẢNG orderItems ===
      {
        $addFields: {
          orderItems: {
            $map: {
              input: '$orderItems',
              as: 'item',
              in: {
                _id: '$$item._id',
                productId: '$$item.product',
                quantity: '$$item.quantity',
                price: '$$item.price',
                size: '$$item.size',
                itemTotal: { $multiply: ['$$item.price', '$$item.quantity'] },
              },
            },
          },
        },
      },

      // Lookup product để lấy productName và image
      { $unwind: { path: '$orderItems', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'products',
          localField: 'orderItems.productId',
          foreignField: '_id',
          as: 'orderItems.productData',
        },
      },
      { $unwind: { path: '$orderItems.productData', preserveNullAndEmptyArrays: true } },

      // Group lại để gom các orderItems thành mảng
      {
        $group: {
          _id: '$_id',
          orderDate: { $first: '$orderDate' },
          orderStatus: { $first: '$orderStatus' },
          user: { $first: '$user' },
          addressDelivery: { $first: '$addressDelivery' },
          payment: { $first: '$payment' },
          coupon: { $first: '$coupon' },
          paymentMethod: { $first: '$paymentMethod' },
          isPaid: { $first: '$isPaid' },
          paidAt: { $first: '$paidAt' },
          vnpTransactionNo: { $first: '$vnpTransactionNo' },
          calculatedSubtotal: { $first: '$calculatedSubtotal' },
          calculatedDiscountValue: { $first: '$calculatedDiscountValue' },
          calculatedCoinsApplied: { $first: '$calculatedCoinsApplied' },
          calculatedCoinValue: { $first: '$calculatedCoinValue' },
          calculatedTotalPrice: { $first: '$calculatedTotalPrice' },
          cancellationReason: { $first: '$cancellationReason' },
          orderItems: {
            $push: {
              productId: '$orderItems.productId',
              productName: '$orderItems.productData.productName',
              quantity: '$orderItems.quantity',
              price: '$orderItems.price',
              size: '$orderItems.size',
              image: { $arrayElemAt: ['$orderItems.productData.images', 0] }, // Lấy ảnh đầu tiên
              itemTotal: '$orderItems.itemTotal',
            },
          },
        },
      },

      // === GIAI ĐOẠN 4: ĐỊNH HÌNH LẠI OUTPUT JSON CUỐI CÙNG ===
      {
        $project: {
          _id: 0,
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
          items: '$orderItems',
          pricing: {
            subTotal: '$calculatedSubtotal',
            discountValue: '$calculatedDiscountValue',
            coinsApplied: '$calculatedCoinsApplied',
            coinValue: '$calculatedCoinValue',
            totalPrice: '$calculatedTotalPrice',
            couponCode: '$coupon.code',
          },
          paymentInfo: {
            method: '$paymentMethod',
            amount: '$payment.amount',
            isPaid: '$isPaid',
            paidAt: {
              $cond: {
                if: '$paidAt',
                then: {
                  $dateToString: {
                    format: "%d/%m/%Y - %H:%M",
                    date: "$paidAt",
                    timezone: "Asia/Ho_Chi_Minh"
                  }
                },
                else: null
              }
            },
            vnpTransactionNo: '$vnpTransactionNo',
          },
          cancellationReason: '$cancellationReason',
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

    return orderDetail;
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