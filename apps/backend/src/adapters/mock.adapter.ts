import { BrokerAdapter, OrderRequest, OrderResponse } from './broker.adapter';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MockAdapter implements BrokerAdapter {
    async connect(credentials: any): Promise<void> {
        console.log('MockAdapter connected with', credentials);
    }

    async placeOrder(order: OrderRequest): Promise<OrderResponse> {
        console.log('MockAdapter placing order', order);
        return {
            id: Math.random().toString(36).substring(7),
            symbol: order.symbol,
            status: 'FILLED',
            filledQuantity: order.quantity,
            averagePrice: order.price || 10000,
        };
    }

    async cancelOrder(orderId: string): Promise<void> {
        console.log('MockAdapter cancelling order', orderId);
    }

    async getBalance(): Promise<number> {
        return 10000;
    }

    async getPositions(): Promise<any[]> {
        return [];
    }
}
