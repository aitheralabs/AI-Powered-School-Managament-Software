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
exports.accountDeletionService = exports.AccountDeletionService = void 0;
const baseService_1 = require("./baseService");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../utils/auth");
const cacheService_1 = __importStar(require("./cacheService"));
class AccountDeletionService extends baseService_1.BaseService {
    async deleteUserAccount(userId, password) {
        try {
            const isValidPassword = await this.verifyPassword(userId, password);
            if (!isValidPassword) {
                throw new errorHandler_1.AppError('Invalid password', 401);
            }
            const userResult = await this.executeQuery('SELECT role FROM users WHERE id = $1', [userId]);
            if (userResult.rows.length === 0) {
                throw new errorHandler_1.AppError('User not found', 404);
            }
            const userRole = userResult.rows[0].role;
            await this.executeQuery('BEGIN');
            try {
                const roleRecordsAffected = await this.handleDataDependencies(userId, userRole);
                const sessionsAffected = await this.invalidateUserSessions(userId);
                await this.executeQuery('UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [userId]);
                await this.executeQuery('COMMIT');
                return {
                    success: true,
                    deletedAt: new Date(),
                    recordsAffected: {
                        user: 1,
                        roleSpecific: roleRecordsAffected,
                        sessions: sessionsAffected
                    }
                };
            }
            catch (error) {
                await this.executeQuery('ROLLBACK');
                throw error;
            }
        }
        catch (error) {
            console.error('Error deleting user account:', error);
            if (error instanceof errorHandler_1.AppError) {
                throw error;
            }
            throw new errorHandler_1.AppError('Failed to delete user account', 500);
        }
    }
    async verifyPassword(userId, password) {
        try {
            const result = await this.executeQuery('SELECT password_hash FROM users WHERE id = $1', [userId]);
            if (result.rows.length === 0) {
                return false;
            }
            const passwordHash = result.rows[0].password_hash;
            return await (0, auth_1.comparePassword)(password, passwordHash);
        }
        catch (error) {
            console.error('Error verifying password:', error);
            return false;
        }
    }
    async handleDataDependencies(userId, role) {
        let recordsAffected = 0;
        switch (role.toLowerCase()) {
            case 'teacher':
                recordsAffected = await this.deleteTeacherData(userId);
                break;
            case 'student':
                recordsAffected = await this.deleteStudentData(userId);
                break;
            case 'parent':
                recordsAffected = await this.deleteParentData(userId);
                break;
            case 'staff':
                recordsAffected = await this.deleteStaffData(userId);
                break;
        }
        const settingsResult = await this.executeQuery('DELETE FROM user_settings WHERE user_id = $1', [userId]);
        recordsAffected += settingsResult.rowCount || 0;
        return recordsAffected;
    }
    async deleteTeacherData(userId) {
        let recordsAffected = 0;
        const teacherResult = await this.executeQuery('SELECT id FROM teachers WHERE user_id = $1', [userId]);
        if (teacherResult.rows.length === 0) {
            return 0;
        }
        const teacherId = teacherResult.rows[0].id;
        const classesResult = await this.executeQuery('UPDATE classes SET teacher_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE teacher_id = $1', [teacherId]);
        recordsAffected += classesResult.rowCount || 0;
        const deleteTeacherResult = await this.executeQuery('DELETE FROM teachers WHERE id = $1', [teacherId]);
        recordsAffected += deleteTeacherResult.rowCount || 0;
        return recordsAffected;
    }
    async deleteStudentData(userId) {
        let recordsAffected = 0;
        const studentResult = await this.executeQuery('SELECT id FROM students WHERE user_id = $1', [userId]);
        if (studentResult.rows.length === 0) {
            return 0;
        }
        const studentId = studentResult.rows[0].id;
        const anonymizeResult = await this.executeQuery(`UPDATE students 
       SET user_id = NULL, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`, [studentId]);
        recordsAffected += anonymizeResult.rowCount || 0;
        return recordsAffected;
    }
    async deleteParentData(userId) {
        let recordsAffected = 0;
        const parentResult = await this.executeQuery('SELECT id FROM parents WHERE user_id = $1', [userId]);
        if (parentResult.rows.length === 0) {
            return 0;
        }
        const parentId = parentResult.rows[0].id;
        const studentsResult = await this.executeQuery('UPDATE students SET parent_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE parent_id = $1', [parentId]);
        recordsAffected += studentsResult.rowCount || 0;
        const commsResult = await this.executeQuery('DELETE FROM communications WHERE parent_id = $1', [parentId]).catch(() => ({ rowCount: 0 }));
        recordsAffected += commsResult.rowCount || 0;
        const deleteParentResult = await this.executeQuery('DELETE FROM parents WHERE id = $1', [parentId]);
        recordsAffected += deleteParentResult.rowCount || 0;
        return recordsAffected;
    }
    async deleteStaffData(userId) {
        let recordsAffected = 0;
        const deleteStaffResult = await this.executeQuery('DELETE FROM staff WHERE user_id = $1', [userId]);
        recordsAffected += deleteStaffResult.rowCount || 0;
        return recordsAffected;
    }
    async invalidateUserSessions(userId) {
        try {
            const pattern = `${cacheService_1.CacheKeys.USER_SESSION}*${userId}*`;
            await cacheService_1.default.delPattern(pattern);
            const sessionsResult = await this.executeQuery('DELETE FROM sessions WHERE user_id = $1', [userId]).catch(() => ({ rowCount: 0 }));
            return sessionsResult.rowCount || 0;
        }
        catch (error) {
            console.error('Error invalidating user sessions:', error);
            return 0;
        }
    }
    async anonymizeRecords(userId) {
        await this.executeQuery(`UPDATE audit_logs 
       SET details = jsonb_set(details, '{user_email}', '"[DELETED]"')
       WHERE user_id = $1`, [userId]).catch(() => { });
    }
}
exports.AccountDeletionService = AccountDeletionService;
exports.accountDeletionService = new AccountDeletionService();
//# sourceMappingURL=accountDeletionService.js.map