import type { Response } from 'express';
import { Controller, Get, Param, Query, Res} from '@nestjs/common';
import { StatisticService } from './statistic.service';

@Controller('statistics')
export class StatisticController {
  constructor(private readonly statisticService: StatisticService) {}

  @Get()
  async getDashboardStats() {
    return this.statisticService.getDashboardStats();
  }

  @Get('sale/:year')
  async getSaleStatsIn1Year(@Param('year') year: number) {
    return this.statisticService.getSaleStatsIn1Year(year);
  }

  @Get('orders')
  async getOrders(@Query('month') month: string, @Query('year') year: string) {
    return this.statisticService.getAllOrdersByMonthAndYear(month, year);
  }

   @Get('export-pdf/:id')
  async exportOrder(@Param('id') id: string, @Res() res: Response) {
    return this.statisticService.exportOrderToPdf(id, res);
  }
}
