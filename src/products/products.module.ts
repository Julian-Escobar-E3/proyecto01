import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product, ProductImage } from './entities';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  imports: [TypeOrmModule.forFeature([Product, ProductImage])], //en este apartado vamos a importar todas las entidades que manejamos
  exports: [ProductsService, TypeOrmModule],// exportamos el servicio que vamos a usar en otros modulos
})
export class ProductsModule {}
