import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CoinUsageDocument = CoinUsage & Document;

@Schema({ timestamps: true })
export class CoinUsage {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, unique: true })
  order: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  coinsUsed: number;
}

export const CoinUsageSchema = SchemaFactory.createForClass(CoinUsage);

// Virtual id
CoinUsageSchema.virtual('id').get(function (this: any) {
  return this._id.toString();
});

// JSON transform
CoinUsageSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: any) => {
    delete ret._id;
  },
});