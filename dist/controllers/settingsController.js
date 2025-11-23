"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsController = exports.SettingsController = void 0;
const settingsService_1 = require("../services/settingsService");
const dataExportService_1 = require("../services/dataExportService");
const accountDeletionService_1 = require("../services/accountDeletionService");
const auditLogger_1 = require("../middleware/auditLogger");
class SettingsController {
    async getSettings(req, res, next) {
        try {
            const userId = req.user.id;
            const settings = await settingsService_1.settingsService.getUserSettings(userId);
            res.json({
                success: true,
                data: settings
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateSettings(req, res, next) {
        try {
            const userId = req.user.id;
            const updates = req.body;
            const settings = await settingsService_1.settingsService.updateUserSettings(userId, updates);
            res.json({
                success: true,
                message: 'Settings updated successfully',
                data: settings
            });
        }
        catch (error) {
            next(error);
        }
    }
    async resetSettings(req, res, next) {
        try {
            const userId = req.user.id;
            const settings = await settingsService_1.settingsService.resetUserSettings(userId);
            res.json({
                success: true,
                message: 'Settings reset to default',
                data: settings
            });
        }
        catch (error) {
            next(error);
        }
    }
    async exportData(req, res, next) {
        try {
            const userId = req.user.id;
            const exportResult = await dataExportService_1.dataExportService.exportUserData(userId);
            auditLogger_1.auditData.access(req, 'user_data_export', userId, true);
            res.json({
                success: true,
                message: 'Data export completed successfully',
                data: exportResult
            });
        }
        catch (error) {
            auditLogger_1.auditData.access(req, 'user_data_export', req.user.id, false);
            next(error);
        }
    }
    async deleteAccount(req, res, next) {
        try {
            const userId = req.user.id;
            const { password, confirmation } = req.body;
            if (!password) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_PASSWORD',
                        message: 'Password is required for account deletion'
                    }
                });
                return;
            }
            if (!confirmation) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_CONFIRMATION',
                        message: 'Confirmation is required for account deletion'
                    }
                });
                return;
            }
            auditLogger_1.auditData.delete(req, 'user_account', userId, true);
            const deletionResult = await accountDeletionService_1.accountDeletionService.deleteUserAccount(userId, password);
            res.json({
                success: true,
                message: 'Account deleted successfully',
                data: deletionResult
            });
        }
        catch (error) {
            auditLogger_1.auditData.delete(req, 'user_account', req.user.id, false);
            next(error);
        }
    }
}
exports.SettingsController = SettingsController;
exports.settingsController = new SettingsController();
//# sourceMappingURL=settingsController.js.map