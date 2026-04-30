import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://localhost:3000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface Master {
    id: string;
    name: string;
    broker: string;
    credentials: any;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    description?: string;
    avatar?: string;
    monthlyFee?: number;
    type?: 'HUMAN' | 'BOT';
    strategy?: string;
    riskScore?: number;
    aiConfig?: {
        detailedStrategy?: string;
        processingSteps?: string[];
        internalParameters?: Record<string, string>;
    };
}

export interface Slave {
    id: string;
    name: string;
    broker: string;
    credentials: any;
    isActive: boolean;
    config: any;
    master?: Master;
    createdAt: string;
    updatedAt: string;
}

export interface CreateMasterDto {
    name: string;
    broker: string;
    credentials: any;
    description?: string;
    avatar?: string;
    monthlyFee?: number;
    type?: 'HUMAN' | 'BOT';
    strategy?: string;
    riskScore?: number;
    aiConfig?: {
        detailedStrategy?: string;
        processingSteps?: string[];
        internalParameters?: Record<string, string>;
    };
}

export interface CreateSlaveDto {
    name: string;
    broker: string;
    credentials: any;
    masterId: string;
    config?: any;
}
