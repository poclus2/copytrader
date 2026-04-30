
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Slave } from '../slaves/entities/slave.entity';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env vars
dotenv.config({ path: resolve(__dirname, '../../.env') });

const RECHARGE_AMOUNT = 10000;

async function bootstrap() {
    console.log('Connecting to database...');

    const AppDataSource = new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL || 'postgres://user:password@127.0.0.1:5432/copytrading',
        entities: [User, Slave], // Add other entities if needed for Foreign Keys, but User should be enough for update
        synchronize: false,
    });

    try {
        await AppDataSource.initialize();
        console.log('Database connected.');

        const userRepository = AppDataSource.getRepository(User);

        console.log(`Updating all users wallet balance to $${RECHARGE_AMOUNT}...`);

        const result = await userRepository.createQueryBuilder()
            .update(User)
            .set({ walletBalance: RECHARGE_AMOUNT })
            .where("isActive = :isActive", { isActive: true }) // Only active users safer? Or all? User said "all".
            .execute();

        console.log(`Success! Affected rows: ${result.affected}`);

    } catch (error) {
        console.error('Error recharging balances:', error);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            console.log('Connection closed.');
        }
    }
}

bootstrap();
