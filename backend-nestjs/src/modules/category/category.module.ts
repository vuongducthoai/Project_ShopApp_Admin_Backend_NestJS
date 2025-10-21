import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Category, CategorySchema } from "./schemas/category.shema";
import { CategoryService } from "./category.service";
import { CategoryController } from "./category.controller";
@Module({
    imports: [
        // register Moogoose model(from schema) into dependency injection container of Nest
        // to you can @InjectModel(...) and using model this in service/controller
        MongooseModule.forFeature([{name: Category.name, schema: CategorySchema}]), 
    ],
    exports: [MongooseModule],
    providers: [CategoryService],
    controllers: [CategoryController],
})
export class CategoryModule {}