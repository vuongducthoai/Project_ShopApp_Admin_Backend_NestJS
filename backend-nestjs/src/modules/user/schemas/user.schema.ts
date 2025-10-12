import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EnumRole } from '../enums/EnumRole';
import * as bcrypt from 'bcrypt'
export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  
  @Prop({ required: true })
  firstName: string;

  @Prop()
  lastName?: string;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  phoneNumber?: string;

  @Prop()
  gender?: boolean;

  @Prop({ enum: EnumRole, default: EnumRole.Customer })
  role: EnumRole;

  @Prop()
  image?: string;

  @Prop({default: true})
  status: boolean; 

  @Prop({ type: [{ type: Types.ObjectId, ref: 'AddressDelivery' }] })
  AddressDelivery?: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Order' }] })
  orders?: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Cart' })
  cart?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Coin' })
  coin?: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

//Hook to hash pasword before save
UserSchema.pre<UserDocument>('save', async function (next){
  //Chi bam mat khau neu no duoc thay doi (hoac la user moi)
  if(!this.isModified('password')){
      return next;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


UserSchema.virtual('id').get(function (this: any) {
  return this._id.toString();
});

UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: any) => {
    delete ret._id;
  },
});
