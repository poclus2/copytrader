import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDecoySlTpToPropFirmConfig1746050000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "prop_firm_configs"
            ADD COLUMN IF NOT EXISTS "useDecoySlTp"   BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "decoyOffsetPips" INTEGER NOT NULL DEFAULT 20;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "prop_firm_configs"
            DROP COLUMN IF EXISTS "useDecoySlTp",
            DROP COLUMN IF EXISTS "decoyOffsetPips";
        `);
    }
}
