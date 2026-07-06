import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { paginate, PaginatedResult } from 'src/common/utils/prisma-pagination.util';
import { FileService } from 'src/file/file.service';
import { revalidateFrontendTags } from 'src/common/utils/revalidate.util';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private fileService: FileService,
  ) { }



  async create(createProductDto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: createProductDto as any,
      include: { category: true }
    });
    revalidateFrontendTags(['featured-products', 'categories']);
    return product;
  }

  async findAll(query?: PaginationQueryDto) {
    let orderBy: any = { id: 'desc' };

    if (query?.sortBy) {
      const direction = query.sortOrder === 'desc' ? 'desc' : 'asc';
      orderBy = { [query.sortBy]: direction };
    }

    // Xây dựng where clause: search theo name hoặc slug
    const where: any = {};
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search } },
        { slug: { contains: query.search } },
      ];
    }

    const result = await paginate(this.prisma.product, {
      query,
      defaultLimit: 8,
      orderBy,
      where,
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
    // Nếu có ảnh mới → xoá ảnh cũ (nếu có)
    if (updateProductDto.image) {
      const existing = await this.prisma.product.findUnique({ where: { id } });
      if (existing?.image && existing.image !== updateProductDto.image) {
        this.fileService.deleteFile(existing.image);
      }
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: true
      }
    });
    revalidateFrontendTags(['featured-products', 'categories']);
    return updated;
  }

  async remove(id: number) {
    // Lấy thông tin product trước khi xoá để cleanup ảnh
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (product?.image) {
      this.fileService.deleteFile(product.image);
    }

    const deleted = await this.prisma.product.delete({ where: { id } });
    revalidateFrontendTags(['featured-products', 'categories']);
    return deleted;
  }
}
