import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { paginate, PaginatedResult } from 'src/common/utils/prisma-pagination.util';
import { revalidateFrontendTags } from 'src/common/utils/revalidate.util';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const category = await this.prisma.category.create({
      data: createCategoryDto,
    });
    revalidateFrontendTags('categories');
    return category;
  }

  async findAll(query?: PaginationQueryDto) {
    // Xây dựng where clause: search theo name hoặc slug
    const where: any = {};
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search } },
        { slug: { contains: query.search } },
      ];
    }

    const result = await paginate(this.prisma.category, {
      query,
      defaultLimit: 20,
      orderBy: { id: 'asc' },
      where,
      include: {
        _count: {
          select: { products: true }
        }
      },
    });

    // Nếu có phân trang → format response với key "categories"
    if (!Array.isArray(result)) {
      const paginated = result as PaginatedResult<any>;
      return {
        categories: paginated.items.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          productCount: cat._count?.products ?? 0,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
        })),
        total: paginated.total,
        page: paginated.page,
        limit: paginated.limit,
        totalPages: paginated.totalPages,
      };
    }

    // Không có phân trang → trả về array (backward compatible)
    return result.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      productCount: cat._count?.products ?? 0,
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
    const category = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
    revalidateFrontendTags('categories');
    return category;
  }

  async remove(id: number) {
    const category = await this.prisma.category.delete({
      where: { id },
    });
    revalidateFrontendTags('categories');
    return category;
  }
}
