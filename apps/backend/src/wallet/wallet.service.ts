import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType, TransactionStatus } from './entities/transaction.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class WalletService {
    constructor(
        @InjectRepository(Transaction)
        private transactionRepository: Repository<Transaction>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async getBalance(userId: string): Promise<{ balance: number; currency: string }> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        return { balance: Number(user.walletBalance), currency: 'USD' };
    }

    async getTransactions(userId: string): Promise<Transaction[]> {
        return this.transactionRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async deposit(userId: string, amount: number, method: string): Promise<Transaction> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        // Create pending transaction
        const transaction = this.transactionRepository.create({
            userId,
            amount,
            type: TransactionType.DEPOSIT,
            status: TransactionStatus.PENDING,
            method,
            currency: 'USD',
        });

        await this.transactionRepository.save(transaction);

        // MOCK: Simulate successful payment immediately for now
        // In real implementation, this would happen via webhook
        await this.completeTransaction(transaction.id);

        const savedTransaction = await this.transactionRepository.findOne({ where: { id: transaction.id } });
        if (!savedTransaction) throw new Error('Transaction creation failed');
        return savedTransaction;
    }

    async withdraw(userId: string, amount: number, method: string, details: any): Promise<Transaction> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        if (user.walletBalance < amount) {
            throw new BadRequestException('Insufficient funds');
        }

        const transaction = this.transactionRepository.create({
            userId,
            amount: -amount, // Negative for withdrawal
            type: TransactionType.WITHDRAWAL,
            status: TransactionStatus.PENDING,
            method,
            metadata: details,
            currency: 'USD',
        });

        await this.transactionRepository.save(transaction);

        // Deduct balance immediately for withdrawal
        user.walletBalance = Number(user.walletBalance) - amount;
        await this.userRepository.save(user);

        return transaction;
    }

    // Internal method to complete a transaction
    async completeTransaction(transactionId: string): Promise<void> {
        const transaction = await this.transactionRepository.findOne({
            where: { id: transactionId },
            relations: ['user']
        });

        if (!transaction || transaction.status === TransactionStatus.COMPLETED) return;

        transaction.status = TransactionStatus.COMPLETED;
        await this.transactionRepository.save(transaction);

        if (transaction.type === TransactionType.DEPOSIT) {
            transaction.user.walletBalance = Number(transaction.user.walletBalance) + Number(transaction.amount);
            await this.userRepository.save(transaction.user);
        }
    }
}
