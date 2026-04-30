
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
        const rows = await AppDataSource.query(`SELECT count(*) as cnt FROM "slaves"`);
        console.log(`Slaves Count: ${rows[0].cnt}`);
        const rows2 = await AppDataSource.query(`SELECT id, "userId", "isActive" FROM "slaves"`);
        rows2.forEach((r: any) => console.log(`Slave: ${r.id}, User: ${r.userId}, Active: ${r.isActive}`));
    } catch (error) {
        console.error('Raw check failed:', error.message);
    } finally {
        if (AppDataSource.isInitialized) await AppDataSource.destroy();
    }
}
check();
