import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/schemas/user.schema';
import { Order } from '../order/schemas/order.shema';
import { OrderStatus } from '../order/enums/order-status.enum';
import { Response } from 'express';
import { join } from 'path';
import axios from 'axios';

const PDFDocument = require('pdfkit');

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
        value: totalSales.toLocaleString('vi-VN', {
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
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

  const saleIn1Year = await this.orderModel.aggregate([
    {
      $match: {
        orderDate: { $gte: startOfYear, $lte: endOfYear },
        orderStatus: { $in: ["COMPLETED", "FEEDBACKED"] }, //lọc đơn hoàn tất
      },
    },
    {
      $lookup: {
        from: "orderitems",
        localField: "orderItems",
        foreignField: "_id",
        as: "items",
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: { month: { $month: "$orderDate" } },
        total: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      },
    },
    { $sort: { "_id.month": 1 } },
  ]);

  const monthlySales = Array.from({ length: 12 }, (_, i) => {
    const found = saleIn1Year.find((s) => s._id.month === i + 1);
    return {
      month: i + 1,
      total: found ? found.total : 0,
    };
  });

  return monthlySales;
}

  async getAllOrdersByMonthAndYear(month: string, year: string) {
  // Kiểm tra năm
  if (isNaN(Number(year)) || Number(year) < 2025) {
    throw new BadRequestException("Năm không hợp lệ!");
  }

  let startDate: Date;
  let endDate: Date;

  // Trường hợp month là "All" => lấy toàn bộ đơn trong năm đó
  if (month.toLowerCase() === "all") {
    startDate = new Date(Number(year), 0, 1); // 01/01/yyyy
    endDate = new Date(Number(year), 11, 31, 23, 59, 59, 999); // 31/12/yyyy
  }
  else if (!isNaN(Number(month))) {
    const monthNum = Number(month);
    if (monthNum < 1 || monthNum > 12) {
      throw new BadRequestException("Tháng không hợp lệ!");
    }
    startDate = new Date(Number(year), monthNum - 1, 1);
    endDate = new Date(Number(year), monthNum, 0, 23, 59, 59, 999);
  }
  else {
    throw new BadRequestException("Giá trị tháng không hợp lệ!");
  }

  const orders = await this.orderModel
    .find({
      orderDate: { $gte: startDate, $lte: endDate }
    })
    .populate("user", "firstName lastName")
    .populate({
      path: "orderItems",
      select: "product price size quantity",
      populate: {
        path: "product", 
        select: "productName listImage",
        populate: {
          path: "listImage",
          select: "imageProduct"
        }
      }
    });

  return orders;
}
  
  async exportOrderToPdf(orderId: string, res: Response) {
    const order = await this.orderModel
      .findById(orderId)
      .populate({
        path: 'user',
        select: 'firstName lastName email',
      })
      .populate({
        path: 'orderItems',
        populate: {
          path: 'product',
          populate: { path: 'listImage', select: 'imageProduct' },
        },
      })
      .exec();

    if (!order) throw new NotFoundException('Order not found');

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    
    const fontRegular = join(process.cwd(), 'src', 'assets', 'fonts', 'Roboto-Regular.ttf');
    const fontBold = join(process.cwd(), 'src', 'assets', 'fonts', 'Roboto-Bold.ttf');
    
    doc.registerFont('Roboto', fontRegular);
    doc.registerFont('Roboto-Bold', fontBold);
    doc.font('Roboto');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Order_${order._id}.pdf`,
    );
    doc.pipe(res);

    // ===== HEADER =====
    doc.font('Roboto-Bold')
      .fontSize(24)
      .fillColor('#2c3e50')
      .text('CHI TIẾT ĐƠN HÀNG', { align: 'center' });
    doc.moveDown(0.5);
    
    // Đường kẻ ngang
    doc.strokeColor('#3498db')
      .lineWidth(2)
      .moveTo(40, doc.y)
      .lineTo(555, doc.y)
      .stroke();
    doc.moveDown(1.5);

    // ===== THÔNG TIN ĐƠN HÀNG =====
    const user = order.user as any;
    const leftColumn = 40;
    const rightColumn = 320;
    
    doc.font('Roboto-Bold').fontSize(11).fillColor('#34495e');
    
    // Cột trái
    doc.text('Mã đơn hàng:', leftColumn, doc.y, { continued: false });
    doc.font('Roboto').text(`${order.id}`, leftColumn + 80, doc.y - 12);
    
    doc.font('Roboto-Bold').text('Khách hàng:', leftColumn, doc.y + 5);
    doc.font('Roboto').text(`${user.firstName} ${user.lastName}`, leftColumn + 80, doc.y - 12);
    
    // Cột phải
    const dateY = doc.y - 36;
    doc.font('Roboto-Bold').text('Ngày đặt:', rightColumn, dateY);
    doc.font('Roboto').text(
      new Date(order.orderDate).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      rightColumn + 60,
      dateY
    );
    
    doc.font('Roboto-Bold').text('Email:', rightColumn, doc.y + 5);
    doc.font('Roboto').text(user.email, rightColumn + 60, doc.y - 12);
    
    doc.moveDown(2);

    // ===== BẢNG SẢN PHẨM =====
    const tableTop = doc.y;
    const tableLeft = 40; // Dịch bảng qua trái
    const tableWidth = 515; // Tổng chiều rộng bảng
    
    const tableHeaders = ['STT', 'Hình ảnh', 'Sản phẩm', 'Size', 'SL', 'Đơn giá', 'Thành tiền'];
    const colWidths = [35, 85, 145, 45, 35, 60, 70];
    const colPositions = [
      tableLeft,           // STT - 40
      tableLeft + 35,      // Hình ảnh - 75
      tableLeft + 120,     // Sản phẩm - 160
      tableLeft + 265,     // Size - 305
      tableLeft + 310,     // SL - 350
      tableLeft + 355,     // Đơn giá - 395
      tableLeft + 435      // Thành tiền - 475
    ];

    // Header bảng - VẼ TRƯỚC KHI GHI CHỮ
    doc.rect(tableLeft, tableTop, tableWidth, 25)
      .fillAndStroke('#3498db', '#3498db');
    
    // Sau đó mới ghi chữ lên trên background
    doc.font('Roboto-Bold').fontSize(10).fillColor('#ffffff'); // Màu trắng
    
    tableHeaders.forEach((header, i) => {
      doc.text(
        header,
        colPositions[i] + 3,
        tableTop + 8,
        { width: colWidths[i] - 6, align: i === 0 || i === 3 || i === 4 ? 'center' : 'left' }
      );
    });

    let currentY = tableTop + 30;
    const orderData = order as any;

    // ===== DANH SÁCH SẢN PHẨM =====
    for (let index = 0; index < orderData.orderItems.length; index++) {
      const item = orderData.orderItems[index];
      const product = item.product as any;
      const imageUrl = product.listImage?.[0]?.imageProduct;
      const rowHeight = 70;

      // Background màu xen kẽ
      if (index % 2 === 0) {
        doc.rect(tableLeft, currentY - 5, tableWidth, rowHeight)
          .fillAndStroke('#f8f9fa', '#e9ecef');
      } else {
        doc.rect(tableLeft, currentY - 5, tableWidth, rowHeight)
          .fillAndStroke('#ffffff', '#e9ecef');
      }

      doc.fillColor('#2c3e50').font('Roboto').fontSize(9);

      // STT
      doc.text(
        `${index + 1}`,
        colPositions[0],
        currentY + 25,
        { width: colWidths[0], align: 'center' }
      );

      // Hình ảnh
      if (imageUrl) {
        try {
          const imageBuffer = await this.downloadImage(imageUrl);
          doc.image(imageBuffer, colPositions[1], currentY, {
            width: 60,
            height: 60,
            fit: [60, 60],
          });
        } catch (error) {
          doc.fontSize(8)
            .fillColor('#95a5a6')
            .text('[Không có ảnh]', colPositions[1] + 5, currentY + 25, {
              width: colWidths[1],
              align: 'center',
            });
        }
      }

      doc.fillColor('#2c3e50').fontSize(9);

      // Tên sản phẩm (wrap text)
      doc.text(
        product.productName,
        colPositions[2] + 3,
        currentY + 25,
        { width: colWidths[2] - 6, align: 'left' }
      );

      // Size
      doc.text(item.size, colPositions[3], currentY + 25, {
        width: colWidths[3],
        align: 'center',
      });

      // Số lượng
      doc.text(item.quantity.toString(), colPositions[4], currentY + 25, {
        width: colWidths[4],
        align: 'center',
      });

      // Đơn giá
      doc.text(
        `${item.price.toLocaleString('vi-VN')}₫`,
        colPositions[5]-20,
        currentY + 25,
        { width: colWidths[5], align: 'right' }
      );

      // Thành tiền
      doc.font('Roboto-Bold').text(
        `${(item.price * item.quantity).toLocaleString('vi-VN')}₫`,
        colPositions[6]-20,
        currentY + 25,
        { width: colWidths[6] - 5, align: 'right' }
      );

      currentY += rowHeight + 5;

      // Thêm trang mới nếu cần
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
    }

    // ===== TỔNG TIỀN =====
    const total = (order.orderItems as any[]).reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    currentY += 10;
    
    // Đường kẻ trên tổng tiền
    doc.strokeColor('#3498db')
      .lineWidth(1)
      .moveTo(tableLeft + 315, currentY)
      .lineTo(tableLeft + tableWidth, currentY)
      .stroke();

    currentY += 15;

    // Tổng cộng
    doc.font('Roboto-Bold')
      .fontSize(14)
      .fillColor('#e74c3c')
      .text('TỔNG CỘNG:', tableLeft + 315, currentY, { width: 100, align: 'left' });
    
    doc.fontSize(16)
      .fillColor('#c0392b')
      .text(
        `${total.toLocaleString('vi-VN')}₫`,
        tableLeft + 405,
        currentY,
        { width: 100, align: 'right' }
      );

    // ===== FOOTER =====
    currentY += 80;
    doc.font('Roboto')
      .fontSize(9)
      .fillColor('#7f8c8d')
      .text(
        `Ngày xuất file: ${new Date().toLocaleString('vi-VN')}`,
        40,
        currentY,
        { align: 'center', width: 515 }
      );

    doc.end();
  }

  // Helper function để tải hình ảnh từ URL
  private imageCache = new Map<string, Buffer>();

  private async downloadImage(url: string): Promise<Buffer> {
    if (this.imageCache.has(url)) {
      //console.log(`Lấy từ cache: ${url}`);
      return this.imageCache.get(url)!; // Dấu ! báo TypeScript: "Chắc chắn có giá trị"
    }

    //console.log(`Đang tải: ${url}`);
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });
    
    const buffer = Buffer.from(response.data, 'binary');
    this.imageCache.set(url, buffer);
    console.log(`Đã lưu cache: ${url}`);
    
    return buffer;
  }

}