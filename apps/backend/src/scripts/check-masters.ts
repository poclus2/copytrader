
import { DataSource } from 'typeorm';
import { Master } from '../masters/entities/master.entity';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

async function check() {
    console.log('Connecting to database...');
    const AppDataSource = new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL || 'postgres://user:password@127.0.0.1:5432/copytrading',
        entities: [Master],
        synchronize: false,
    });

    try {
        await AppDataSource.initialize();
        console.log('Database connected.');

        const masters = await AppDataSource.getRepository(Master).find();
        console.log(`Masters count: ${masters.length}`);
        masters.forEach(m => console.log(`- ${m.id}: ${m.name} (${m.type})`));

    } catch (error) {
        console.error('Check failed:', error);
    } finally {
        if (AppDataSource.isInitialized) await AppDataSource.destroy();
    }
}
check();
