"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsController = exports.SettingsController = void 0;
const settingsService_1 = require("../services/settingsService");
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
}
exports.SettingsController = SettingsController;
exports.settingsController = new SettingsController();
//# sourceMappingURL=settingsController.js.map