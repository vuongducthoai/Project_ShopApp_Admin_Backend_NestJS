import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({timestamps: true})
export class Notification extends Document{
    @Prop({type: Types.ObjectId, ref: 'User', require: true})
    userId: Types.ObjectId;
    
    @Prop({require: true})
    title: string;

    @Prop({require: true})
    message: string;

    @Prop()
    type: string;

    @Prop({default: false})
    isRead: boolean

}
export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.virtual('id').get(function (this: Notification) {
  return (this._id as Types.ObjectId).toString();
});

NotificationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
});