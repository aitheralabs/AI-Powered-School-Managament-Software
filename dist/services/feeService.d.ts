import { BaseService } from './baseService';
import { CreateFeeCategory, UpdateFeeCategory, AssignFeesToStudents } from '../types/fee';
export declare class FeeService extends BaseService {
    createFeeCategory(feeCategoryData: CreateFeeCategory): Promise<{
        academicYear: {
            id: any;
            name: any;
        };
        id: any;
        altId: any;
        name: any;
        description: any;
        amount: number;
        frequency: any;
        isMandatory: any;
        academicYearId: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    getFeeCategories(req: any): Promise<{
        feeCategories: any;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    private executeFeeCategoriesQuery;
    getFeeCategoryById(id: string): Promise<{
        academicYear: {
            id: any;
            name: any;
        };
        statistics: {
            totalStudents: number;
            paidStudents: number;
            pendingStudents: number;
            overdueStudents: number;
            totalAmount: number;
            paidAmount: number;
            pendingAmount: number;
        };
        id: any;
        altId: any;
        name: any;
        description: any;
        amount: number;
        frequency: any;
        isMandatory: any;
        academicYearId: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateFeeCategory(id: string, updateData: UpdateFeeCategory): Promise<{
        id: any;
        altId: any;
        name: any;
        description: any;
        amount: number;
        frequency: any;
        isMandatory: any;
        academicYearId: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    deleteFeeCategory(id: string): Promise<{
        success: boolean;
    }>;
    assignFeesToStudents(assignmentData: AssignFeesToStudents): Promise<{
        feeCategoryId: string;
        feeCategoryName: any;
        totalAssignments: number;
        assignments: {
            student: {
                id: any;
                studentId: any;
            };
            id: any;
            studentId: any;
            feeCategoryId: any;
            amount: number;
            dueDate: any;
            status: any;
            createdAt: any;
            updatedAt: any;
        }[];
    }>;
    getStudentFees(req: any): Promise<{
        studentFees: any;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getStudentFeeById(id: string): Promise<{
        student: {
            id: any;
            studentId: any;
            name: string;
        };
        feeCategory: {
            id: any;
            name: any;
            frequency: any;
        };
        paidAmount: number;
        remainingAmount: number;
        id: any;
        studentId: any;
        feeCategoryId: any;
        amount: number;
        dueDate: any;
        status: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateStudentFee(id: string, updateData: {
        dueDate?: string;
        amount?: number;
        status?: string;
    }): Promise<{
        id: any;
        studentId: any;
        feeCategoryId: any;
        amount: number;
        dueDate: any;
        status: any;
        createdAt: any;
        updatedAt: any;
    }>;
    assignFeesToClass(assignmentData: {
        classId: string;
        feeCategoryId: string;
        dueDate: string;
        discountAmount?: number;
    }): Promise<{
        class: {
            id: any;
            name: any;
            grade: any;
            section: any;
        };
        feeCategory: {
            id: any;
            name: any;
        };
        totalStudents: any;
        assigned: number;
        skipped: number;
    }>;
    private transformFeeCategoryResponse;
    private transformStudentFeeResponse;
}
//# sourceMappingURL=feeService.d.ts.map