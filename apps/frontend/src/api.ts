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
    masters?: Master[];    // Multi-Master : liste des masters
    master?: Master;       // Rétrocompatibilité
    isPropFirm?: boolean;
    status?: string;
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
    masterIds: string[];   // Tableau de masters (Multi-Master)
    config?: any;
    isPropFirm?: boolean;
    userId?: string;
    type?: 'EXTERNAL' | 'VIRTUAL';
    initialBalance?: number;
}

