import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product, ProductImage } from './entities';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';
@Injectable()
export class ProductsService {
  /** a traves del constructor vamos a inyectar codigo en este caso
   * iyectaremos la entidad para poder manejarla
   */
  private readonly logger = new Logger('ProductService');
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage) // cuidado con el tipo de dato que inyectamos
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,
  ) {}
  async create(createProductDto: CreateProductDto) {
    try {
      const { images = [], ...productDetails } = createProductDto;
      const product = this.productRepository.create({
        ...productDetails,
        images: images.map((url) =>
          this.productImageRepository.create({ url: url }),
        ),
      });

      await this.productRepository.save(product);

      return { ...product, images };
    } catch (error) {
      //manejamos los losgs por terminal de una mejor forma utilizando las utilidades de nestjs
      this.handleDBExceptions(error);
      // console.log(error);

      throw new InternalServerErrorException('Ayudaaaaa');
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const productos = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true,
      },
    });

    return productos.map(({ images, ...resto }) => ({
      ...resto,
      images: images.map((img) => img.url),
    }));
  }

  async findOne(termino: string) {
    let product: Product;

    if (isUUID(termino)) {
      product = await this.productRepository.findOneBy({ id: termino });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder('prod'); // con esta herramiente podemos manejar lo que es querys perzonalizadas
      product = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug', {
          title: termino.toUpperCase(),
          slug: termino.toLowerCase(),
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .getOne();
    }

    if (!product)
      throw new NotFoundException(`Product with ${termino} not found`);

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { images, ...toUpdate } = updateProductDto;

    const product = await this.productRepository.preload({
      id,
      ...toUpdate,
    });
    if (!product)
      throw new NotFoundException(
        `Producto con el id : ${id} no se encuentra😔`,
      );

    // Creacion del query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } });
        product.images = images.map((img) =>
          this.productImageRepository.create({ url: img }),
        );
      }
      await queryRunner.manager.save(product);
      await queryRunner.commitTransaction();
      await queryRunner.release();
      //await this.productRepository.save(product);
      return this.buscayaplana(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleDBExceptions(error);
    }
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  //____________________
  private handleDBExceptions(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);

    this.logger.error(error);
    // console.log(error)
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }

  async buscayaplana(termino: string) {
    const { images = [], ...resto } = await this.findOne(termino);
    return { ...resto, images: images.map((img) => img.url) };
  }


  // Limpiar la base de datos todos los productos existentes 
  async destroyAll() {
    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query
        .delete()
        .where({})
        .execute();

    } catch (error) {
      this.handleDBExceptions(error);
    }

  }
}
