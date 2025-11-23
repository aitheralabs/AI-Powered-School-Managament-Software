"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsService = exports.SettingsService = void 0;
const baseService_1 = require("./baseService");
const errorHandler_1 = require("../middleware/errorHandler");
const cacheService_1 = __importStar(require("./cacheService"));
class SettingsService extends baseService_1.BaseService {
    async getUserSettings(userId) {
        try {
            const cacheKey = `${cacheService_1.CacheKeys.USER_SESSION}:settings:${userId}`;
            const cached = await cacheService_1.default.get(cacheKey);
            if (cached && typeof cached === 'string') {
                return JSON.parse(cached);
            }
            const result = await this.executeQuery('SELECT * FROM user_settings WHERE user_id = $1', [userId]);
            let settings;
            if (result.rows.length === 0) {
                const createResult = await this.executeQuery(`INSERT INTO user_settings (
            user_id, email_notifications, push_notifications, sms_notifications,
            dark_mode, compact_view, profile_visibility, activity_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *`, [userId, true, false, false, false, false, true, true]);
                settings = this.transformSettings(createResult.rows[0]);
            }
            else {
                settings = this.transformSettings(result.rows[0]);
            }
            await cacheService_1.default.set(cacheKey, JSON.stringify(settings), cacheService_1.CacheTTL.TEN_MINUTES);
            return settings;
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to fetch user settings', 500);
        }
    }
    async updateUserSettings(userId, updates) {
        try {
            const existing = await this.executeQuery('SELECT 1 FROM user_settings WHERE user_id = $1', [userId]);
            let result;
            if (existing.rows.length > 0) {
                const updateFields = [];
                const values = [];
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
                result = await this.executeQuery(`UPDATE user_settings SET ${updateFields.join(', ')} 
           WHERE user_id = $${paramIndex} RETURNING *`, values);
            }
            else {
                result = await this.executeQuery(`INSERT INTO user_settings (
            user_id, email_notifications, push_notifications, sms_notifications,
            dark_mode, compact_view, profile_visibility, activity_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *`, [
                    userId,
                    updates.emailNotifications ?? true,
                    updates.pushNotifications ?? false,
                    updates.smsNotifications ?? false,
                    updates.darkMode ?? false,
                    updates.compactView ?? false,
                    updates.profileVisibility ?? true,
                    updates.activityStatus ?? true
                ]);
            }
            const settings = this.transformSettings(result.rows[0]);
            const cacheKey = `${cacheService_1.CacheKeys.USER_SESSION}:settings:${userId}`;
            await cacheService_1.default.del(cacheKey);
            return settings;
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to update user settings', 500);
        }
    }
    async resetUserSettings(userId) {
        try {
            const result = await this.executeQuery(`INSERT INTO user_settings (
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
        RETURNING *`, [userId, true, false, false, false, false, true, true]);
            const settings = this.transformSettings(result.rows[0]);
            const cacheKey = `${cacheService_1.CacheKeys.USER_SESSION}:settings:${userId}`;
            await cacheService_1.default.del(cacheKey);
            return settings;
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to reset user settings', 500);
        }
    }
    transformSettings(row) {
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
exports.SettingsService = SettingsService;
exports.settingsService = new SettingsService();
//# sourceMappingURL=settingsService.js.map