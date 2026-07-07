import {
  Injectable, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { paginate, PaginatedResult } from '../common/utils/prisma-pagination.util';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['processing', 'cancelled'],
  processing: ['shipped'],
  shipped:    ['delivered'],
  delivered:  [],
  cancelled:  [],
};

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  // ─────────────── CART ───────────────

  async getCart(userId: number) {
    return this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: { id: true, name: true, slug: true, price: true, stock: true, image: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addToCart(userId: number, dto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId: dto.productId } },
    });

    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + dto.quantity },
        include: { product: true },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        userId,
        productId: dto.productId,
        quantity: dto.quantity,
      },
      include: { product: true },
    });
  }

  async updateCartItem(userId: number, itemId: number, dto: UpdateCartItemDto) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
      include: { product: true },
    });
  }

  async removeCartItem(userId: number, itemId: number) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, userId },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    return this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  // ─────────────── CHECKOUT ───────────────

  async checkout(userId: number, dto: CheckoutDto) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (!cartItems.length) {
      throw new BadRequestException('Cart is empty');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      // 1. Validate stock + decrement atomically
      for (const item of cartItems) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new BadRequestException(
            `Insufficient stock for "${item.product.name}"`,
          );
        }
      }

      // 2. Calculate total server-side
      const total = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      );

      // 3. Create order number
      const orderNumber = await this.generateOrderNumber(tx);

      // 4. Create Order + OrderItems
      const order = await tx.order.create({
        data: {
          userId,
          orderNumber,
          total,
          shippingAddress: dto.shippingAddress,
          note: dto.note,
          status: 'pending',
          orderItems: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: { orderItems: true },
      });

      // 5. Log status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          toStatus: 'pending',
          changedBy: userId,
          changedByRole: 'user',
        },
      });

      // 6. Clear cart
      await tx.cartItem.deleteMany({ where: { userId } });

      return order;
    });

    return this.prisma.order.findUnique({
      where: { id: order.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        orderItems: {
          include: { product: { select: { id: true, name: true, slug: true, image: true } } },
        },
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  // ─────────────── ADMIN ORDER MANAGEMENT ───────────────

  async findAll(query: OrderQueryDto) {
    const where: any = {};

    // Filter by status
    if (query.status) {
      where.status = query.status;
    }

    // Filter by date range
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    // Search by orderNumber or customer name/email
    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search } },
        { user: { name: { contains: query.search } } },
        { user: { email: { contains: query.search } } },
      ];
    }

    let orderBy: any = { id: 'desc' };
    if (query.sortBy) {
      const direction = query.sortOrder === 'asc' ? 'asc' : 'desc';
      // Map sort fields
      const sortMap: Record<string, string> = {
        total: 'total',
        status: 'status',
        createdAt: 'createdAt',
        orderNumber: 'orderNumber',
      };
      if (sortMap[query.sortBy]) {
        orderBy = { [sortMap[query.sortBy]]: direction };
      }
    }

    const result = await paginate(this.prisma.order, {
      query,
      defaultLimit: 15,
      orderBy,
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        orderItems: {
          include: { product: { select: { id: true, name: true, image: true } } },
        },
      },
    });

    // Cast to any to access the paginated shape
    const paginated = result as any;
    if (!Array.isArray(paginated) && paginated.items) {
      return {
        orders: paginated.items,
        total: paginated.total,
        page: paginated.page,
        limit: paginated.limit,
        totalPages: paginated.totalPages,
      };
    }

    return { orders: result as any, total: 0, page: 1, limit: 0, totalPages: 0 };
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        orderItems: {
          include: { product: { select: { id: true, name: true, slug: true, image: true, price: true } } },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          include: {
            // changedBy is the user id
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: number, dto: UpdateOrderStatusDto, adminUser: any) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    const currentStatus = order.status;
    const newStatus = dto.status;

    // Validate transition
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed: ${(allowed || []).join(', ') || 'none'}`,
      );
    }

    // Handle cancellation reason
    const updateData: any = { status: newStatus };
    if (newStatus === 'cancelled') {
      updateData.cancelledAt = new Date();
      updateData.cancelledReason = dto.note || null;
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: updateData,
    });

    // Log status history
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId: id,
        fromStatus: currentStatus,
        toStatus: newStatus,
        changedBy: adminUser.id,
        changedByRole: 'admin',
        note: dto.note,
      },
    });

    return this.findOne(id);
  }

  // ─────────────── HELPERS ───────────────

  private async generateOrderNumber(tx: any): Promise<string> {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const prefix = `ORD-${y}${m}${d}-`;

    // Find latest order number for today
    const last = await tx.order.findFirst({
      where: { orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });

    let seq = 1;
    if (last) {
      const parts = last.orderNumber.split('-');
      seq = parseInt(parts[3], 10) + 1;
    }

    return `${prefix}${String(seq).padStart(5, '0')}`;
  }
}
