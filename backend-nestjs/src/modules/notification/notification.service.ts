import { Injectable, Body } from "@nestjs/common";
import { NotificationGateway } from "./notification.gateway";
import { Model, PipelineStage } from 'mongoose';
import { Notification } from './schemas/notification.schema';
import { InjectModel } from '@nestjs/mongoose';
import { CreateNotificationDto } from './dto/createNoti.dto'
import axios from 'axios';
@Injectable()
export class NotificationService {
    constructor(private notificationGateway: NotificationGateway,
        @InjectModel(Notification.name)
        private readonly notificationModel: Model<Notification>) { }

    async notify(payload: any) {
        this.notificationGateway.sendNotification(payload)
    }
    async getAll(query: {
        page?: string;
        limit?: string;
        type?: string;
    }): Promise<{ data: any[]; total: number; page: number; limit: number }> {
        const {
            page = '1',
            limit = '5',
            type
        } = query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const pipeline: PipelineStage[] = [];

        // 🔹 Nếu có type thì thêm điều kiện lọc
        if (type && type.trim() !== '') {
            pipeline.push({
                $match: { type: type }
            });
        }

        // 🔹 Nhóm theo title + message để loại trùng
        pipeline.push(
            {
                $group: {
                    _id: { title: "$title", message: "$message" },
                    doc: { $first: "$$ROOT" } // lấy document đại diện
                }
            },
            { $replaceRoot: { newRoot: "$doc" } },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limitNum }
        );

        // 🔹 Chạy song song 2 truy vấn: data + tổng số lượng
        const [notifications, totalResult] = await Promise.all([
            this.notificationModel.aggregate(pipeline),
            this.notificationModel.aggregate([
                ...(type && type.trim() !== '' ? [{ $match: { type: type } }] : []),
                {
                    $group: {
                        _id: { title: "$title", message: "$message" }
                    }
                },
                { $count: "total" }
            ])
        ]);

        const total = totalResult[0]?.total || 0;

        return { data: notifications, total, page: pageNum, limit: limitNum };
    }




    async create(createNotificationDto: CreateNotificationDto): Promise<any> {
        this.notificationGateway.sendNotification({
            type: createNotificationDto.type,
            title: createNotificationDto.title,
            message: createNotificationDto.message
        })

        try {
            await axios.post('http://localhost:8088/api/notifications/broadcast', {
                title: createNotificationDto.title,
                message: createNotificationDto.message,
                type: createNotificationDto.type,
            });
            console.log('✅ Đã gửi thông báo sang Express backend');
        } catch (err) {
            console.error('❌ Lỗi gửi thông báo sang Express backend:', err.message);
        }
        return {
            message: true
        }
    }

}