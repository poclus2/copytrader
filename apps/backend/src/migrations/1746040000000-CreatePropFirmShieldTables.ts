import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: CreatePropFirmShieldTables
 *
 * Creates:
 *  - prop_firm_configs  (OneToOne → slaves)
 *  - shield_logs        (monitoring log per shielded order)
 *
 * NOTE: Run with `npx typeorm migration:run -d src/data-source.ts`
 *       from the apps/backend directory.
 */
export class CreatePropFirmShieldTables1746040000000 implements MigrationInterface {
    name = 'CreatePropFirmShieldTables1746040000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ── prop_firm_configs ────────────────────────────────────────────────
        await queryRunner.query(`
            CREATE TABLE "prop_firm_configs" (
                "id"                  UUID              NOT NULL DEFAULT uuid_generate_v4(),
                "slaveId"             UUID              NOT NULL,
                "isEnabled"           BOOLEAN           NOT NULL DEFAULT false,
                "minJitter"           INTEGER           NOT NULL DEFAULT 1000,
                "maxJitter"           INTEGER           NOT NULL DEFAULT 5000,
                "lotVariation"        DOUBLE PRECISION  NOT NULL DEFAULT 1.5,
                "dailyLossLimit"      DOUBLE PRECISION  NOT NULL DEFAULT 0,
                "totalLossLimit"      DOUBLE PRECISION  NOT NULL DEFAULT 0,
                "customCommentPrefix" VARCHAR           NOT NULL DEFAULT 'MNL_',
                "createdAt"           TIMESTAMP         NOT NULL DEFAULT now(),
                "updatedAt"           TIMESTAMP         NOT NULL DEFAULT now(),
                CONSTRAINT "PK_prop_firm_configs"        PRIMARY KEY ("id"),
                CONSTRAINT "UQ_prop_firm_configs_slave"  UNIQUE ("slaveId"),
                CONSTRAINT "FK_prop_firm_configs_slave"  FOREIGN KEY ("slaveId")
                    REFERENCES "slaves"("id") ON DELETE CASCADE
            )
        `);

        // ── shield_logs ──────────────────────────────────────────────────────
        await queryRunner.query(`
            CREATE TABLE "shield_logs" (
                "id"                   UUID     NOT NULL DEFAULT uuid_generate_v4(),
                "slaveId"              UUID     NOT NULL,
                "masterTradeId"        UUID,
                "symbol"               VARCHAR  NOT NULL,
                "side"                 VARCHAR  NOT NULL,
                "originalVolume"       DOUBLE PRECISION NOT NULL,
                "shieldedVolume"       DOUBLE PRECISION NOT NULL,
                "jitterMs"             INTEGER  NOT NULL,
                "magicNumber"          BIGINT   NOT NULL,
                "comment"              VARCHAR  NOT NULL,
                "action"               VARCHAR  NOT NULL DEFAULT 'OPEN',
                "blockedByEquityGuard" BOOLEAN  NOT NULL DEFAULT false,
                "blockReason"          VARCHAR,
                "createdAt"            TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_shield_logs" PRIMARY KEY ("id")
            )
        `);

        // Indexes for dashboard queries
        await queryRunner.query(`
            CREATE INDEX "IDX_shield_logs_slave_created"
            ON "shield_logs" ("slaveId", "createdAt")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_shield_logs_master_trade"
            ON "shield_logs" ("masterTradeId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shield_logs_master_trade"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shield_logs_slave_created"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "shield_logs"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "prop_firm_configs"`);
    }
}
