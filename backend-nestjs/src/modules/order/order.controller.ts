import { Controller,Body ,Get, Query, DefaultValuePipe, ParseIntPipe, Search, Param, Patch } from "@nestjs/common";
import { OrderService } from "./order.service";
import { OrderStatus } from "./enums/order-status.enum";
import { PaymentMethod } from "../payment/enums/payment-method.enum";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";


@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService){}
  

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('orderStatus') orderStatus?: OrderStatus,
    @Query('paymentMethod') paymentMethod?: PaymentMethod,
    // Sửa ở đây: nhận vào startDate và endDate
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.orderService.findAll({ 
      page, 
      limit, 
      search, 
      orderStatus, 
      paymentMethod,
      startDate, 
      endDate,   
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }


 @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(id, updateOrderStatusDto.status);
  }
}
