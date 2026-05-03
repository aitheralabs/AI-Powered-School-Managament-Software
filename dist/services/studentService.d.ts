import { BaseService } from './baseService';
import { CreateStudent, UpdateStudent } from '../types/student';
export declare class StudentService extends BaseService {
    createStudent(studentData: CreateStudent): Promise<{
        user: {
            firstName: any;
            lastName: any;
            email: any;
            phone: any;
            dateOfBirth: any;
            address: any;
        };
        temporaryPassword: string | undefined;
        id: any;
        altId: any;
        userId: any;
        studentId: any;
        classId: any;
        enrollmentDate: any;
        guardianName: any;
        guardianPhone: any;
        guardianEmail: any;
        emergencyContact: any;
        medicalInfo: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    getStudents(req: any): Promise<{
        items: any;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    private executeStudentsQuery;
    getStudentById(id: string): Promise<{
        user: {
            firstName: any;
            lastName: any;
            email: any;
            phone: any;
            dateOfBirth: any;
            address: any;
        };
        class: {
            id: any;
            name: any;
            grade: any;
            section: any;
            academicYear: any;
        };
        attendanceSummary: {
            totalDays: number;
            presentDays: number;
            absentDays: number;
            lateDays: number;
            attendancePercentage: number;
        };
        id: any;
        altId: any;
        userId: any;
        studentId: any;
        classId: any;
        enrollmentDate: any;
        guardianName: any;
        guardianPhone: any;
        guardianEmail: any;
        emergencyContact: any;
        medicalInfo: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateStudent(id: string, updateData: UpdateStudent): Promise<{
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
        studentId: any;
        classId: any;
        enrollmentDate: any;
        guardianName: any;
        guardianPhone: any;
        guardianEmail: any;
        emergencyContact: any;
        medicalInfo: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    deleteStudent(id: string): Promise<{
        success: boolean;
    }>;
    getStudentsByClass(classId: string, params: {
        page: number;
        limit: number;
    }): Promise<{
        students: any;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getStudentSummary(id: string): Promise<{
        studentId: any;
        personalInfo: {
            name: string;
            studentIdNumber: any;
            email: any;
            phone: any;
            dateOfBirth: any;
            address: any;
        };
        academicInfo: {
            currentClass: string;
            enrollmentDate: any;
            academicYear: any;
        };
        guardianInfo: {
            guardianName: any;
            guardianPhone: any;
            guardianEmail: any;
            emergencyContact: any;
        };
        currentStats: {
            attendancePercentage: any;
            overallGpa: string | null;
            pendingFees: number;
            nextDueDate: any;
            recentGrades: any;
        };
    }>;
    getStudentClassHistory(id: string): Promise<any>;
    bulkUpdateStudents(studentIds: string[], updateData: any): Promise<{
        updatedCount: number;
        failedUpdates: any[];
    }>;
    private generateDefaultPassword;
    private transformStudentResponse;
    private transformUserResponse;
}
//# sourceMappingURL=studentService.d.ts.map