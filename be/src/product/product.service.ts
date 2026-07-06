import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { paginate, PaginatedResult } from 'src/common/utils/prisma-pagination.util';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) { }

  private async triggerFrontendRevalidate() {
    try {
      const feUrl = process.env.FRONTEND_URL || "http://localhost:3009";
      
      // Trigger revalidation for both featured products and categories lists asynchronously
      // We don't block the request, we just fire and log on failure
      Promise.all([
        fetch(`${feUrl}/api/revalidate?tag=featured-products`),
        fetch(`${feUrl}/api/revalidate?tag=categories`)
      ]).then((responses) => {
        responses.forEach((res, index) => {
          const tag = index === 0 ? 'featured-products' : 'categories';
          if (!res.ok) {
            console.warn(`[Revalidate] Failed to revalidate tag: ${tag}, status: ${res.status}`);
          } else {
            console.log(`[Revalidate] Successfully revalidated tag: ${tag}`);
          }
        });
      }).catch(err => {
        console.error('[Revalidate] Error sending revalidation request to frontend:', err);
      });
    } catch (error) {
      console.error('[Revalidate] Unexpected error in triggerFrontendRevalidate:', error);
    }
  }

  async create(createProductDto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: createProductDto as any,
      include: { category: true }
    });
    this.triggerFrontendRevalidate();
    return product;
  }

  async findAll(query?: PaginationQueryDto) {
    let orderBy: any = { id: 'desc' };

    if (query?.sortBy) {
      const direction = query.sortOrder === 'desc' ? 'desc' : 'asc';
      orderBy = { [query.sortBy]: direction };
    }

    const result = await paginate(this.prisma.product, {
      query,
      defaultLimit: 8,
      orderBy,
      include: { category: true },
    });

    // Nếu trả về dạng PaginatedResult → map lại key "products" cho frontend
    if (!Array.isArray(result)) {
      const paginated = result as PaginatedResult<any>;
      return {
        products: paginated.items,
        total: paginated.total,
        page: paginated.page,
        limit: paginated.limit,
        totalPages: paginated.totalPages,
      };
    }

    return result;
  }

  async findOne(id: number) {
    return await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true
      }
    });
  }

  async findBySlug(slug: string) {
    return await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true
      }
    });
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const updated = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: true
      }
    });
    this.triggerFrontendRevalidate();
    return updated;
  }

  async remove(id: number) {
    const deleted = await this.prisma.product.delete({ where: { id } });
    this.triggerFrontendRevalidate();
    return deleted;
  }
}
