import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { OrderService } from './order.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // ─── CART ───

  @UseGuards(AuthGuard)
  @Get('cart')
  getCart(@Req() req: Request) {
    return this.orderService.getCart(req['user'].id);
  }

  @UseGuards(AuthGuard)
  @Post('cart/items')
  addToCart(@Req() req: Request, @Body() dto: AddToCartDto) {
    return this.orderService.addToCart(req['user'].id, dto);
  }

  @UseGuards(AuthGuard)
  @Patch('cart/items/:id')
  updateCartItem(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.orderService.updateCartItem(req['user'].id, +id, dto);
  }

  @UseGuards(AuthGuard)
  @Delete('cart/items/:id')
  removeCartItem(@Req() req: Request, @Param('id') id: string) {
    return this.orderService.removeCartItem(req['user'].id, +id);
  }

  // ─── CHECKOUT ───

  @UseGuards(AuthGuard)
  @Post('orders')
  checkout(@Req() req: Request, @Body() dto: CheckoutDto) {
    return this.orderService.checkout(req['user'].id, dto);
  }

  // ─── ADMIN ORDERS ───

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/orders')
  findAll(@Query() query: OrderQueryDto) {
    return this.orderService.findAll(query);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/orders/:id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(+id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('admin/orders/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: Request,
  ) {
    return this.orderService.updateStatus(+id, dto, req['user']);
  }
}
