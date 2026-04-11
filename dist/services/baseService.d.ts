export declare abstract class BaseService {
    protected schoolId: string;
    forSchool(id: string): this;
    protected requireSchool(): string;
    protected executeQuery(sql: string, params?: any[]): Promise<any>;
    protected executeTransaction<T>(callback: (client: any) => Promise<T>): Promise<T>;
    protected validateUUID(id: string): boolean;
    protected checkEntityExists(tableName: string, id: string, altIdColumn?: string): Promise<any>;
    protected generateSequentialId(tableName: string): Promise<string>;
    protected buildUpdateQuery(tableName: string, updateData: Record<string, any>, idField?: string): {
        query: string;
        values: any[];
    };
    protected camelToSnake(str: string): string;
    protected snakeToCamel(str: string): string;
    protected transformRowToCamelCase(row: any): any;
}
//# sourceMappingURL=baseService.d.ts.map