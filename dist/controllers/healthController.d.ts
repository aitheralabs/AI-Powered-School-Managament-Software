import { Request, Response } from "express";
export declare const healthCheck: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const healthCheckDetailed: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const readinessCheck: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const livenessCheck: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const databaseStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=healthController.d.ts.map