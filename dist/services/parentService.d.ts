import { BaseService } from './baseService';
import { CreateParent, UpdateParent, CreateStudentParent } from '../types/parent';
export declare class ParentService extends BaseService {
    createParent(parentData: CreateParent): Promise<{
        id: any;
        altId: any;
        firstName: any;
        lastName: any;
        email: any;
        role: any;
        phone: any;
        address: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    getParents(req: any): Promise<{
        parents: any;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    private executeParentsQuery;
    getParentById(id: string): Promise<{
        children: any;
        id: any;
        altId: any;
        firstName: any;
        lastName: any;
        email: any;
        role: any;
        phone: any;
        address: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    updateParent(id: string, updateData: UpdateParent): Promise<{
        id: any;
        altId: any;
        firstName: any;
        lastName: any;
        email: any;
        role: any;
        phone: any;
        address: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
    deleteParent(id: string): Promise<{
        success: boolean;
    }>;
    linkStudentToParent(linkData: CreateStudentParent): Promise<{
        id: any;
        studentId: any;
        parentUserId: any;
        relationshipType: any;
        isPrimary: any;
        createdAt: any;
        updatedAt: any;
        student: {
            id: any;
            studentId: any;
            name: string;
        };
        parent: {
            id: any;
            name: string;
        };
    }>;
    unlinkStudentFromParent(studentId: string, parentUserId: string): Promise<{
        success: boolean;
    }>;
    getParentChildren(parentId: string): Promise<{
        parent: {
            id: any;
            altId: any;
            firstName: any;
            lastName: any;
            email: any;
            role: any;
            phone: any;
            address: any;
            isActive: any;
            createdAt: any;
            updatedAt: any;
        };
        children: any;
        totalChildren: any;
    }>;
    getParentDashboard(parentId: string): Promise<{
        parent: {
            id: any;
            altId: any;
            firstName: any;
            lastName: any;
            email: any;
            role: any;
            phone: any;
            address: any;
            isActive: any;
            createdAt: any;
            updatedAt: any;
        };
        children: any;
        feeSummary: {
            totalDue: number;
            totalPaid: number;
            overdueFees: number;
        };
        attendanceSummary: any[];
    }>;
    private transformParentResponse;
}
//# sourceMappingURL=parentService.d.ts.map