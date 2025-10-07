import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsBoolean, IsMongoId } from 'class-validator';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã giảm giá (code) không được để trống' })
  code: string;

  @IsNumber({}, { message: 'Giá trị giảm phải là số' })
  @IsNotEmpty({ message: 'Giá trị giảm (discountValue) là bắt buộc' })
  discountValue: number;

  @IsOptional()
  @IsNumber({}, { message: 'Giảm tối đa phải là số' })
  maxDiscount?: number;

  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập ngày bắt đầu' })
  startDate: Date;

  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập ngày kết thúc' })
  endDate: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  usedCount?: number;

  @IsOptional()
  @IsMongoId({ message: 'order phải là ObjectId hợp lệ' })
  order?: string;
}
