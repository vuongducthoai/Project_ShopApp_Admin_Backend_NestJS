import { Controller, Get, Param } from '@nestjs/common';
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
}
