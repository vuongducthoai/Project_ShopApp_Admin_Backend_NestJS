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
import { NotificationService } from "./notification.service";
import {CreateNotificationDto} from "./dto/createNoti.dto"

@Controller('notifications')
export class NotificationController {
    constructor(private service: NotificationService){}

    @Post()
    async receiveFromExpress(@Body() payload: any){
        console.log('📩 Received notification from Express:', payload);
        await this.service.notify(payload)
        return { success: true };
    }

    @Get()
    async getAll(@Query() query: any){
        return await this.service.getAll(query)
    }

    @Post('send-notification')
    async sendNotification(@Body() createNotificationDTO: CreateNotificationDto): Promise<any>{
        return this.service.create(createNotificationDTO)
    }
}