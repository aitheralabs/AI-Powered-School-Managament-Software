import { BaseService } from './baseService';
import { UserSettings, UpdateSettingsDTO } from '../types/settings';
export declare class SettingsService extends BaseService {
    getUserSettings(userId: string): Promise<UserSettings>;
    updateUserSettings(userId: string, updates: UpdateSettingsDTO): Promise<UserSettings>;
    resetUserSettings(userId: string): Promise<UserSettings>;
    private transformSettings;
}
export declare const settingsService: SettingsService;
//# sourceMappingURL=settingsService.d.ts.map