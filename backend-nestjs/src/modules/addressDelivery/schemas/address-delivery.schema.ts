
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AddressDeliverynDocument = AddressDelivery & DocumentFragment;

@Schema({
  timestamps: true,
})
export class AddressDelivery {

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;
}

export const AddressDeliverySchema = SchemaFactory.createForClass(AddressDelivery);

AddressDeliverySchema.virtual('id').get(function () {
  return this._id.toHexString();
});

AddressDeliverySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: any) => {
    delete ret._id;
  },
});
