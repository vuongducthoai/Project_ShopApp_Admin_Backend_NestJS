import {
    WebSocketGateway,
    SubscribeMessage,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
} from '@nestjs/websockets';
import { Server } from 'socket.io'


@WebSocketGateway({
    cors: {
        origin: '*',
    },
})

export class NotificationGateway implements OnGatewayInit, OnGatewayConnection {
    @WebSocketServer() server: Server
    afterInit(server: any) {
        console.log('WebSocket initialized');
    }
    handleConnection(client: any, ...args: any[]) {
        console.log('Client connected:', client.id);
    }

    sendNotification(data: any) {
        this.server.emit('notification', data)
    }
    @SubscribeMessage('new_feedback')
    handleNewFeedback(client: any, payload: any){
        console.log('📩 Feedback mới từ Express:', payload);
        this.server.emit('admin_notification', payload)
    }
}

