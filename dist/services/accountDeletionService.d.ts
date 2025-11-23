import { BaseService } from './baseService';
import { DeletionResult } from '../types/settings';
export declare class AccountDeletionService extends BaseService {
    deleteUserAccount(userId: string, password: string): Promise<DeletionResult>;
    verifyPassword(userId: string, password: string): Promise<boolean>;
    handleDataDependencies(userId: string, role: string): Promise<number>;
    private deleteTeacherData;
    private deleteStudentData;
    private deleteParentData;
    private deleteStaffData;
    invalidateUserSessions(userId: string): Promise<number>;
    private anonymizeRecords;
}
export declare const accountDeletionService: AccountDeletionService;
//# sourceMappingURL=accountDeletionService.d.ts.map