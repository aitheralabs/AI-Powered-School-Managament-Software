"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(pool) {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      email_notifications BOOLEAN NOT NULL DEFAULT true,
      push_notifications BOOLEAN NOT NULL DEFAULT false,
      sms_notifications BOOLEAN NOT NULL DEFAULT false,
      dark_mode BOOLEAN NOT NULL DEFAULT false,
      compact_view BOOLEAN NOT NULL DEFAULT false,
      profile_visibility BOOLEAN NOT NULL DEFAULT true,
      activity_status BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create index on user_id for faster lookups
    CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

    -- Create trigger to update updated_at timestamp
    CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_updated_at();
  `);
}
async function down(pool) {
    await pool.query(`
    DROP TRIGGER IF EXISTS user_settings_updated_at ON user_settings;
    DROP FUNCTION IF EXISTS update_user_settings_updated_at();
    DROP INDEX IF EXISTS idx_user_settings_user_id;
    DROP TABLE IF EXISTS user_settings;
  `);
}
//# sourceMappingURL=20241123_add_user_settings.js.map