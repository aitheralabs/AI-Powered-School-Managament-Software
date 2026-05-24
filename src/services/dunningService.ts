/**
 * Dunning Service
 *
 * Handles three automated billing-health workflows:
 *
 *  1. runDunning()       — escalating emails for past_due schools
 *     Step 0 (day 0)  : payment fails  → immediate email (called from webhook)
 *     Step 1 (day 3)  : still past_due → reminder email
 *     Step 2 (day 7)  : still past_due → final warning + partial feature lock
 *     Step 3 (day 14) : still past_due → full suspension
 *
 *  2. runTrialWarnings() — proactive emails before trial expires
 *     7 days, 3 days, 1 day before trial_ends_at
 *
 *  3. runOverageAlerts() — email school admin when usage hits 90 % of any limit
 *
 * All three are called from src/cron/scheduledTasks.ts on a daily schedule.
 */

import { query, getClient } from '../database/connection';
import { emailService } from './emailService';

export class DunningService {
  // ─────────────────────────────────────────────────────────────
  // 1. Dunning workflow
  // ─────────────────────────────────────────────────────────────

  /**
   * Called immediately when a payment fails (from webhook).
   * Sets dunning_step = 1 and sends the first failure email.
   */
  async handlePaymentFailed(schoolId: string): Promise<void> {
    const school = await this.getSchoolContact(schoolId);
    if (!school) return;

    await query(
      `UPDATE schools
       SET dunning_step = 1,
           dunning_started_at    = NOW(),
           dunning_last_email_at = NOW(),
           updated_at            = NOW()
       WHERE id = $1`,
      [schoolId]
    );

    await emailService.sendPaymentFailedEmail(
      school.email,
      school.name,
      0, // amount unknown at this point; payment webhook caller can pass it
      school.currency || 'INR'
    ).catch(err => console.error('[Dunning] Payment-failed email error:', err));

    console.log(`[Dunning] Step 1 email sent to ${school.name} (${schoolId})`);
  }

  /**
   * Run dunning escalation for all currently past_due schools.
   * Called daily by the cron scheduler.
   */
  async runDunning(): Promise<void> {
    // Fetch schools that are past_due and still need escalation
    const result = await query(
      `SELECT s.id, s.name, s.email, s.currency, s.dunning_step, s.dunning_started_at
       FROM schools s
       WHERE s.subscription_status IN ('past_due', 'suspended')
         AND s.dunning_step < 5
       ORDER BY s.dunning_started_at ASC`,
      []
    );

    for (const school of result.rows) {
      await this.escalateDunning(school).catch(err =>
        console.error(`[Dunning] Escalation error for ${school.id}:`, err)
      );
    }

    console.log(`[Dunning] Processed ${result.rows.length} past_due schools`);
  }

  private async escalateDunning(school: any): Promise<void> {
    const daysPastDue = daysSince(school.dunning_started_at);
    const currentStep: number = school.dunning_step;
    const appUrl = process.env.APP_URL || 'http://localhost:4200';
    const appName = process.env.APP_NAME || 'EduSaaS';

    // Step 2: 3-day reminder
    if (currentStep === 1 && daysPastDue >= 3) {
      await emailService.sendEmail({
        to: school.email,
        subject: `[Reminder] Payment still pending – ${school.name}`,
        html: buildDunningEmailHtml(school.name, 2, appUrl, appName, 7),
      }).catch(err => console.error(`[Dunning] Step-2 email error:`, err));
      await query(
        `UPDATE schools SET dunning_step = 2, dunning_last_email_at = NOW() WHERE id = $1`,
        [school.id]
      );
      console.log(`[Dunning] Step 2 (day-3 reminder) → ${school.name}`);
    }

    // Step 3: 7-day warning + partial lock
    else if (currentStep === 2 && daysPastDue >= 7) {
      await emailService.sendEmail({
        to: school.email,
        subject: `[URGENT] Access restricted – payment overdue – ${school.name}`,
        html: buildDunningEmailHtml(school.name, 3, appUrl, appName, 7),
      }).catch(err => console.error(`[Dunning] Step-3 email error:`, err));
      // Partial lock: disable AI insights and API access
      await query(
        `UPDATE schools
         SET dunning_step          = 3,
             dunning_last_email_at = NOW(),
             feature_ai_insights   = false,
             feature_api_access    = false,
             updated_at            = NOW()
         WHERE id = $1`,
        [school.id]
      );
      console.log(`[Dunning] Step 3 (day-7 warning + partial lock) → ${school.name}`);
    }

    // Step 4: 14-day full suspension
    else if (currentStep === 3 && daysPastDue >= 14) {
      await emailService.sendEmail({
        to: school.email,
        subject: `Account suspended – ${school.name}`,
        html: buildDunningEmailHtml(school.name, 4, appUrl, appName, 0),
      }).catch(err => console.error(`[Dunning] Step-4 email error:`, err));

      await query(
        `UPDATE schools
         SET dunning_step          = 4,
             dunning_last_email_at = NOW(),
             subscription_status   = 'suspended',
             is_active             = false,
             updated_at            = NOW()
         WHERE id = $1`,
        [school.id]
      );

      // Invalidate all refresh tokens for users in this school
      await query(
        `UPDATE refresh_tokens SET is_active = false
         WHERE user_id IN (SELECT id FROM users WHERE school_id = $1)`,
        [school.id]
      );

      console.log(`[Dunning] Step 4 (day-14 suspension) → ${school.name}`);
    }

    // Step 5: 30-day auto-cancellation
    else if (currentStep === 4 && daysPastDue >= 30) {
      await emailService.sendEmail({
        to: school.email,
        subject: `Subscription cancelled – ${school.name}`,
        html: buildDunningEmailHtml(school.name, 5, appUrl, appName, 0),
      }).catch(err => console.error(`[Dunning] Step-5 email error:`, err));

      await query(
        `UPDATE schools
         SET dunning_step          = 5,
             dunning_last_email_at = NOW(),
             subscription_status   = 'cancelled',
             updated_at            = NOW()
         WHERE id = $1`,
        [school.id]
      );

      console.log(`[Dunning] Step 5 (day-30 cancellation) → ${school.name}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Trial expiry warnings
  // ─────────────────────────────────────────────────────────────

  async runTrialWarnings(): Promise<void> {
    const result = await query(
      `SELECT id, name, email, trial_ends_at, trial_warning_sent
       FROM schools
       WHERE subscription_status = 'trialing'
         AND trial_ends_at IS NOT NULL
         AND trial_ends_at > NOW()
         AND trial_ends_at < NOW() + INTERVAL '8 days'`,
      []
    );

    for (const school of result.rows) {
      const daysLeft = Math.ceil(
        (new Date(school.trial_ends_at).getTime() - Date.now()) / 86_400_000
      );
      const warningSent: number = school.trial_warning_sent;

      // 7-day warning (send once, warning_sent < 1)
      if (daysLeft <= 7 && daysLeft > 3 && warningSent < 1) {
        await emailService.sendTrialExpiryEmail(school.email, school.name, daysLeft)
          .catch(err => console.error('[Dunning] Trial-7d email error:', err));
        await query(
          `UPDATE schools SET trial_warning_sent = 1 WHERE id = $1`, [school.id]
        );
        console.log(`[Dunning] Trial 7-day warning → ${school.name}`);
      }

      // 3-day warning (send once, warning_sent < 2)
      else if (daysLeft <= 3 && daysLeft > 1 && warningSent < 2) {
        await emailService.sendTrialExpiryEmail(school.email, school.name, daysLeft)
          .catch(err => console.error('[Dunning] Trial-3d email error:', err));
        await query(
          `UPDATE schools SET trial_warning_sent = 2 WHERE id = $1`, [school.id]
        );
        console.log(`[Dunning] Trial 3-day warning → ${school.name}`);
      }

      // 1-day warning (send once, warning_sent < 3)
      else if (daysLeft <= 1 && warningSent < 3) {
        await emailService.sendTrialExpiryEmail(school.email, school.name, daysLeft)
          .catch(err => console.error('[Dunning] Trial-1d email error:', err));
        await query(
          `UPDATE schools SET trial_warning_sent = 3 WHERE id = $1`, [school.id]
        );
        console.log(`[Dunning] Trial 1-day warning → ${school.name}`);
      }
    }

    console.log(`[Dunning] Trial warning pass done — checked ${result.rows.length} schools`);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Overage / limit alerts (90 % threshold)
  // ─────────────────────────────────────────────────────────────

  async runOverageAlerts(): Promise<void> {
    const THRESHOLD = 0.90; // alert at 90% of limit

    // Build usage counts in one query
    const result = await query(
      `SELECT
         s.id, s.name, s.email,
         s.max_students, s.max_teachers, s.max_staff,
         (SELECT COUNT(*) FROM students  WHERE school_id = s.id)::INT  AS student_count,
         (SELECT COUNT(*) FROM teachers  WHERE school_id = s.id)::INT  AS teacher_count,
         (SELECT COUNT(*) FROM staff     WHERE school_id = s.id AND is_active = true)::INT AS staff_count
       FROM schools s
       WHERE s.subscription_status IN ('trialing','active')
         AND s.is_active = true`,
      []
    );

    const appName = process.env.APP_NAME || 'EduSaaS';
    const appUrl  = process.env.APP_URL  || 'http://localhost:4200';

    for (const s of result.rows) {
      const alerts: string[] = [];

      if (s.student_count >= s.max_students * THRESHOLD)
        alerts.push(`Students: ${s.student_count} / ${s.max_students}`);
      if (s.teacher_count >= s.max_teachers * THRESHOLD)
        alerts.push(`Teachers: ${s.teacher_count} / ${s.max_teachers}`);
      if (s.staff_count >= s.max_staff * THRESHOLD)
        alerts.push(`Staff: ${s.staff_count} / ${s.max_staff}`);

      if (alerts.length === 0) continue;

      const html = buildOverageEmailHtml(s.name, alerts, appUrl, appName);
      await emailService.sendEmail({
        to: s.email,
        subject: `You're approaching your plan limits – ${s.name}`,
        html,
      }).catch(err => console.error(`[Dunning] Overage email error for ${s.id}:`, err));

      console.log(`[Dunning] Overage alert → ${s.name}: ${alerts.join(', ')}`);
    }

    console.log(`[Dunning] Overage alert pass done — checked ${result.rows.length} schools`);
  }

  // ─── Internal helpers ────────────────────────────────────────

  private async getSchoolContact(schoolId: string) {
    const r = await query(
      'SELECT id, name, email, currency FROM schools WHERE id = $1', [schoolId]
    );
    return r.rows[0] || null;
  }
}

// ─── Email HTML builders ────────────────────────────────────

function buildDunningEmailHtml(
  schoolName: string,
  step: number,
  appUrl: string,
  appName: string,
  daysLeft: number
): string {
  const isCancelled = step >= 5;
  const isSuspended = step === 4;
  const headerColor = isCancelled ? '#450a0a' : isSuspended ? '#7f1d1d' : step === 3 ? '#dc2626' : '#d97706';
  const title       = isCancelled
    ? 'Subscription Cancelled'
    : isSuspended
    ? 'Account Suspended'
    : step === 3
    ? 'Final Warning — Access Restricted'
    : 'Payment Reminder';

  const body = isCancelled
    ? `Your subscription has been <strong>cancelled</strong> due to prolonged non-payment. Your data will be retained for 90 days. Please contact <a href="mailto:billing@edusaas.in">billing@edusaas.in</a> to reactivate your account.`
    : isSuspended
    ? `Your account has been <strong>suspended</strong> due to non-payment. Your data is safe. Please contact <a href="mailto:billing@edusaas.in">billing@edusaas.in</a> to reactivate your account.`
    : step === 3
    ? `Your payment is now <strong>7 days overdue</strong>. Some advanced features have been temporarily disabled. Please update your payment method immediately — you have <strong>7 days</strong> before full suspension.`
    : `This is a reminder that your payment is still pending. Please update your payment method to avoid service interruption.`;

  return `
<!DOCTYPE html><html><head>
<style>
  body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
  .wrap{max-width:600px;margin:0 auto;padding:20px}
  .header{background:${headerColor};color:white;padding:28px 24px;border-radius:12px 12px 0 0;text-align:center}
  .content{background:#f8fafc;padding:28px 24px;border-radius:0 0 12px 12px}
  .btn{display:inline-block;padding:14px 32px;background:#4f46e5;color:white;text-decoration:none;border-radius:8px;font-weight:600;margin:20px 0}
  .footer{text-align:center;margin-top:20px;font-size:12px;color:#94a3b8}
</style>
</head><body><div class="wrap">
  <div class="header"><h1>${title}</h1><p style="opacity:.85;margin:4px 0 0">${schoolName}</p></div>
  <div class="content">
    <p>${body}</p>
    ${!isSuspended ? `<div style="text-align:center"><a href="${appUrl}/billing" class="btn">Update Payment Method</a></div>` : ''}
    <p style="color:#64748b;font-size:13px">Need help? Email <a href="mailto:billing@edusaas.in">billing@edusaas.in</a></p>
  </div>
  <div class="footer">© ${new Date().getFullYear()} ${appName}</div>
</div></body></html>`;
}

function buildOverageEmailHtml(
  schoolName: string,
  alerts: string[],
  appUrl: string,
  appName: string
): string {
  const listItems = alerts.map(a => `<li>${a}</li>`).join('');
  return `
<!DOCTYPE html><html><head>
<style>
  body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
  .wrap{max-width:600px;margin:0 auto;padding:20px}
  .header{background:linear-gradient(135deg,#d97706,#b45309);color:white;padding:28px 24px;border-radius:12px 12px 0 0;text-align:center}
  .content{background:#f8fafc;padding:28px 24px;border-radius:0 0 12px 12px}
  .alert-box{background:#fffbeb;border:1px solid #fcd34d;padding:16px;border-radius:8px;margin:16px 0}
  .btn{display:inline-block;padding:14px 32px;background:#4f46e5;color:white;text-decoration:none;border-radius:8px;font-weight:600;margin:20px 0}
  .footer{text-align:center;margin-top:20px;font-size:12px;color:#94a3b8}
</style>
</head><body><div class="wrap">
  <div class="header"><h1>Approaching Plan Limits</h1><p style="opacity:.85;margin:4px 0 0">${schoolName}</p></div>
  <div class="content">
    <p>You are approaching the limits of your current subscription plan:</p>
    <div class="alert-box"><ul style="margin:0;padding-left:20px">${listItems}</ul></div>
    <p>Upgrade your plan now to avoid any disruption when adding new students or staff.</p>
    <div style="text-align:center"><a href="${appUrl}/billing/upgrade" class="btn">Upgrade Plan</a></div>
    <p style="color:#64748b;font-size:13px">Questions? Contact <a href="mailto:support@edusaas.in">support@edusaas.in</a></p>
  </div>
  <div class="footer">© ${new Date().getFullYear()} ${appName}</div>
</div></body></html>`;
}

// ─── Helper ──────────────────────────────────────────────────

function daysSince(date: Date | string | null): number {
  if (!date) return 0;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
}

export const dunningService = new DunningService();
