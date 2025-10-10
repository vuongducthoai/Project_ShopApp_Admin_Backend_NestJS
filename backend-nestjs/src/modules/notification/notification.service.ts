import { Injectable } from "@nestjs/common";
import { NotificationGateway } from "./notification.gateway";

@Injectable()
export class NotificationService {
    constructor(private gateway: NotificationGateway){}

    async notify(payload: any){
        this.gateway.sendNotification(payload)
    }
}