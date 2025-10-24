import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { Notification, NotificationSchema } from './schemas/notification.schema'; // 👈 import model/schema của bạn

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema }, // 👈 đăng ký model
    ]),
  ],
  providers: [NotificationGateway, NotificationService],
  controllers: [NotificationController],
  exports: [NotificationGateway],
})
export class NotificationModule {}