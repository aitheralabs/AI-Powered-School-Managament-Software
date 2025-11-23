import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/settingsService';
import { dataExportService } from '../services/dataExportService';
import { accountDeletionService } from '../services/accountDeletionService';
import { auditData } from '../middleware/auditLogger';

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

  /**
   * Export user data
   */
  async exportData(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      
      // Export user data
      const exportResult = await dataExportService.exportUserData(userId);

      // Log the export action
      auditData.access(req, 'user_data_export', userId, true);

      res.json({
        success: true,
        message: 'Data export completed successfully',
        data: exportResult
      });
    } catch (error) {
      // Log failed export attempt
      auditData.access(req, 'user_data_export', req.user!.id, false);
      next(error);
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { password, confirmation } = req.body;

      // Validate request
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

      // Log deletion attempt before deletion
      auditData.delete(req, 'user_account', userId, true);

      // Delete account
      const deletionResult = await accountDeletionService.deleteUserAccount(userId, password);

      res.json({
        success: true,
        message: 'Account deleted successfully',
        data: deletionResult
      });
    } catch (error) {
      // Log failed deletion attempt
      auditData.delete(req, 'user_account', req.user!.id, false);
      next(error);
    }
  }
}

export const settingsController = new SettingsController();
