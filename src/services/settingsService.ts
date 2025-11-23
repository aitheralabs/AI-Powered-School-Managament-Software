import { BaseService } from './baseService';
import { UserSettings, UpdateSettingsDTO } from '../types/settings';
import { AppError } from '../middleware/errorHandler';
import cacheService, { CacheKeys, CacheTTL } from './cacheService';

export class SettingsService extends BaseService {
  /**
   * Get user settings
   */
  async getUserSettings(userId: string): Promise<UserSettings> {
    try {
      // Try to get from cache first
      const cacheKey = `${CacheKeys.USER_SESSION}:settings:${userId}`;
      const cached = await cacheService.get(cacheKey);
      if (cached && typeof cached === 'string') {
        return JSON.parse(cached);
      }

      const result = await this.executeQuery(
        'SELECT * FROM user_settings WHERE user_id = $1',
        [userId]
      );

      let settings;
      if (result.rows.length === 0) {
        // Create default settings if they don't exist
        const createResult = await this.executeQuery(
          `INSERT INTO user_settings (
            user_id, email_notifications, push_notifications, sms_notifications,
            dark_mode, compact_view, profile_visibility, activity_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *`,
          [userId, true, false, false, false, false, true, true]
        );
        settings = this.transformSettings(createResult.rows[0]);
      } else {
        settings = this.transformSettings(result.rows[0]);
      }

      // Cache the settings
      await cacheService.set(cacheKey, JSON.stringify(settings), CacheTTL.TEN_MINUTES);

      return settings;
    } catch (error) {
      throw new AppError('Failed to fetch user settings', 500);
    }
  }

  /**
   * Update user settings
   */
  async updateUserSettings(
    userId: string,
    updates: UpdateSettingsDTO
  ): Promise<UserSettings> {
    try {
      // Check if settings exist
      const existing = await this.executeQuery(
        'SELECT 1 FROM user_settings WHERE user_id = $1',
        [userId]
      );

      let result;
      if (existing.rows.length > 0) {
        // Build dynamic update query
        const updateFields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (updates.emailNotifications !== undefined) {
          updateFields.push(`email_notifications = $${paramIndex++}`);
          values.push(updates.emailNotifications);
        }
        if (updates.pushNotifications !== undefined) {
          updateFields.push(`push_notifications = $${paramIndex++}`);
          values.push(updates.pushNotifications);
        }
        if (updates.smsNotifications !== undefined) {
          updateFields.push(`sms_notifications = $${paramIndex++}`);
          values.push(updates.smsNotifications);
        }
        if (updates.darkMode !== undefined) {
          updateFields.push(`dark_mode = $${paramIndex++}`);
          values.push(updates.darkMode);
        }
        if (updates.compactView !== undefined) {
          updateFields.push(`compact_view = $${paramIndex++}`);
          values.push(updates.compactView);
        }
        if (updates.profileVisibility !== undefined) {
          updateFields.push(`profile_visibility = $${paramIndex++}`);
          values.push(updates.profileVisibility);
        }
        if (updates.activityStatus !== undefined) {
          updateFields.push(`activity_status = $${paramIndex++}`);
          values.push(updates.activityStatus);
        }

        values.push(userId);

        result = await this.executeQuery(
          `UPDATE user_settings SET ${updateFields.join(', ')} 
           WHERE user_id = $${paramIndex} RETURNING *`,
          values
        );
      } else {
        // Create new settings
        result = await this.executeQuery(
          `INSERT INTO user_settings (
            user_id, email_notifications, push_notifications, sms_notifications,
            dark_mode, compact_view, profile_visibility, activity_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *`,
          [
            userId,
            updates.emailNotifications ?? true,
            updates.pushNotifications ?? false,
            updates.smsNotifications ?? false,
            updates.darkMode ?? false,
            updates.compactView ?? false,
            updates.profileVisibility ?? true,
            updates.activityStatus ?? true
          ]
        );
      }

      const settings = this.transformSettings(result.rows[0]);

      // Invalidate cache
      const cacheKey = `${CacheKeys.USER_SESSION}:settings:${userId}`;
      await cacheService.del(cacheKey);

      return settings;
    } catch (error) {
      throw new AppError('Failed to update user settings', 500);
    }
  }

  /**
   * Reset user settings to default
   */
  async resetUserSettings(userId: string): Promise<UserSettings> {
    try {
      const result = await this.executeQuery(
        `INSERT INTO user_settings (
          user_id, email_notifications, push_notifications, sms_notifications,
          dark_mode, compact_view, profile_visibility, activity_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (user_id) DO UPDATE SET
          email_notifications = EXCLUDED.email_notifications,
          push_notifications = EXCLUDED.push_notifications,
          sms_notifications = EXCLUDED.sms_notifications,
          dark_mode = EXCLUDED.dark_mode,
          compact_view = EXCLUDED.compact_view,
          profile_visibility = EXCLUDED.profile_visibility,
          activity_status = EXCLUDED.activity_status
        RETURNING *`,
        [userId, true, false, false, false, false, true, true]
      );

      const settings = this.transformSettings(result.rows[0]);

      // Invalidate cache
      const cacheKey = `${CacheKeys.USER_SESSION}:settings:${userId}`;
      await cacheService.del(cacheKey);

      return settings;
    } catch (error) {
      throw new AppError('Failed to reset user settings', 500);
    }
  }

  /**
   * Transform database row to UserSettings object
   */
  private transformSettings(row: any): UserSettings {
    return {
      userId: row.user_id,
      emailNotifications: row.email_notifications,
      pushNotifications: row.push_notifications,
      smsNotifications: row.sms_notifications,
      darkMode: row.dark_mode,
      compactView: row.compact_view,
      profileVisibility: row.profile_visibility,
      activityStatus: row.activity_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export const settingsService = new SettingsService();
