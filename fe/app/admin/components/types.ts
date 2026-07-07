export interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface CategoryData {
  id: number;
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
  createdAt: string;
}

export interface ProductData {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  image?: string;
  categoryId?: number;
  category?: { id: number; name: string };
  createdAt: string;
}

export interface OrderData {
  id: number;
  orderNumber: string;
  userId: number;
  user: { id: number; name: string; email: string };
  total: number;
  status: string;
  shippingAddress?: string;
  note?: string;
  cancelledAt?: string;
  cancelledReason?: string;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItemData[];
  statusHistory: StatusHistoryData[];
}

export interface OrderItemData {
  id: number;
  productId: number;
  product: { id: number; name: string; slug: string; image?: string; price: number };
  quantity: number;
  price: number;
}

export interface StatusHistoryData {
  id: number;
  fromStatus?: string;
  toStatus: string;
  changedBy: number;
  changedByRole: string;
  note?: string;
  createdAt: string;
}

export const ORDER_STATUSES = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled',
] as const;

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export type TabType = 'overview' | 'products' | 'categories' | 'users' | 'orders';
