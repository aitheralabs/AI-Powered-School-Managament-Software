/**
 * Notification Worker
 *
 * Runs as a separate process (docker-compose service "worker").
 * Polls the notifications table every 30 seconds and sends pending notifications.
 * Also runs scheduled jobs: fee reminders, attendance alerts.
 */

import cron from 'node-cron';
import { processNotificationQueue, notifyFeeDue, notifyLowAttendance } from '../services/notificationService';
import { testConnection, closePool } from '../database/connection';
import { query } from '../database/connection';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('[Worker] Starting notification worker...');

  const connected = await testConnection();
  if (!connected) {
    console.error('[Worker] Cannot connect to database. Exiting.');
    process.exit(1);
  }

  console.log('[Worker] Database connected. Starting scheduled jobs...');

  // ── Process notification queue every 30 seconds ────────────
  cron.schedule('*/30 * * * * *', async () => {
    try {
      await processNotificationQueue(50);
    } catch (err) {
      console.error('[Worker] Error processing notification queue:', err);
    }
  });

  // ── Daily: send fee due reminders (9 AM) ──────────────────
  cron.schedule('0 9 * * *', async () => {
    console.log('[Worker] Running daily fee reminder job...');
    try {
      // Find fees due in the next 3 days
      const dueFees = await query(`
        SELECT
          sf.id, sf.student_id, sf.amount, sf.amount_paid, sf.due_date,
          u.first_name || ' ' || u.last_name AS student_name,
          s.school_id,
          pu.email AS parent_email
        FROM student_fees sf
        JOIN students s ON s.id = sf.student_id
        JOIN users u ON u.id = s.user_id
        LEFT JOIN student_parents sp ON sp.student_id = sf.student_id
        LEFT JOIN users pu ON pu.id = sp.parent_id
        WHERE sf.status IN ('pending', 'partial')
          AND sf.due_date BETWEEN NOW() AND NOW() + INTERVAL '3 days'
          AND sf.school_id IN (
            SELECT id FROM schools WHERE subscription_status IN ('active', 'trialing')
          )
      `);

      for (const fee of dueFees.rows) {
        await notifyFeeDue(
          fee.school_id,
          fee.student_id,
          fee.student_name,
          parseFloat(fee.amount) - parseFloat(fee.amount_paid || 0),
          new Date(fee.due_date).toLocaleDateString('en-IN'),
          fee.parent_email
        );
      }

      console.log(`[Worker] Fee reminders sent for ${dueFees.rows.length} fees.`);
    } catch (err) {
      console.error('[Worker] Fee reminder job error:', err);
    }
  });

  // ── Weekly: attendance alert (Monday 8 AM) ─────────────────
  cron.schedule('0 8 * * 1', async () => {
    console.log('[Worker] Running weekly attendance alert job...');
    try {
      // Find students below 75% attendance in active schools
      const atRisk = await query(`
        SELECT
          s.id AS student_id, s.school_id,
          u.first_name || ' ' || u.last_name AS student_name,
          COUNT(a.id) FILTER (WHERE a.status IN ('present','leave'))::FLOAT /
            NULLIF(COUNT(a.id), 0) * 100 AS attendance_rate,
          pu.email AS parent_email
        FROM students s
        JOIN users u ON u.id = s.user_id
        JOIN schools sc ON sc.id = s.school_id AND sc.subscription_status IN ('active','trialing')
        LEFT JOIN attendance a ON a.student_id = s.id
          AND a.date >= NOW() - INTERVAL '30 days'
        LEFT JOIN student_parents sp ON sp.student_id = s.id
        LEFT JOIN users pu ON pu.id = sp.parent_id
        GROUP BY s.id, student_name, s.school_id, pu.email
        HAVING COUNT(a.id) > 0
          AND COUNT(a.id) FILTER (WHERE a.status IN ('present','leave'))::FLOAT / NULLIF(COUNT(a.id),0) < 0.75
      `);

      for (const student of atRisk.rows) {
        await notifyLowAttendance(
          student.school_id,
          student.student_id,
          student.student_name,
          Math.round(parseFloat(student.attendance_rate)),
          student.parent_email
        );
      }

      console.log(`[Worker] Attendance alerts sent for ${atRisk.rows.length} students.`);
    } catch (err) {
      console.error('[Worker] Attendance alert job error:', err);
    }
  });

  // ── Trial expiry warnings (daily at 10 AM) ─────────────────
  cron.schedule('0 10 * * *', async () => {
    try {
      // Schools whose trial expires in exactly 7 days
      const expiring = await query(`
        SELECT s.id, s.name, s.email
        FROM schools s
        WHERE s.subscription_status = 'trialing'
          AND s.trial_ends_at::DATE = (NOW() + INTERVAL '7 days')::DATE
      `);

      const { default: nodemailer } = await import('nodemailer');
      // Send trial expiry warning emails
      for (const school of expiring.rows) {
        console.log(`[Worker] Trial expiry warning for: ${school.name} (${school.email})`);
        // In production, send email via notificationService.sendEmail
      }
    } catch (err) {
      console.error('[Worker] Trial expiry warning error:', err);
    }
  });

  console.log('[Worker] All cron jobs registered. Worker is running.');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('[Worker] SIGTERM received. Closing database pool...');
    await closePool();
    process.exit(0);
  });
}

main().catch(err => {
  console.error('[Worker] Fatal error:', err);
  process.exit(1);
});
