import nodemailer from 'nodemailer';
import { AppError } from '../middleware/errorHandler';
import env from '../config/env';

export class EmailService {
  private static instance: EmailService;
  private transporter!: nodemailer.Transporter;
  private isConfigured: boolean = false;

  private constructor() {
    this.initializeTransporter();
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private initializeTransporter() {
    try {
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = parseInt(process.env.SMTP_PORT || '587');
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (!smtpHost || !smtpUser || !smtpPass) {
        console.warn('⚠️  SMTP configuration incomplete. Email functionality will be disabled.');
        this.isConfigured = false;
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      this.isConfigured = true;
      console.log('✅ Email service configured successfully');
    } catch (error) {
      console.error('❌ Failed to configure email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.isConfigured) {
      console.warn('Email service not configured. Skipping email send.');
      return;
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || options.from || 'noreply@schoolmanagement.com',
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${mailOptions.to}`);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw new AppError(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(to: string, userName: string, userRole: string, tempPassword?: string): Promise<void> {
    const subject = 'Welcome to School Management System';
    const html = this.getWelcomeEmailTemplate(userName, userRole, tempPassword);

    await this.sendEmail({ to, subject, html });
  }

  /**
   * Send fee payment reminder
   */
  async sendFeeReminder(to: string, studentName: string, feeDetails: {
    feeName: string;
    amount: number;
    dueDate: string;
    outstandingAmount: number;
  }): Promise<void> {
    const subject = 'Fee Payment Reminder - School Management System';
    const html = this.getFeeReminderTemplate(studentName, feeDetails);

    await this.sendEmail({ to, subject, html });
  }

  /**
   * Send attendance alert
   */
  async sendAttendanceAlert(to: string, studentName: string, attendanceData: {
    attendancePercentage: number;
    absentDays: number;
    month: string;
  }): Promise<void> {
    const subject = 'Low Attendance Alert - School Management System';
    const html = this.getAttendanceAlertTemplate(studentName, attendanceData);

    await this.sendEmail({ to, subject, html });
  }

  /**
   * Send grade notification
   */
  async sendGradeNotification(to: string, studentName: string, gradeData: {
    subject: string;
    grade: string;
    marks: number;
    totalMarks: number;
    semester: string;
  }): Promise<void> {
    const subject = 'New Grade Posted - School Management System';
    const html = this.getGradeNotificationTemplate(studentName, gradeData);

    await this.sendEmail({ to, subject, html });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, userName: string, resetToken: string, resetUrl: string): Promise<void> {
    const subject = 'Password Reset Request - School Management System';
    const html = this.getPasswordResetTemplate(userName, resetToken, resetUrl);

    await this.sendEmail({ to, subject, html });
  }

  /**
   * Send report card email
   */
  async sendReportCard(to: string, studentName: string, semester: string, attachmentPath?: string): Promise<void> {
    const subject = `Report Card - ${semester} - School Management System`;
    const html = this.getReportCardTemplate(studentName, semester);

    const attachments = attachmentPath ? [{
      filename: `ReportCard_${studentName}_${semester}.pdf`,
      path: attachmentPath,
    }] : undefined;

    await this.sendEmail({ to, subject, html, attachments });
  }

  /**
   * Send custom email
   */
  async sendCustomEmail(to: string | string[], subject: string, message: string): Promise<void> {
    const html = this.getCustomEmailTemplate(message);
    await this.sendEmail({ to, subject, html });
  }

  /**
   * Send school email verification
   */
  async sendEmailVerification(to: string, schoolName: string, verifyUrl: string): Promise<void> {
    const appName = process.env.APP_NAME || 'EduSaaS';
    const subject = `Please verify your email — ${appName}`;
    const html = `
      <!DOCTYPE html><html><head>
      <style>
        body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0}
        .wrap{max-width:580px;margin:0 auto;padding:20px}
        .header{background:linear-gradient(135deg,#4f46e5,#6366f1);color:white;padding:28px 24px;border-radius:12px 12px 0 0;text-align:center}
        .content{background:#f8fafc;padding:28px 24px;border-radius:0 0 12px 12px}
        .btn{display:inline-block;padding:14px 32px;background:#4f46e5;color:white;text-decoration:none;border-radius:8px;font-weight:600;margin:20px 0}
        .note{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;margin-top:16px;font-size:13px;color:#64748b;word-break:break-all}
        .footer{text-align:center;margin-top:20px;font-size:12px;color:#94a3b8}
      </style>
      </head><body><div class="wrap">
        <div class="header">
          <div style="font-size:36px">✉️</div>
          <h1 style="margin:8px 0 0;font-size:22px">Verify your email</h1>
        </div>
        <div class="content">
          <p>Hi,</p>
          <p>Thank you for registering <strong>${schoolName}</strong> on ${appName}. Please verify the school's contact email address by clicking the button below.</p>
          <div style="text-align:center"><a href="${verifyUrl}" class="btn">Verify Email Address</a></div>
          <p style="color:#64748b;font-size:14px">This link expires in <strong>72 hours</strong>. If you didn't register, you can safely ignore this email.</p>
          <div class="note">If the button doesn't work, copy and paste this link into your browser:<br><a href="${verifyUrl}">${verifyUrl}</a></div>
        </div>
        <div class="footer"><p>© ${new Date().getFullYear()} ${appName}</p></div>
      </div></body></html>
    `;
    await this.sendEmail({ to, subject, html });
  }

  /**
   * Send school onboarding welcome email (SaaS)
   */
  async sendSchoolWelcomeEmail(to: string, adminName: string, schoolName: string, trialDays = 30): Promise<void> {
    const appUrl = process.env.APP_URL || 'http://localhost:4200';
    const appName = process.env.APP_NAME || 'EduSaaS';
    const subject = `Welcome to ${appName} — Your school is ready!`;
    const html = `
      <!DOCTYPE html><html><head>
      <style>
        body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0}
        .wrap{max-width:600px;margin:0 auto;padding:20px}
        .header{background:linear-gradient(135deg,#6366f1,#4f46e5);color:white;padding:32px 24px;border-radius:12px 12px 0 0;text-align:center}
        .header h1{margin:8px 0 4px;font-size:24px}
        .content{background:#f8fafc;padding:32px 24px;border-radius:0 0 12px 12px}
        .trial-box{background:white;border-left:4px solid #6366f1;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0}
        .steps{counter-reset:step;margin:20px 0}
        .step{display:flex;gap:12px;margin-bottom:16px;align-items:flex-start}
        .step-num{background:#6366f1;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;flex-shrink:0;font-size:13px}
        .btn{display:inline-block;padding:14px 32px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;font-weight:600;margin:20px 0}
        .footer{text-align:center;margin-top:24px;font-size:12px;color:#94a3b8}
      </style>
      </head><body><div class="wrap">
        <div class="header">
          <div style="font-size:40px">🎓</div>
          <h1>Welcome to ${appName}!</h1>
          <p style="opacity:0.9;margin:0">${schoolName} is now live on the platform</p>
        </div>
        <div class="content">
          <p>Hi ${adminName},</p>
          <p>Your school <strong>${schoolName}</strong> has been successfully onboarded. You're now on a <strong>${trialDays}-day free trial</strong> — no credit card required.</p>

          <div class="trial-box">
            <strong>Your trial includes:</strong>
            <ul style="margin:8px 0">
              <li>Up to 100 students</li>
              <li>Attendance &amp; fee management</li>
              <li>Student &amp; teacher portals</li>
              <li>All core features</li>
            </ul>
          </div>

          <p><strong>Get started in 3 steps:</strong></p>
          <div class="steps">
            <div class="step"><div class="step-num">1</div><div>Log in to your admin dashboard using your registered email and password.</div></div>
            <div class="step"><div class="step-num">2</div><div>Add your teachers and students, or use bulk CSV upload.</div></div>
            <div class="step"><div class="step-num">3</div><div>Set up classes, fee categories, and academic year to go live.</div></div>
          </div>

          <div style="text-align:center">
            <a href="${appUrl}/auth/login" class="btn">Log In to Your Dashboard</a>
          </div>

          <p>Need help? Reply to this email or check the documentation at <a href="${appUrl}/help">${appUrl}/help</a>.</p>
        </div>
        <div class="footer"><p>© ${new Date().getFullYear()} ${appName}. You received this because you registered a school on our platform.</p></div>
      </div></body></html>
    `;
    await this.sendEmail({ to, subject, html });
  }

  /**
   * Send trial expiry warning email (SaaS)
   */
  async sendTrialExpiryEmail(to: string, schoolName: string, daysLeft: number): Promise<void> {
    const appUrl = process.env.APP_URL || 'http://localhost:4200';
    const appName = process.env.APP_NAME || 'EduSaaS';
    const subject = `Your ${appName} trial expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
    const isUrgent = daysLeft <= 3;
    const html = `
      <!DOCTYPE html><html><head>
      <style>
        body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0}
        .wrap{max-width:600px;margin:0 auto;padding:20px}
        .header{background:${isUrgent ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : 'linear-gradient(135deg,#d97706,#b45309)'};color:white;padding:32px 24px;border-radius:12px 12px 0 0;text-align:center}
        .content{background:#f8fafc;padding:32px 24px;border-radius:0 0 12px 12px}
        .days-box{background:white;border:2px solid ${isUrgent ? '#dc2626' : '#d97706'};padding:20px;border-radius:8px;text-align:center;margin:20px 0}
        .days-num{font-size:56px;font-weight:bold;color:${isUrgent ? '#dc2626' : '#d97706'};line-height:1}
        .btn{display:inline-block;padding:14px 32px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;font-weight:600;margin:20px 0}
        .plan-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}
        .plan-card{background:white;border:1px solid #e2e8f0;padding:16px;border-radius:8px}
        .footer{text-align:center;margin-top:24px;font-size:12px;color:#94a3b8}
      </style>
      </head><body><div class="wrap">
        <div class="header">
          <div style="font-size:40px">${isUrgent ? '⚠️' : '⏰'}</div>
          <h1>Trial Expiring Soon</h1>
          <p style="opacity:0.9;margin:0">${schoolName}</p>
        </div>
        <div class="content">
          <p>Your free trial is almost over. Don't lose access to your school's data!</p>

          <div class="days-box">
            <div class="days-num">${daysLeft}</div>
            <div style="color:#64748b;margin-top:4px">day${daysLeft !== 1 ? 's' : ''} remaining</div>
          </div>

          <p>After your trial ends, your account will be locked and you won't be able to add new records. Upgrade now to continue without interruption.</p>

          <div style="text-align:center">
            <a href="${appUrl}/auth/login" class="btn">Upgrade Now — Keep Your Data</a>
          </div>

          <p style="color:#64748b;font-size:14px;text-align:center">
            Questions? Contact us at <a href="mailto:support@edusaas.in">support@edusaas.in</a>
          </p>
        </div>
        <div class="footer"><p>© ${new Date().getFullYear()} ${appName}. ${schoolName} account notification.</p></div>
      </div></body></html>
    `;
    await this.sendEmail({ to, subject, html });
  }

  /**
   * Send subscription payment failed email (SaaS)
   */
  async sendPaymentFailedEmail(to: string, schoolName: string, amount: number, currency = 'INR'): Promise<void> {
    const appUrl = process.env.APP_URL || 'http://localhost:4200';
    const appName = process.env.APP_NAME || 'EduSaaS';
    const subject = `Action required: Payment failed for ${schoolName}`;
    const formattedAmount = currency === 'INR' ? `₹${amount.toLocaleString('en-IN')}` : `${currency} ${amount}`;
    const html = `
      <!DOCTYPE html><html><head>
      <style>
        body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0}
        .wrap{max-width:600px;margin:0 auto;padding:20px}
        .header{background:linear-gradient(135deg,#dc2626,#b91c1c);color:white;padding:32px 24px;border-radius:12px 12px 0 0;text-align:center}
        .content{background:#f8fafc;padding:32px 24px;border-radius:0 0 12px 12px}
        .alert-box{background:#fef2f2;border:1px solid #fca5a5;padding:16px 20px;border-radius:8px;margin:20px 0}
        .btn{display:inline-block;padding:14px 32px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;font-weight:600;margin:20px 0}
        .footer{text-align:center;margin-top:24px;font-size:12px;color:#94a3b8}
      </style>
      </head><body><div class="wrap">
        <div class="header">
          <div style="font-size:40px">❌</div>
          <h1>Payment Failed</h1>
          <p style="opacity:0.9;margin:0">${schoolName}</p>
        </div>
        <div class="content">
          <p>We were unable to process the subscription payment of <strong>${formattedAmount}</strong> for <strong>${schoolName}</strong>.</p>

          <div class="alert-box">
            <strong>What happens next:</strong>
            <ul style="margin:8px 0">
              <li>Your account remains active for a 7-day grace period.</li>
              <li>If payment is not updated within 7 days, access will be restricted.</li>
              <li>No data will be deleted.</li>
            </ul>
          </div>

          <p>Please update your payment method to avoid any interruption:</p>

          <div style="text-align:center">
            <a href="${appUrl}/auth/login" class="btn">Update Payment Method</a>
          </div>

          <p style="color:#64748b;font-size:14px;text-align:center">
            Need help? Contact <a href="mailto:billing@edusaas.in">billing@edusaas.in</a>
          </p>
        </div>
        <div class="footer"><p>© ${new Date().getFullYear()} ${appName}. Billing notification for ${schoolName}.</p></div>
      </div></body></html>
    `;
    await this.sendEmail({ to, subject, html });
  }

  // Email Templates

  private getWelcomeEmailTemplate(userName: string, userRole: string, tempPassword?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .credentials { background: white; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to School Management System</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Welcome to our School Management System. Your account has been created successfully as a <strong>${userRole}</strong>.</p>
            
            ${tempPassword ? `
            <div class="credentials">
              <h3>Your Login Credentials:</h3>
              <p><strong>Temporary Password:</strong> ${tempPassword}</p>
              <p style="color: #dc3545;"><strong>Important:</strong> Please change your password after your first login for security reasons.</p>
            </div>
            ` : ''}
            
            <p>You can now access the system and start using all the features available to you.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login to Your Account</a>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from School Management System. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getFeeReminderTemplate(studentName: string, feeDetails: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ffc107; color: #333; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .fee-details { background: white; padding: 20px; border-left: 4px solid #ffc107; margin: 20px 0; }
          .amount { font-size: 24px; color: #dc3545; font-weight: bold; }
          .button { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Fee Payment Reminder</h1>
          </div>
          <div class="content">
            <h2>Dear Parent/Guardian of ${studentName},</h2>
            <p>This is a friendly reminder about an upcoming fee payment.</p>
            
            <div class="fee-details">
              <h3>Fee Details:</h3>
              <p><strong>Fee Type:</strong> ${feeDetails.feeName}</p>
              <p><strong>Amount:</strong> ₹${feeDetails.amount.toFixed(2)}</p>
              <p><strong>Due Date:</strong> ${new Date(feeDetails.dueDate).toLocaleDateString()}</p>
              <p class="amount">Outstanding Amount: ₹${feeDetails.outstandingAmount.toFixed(2)}</p>
            </div>
            
            <p>Please ensure the payment is made before the due date to avoid any late fees.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments" class="button">Make Payment</a>
            
            <p>If you have already made the payment, please disregard this reminder.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from School Management System. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getAttendanceAlertTemplate(studentName: string, attendanceData: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .alert-box { background: #fff3cd; padding: 20px; border-left: 4px solid #dc3545; margin: 20px 0; }
          .percentage { font-size: 32px; color: #dc3545; font-weight: bold; }
          .button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Low Attendance Alert</h1>
          </div>
          <div class="content">
            <h2>Dear Parent/Guardian of ${studentName},</h2>
            <p>We would like to bring to your attention that ${studentName}'s attendance has fallen below the required threshold.</p>
            
            <div class="alert-box">
              <h3>Attendance Summary for ${attendanceData.month}:</h3>
              <p class="percentage">${attendanceData.attendancePercentage}%</p>
              <p><strong>Absent Days:</strong> ${attendanceData.absentDays}</p>
              <p style="color: #dc3545;"><strong>Note:</strong> Minimum required attendance is 75%</p>
            </div>
            
            <p>Regular attendance is crucial for academic success. We encourage you to ensure ${studentName} attends school regularly.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/attendance" class="button">View Detailed Attendance</a>
            
            <p>If there are any concerns or issues affecting attendance, please contact the school administration.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from School Management System. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getGradeNotificationTemplate(studentName: string, gradeData: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .grade-box { background: white; padding: 20px; border-left: 4px solid #28a745; margin: 20px 0; }
          .grade { font-size: 48px; color: #28a745; font-weight: bold; }
          .button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 New Grade Posted</h1>
          </div>
          <div class="content">
            <h2>Dear Parent/Guardian of ${studentName},</h2>
            <p>A new grade has been posted for ${studentName}.</p>
            
            <div class="grade-box">
              <h3>${gradeData.subject} - ${gradeData.semester}</h3>
              <p class="grade">${gradeData.grade}</p>
              <p><strong>Marks Obtained:</strong> ${gradeData.marks} / ${gradeData.totalMarks}</p>
              <p><strong>Percentage:</strong> ${((gradeData.marks / gradeData.totalMarks) * 100).toFixed(2)}%</p>
            </div>
            
            <p>You can view the complete grade details and report card by logging into the parent portal.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/grades" class="button">View All Grades</a>
          </div>
          <div class="footer">
            <p>This is an automated email from School Management System. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(userName: string, resetToken: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>We received a request to reset your password for your School Management System account.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <div class="warning">
              <p><strong>Security Note:</strong></p>
              <p>• This link will expire in 1 hour</p>
              <p>• If you didn't request this reset, please ignore this email</p>
              <p>• Never share this link with anyone</p>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>This is an automated email from School Management System. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getReportCardTemplate(studentName: string, semester: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6f42c1; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Report Card Available</h1>
          </div>
          <div class="content">
            <h2>Dear Parent/Guardian of ${studentName},</h2>
            <p>The report card for ${semester} is now available.</p>
            
            <p>Please find the report card attached to this email. You can also view and download it from the parent portal.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/report-cards" class="button">View Report Card</a>
            
            <p>If you have any questions about the report card, please contact the class teacher or school administration.</p>
          </div>
          <div class="footer">
            <p>This is an automated email from School Management System. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getCustomEmailTemplate(message: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
          .message { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>School Management System</h1>
          </div>
          <div class="content">
            <div class="message">
              ${message}
            </div>
          </div>
          <div class="footer">
            <p>This is an automated email from School Management System. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Check if email service is configured
   */
  isEmailConfigured(): boolean {
    return this.isConfigured;
  }
}

// Types
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

export const emailService = EmailService.getInstance();
