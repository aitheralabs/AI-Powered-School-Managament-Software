import { Request, Response, NextFunction } from 'express';
export declare class SettingsController {
    getSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
    resetSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const settingsController: SettingsController;
//# sourceMappingURL=settingsController.d.ts.map