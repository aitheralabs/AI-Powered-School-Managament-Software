/**
 * Notification Service
 *
 * Handles:
 *   - In-app notifications (stored in DB)
 *   - Email notifications (via Nodemailer)
 *   - Notification triggers (fee due, attendance alert, grade posted)
 *
 * Design: enqueue to `notifications` table → background worker picks up and sends.
 * This keeps request latency low (no blocking on SMTP).
 */

import { query } from '../database/connection';
import nodemailer from 'nodemailer';
import env from '../config/env';
import { emitToUser } from '../socket/socketServer';

// ─────────────────────────────────────────────────────────────
// Email transport
// ─────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!env.SMTP_HOST || !env.SMTP_USER) {
    console.warn('[Notifications] SMTP not configured, skipping email to:', to);
    return;
  }
  await transporter.sendMail({
    from: `"School Management" <${env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

// ─────────────────────────────────────────────────────────────
// Core enqueue function
// ─────────────────────────────────────────────────────────────

export interface NotificationPayload {
  schoolId?: string;
  userId: string;
  type: string;
  channel: 'email' | 'sms' | 'push' | 'in_app';
  title: string;
  body: string;
  data?: Record<string, any>;
}

export async function enqueueNotification(payload: NotificationPayload): Promise<void> {
  const result = await query(
    `INSERT INTO notifications (school_id, user_id, type, channel, title, body, data)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, type, title, body, data, created_at`,
    [
      payload.schoolId || null,
      payload.userId,
      payload.type,
      payload.channel,
      payload.title,
      payload.body,
      JSON.stringify(payload.data || {}),
    ]
  );

  // Push real-time notification to connected client
  if (payload.channel === 'in_app' && result.rows.length > 0) {
    const notification = result.rows[0];
    emitToUser(payload.userId, 'notification:new', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      createdAt: notification.created_at,
    });
  }
}

// ─────────────────────────────────────────────────────────────
// Domain-specific triggers
// ─────────────────────────────────────────────────────────────

/** Alert when student attendance drops below threshold */
export async function notifyLowAttendance(
  schoolId: string,
  studentId: string,
  studentName: string,
  attendanceRate: number,
  parentEmail?: string
): Promise<void> {
  const title = `Attendance Alert: ${studentName}`;
  const body  = `${studentName}'s attendance has dropped to ${attendanceRate}%. Please contact the school.`;

  // Notify parent via email
  if (parentEmail) {
    await sendEmail(parentEmail, title, `
      <p>Dear Parent,</p>
      <p>${body}</p>
      <p>Please contact the school administration for more details.</p>
    `);
  }

  // In-app notification for admin
  const admins = await query(
    "SELECT id FROM users WHERE school_id = $1 AND role = 'admin' AND is_active = true",
    [schoolId]
  );
  for (const admin of admins.rows) {
    await enqueueNotification({
      schoolId,
      userId: admin.id,
      type: 'attendance_alert',
      channel: 'in_app',
      title,
      body,
      data: { studentId, attendanceRate },
    });
  }
}

/** Notify parents when fee is due */
export async function notifyFeeDue(
  schoolId: string,
  studentId: string,
  studentName: string,
  amount: number,
  dueDate: string,
  parentEmail?: string
): Promise<void> {
  const title = `Fee Due: ${studentName}`;
  const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  const body = `Fee of ${formattedAmount} for ${studentName} is due on ${dueDate}.`;

  if (parentEmail) {
    await sendEmail(parentEmail, title, `
      <p>Dear Parent,</p>
      <p>${body}</p>
      <p>Please log in to the school portal to pay or contact the accounts office.</p>
    `);
  }

  await enqueueNotification({
    schoolId,
    userId: studentId,  // student's user ID
    type: 'fee_due',
    channel: 'in_app',
    title,
    body,
    data: { amount, dueDate },
  });
}

/** Send fee payment receipt */
export async function sendPaymentReceipt(
  parentEmail: string,
  studentName: string,
  amount: number,
  receiptNumber: string,
  paymentDate: string
): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  await sendEmail(
    parentEmail,
    `Payment Receipt - ${receiptNumber}`,
    `
      <h2>Payment Received</h2>
      <table>
        <tr><td><b>Student:</b></td><td>${studentName}</td></tr>
        <tr><td><b>Amount Paid:</b></td><td>${formattedAmount}</td></tr>
        <tr><td><b>Receipt No:</b></td><td>${receiptNumber}</td></tr>
        <tr><td><b>Date:</b></td><td>${paymentDate}</td></tr>
      </table>
      <p>Thank you for your payment. Please keep this receipt for your records.</p>
    `
  );
}

// ─────────────────────────────────────────────────────────────
// Background worker — process pending notifications
// ─────────────────────────────────────────────────────────────

export async function processNotificationQueue(batchSize = 50): Promise<void> {
  const pending = await query(
    `UPDATE notifications
     SET status = 'processing', attempts = attempts + 1, last_attempt_at = NOW()
     WHERE id IN (
       SELECT id FROM notifications
       WHERE status = 'pending' AND attempts < 3
       ORDER BY created_at ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING *`,
    [batchSize]
  );

  for (const notification of pending.rows) {
    try {
      if (notification.channel === 'email') {
        // Get user email
        const user = await query('SELECT email FROM users WHERE id = $1', [notification.user_id]);
        if (user.rows.length > 0) {
          await sendEmail(user.rows[0].email, notification.title, `<p>${notification.body}</p>`);
        }
      }
      // In-app and push are stored in DB (client polls/websocket)

      await query(
        "UPDATE notifications SET status = 'sent', sent_at = NOW() WHERE id = $1",
        [notification.id]
      );
    } catch (err) {
      console.error('[NotificationWorker] Failed to send notification:', err);
      await query(
        `UPDATE notifications SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'pending' END,
         error_message = $1 WHERE id = $2`,
        [String(err), notification.id]
      );
    }
  }
}
