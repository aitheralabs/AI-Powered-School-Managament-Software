import { BaseService } from './baseService';
import { CreateTeacher, UpdateTeacher } from '../types/teacher';
export declare class TeacherService extends BaseService {
    createTeacher(teacherData: CreateTeacher): Promise<{
        user: {
            firstName: any;
            lastName: any;
            email: any;
            phone: any;
            dateOfBirth: any;
            address: any;
        };
        id: any;
        altId: any;
        userId: any;
        employeeId: any;
        qualification: any;
        experienceYears: any;
        specialization: any;
        joiningDate: any;
        salary: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    getTeachers(req: any): Promise<{
        items: any;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getTeacherById(id: string): Promise<{
        user: {
            firstName: any;
            lastName: any;
            email: any;
            phone: any;
            dateOfBirth: any;
            address: any;
        };
        subjects: any;
        classes: any;
        id: any;
        altId: any;
        userId: any;
        employeeId: any;
        qualification: any;
        experienceYears: any;
        specialization: any;
        joiningDate: any;
        salary: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateTeacher(id: string, updateData: UpdateTeacher): Promise<{
        user: {
            firstName: any;
            lastName: any;
            email: any;
            phone: any;
            dateOfBirth: any;
            address: any;
        };
        id: any;
        altId: any;
        userId: any;
        employeeId: any;
        qualification: any;
        experienceYears: any;
        specialization: any;
        joiningDate: any;
        salary: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    deleteTeacher(id: string): Promise<{
        success: boolean;
    }>;
    private transformTeacherResponse;
    private transformUserResponse;
}
//# sourceMappingURL=teacherService.d.ts.map