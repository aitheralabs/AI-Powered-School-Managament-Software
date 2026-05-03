import { Request, Response } from "express";
export declare const createParent: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getParents: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getParentById: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateParent: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const deleteParent: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const linkStudentToParent: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const unlinkStudentFromParent: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getParentChildren: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const linkParentToStudent: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateParentStudentRelationship: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const removeParentStudentRelationship: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getParentDashboard: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=parentController.d.ts.map