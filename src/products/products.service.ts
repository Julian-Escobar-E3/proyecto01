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
import { Repository } from 'typeorm';
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

    @InjectRepository(ProductImage)// cuidado con el tipo de dato que inyectamos
    private readonly productImageRepository: Repository<ProductImage>,
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

      return product;
    } catch (error) {
      //manejamos los losgs por terminal de una mejor forma utilizando las utilidades de nestjs
      this.handleDBExceptions(error);
      // console.log(error);

      throw new InternalServerErrorException('Ayudaaaaa');
    }
  }

  findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    return this.productRepository.find({
      take: limit,
      skip: offset,
      // TODO: relaciones
    });
  }

  async findOne(termino: string) {
    let product: Product;

    if (isUUID(termino)) {
      product = await this.productRepository.findOneBy({ id: termino });
    } else {
      const queryBuilder = this.productRepository.createQueryBuilder(); // con esta herramiente podemos manejar lo que es querys perzonalizadas
      product = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug', {
          title: termino.toUpperCase(),
          slug: termino.toLowerCase(),
        })
        .getOne();
    }

    if (!product)
      throw new NotFoundException(`Product with ${termino} not found`);

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.preload({
      id: id,
      ...updateProductDto,
      images: [],
    });
    if (!product)
      throw new NotFoundException(
        `Producto con el id : ${id} no se encuentra😔`,
      );
    try {
      await this.productRepository.save(product);
      return product;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async remove(id: number) {
    return `This action removes a #${id} product`;
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
}
