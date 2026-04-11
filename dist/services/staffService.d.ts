import { CreateStaff, UpdateStaff, StaffQuery, StaffResponse, StaffSummary } from '../types/staff';
import { BaseService } from './baseService';
export declare class StaffService extends BaseService {
    createStaff(staffData: CreateStaff, adminUserId: string): Promise<StaffResponse>;
    getStaff(queryParams: StaffQuery, userRole: string, userId?: string): Promise<{
        staff: StaffResponse[];
        total: number;
    }>;
    getStaffById(staffId: string, userRole: string, userId?: string): Promise<StaffResponse>;
    updateStaff(staffId: string, updateData: UpdateStaff, userRole: string, userId?: string): Promise<StaffResponse>;
    deactivateStaff(staffId: string): Promise<void>;
    reactivateStaff(staffId: string): Promise<StaffResponse>;
    getStaffSummary(): Promise<StaffSummary>;
    private getStaffWithUser;
    private formatStaffResponse;
    private getSortColumn;
}
//# sourceMappingURL=staffService.d.ts.map