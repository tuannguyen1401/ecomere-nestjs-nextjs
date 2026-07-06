export class CreateProductDto {
  name: string;
  slug: string;
  price: number;
  stock: number;
  image?: string;
  categoryId?: number;
}
