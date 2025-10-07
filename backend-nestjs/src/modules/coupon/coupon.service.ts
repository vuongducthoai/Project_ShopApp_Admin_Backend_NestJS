import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Coupon } from "./schemas/coupon.schema";
import { CreateCouponDto } from "./dto/create-coupon.dto";

@Injectable()
export class CouponService{
    constructor(
        @InjectModel(Coupon.name) private couponModel: Model<Coupon>
    ) {}

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
        return coupon.save();
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
    async softDeleteCoupon (id: string) : Promise<Coupon>{
        const coupon = await this.couponModel.findByIdAndUpdate(
            id,
            {$set: {isActive: false}},
            {new: true}
        );
        if (!coupon){
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