// product-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDTO {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  imageProduct: string[];

  @ApiProperty()
  categoryName: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  price: number;

  @ApiProperty()
  status: boolean;

  @ApiProperty({ type: [String] })
  productSizes: string[];
}
