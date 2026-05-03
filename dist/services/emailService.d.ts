export declare class EmailService {
    private static instance;
    private transporter;
    private isConfigured;
    private constructor();
    static getInstance(): EmailService;
    private initializeTransporter;
    sendEmail(options: EmailOptions): Promise<void>;
    sendWelcomeEmail(to: string, userName: string, userRole: string, tempPassword?: string): Promise<void>;
    sendFeeReminder(to: string, studentName: string, feeDetails: {
        feeName: string;
        amount: number;
        dueDate: string;
        outstandingAmount: number;
    }): Promise<void>;
    sendAttendanceAlert(to: string, studentName: string, attendanceData: {
        attendancePercentage: number;
        absentDays: number;
        month: string;
    }): Promise<void>;
    sendGradeNotification(to: string, studentName: string, gradeData: {
        subject: string;
        grade: string;
        marks: number;
        totalMarks: number;
        semester: string;
    }): Promise<void>;
    sendPasswordResetEmail(to: string, userName: string, resetToken: string, resetUrl: string): Promise<void>;
    sendReportCard(to: string, studentName: string, semester: string, attachmentPath?: string): Promise<void>;
    sendCustomEmail(to: string | string[], subject: string, message: string): Promise<void>;
    sendEmailVerification(to: string, schoolName: string, verifyUrl: string): Promise<void>;
    sendSchoolWelcomeEmail(to: string, adminName: string, schoolName: string, trialDays?: number): Promise<void>;
    sendTrialExpiryEmail(to: string, schoolName: string, daysLeft: number): Promise<void>;
    sendPaymentFailedEmail(to: string, schoolName: string, amount: number, currency?: string): Promise<void>;
    private getWelcomeEmailTemplate;
    private getFeeReminderTemplate;
    private getAttendanceAlertTemplate;
    private getGradeNotificationTemplate;
    private getPasswordResetTemplate;
    private getReportCardTemplate;
    private getCustomEmailTemplate;
    isEmailConfigured(): boolean;
}
export interface EmailOptions {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    from?: string;
    attachments?: Array<{
        filename: string;
        path?: string;
        content?: string | Buffer;
    }>;
}
export declare const emailService: EmailService;
//# sourceMappingURL=emailService.d.ts.map