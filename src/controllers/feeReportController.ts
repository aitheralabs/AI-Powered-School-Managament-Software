import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { FeeReportService } from '../services/feeReportService';

const feeReportService = new FeeReportService();

export const generateFeeCollectionReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await feeReportService.forSchool(req.schoolId!).generateFeeCollectionReport(
    req.query as any, req.user!.id, req.user!.role
  );
  res.json({ success: true, data: report });
});

export const getOutstandingDuesReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await feeReportService.forSchool(req.schoolId!).getOutstandingDuesReport(
    req.query, req.user!.id, req.user!.role
  );
  res.json({ success: true, data: report });
});

export const getFeeDefaultersReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await feeReportService.forSchool(req.schoolId!).getFeeDefaultersReport(
    req.query, req.user!.id, req.user!.role
  );
  res.json({ success: true, data: report });
});

export const getPaymentAnalysisReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await feeReportService.forSchool(req.schoolId!).getPaymentAnalysisReport(
    req.query, req.user!.id, req.user!.role
  );
  res.json({ success: true, data: report });
});

export const exportFeeReportData = asyncHandler(async (req: Request, res: Response) => {
  const { format = 'csv', reportType = 'collection', ...filters } = req.query;
  const exportResult = await feeReportService.forSchool(req.schoolId!).exportFeeReportData(
    format as string, reportType as string, filters, req.user!.id
  );

  if (format === 'json') {
    res.json({ success: true, data: exportResult.data, exportInfo: exportResult.exportInfo });
  } else {
    res.setHeader('Content-Type', exportResult.mimeType || 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename || 'report.csv'}"`);
    res.send(exportResult.csvData);
  }
});
