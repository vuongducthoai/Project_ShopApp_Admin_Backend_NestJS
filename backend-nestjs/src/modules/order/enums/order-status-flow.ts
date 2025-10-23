import { Order } from "../schemas/order.shema";
import { OrderStatus } from "./order-status.enum";

export const StatusFlow: Record<OrderStatus, OrderStatus[]> = { 
    [OrderStatus.ORDERED]:   [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPED]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    [OrderStatus.COMPLETED]: [],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.FEEDBACKED]: [],
};  