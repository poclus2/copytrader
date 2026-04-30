
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

async function check() {
    console.log('Connecting (Raw SQL)...');
    const AppDataSource = new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL || 'postgres://user:password@127.0.0.1:5432/copytrading',
        synchronize: false,
    });

    try {
        await AppDataSource.initialize();
        console.log('Connected.');
        const rows = await AppDataSource.query(`SELECT * FROM "masters"`);
        console.log(`Masters Count: ${rows.length}`);
        rows.forEach((r: any) => console.log(`- [${r.id}] ${r.name} (${r.type}) Active:${r.isActive}`));
    } catch (error) {
        console.error('Raw check failed:', error.message);
    } finally {
        if (AppDataSource.isInitialized) await AppDataSource.destroy();
    }
}
check();
