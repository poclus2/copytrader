import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async create(userData: Partial<User>): Promise<User> {
        const user = this.usersRepository.create(userData);
        return this.usersRepository.save(user);
    }

    async findOne(id: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { id } });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async update(id: string, userData: Partial<User>): Promise<User | null> {
        await this.usersRepository.update(id, userData);
        return this.findOne(id);
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async deductBalance(userId: string, amount: number): Promise<User> {
        const user = await this.findOne(userId);
        if (!user) throw new Error('User not found');

        // Convert to number to ensure arithmetic safety with decimal types
        const currentBalance = Number(user.walletBalance);
        if (currentBalance < amount) {
            throw new Error('Insufficient wallet balance');
        }

        user.walletBalance = currentBalance - amount;
        return this.usersRepository.save(user);
    }

    async addBalance(userId: string, amount: number): Promise<User> {
        const user = await this.findOne(userId);
        if (!user) throw new Error('User not found');

        user.walletBalance = Number(user.walletBalance) + amount;
        return this.usersRepository.save(user);
    }
}
