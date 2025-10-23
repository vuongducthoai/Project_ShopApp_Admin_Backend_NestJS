import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsBoolean, IsMongoId } from 'class-validator';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty({ message: 'Code is required' })
  code: string;

  @IsNumber({}, { message: 'Discount value must be a number' })
  @IsNotEmpty({ message: 'Discount value is required' })
  discountValue: number;

  @IsOptional()
  @IsNumber({}, { message: 'Maximum discount must be a number' })
  maxDiscount?: number;

  @IsDateString({}, { message: 'Start date must be a valid date string' })
  @IsNotEmpty({ message: 'Start date is required' })
  startDate: Date;

  @IsDateString({}, { message: 'End date must be a valid date string' })
  @IsNotEmpty({ message: 'End date is required' })
  endDate: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  usedCount?: number;

  @IsOptional()
  @IsMongoId({ message: 'Order must be a valid ObjectId' })
  order?: string;
}