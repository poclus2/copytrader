
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Slave } from '../slaves/entities/slave.entity';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

async function check() {
    const AppDataSource = new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL || 'postgres://user:password@127.0.0.1:5432/copytrading',
        entities: [User, Slave],
        synchronize: false,
    });

    try {
        await AppDataSource.initialize();
        const user = await AppDataSource.getRepository(User).findOne({ where: {} }); // Get any user
        if (user) {
            console.log(`User ${user.email} Balance: ${user.walletBalance}`);
        } else {
            console.log('No users found.');
        }
    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        if (AppDataSource.isInitialized) await AppDataSource.destroy();
    }
}
check();
