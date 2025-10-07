import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CoinDocument = Coin & Document;

@Schema({ timestamps: true })
export class Coin {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  User: Types.ObjectId;

  @Prop({ required: true })
  value: number;
}

export const CoinSchema = SchemaFactory.createForClass(Coin);

//Virtual id
CoinSchema.virtual('id').get(function (this: any) {
  return this._id.toString();
});

CoinSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: any) => {
    delete ret._id;
  },
});
