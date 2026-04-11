/**
 * AI Insights Controller
 *
 * Routes:
 *   GET  /api/v1/ai/attendance-risks        — students with low attendance
 *   GET  /api/v1/ai/grade-trends            — declining grade detection
 *   GET  /api/v1/ai/fee-risks               — fee defaulter risk scores
 *   GET  /api/v1/ai/school-health           — AI narrative summary (Premium)
 *   POST /api/v1/ai/ask                     — natural language Q&A (Premium)
 */

import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import * as aiService from '../services/aiInsightsService';
import { query } from '../database/connection';

/** GET /api/v1/ai/attendance-risks */
export const getAttendanceRisks = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.schoolId!;
  const threshold = parseInt(req.query.threshold as string) || 75;

  // Get active academic year
  const ayResult = await query(
    'SELECT id FROM academic_years WHERE school_id = $1 AND is_active = true LIMIT 1',
    [schoolId]
  );
  if (ayResult.rows.length === 0) throw new AppError('No active academic year found', 404);

  const risks = await aiService.getAttendanceRisks(schoolId, ayResult.rows[0].id, threshold);

  res.json({
    success: true,
    data: {
      threshold,
      totalAtRisk: risks.length,
      breakdown: {
        critical: risks.filter(r => r.riskLevel === 'critical').length,
        high:     risks.filter(r => r.riskLevel === 'high').length,
        medium:   risks.filter(r => r.riskLevel === 'medium').length,
      },
      students: risks,
    },
  });
});

/** GET /api/v1/ai/grade-trends */
export const getGradeTrends = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.schoolId!;
  const classId  = req.query.classId as string | undefined;

  const trends = await aiService.getGradeTrends(schoolId, classId);

  res.json({
    success: true,
    data: {
      totalAnalyzed: trends.length,
      breakdown: {
        improving: trends.filter(r => r.trend === 'improving').length,
        stable:    trends.filter(r => r.trend === 'stable').length,
        declining: trends.filter(r => r.trend === 'declining').length,
      },
      trends,
    },
  });
});

/** GET /api/v1/ai/fee-risks */
export const getFeeRisks = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.schoolId!;
  const risks = await aiService.getFeeDefaulterRisks(schoolId);

  const totalOverdue = risks.reduce((sum, r) => sum + r.overdueAmount, 0);

  res.json({
    success: true,
    data: {
      totalDefaulters: risks.length,
      totalOverdueAmount: totalOverdue,
      highRiskCount: risks.filter(r => r.riskScore >= 70).length,
      students: risks,
    },
  });
});

/** GET /api/v1/ai/school-health — AI narrative (Premium feature) */
export const getSchoolHealthSummary = asyncHandler(async (req: Request, res: Response) => {
  const schoolId   = req.schoolId!;
  const schoolName = req.school!.name;

  const ayResult = await query(
    'SELECT id FROM academic_years WHERE school_id = $1 AND is_active = true LIMIT 1',
    [schoolId]
  );
  if (ayResult.rows.length === 0) throw new AppError('No active academic year found', 404);

  const summary = await aiService.generateSchoolHealthSummary(
    schoolId,
    schoolName,
    ayResult.rows[0].id
  );

  res.json({ success: true, data: summary });
});

/** POST /api/v1/ai/ask — natural language Q&A (Premium feature) */
export const askSchoolAI = asyncHandler(async (req: Request, res: Response) => {
  const { question } = req.body;
  if (!question || typeof question !== 'string' || question.trim().length < 5) {
    throw new AppError('Please provide a valid question (at least 5 characters)', 400);
  }

  const schoolId   = req.schoolId!;
  const schoolName = req.school!.name;

  const ayResult = await query(
    'SELECT id FROM academic_years WHERE school_id = $1 AND is_active = true LIMIT 1',
    [schoolId]
  );
  if (ayResult.rows.length === 0) throw new AppError('No active academic year found', 404);

  const answer = await aiService.askSchoolAI(
    schoolId,
    schoolName,
    question.trim(),
    ayResult.rows[0].id
  );

  res.json({ success: true, data: { question, answer } });
});
