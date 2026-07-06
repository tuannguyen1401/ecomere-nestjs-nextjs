import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { paginate, PaginatedResult } from 'src/common/utils/prisma-pagination.util';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  async findAll() {
    const categories = await this.prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { id: 'asc' }
    });

    return categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      productCount: cat._count.products,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));
  }

  async findBySlug(slug: string, query?: PaginationQueryDto) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }

    const total = category._count.products;

    // Sử dụng hàm paginate dùng chung
    const result = await paginate(this.prisma.product, {
      where: { categoryId: category.id },
      query,
      defaultLimit: 8,
      orderBy: { id: 'desc' },
      include: { category: true },
    });

    let products: any[] = [];
    let totalPages = 1;
    let page = 1;
    let limit = 8;

    if (!Array.isArray(result)) {
      const paginated = result as PaginatedResult<any>;
      products = paginated.items;
      totalPages = paginated.totalPages;
      page = paginated.page;
      limit = paginated.limit;
    } else {
      products = result;
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      productCount: total,
      products,
      page,
      limit,
      totalPages,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: number) {
    return this.prisma.category.delete({
      where: { id },
    });
  }
}
