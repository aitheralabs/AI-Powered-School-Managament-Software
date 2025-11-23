import { BaseService } from './baseService';
import { UserDataExport, ExportResult } from '../types/settings';
export declare class DataExportService extends BaseService {
    private readonly exportDir;
    exportUserData(userId: string): Promise<ExportResult>;
    collectUserData(userId: string): Promise<UserDataExport>;
    private collectProfileData;
    private collectSettingsData;
    private collectRoleSpecificData;
    private collectTeacherData;
    private collectStudentData;
    private collectParentData;
    private collectStaffData;
    private collectAuditLogs;
    generateJSONExport(userData: UserDataExport, exportDir: string, exportId: string): Promise<string>;
    generatePDFExport(userData: UserDataExport, exportDir: string, exportId: string): Promise<string>;
    private generatePDFContent;
    private ensureExportDirectory;
    scheduleFileCleanup(filePath: string, delayHours: number): Promise<void>;
    private calculateRecordCount;
}
export declare const dataExportService: DataExportService;
//# sourceMappingURL=dataExportService.d.ts.map