import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string; // muy importante para el momento de la busqueda tener presente el tipo del dato que buscaremos

  @Column('text', { unique: true, nullable: false })
  title: string;
  @Column('float', { default: 0 }) //es necesario saber que tipo de datos maneja cada base de datos
  price: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('text', { unique: true })
  slug: string;

  @Column('numeric', { default: 0 })
  stock: number;

  @Column('text', { array: true })
  sizes: string[];

  @Column('text', { nullable: true })
  gender: string;

  @Column('text', { array: true, default: [] }) // manejamos el each para que se maneje la info de forma dinamica s
  tags: string[];

  // Funcionalidades de TypeORM para el manejo de creacion y actualizacion respectivamente
  @BeforeInsert()
  checkSlugInsert() {
    if (!this.slug) {
      this.slug = this.title;
    }

    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }

  @BeforeUpdate()
  checkSlugUpdate() {
    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }
}
