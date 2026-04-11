import { BaseService } from './baseService';
export declare class ClassService extends BaseService {
    createClass(classData: any): Promise<{
        academicYear: {
            id: any;
            name: any;
        };
        teacher: {
            id: any;
            name: string;
        } | null;
        id: any;
        altId: any;
        name: any;
        grade: any;
        section: any;
        teacherId: any;
        capacity: any;
        room: any;
        description: any;
        academicYearId: any;
        currentEnrollment: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    getClasses(req: any): Promise<{
        classes: any;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getClassById(id: string): Promise<{
        academicYear: {
            id: any;
            name: any;
        } | null;
        teacher: {
            id: any;
            name: string;
        } | null;
        students: any;
        subjects: any;
        id: any;
        altId: any;
        name: any;
        grade: any;
        section: any;
        teacherId: any;
        capacity: any;
        room: any;
        description: any;
        academicYearId: any;
        currentEnrollment: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateClass(id: string, updateData: any): Promise<{
        id: any;
        altId: any;
        name: any;
        grade: any;
        section: any;
        teacherId: any;
        capacity: any;
        room: any;
        description: any;
        academicYearId: any;
        currentEnrollment: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    deleteClass(id: string): Promise<{
        success: boolean;
    }>;
    private transformClassResponse;
}
//# sourceMappingURL=classService.d.ts.map