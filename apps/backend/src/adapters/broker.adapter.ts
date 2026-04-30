export interface OrderRequest {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT' | 'STOP';
    quantity: number;
    price?: number;
    stopLoss?: number;
    takeProfit?: number;
}

export interface OrderResponse {
    id: string;
    symbol: string;
    status: 'FILLED' | 'PENDING' | 'CANCELLED' | 'REJECTED';
    filledQuantity: number;
    averagePrice: number;
}

export interface BrokerAdapter {
    connect(credentials: any): Promise<void>;
    placeOrder(order: OrderRequest): Promise<OrderResponse>;
    cancelOrder(orderId: string): Promise<void>;
    getBalance(): Promise<number>;
    getPositions(): Promise<any[]>;
}
