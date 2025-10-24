import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { removeVietnameseAccents } from 'src/utils/textUtils';

export type ProductDocument = Product & Document;

@Schema({timestamps: false})
export class Product{
    @Prop({required: true})
    productName: string;


    @Prop()
    productNameNormalized?: string;

    @Prop({
      type: [{ type: Types.ObjectId, ref: 'ImageProduct' }],
    })
    listImage?: Types.ObjectId[];


    @Prop()
    description?: string;

    @Prop()
    descriptionNormalized?:string;

    // @Prop({required: true})
    // quantity: number;

    @Prop({required: true})
    price: number;

   @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
   category: Types.ObjectId;

   @Prop({default: true})
   status: boolean;

   @Prop({type: Date, default: Date.now})
   createDate?: Date;

   @Prop({type: Date, default: Date.now})
   updateDate?: Date;

    @Prop({
      type: [{ type: Types.ObjectId, ref: 'ProductSize' }],
    })
    productSizes: Types.ObjectId[];   // <-- đổi tên thành productSizes
}


export const ProductSchema = SchemaFactory.createForClass(Product);

//Middleawre pre-save
ProductSchema.pre<Product>('save', function (next) {
  if (this.productName) {
    this.productNameNormalized = removeVietnameseAccents(this.productName);
  }
  if (this.description) {
    this.descriptionNormalized = removeVietnameseAccents(this.description);
  }
  next();
});

//Middle pre-update
ProductSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  const update = this.getUpdate() as any;
  if (update.$set) {
    if (update.$set.productName) {
      update.$set.productNameNormalized = removeVietnameseAccents(update.$set.productName);
    }
    if (update.$set.description) {
      update.$set.descriptionNormalized = removeVietnameseAccents(update.$set.description);
    }
  } else {
    if (update.productName) {
      update.productNameNormalized = removeVietnameseAccents(update.productName);
    }
    if (update.description) {
      update.descriptionNormalized = removeVietnameseAccents(update.description);
    }
  }
  next();
});

ProductSchema.virtual('id').get(function (this: any) {
  return this._id.toString();
});

ProductSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc: any, ret: any) => {
    delete ret._id;
    delete ret.productNameNormalized;
    delete ret.descriptionNormalized;
  },
});


