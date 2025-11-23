import { Router } from 'express';
import { settingsController } from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user settings
router.get('/', settingsController.getSettings.bind(settingsController));

// Update user settings
router.put('/', settingsController.updateSettings.bind(settingsController));

// Reset user settings to default
router.post('/reset', settingsController.resetSettings.bind(settingsController));

// Export user data
router.post('/export-data', settingsController.exportData.bind(settingsController));

// Delete user account
router.delete('/delete-account', settingsController.deleteAccount.bind(settingsController));

export default router;
