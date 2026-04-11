/**
 * AI Insights Service
 *
 * Provides AI-powered analytics for school administrators:
 *   - Attendance pattern analysis & risk detection
 *   - Grade trend prediction & early-warning alerts
 *   - Fee defaulter risk scoring
 *   - AI-generated narrative summaries (via Claude API)
 *
 * Uses a combination of rule-based analytics (always-on, no API cost)
 * and generative AI summaries (gated behind feature_ai_insights flag).
 *
 * Install SDK: npm install @anthropic-ai/sdk
 */

import { query } from '../database/connection';
import { AppError } from '../middleware/errorHandler';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─────────────────────────────────────────────────────────────
// Rule-based analytics (free tier, no AI cost)
// ─────────────────────────────────────────────────────────────

export interface AttendanceRisk {
  studentId: string;
  studentName: string;
  attendanceRate: number;       // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  daysAbsent: number;
  totalDays: number;
  consecutiveAbsences: number;
}

export interface GradeTrend {
  studentId: string;
  studentName: string;
  subjectName: string;
  trend: 'improving' | 'stable' | 'declining';
  currentAverage: number;
  previousAverage: number;
  change: number;
}

export interface FeeRisk {
  studentId: string;
  studentName: string;
  className: string;
  overdueAmount: number;
  daysPastDue: number;
  riskScore: number;            // 0-100
}

/** Detect students with attendance risk */
export async function getAttendanceRisks(
  schoolId: string,
  academicYearId: string,
  threshold = 75
): Promise<AttendanceRisk[]> {
  const result = await query(
    `WITH attendance_stats AS (
       SELECT
         s.id AS student_id,
         u.first_name || ' ' || u.last_name AS student_name,
         COUNT(a.id) FILTER (WHERE a.status IN ('present','leave')) AS days_present,
         COUNT(a.id) AS total_days,
         COUNT(a.id) FILTER (WHERE a.status = 'absent') AS days_absent,
         -- Consecutive absences (simplified: max run in last 30 days)
         MAX(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS had_absence
       FROM students s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN attendance a
         ON a.student_id = s.id
         AND a.school_id = s.school_id
         AND a.date >= (
           SELECT start_date FROM academic_years WHERE id = $2
         )
       WHERE s.school_id = $1
       GROUP BY s.id, student_name
       HAVING COUNT(a.id) > 0
     )
     SELECT
       student_id,
       student_name,
       days_present,
       total_days,
       days_absent,
       CASE WHEN total_days > 0
         THEN ROUND((days_present::NUMERIC / total_days) * 100, 1)
         ELSE 100
       END AS attendance_rate
     FROM attendance_stats
     ORDER BY attendance_rate ASC`,
    [schoolId, academicYearId]
  );

  return result.rows.map((row: any) => {
    const rate = parseFloat(row.attendance_rate);
    let riskLevel: AttendanceRisk['riskLevel'] = 'low';
    if (rate < 50) riskLevel = 'critical';
    else if (rate < 65) riskLevel = 'high';
    else if (rate < threshold) riskLevel = 'medium';

    return {
      studentId: row.student_id,
      studentName: row.student_name,
      attendanceRate: rate,
      riskLevel,
      daysAbsent: parseInt(row.days_absent),
      totalDays: parseInt(row.total_days),
      consecutiveAbsences: 0, // TODO: window function for streaks
    };
  }).filter((r: AttendanceRisk) => r.riskLevel !== 'low');
}

/** Detect students with declining grades */
export async function getGradeTrends(
  schoolId: string,
  classId?: string
): Promise<GradeTrend[]> {
  const result = await query(
    `WITH grade_periods AS (
       SELECT
         g.student_id,
         u.first_name || ' ' || u.last_name AS student_name,
         sub.name AS subject_name,
         g.semester_id,
         sem.start_date,
         AVG(g.percentage) AS avg_percentage,
         ROW_NUMBER() OVER (
           PARTITION BY g.student_id, g.subject_id
           ORDER BY sem.start_date DESC
         ) AS period_rank
       FROM grades g
       JOIN students st ON st.id = g.student_id AND st.school_id = $1
       JOIN users u ON u.id = st.user_id
       JOIN subjects sub ON sub.id = g.subject_id
       JOIN semesters sem ON sem.id = g.semester_id
       ${classId ? 'JOIN student_class_assignments sca ON sca.student_id = g.student_id AND sca.class_id = $2' : ''}
       WHERE g.school_id = $1
       GROUP BY g.student_id, student_name, g.subject_id, sub.name, g.semester_id, sem.start_date
     )
     SELECT
       curr.student_id,
       curr.student_name,
       curr.subject_name,
       curr.avg_percentage AS current_average,
       prev.avg_percentage AS previous_average,
       (curr.avg_percentage - prev.avg_percentage) AS grade_change
     FROM grade_periods curr
     LEFT JOIN grade_periods prev
       ON prev.student_id = curr.student_id
       AND prev.subject_name = curr.subject_name
       AND prev.period_rank = 2
     WHERE curr.period_rank = 1
       AND prev.avg_percentage IS NOT NULL
     ORDER BY grade_change ASC`,
    classId ? [schoolId, classId] : [schoolId]
  );

  return result.rows.map((row: any) => {
    const change = parseFloat(row.grade_change);
    let trend: GradeTrend['trend'] = 'stable';
    if (change <= -5) trend = 'declining';
    else if (change >= 5) trend = 'improving';

    return {
      studentId: row.student_id,
      studentName: row.student_name,
      subjectName: row.subject_name,
      trend,
      currentAverage: parseFloat(row.current_average),
      previousAverage: parseFloat(row.previous_average),
      change,
    };
  });
}

/** Score fee defaulter risk */
export async function getFeeDefaulterRisks(schoolId: string): Promise<FeeRisk[]> {
  const result = await query(
    `SELECT
       s.id AS student_id,
       u.first_name || ' ' || u.last_name AS student_name,
       cl.name AS class_name,
       SUM(sf.amount - COALESCE(sf.amount_paid,0)) AS overdue_amount,
       MAX(EXTRACT(DAY FROM NOW() - sf.due_date))::INT AS days_past_due
     FROM student_fees sf
     JOIN students s ON s.id = sf.student_id AND s.school_id = $1
     JOIN users u ON u.id = s.user_id
     LEFT JOIN classes cl ON cl.school_id = $1
     WHERE sf.school_id = $1
       AND sf.status IN ('pending','partial','overdue')
       AND sf.due_date < NOW()
     GROUP BY s.id, student_name, class_name
     ORDER BY overdue_amount DESC
     LIMIT 100`,
    [schoolId]
  );

  return result.rows.map((row: any) => {
    const overdue = parseFloat(row.overdue_amount || 0);
    const days = parseInt(row.days_past_due || 0);
    // Simple risk score: weight overdue amount and days
    const riskScore = Math.min(100, Math.round((days / 90) * 50 + Math.min(overdue / 5000, 1) * 50));

    return {
      studentId: row.student_id,
      studentName: row.student_name,
      className: row.class_name,
      overdueAmount: overdue,
      daysPastDue: days,
      riskScore,
    };
  });
}

// ─────────────────────────────────────────────────────────────
// AI-powered narrative summaries (Premium feature)
// ─────────────────────────────────────────────────────────────

export interface SchoolHealthSummary {
  generatedAt: string;
  attendanceSummary: string;
  gradeSummary: string;
  feeSummary: string;
  topConcerns: string[];
  recommendations: string[];
  rawData: {
    attendanceRisks: number;
    decliningGrades: number;
    feeDefaulters: number;
  };
}

/**
 * Generate an AI narrative summary of the school's academic health.
 * Requires ANTHROPIC_API_KEY env var and feature_ai_insights = true.
 */
export async function generateSchoolHealthSummary(
  schoolId: string,
  schoolName: string,
  academicYearId: string
): Promise<SchoolHealthSummary> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AppError('AI service is not configured. Contact your administrator.', 503);
  }

  // Gather data
  const [attendanceRisks, gradeTrends, feeRisks] = await Promise.all([
    getAttendanceRisks(schoolId, academicYearId),
    getGradeTrends(schoolId),
    getFeeDefaulterRisks(schoolId),
  ]);

  const criticalAttendance = attendanceRisks.filter(r => r.riskLevel === 'critical').length;
  const highAttendance = attendanceRisks.filter(r => r.riskLevel === 'high').length;
  const decliningGrades = gradeTrends.filter(r => r.trend === 'declining').length;
  const highFeeRisk = feeRisks.filter(r => r.riskScore >= 70).length;

  const prompt = `You are an educational analyst generating a concise health report for "${schoolName}" school management system.

Current academic data:
- Attendance: ${criticalAttendance} students with CRITICAL attendance (<50%), ${highAttendance} with HIGH risk (<65%)
- Grades: ${decliningGrades} student-subject combinations showing declining performance (drop ≥5%)
- Fees: ${highFeeRisk} students with high fee defaulter risk (score ≥70/100), total ${feeRisks.length} with overdue fees
- Total students at risk (attendance): ${attendanceRisks.length}

Top attendance risk students: ${attendanceRisks.slice(0, 5).map(r => `${r.studentName} (${r.attendanceRate}%)`).join(', ') || 'None'}
Top grade declines: ${gradeTrends.filter(r => r.trend === 'declining').slice(0, 5).map(r => `${r.studentName} in ${r.subjectName} (${r.change.toFixed(1)}%)`).join(', ') || 'None'}

Generate a JSON response with these exact keys:
{
  "attendanceSummary": "2-3 sentences on attendance situation",
  "gradeSummary": "2-3 sentences on academic performance trends",
  "feeSummary": "1-2 sentences on fee collection health",
  "topConcerns": ["concern 1", "concern 2", "concern 3"],
  "recommendations": ["action 1", "action 2", "action 3", "action 4"]
}

Be specific, actionable, and concise. No markdown formatting.`;

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = (message.content[0] as any).text;

  let parsed: any;
  try {
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
  } catch {
    parsed = {
      attendanceSummary: 'Unable to parse AI response.',
      gradeSummary: '',
      feeSummary: '',
      topConcerns: [],
      recommendations: [],
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    attendanceSummary: parsed.attendanceSummary || '',
    gradeSummary: parsed.gradeSummary || '',
    feeSummary: parsed.feeSummary || '',
    topConcerns: parsed.topConcerns || [],
    recommendations: parsed.recommendations || [],
    rawData: {
      attendanceRisks: attendanceRisks.length,
      decliningGrades,
      feeDefaulters: feeRisks.length,
    },
  };
}

/**
 * AI Chat endpoint: answer questions about school data in natural language.
 * Example: "Which students are at risk this month?"
 */
export async function askSchoolAI(
  schoolId: string,
  schoolName: string,
  question: string,
  academicYearId: string
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AppError('AI service is not configured.', 503);
  }

  // Gather context
  const [attendanceRisks, gradeTrends, feeRisks] = await Promise.all([
    getAttendanceRisks(schoolId, academicYearId),
    getGradeTrends(schoolId),
    getFeeDefaulterRisks(schoolId),
  ]);

  const context = `
School: ${schoolName}
Date: ${new Date().toLocaleDateString('en-IN')}

ATTENDANCE DATA:
${attendanceRisks.slice(0, 20).map(r =>
  `- ${r.studentName}: ${r.attendanceRate}% (${r.riskLevel} risk, ${r.daysAbsent} days absent)`
).join('\n') || 'No at-risk students.'}

GRADE TRENDS:
${gradeTrends.filter(r => r.trend === 'declining').slice(0, 20).map(r =>
  `- ${r.studentName} | ${r.subjectName}: ${r.previousAverage.toFixed(1)}% → ${r.currentAverage.toFixed(1)}% (${r.change.toFixed(1)}%)`
).join('\n') || 'No declining grades detected.'}

FEE STATUS:
${feeRisks.slice(0, 20).map(r =>
  `- ${r.studentName} (${r.className}): ₹${r.overdueAmount.toLocaleString()} overdue, ${r.daysPastDue} days past due`
).join('\n') || 'No fee defaulters.'}
`;

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: `You are an AI assistant for ${schoolName}'s school management system. Answer questions about the school data provided concisely and helpfully. Always be respectful and professional. Do not reveal specific personal data unless directly asked. Keep responses under 200 words.`,
    messages: [
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${question}`,
      },
    ],
  });

  return (message.content[0] as any).text;
}

/** Generate AI-written personalized report card comment for a student */
export async function generateReportCardComment(
  studentName: string,
  className: string,
  grades: Array<{ subject: string; percentage: number; grade: string }>,
  attendanceRate: number
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return ''; // Silently skip if no API key
  }

  const avgGrade = grades.reduce((sum, g) => sum + g.percentage, 0) / (grades.length || 1);

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Write a brief, encouraging report card comment (2-3 sentences, max 60 words) for a student.

Student: ${studentName}, Class: ${className}
Average grade: ${avgGrade.toFixed(1)}%, Attendance: ${attendanceRate}%
Subject performance: ${grades.map(g => `${g.subject}: ${g.grade}`).join(', ')}

Write in third person. Be positive but honest. Mention attendance if below 80%. No markdown.`,
    }],
  });

  return (message.content[0] as any).text.trim();
}
