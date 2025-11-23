import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/settingsService';

export class SettingsController {
  /**
   * Get current user's settings
   */
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const settings = await settingsService.getUserSettings(userId);

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user's settings
   */
  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const updates = req.body;

      const settings = await settingsService.updateUserSettings(userId, updates);

      res.json({
        success: true,
        message: 'Settings updated successfully',
        data: settings
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset current user's settings to default
   */
  async resetSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const settings = await settingsService.resetUserSettings(userId);

      res.json({
        success: true,
        message: 'Settings reset to default',
        data: settings
      });
    } catch (error) {
      next(error);
    }
  }
}

export const settingsController = new SettingsController();
