
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env') });

const RECHARGE_AMOUNT = 10000;

async function bootstrap() {
    console.log('Connecting to database (Raw SQL)...');

    // Create new DataSource without entities for raw query
    const AppDataSource = new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL || 'postgres://user:password@127.0.0.1:5432/copytrading',
        synchronize: false,
    });

    try {
        await AppDataSource.initialize();
        console.log('Database connected.');

        console.log(`Executing raw update...`);
        // Note: Check column name casing. user.entity.ts had @Column() walletBalance, usually camelCase in code maps to camelCase in Postgres if not specified, OR lowercase if TypeORM defaults apply.
        // TypeORM default naming strategy usually preserves casing or lowercase.
        // I will try double quotes "walletBalance" to matches standard TypeORM behavior if it was created with camelCase, 
        // OR try lowercase snake_case if I suspect that. 
        // Let's assume standard "walletBalance" or "wallet_balance"?
        // Looking at the entity file: @Column() walletBalance: number;
        // If no name specified, it uses property name "walletBalance".
        // PostgreSQL is case sensitive with quotes.

        // Let's try to update "user" table (usually "user" is reserved or "users"). Entity says @Entity('users').

        const result = await AppDataSource.query(
            `UPDATE "users" SET "walletBalance" = $1 WHERE "isActive" = true`,
            [RECHARGE_AMOUNT]
        );

        // If "walletBalance" fails, I might try walletBalance (unquoted -> lowercase).
        // But usually TypeORM with @Column() uses the property name as is if used with synchronize: true.

        console.log('Update query executed.');

        // Verification
        const rows = await AppDataSource.query(`SELECT count(*) as cnt, sum("walletBalance") as total FROM "users"`);
        console.log('Verification:', rows);

    } catch (error) {
        console.error('Error recharging balances:', error.message);
        // Fallback: try snake_case if column not found
        if (error.message.includes('column "walletBalance" does not exist')) {
            console.log('Retrying with snake_case wallet_balance...');
            try {
                await AppDataSource.query(
                    `UPDATE "users" SET "wallet_balance" = $1 WHERE "isActive" = true`,
                    [RECHARGE_AMOUNT]
                );
                console.log('Retry success.');
            } catch (e) { console.error('Retry failed:', e.message); }
        }
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            console.log('Connection closed.');
        }
    }
}

bootstrap();
