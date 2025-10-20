import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelsService } from './models.service';
import { ModelsController } from './models.controller';
import { Models, ModelSchema } from '../model/models';
import { Brand, BrandSchema } from '../model/brands';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Models.name, schema: ModelSchema },
      { name: Brand.name, schema: BrandSchema }, // <-- register Brand model here
    ]),
  ],
  controllers: [ModelsController],
  providers: [ModelsService],
  exports: [ModelsService],
})
export class ModelsModule {}