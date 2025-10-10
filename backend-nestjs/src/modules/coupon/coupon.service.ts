import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Coupon } from "./schemas/coupon.schema";
import { CreateCouponDto } from "./dto/create-coupon.dto";
import { NotificationGateway } from '../notification/notification.gateway';
import axios from 'axios';
@Injectable()
export class CouponService {
    constructor(
        @InjectModel(Coupon.name) private couponModel: Model<Coupon>,
        private readonly notificationGateway: NotificationGateway,
    ) { }

    //Tạo mới coupon
    async createCoupon(createCouponDto: CreateCouponDto): Promise<Coupon> {
        const { startDate, endDate } = createCouponDto;

        // Kiểm tra logic ngày
        if (new Date(startDate) >= new Date(endDate)) {
            throw new BadRequestException('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
        }

        // Kiểm tra code trùng
        const existing = await this.couponModel.findOne({ code: createCouponDto.code });
        if (existing) {
            throw new BadRequestException('Mã khuyến mại đã tồn tại');
        }

        const coupon = new this.couponModel(createCouponDto);
        const savedCoupon = await coupon.save();
        this.notificationGateway.sendNotification({
            type: 'NEW_COUPON',
            title: 'Voucher mới!',
            message: `Shop vừa thêm mã giảm giá: ${savedCoupon.discountValue}`,
            data: savedCoupon,
        })
        
        try {
            await axios.post('http://localhost:8088/api/notifications/broadcast', {
                title: '🎉 Mã giảm giá mới!',
                message: `Đã có mã giảm giá mới: ${coupon.code}`,
                type: 'coupon',
            });
            console.log('✅ Đã gửi thông báo sang Express backend');
        } catch (err) {
            console.error('❌ Lỗi gửi thông báo sang Express backend:', err.message);
        }
        return savedCoupon
    }

    async updateCoupon(id: string, updateCouponDto: CreateCouponDto): Promise<Coupon> {
        const coupon = await this.couponModel.findById(id);
        if (!coupon) {
            throw new NotFoundException('Không tìm thấy mã khuyến mại');
        }

        const { startDate, endDate } = updateCouponDto;

        // Nếu có cập nhật ngày thì kiểm tra hợp lệ
        if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
            throw new BadRequestException('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
        }

        Object.assign(coupon, updateCouponDto);
        return coupon.save();
    }


    // Xóa mềm
    async softDeleteCoupon(id: string): Promise<Coupon> {
        const coupon = await this.couponModel.findByIdAndUpdate(
            id,
            { $set: { isActive: false } },
            { new: true }
        );
        if (!coupon) {
            throw new NotFoundException('Không tìm thấy mã khuyến mại');
        }
        return coupon;
    }

    async findAllCoupons(query: {
        isActive?: string;
        startDate?: string;
        endDate?: string;
        code?: string;
        maxDiscountValue?: string;
        page?: string;
        limit?: string;
    }): Promise<{ data: Coupon[]; total: number; page: number; limit: number }> {
        const {
            isActive,
            startDate,
            endDate,
            code,
            maxDiscountValue,
            page = '1',
            limit = '10',
        } = query;

        const filter: any = {};

        // Lọc theo trạng thái hoạt động
        if (typeof isActive !== 'undefined') {
            filter.isActive = isActive === 'true';
        }

        // Lọc theo ngày tạo (khoảng thời gian)
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Tìm kiếm code (fuzzy search)
        if (code) {
            filter.code = { $regex: code, $options: 'i' }; // không phân biệt hoa thường
        }

        // Lọc discountValue ≤ maxDiscountValue
        if (maxDiscountValue) {
            filter.discountValue = { $lte: Number(maxDiscountValue) };
        }

        // Phân trang
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const [data, total] = await Promise.all([
            this.couponModel.find(filter).skip(skip).limit(limitNum).exec(),
            this.couponModel.countDocuments(filter),
        ]);

        return { data, total, page: pageNum, limit: limitNum };
    }
}