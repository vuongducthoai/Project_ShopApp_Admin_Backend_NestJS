import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UsePipes, 
  ValidationPipe 
} from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { Coupon } from './schemas/coupon.schema';

@Controller('coupons')
export class CouponController {
    constructor(private readonly couponService: CouponService) {}

    @Post()
    @UsePipes(new ValidationPipe({ transform: true }))
    async create(@Body() createCouponDto: CreateCouponDto): Promise<Coupon> {
        return this.couponService.createCoupon(createCouponDto);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updateCouponDto: CreateCouponDto,
    ): Promise<Coupon> {
        return this.couponService.updateCoupon(id, updateCouponDto);
    }

    @Patch('soft-delete/:id')
    async softDelete(@Param('id') id: string): Promise<Coupon> {
        return this.couponService.softDeleteCoupon(id);
    }

    @Get()
    async findAll(@Query() query: any) {
        return this.couponService.findAllCoupons(query);
    }

}
