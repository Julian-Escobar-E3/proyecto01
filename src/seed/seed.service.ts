import { ProductsService } from './../products/products.service';
import { Injectable } from '@nestjs/common';
import { initialData } from './data/seed-data';

@Injectable()
export class SeedService {
  constructor(private readonly productService: ProductsService) {}

  async runSeed() {
    await this.uploadNewProducts();
    return 'Seed Executed';
  }

  private async uploadNewProducts() {
    this.productService.destroyAll(); // llamarlo como el metodo y no atributo es decir ponerle los () al final
    const products = initialData.products;

    const insertPromises = [];

    products.forEach((product) => {
      insertPromises.push(this.productService.create(product));
    });

    await Promise.all(insertPromises);

    return true;
  }
}
