import { Pool } from 'pg';

export async function up(pool: Pool): Promise<void> {
  await pool.query(`
    ALTER TABLE schools
      ADD COLUMN IF NOT EXISTS max_storage_gb INT NOT NULL DEFAULT 5
  `);

  await pool.query(`
    UPDATE schools SET max_storage_gb =
      CASE plan
        WHEN 'trial'      THEN 5
        WHEN 'basic'      THEN 20
        WHEN 'standard'   THEN 50
        WHEN 'premium'    THEN 100
        WHEN 'enterprise' THEN 500
        ELSE 5
      END
  `);

  await pool.query(`
    ALTER TABLE subscription_plans
      ADD COLUMN IF NOT EXISTS max_storage_gb INT NOT NULL DEFAULT 5
  `);

  await pool.query(`
    UPDATE subscription_plans SET max_storage_gb =
      CASE name
        WHEN 'trial'      THEN 5
        WHEN 'basic'      THEN 20
        WHEN 'standard'   THEN 50
        WHEN 'premium'    THEN 100
        WHEN 'enterprise' THEN 500
        ELSE 5
      END
  `);
}

export async function down(pool: Pool): Promise<void> {
  await pool.query(`ALTER TABLE schools DROP COLUMN IF EXISTS max_storage_gb`);
  await pool.query(`ALTER TABLE subscription_plans DROP COLUMN IF EXISTS max_storage_gb`);
}
