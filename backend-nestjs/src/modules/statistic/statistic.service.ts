import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/schemas/user.schema';
import { Order } from '../order/schemas/order.shema';
import { OrderStatus } from '../order/enums/order-status.enum';

@Injectable()
export class StatisticService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
  ) {}

  async getDashboardStats() {
    const today = new Date();

    // Tạo mốc thời gian cho 7 ngày trước
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    // USER
    const totalUsers = await this.userModel.countDocuments();

    // Số user mới trong 7 ngày vừa qua
    const newUsers7Days = await this.userModel.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // ORDER
    const totalOrders = await this.orderModel.countDocuments();

    // Đơn hàng mới trong 7 ngày qua
    const newOrders7Days = await this.orderModel.countDocuments({
      orderDate: { $gte: sevenDaysAgo },
    });

    // SALES
   // Tổng doanh thu toàn thời gian
    const [totalSalesResult] = await this.orderModel.aggregate([
    {
        $lookup: {
        from: 'orderitems',
        localField: 'orderItems',
        foreignField: '_id',
        as: 'items',
        },
    },
    { $unwind: '$items' },
    { $group: { _id: null, total: { $sum: '$items.price' } } },
    ]);

    // Tổng doanh thu trong 7 ngày gần nhất
    const [salesLast7Days] = await this.orderModel.aggregate([
    { $match: { orderDate: { $gte: sevenDaysAgo } } },
    {
        $lookup: {
        from: 'orderitems',
        localField: 'orderItems',
        foreignField: '_id',
        as: 'items',
        },
    },
    { $unwind: '$items' },
    { $group: { _id: null, total: { $sum: '$items.price' } } },
    ]);

    const totalSales = totalSalesResult?.total ?? 0;
    const recentSales = salesLast7Days?.total ?? 0;

    // % doanh thu 7 ngày qua so với tổng doanh thu
    const salesPercent = totalSales > 0 ? ((recentSales / totalSales) * 100) : 0;

    const formattedPercent = salesPercent % 1 === 0
    ? `${salesPercent.toFixed(0)}%`
    : `${salesPercent.toFixed(1)}%`;

    const salesTrend = `+${formattedPercent} of total in past 7 days`;


    // PENDING
    const totalPending = await this.orderModel.countDocuments({
      orderStatus: OrderStatus.ORDERED,
    });

    const pending7Days = await this.orderModel.countDocuments({
      orderStatus: OrderStatus.ORDERED,
      orderDate: { $gte: sevenDaysAgo },
    });

    return [
      {
        title: 'Total User',
        value: totalUsers,
        percent: `+${newUsers7Days} new users in last 7 days`,
      },
      {
        title: 'Total Order',
        value: totalOrders,
        percent: `+${newOrders7Days} new orders in last 7 days`,
      },
      {
        title: 'Total Sales',
        value: recentSales.toLocaleString('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }),
        percent: salesTrend,
      },
      {
        title: 'Total Pending',
        value: totalPending,
        percent: `+${pending7Days} new pending in last 7 days`,
      },
    ];
  }

  async getSaleStatsIn1Year(year: number) {
  // Xác định ngày đầu và ngày cuối năm
  const startOfYear = new Date(`${year}-01-01`);
  const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

  // Aggregation tính tổng doanh thu theo từng tháng
  const saleIn1Year = await this.orderModel.aggregate([
    {
      $match: {
        orderDate: { $gte: startOfYear, $lte: endOfYear },
      },
    },
    {
      $lookup: {
        from: 'orderitems',
        localField: 'orderItems',
        foreignField: '_id',
        as: 'items',
      },
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: { month: { $month: '$orderDate' } },
        total: { $sum: '$items.price' },
      },
    },
    { $sort: { '_id.month': 1 } },
  ]);

  console.log(saleIn1Year)

  // Format kết quả cho dễ đọc
  const monthlySales = Array.from({ length: 12 }, (_, i) => {
    const found = saleIn1Year.find((s) => s._id.month === i + 1);
    return {
      month: i + 1,
      total: found ? found.total : 0,
    };
  });

  return monthlySales;
}
}
