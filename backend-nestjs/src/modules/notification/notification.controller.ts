import { Controller, Post, Body } from "@nestjs/common";
import { NotificationService } from "./notification.service";

@Controller('notifications')
export class NotificationController {
    constructor(private service: NotificationService){}

    @Post()
    async receiveFromExpress(@Body() payload: any){
        console.log('📩 Received notification from Express:', payload);
        await this.service.notify(payload)
        return { success: true };
    }
}