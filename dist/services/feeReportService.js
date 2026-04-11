"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeReportService = void 0;
const baseService_1 = require("./baseService");
const errorHandler_1 = require("../middleware/errorHandler");
class FeeReportService extends baseService_1.BaseService {
    async generateFeeCollectionReport(reportQuery, userId, userRole) {
        const startDate = new Date(reportQuery.startDate);
        const endDate = new Date(reportQuery.endDate);
        if (startDate > endDate) {
            throw new errorHandler_1.AppError('Start date cannot be after end date', 400);
        }
        let whereClause = 'WHERE sf.created_at BETWEEN $1 AND $2';
        const queryParams = [reportQuery.startDate, reportQuery.endDate];
        whereClause = this.addAuthorizationFilters(whereClause, queryParams, userId, userRole);
        whereClause = this.addOptionalFilters(whereClause, queryParams, reportQuery);
        let reportData = [];
        let summary = {};
        switch (reportQuery.groupBy) {
            case 'student':
                reportData = await this.generateStudentFeeReport(whereClause, queryParams, reportQuery);
                break;
            case 'class':
                reportData = await this.generateClassFeeReport(whereClause, queryParams, reportQuery);
                break;
            case 'category':
                reportData = await this.generateCategoryFeeReport(whereClause, queryParams, reportQuery);
                break;
            case 'date':
                reportData = await this.generateDateFeeReport(whereClause, queryParams, reportQuery);
                break;
            default:
                reportData = await this.generateStudentFeeReport(whereClause, queryParams, reportQuery);
        }
        summary = await this.calculateFeeSummary(whereClause, queryParams);
        return {
            reportType: `Fee Collection Report - ${reportQuery.groupBy} wise`,
            startDate: reportQuery.startDate,
            endDate: reportQuery.endDate,
            generatedAt: new Date().toISOString(),
            data: reportData,
            summary: summary,
        };
    }
    async getOutstandingDuesReport(filters, userId, userRole) {
        const { classId, feeCategoryId, daysOverdue = 0 } = filters;
        let whereClause = `WHERE sf.status IN ('pending', 'partial', 'overdue') 
                       AND sf.due_date <= CURRENT_DATE - INTERVAL '${daysOverdue} days'`;
        const queryParams = [];
        whereClause = this.addAuthorizationFilters(whereClause, queryParams, userId, userRole);
        if (classId) {
            whereClause += ` AND s.class_id = $${queryParams.length + 1}`;
            queryParams.push(classId);
        }
        if (feeCategoryId) {
            whereClause += ` AND sf.fee_category_id = $${queryParams.length + 1}`;
            queryParams.push(feeCategoryId);
        }
        const result = await this.executeQuery(`SELECT 
         s.id as student_id,
         s.student_id as student_number,
         u.first_name,
         u.last_name,
         u.email,
         u.phone,
         c.name as class_name,
         c.grade,
         c.section,
         fc.name as fee_category_name,
         sf.amount as total_amount,
         COALESCE(SUM(p.amount), 0) as paid_amount,
         sf.amount - COALESCE(SUM(p.amount), 0) as outstanding_amount,
         sf.due_date,
         CURRENT_DATE - sf.due_date as days_overdue,
         sf.status
       FROM student_fees sf
       JOIN students s ON sf.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON s.class_id = c.id
       JOIN fee_categories fc ON sf.fee_category_id = fc.id
       LEFT JOIN payments p ON sf.id = p.student_fee_id
       ${whereClause}
       GROUP BY s.id, s.student_id, u.first_name, u.last_name, u.email, u.phone,
                c.name, c.grade, c.section, fc.name, sf.amount, sf.due_date, sf.status
       HAVING sf.amount - COALESCE(SUM(p.amount), 0) > 0
       ORDER BY sf.due_date ASC, outstanding_amount DESC`, queryParams);
        const totalOutstanding = result.rows.reduce((sum, row) => sum + parseFloat(row.outstanding_amount), 0);
        const summary = {
            totalStudents: result.rows.length,
            totalOutstandingAmount: totalOutstanding,
            averageOutstanding: result.rows.length > 0 ? totalOutstanding / result.rows.length : 0,
            criticalOverdue: result.rows.filter((row) => parseInt(row.days_overdue) > 30).length,
        };
        const outstandingDues = result.rows.map((row) => ({
            studentId: row.student_id,
            studentNumber: row.student_number,
            studentName: `${row.first_name} ${row.last_name}`,
            email: row.email,
            phone: row.phone,
            className: `${row.class_name} (${row.grade}-${row.section})`,
            feeCategoryName: row.fee_category_name,
            totalAmount: parseFloat(row.total_amount),
            paidAmount: parseFloat(row.paid_amount),
            outstandingAmount: parseFloat(row.outstanding_amount),
            dueDate: row.due_date,
            daysOverdue: parseInt(row.days_overdue),
            status: row.status,
            urgencyLevel: parseInt(row.days_overdue) > 60 ? 'critical' :
                parseInt(row.days_overdue) > 30 ? 'high' :
                    parseInt(row.days_overdue) > 0 ? 'medium' : 'low',
        }));
        return {
            summary,
            outstandingDues,
            generatedAt: new Date().toISOString(),
            filters: { classId, feeCategoryId, daysOverdue: parseInt(daysOverdue) },
        };
    }
    async getFeeDefaultersReport(filters, userId, userRole) {
        const { minOutstandingAmount = 0, minDaysOverdue = 30 } = filters;
        let whereClause = `WHERE sf.status IN ('overdue') 
                       AND sf.due_date <= CURRENT_DATE - INTERVAL '${minDaysOverdue} days'`;
        const queryParams = [];
        whereClause = this.addAuthorizationFilters(whereClause, queryParams, userId, userRole);
        const result = await this.executeQuery(`SELECT 
         s.id as student_id,
         s.student_id as student_number,
         u.first_name,
         u.last_name,
         u.email,
         u.phone,
         c.name as class_name,
         c.grade,
         c.section,
         COUNT(sf.id) as overdue_fees_count,
         SUM(sf.amount) as total_fee_amount,
         SUM(COALESCE(p.paid_amount, 0)) as total_paid_amount,
         SUM(sf.amount) - SUM(COALESCE(p.paid_amount, 0)) as total_outstanding,
         MIN(sf.due_date) as earliest_due_date,
         MAX(CURRENT_DATE - sf.due_date) as max_days_overdue,
         STRING_AGG(fc.name, ', ') as fee_categories
       FROM student_fees sf
       JOIN students s ON sf.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON s.class_id = c.id
       JOIN fee_categories fc ON sf.fee_category_id = fc.id
       LEFT JOIN (
         SELECT student_fee_id, SUM(amount) as paid_amount
         FROM payments
         GROUP BY student_fee_id
       ) p ON sf.id = p.student_fee_id
       ${whereClause}
       GROUP BY s.id, s.student_id, u.first_name, u.last_name, u.email, u.phone,
                c.name, c.grade, c.section
       HAVING SUM(sf.amount) - SUM(COALESCE(p.paid_amount, 0)) >= $${queryParams.length + 1}
       ORDER BY total_outstanding DESC, max_days_overdue DESC`, [...queryParams, minOutstandingAmount]);
        const defaulters = result.rows.map((row) => ({
            studentId: row.student_id,
            studentNumber: row.student_number,
            studentName: `${row.first_name} ${row.last_name}`,
            email: row.email,
            phone: row.phone,
            className: `${row.class_name} (${row.grade}-${row.section})`,
            overdueFeesCount: parseInt(row.overdue_fees_count),
            totalFeeAmount: parseFloat(row.total_fee_amount),
            totalPaidAmount: parseFloat(row.total_paid_amount),
            totalOutstanding: parseFloat(row.total_outstanding),
            earliestDueDate: row.earliest_due_date,
            maxDaysOverdue: parseInt(row.max_days_overdue),
            feeCategories: row.fee_categories,
            riskLevel: parseFloat(row.total_outstanding) > 10000 ? 'high' :
                parseFloat(row.total_outstanding) > 5000 ? 'medium' : 'low',
        }));
        const totalDefaulters = defaulters.length;
        const totalOutstandingAmount = defaulters.reduce((sum, d) => sum + d.totalOutstanding, 0);
        return {
            summary: {
                totalDefaulters,
                totalOutstandingAmount,
                averageOutstanding: totalDefaulters > 0 ? totalOutstandingAmount / totalDefaulters : 0,
                highRiskDefaulters: defaulters.filter((d) => d.riskLevel === 'high').length,
            },
            defaulters,
            generatedAt: new Date().toISOString(),
            criteria: {
                minOutstandingAmount: parseFloat(minOutstandingAmount),
                minDaysOverdue: parseInt(minDaysOverdue),
            },
        };
    }
    async getPaymentAnalysisReport(filters, userId, userRole) {
        const { period = 'month', classId, feeCategoryId } = filters;
        const { startDate, endDate } = this.calculateDateRange(period);
        let whereClause = 'WHERE p.payment_date BETWEEN $1 AND $2';
        const queryParams = [startDate, endDate];
        whereClause = this.addAuthorizationFilters(whereClause, queryParams, userId, userRole);
        if (classId) {
            whereClause += ` AND s.class_id = $${queryParams.length + 1}`;
            queryParams.push(classId);
        }
        if (feeCategoryId) {
            whereClause += ` AND sf.fee_category_id = $${queryParams.length + 1}`;
            queryParams.push(feeCategoryId);
        }
        const [trendsResult, methodAnalysisResult, categoryPerformanceResult, overallStats] = await Promise.all([
            this.getPaymentTrends(whereClause, queryParams),
            this.getPaymentMethodAnalysis(whereClause, queryParams),
            this.getCategoryPerformance(whereClause, queryParams),
            this.getOverallPaymentStats(whereClause, queryParams)
        ]);
        const stats = overallStats.rows[0];
        return {
            period: period,
            dateRange: { startDate, endDate },
            overview: {
                totalPayments: parseInt(stats.total_payments),
                totalAmount: parseFloat(stats.total_amount) || 0,
                averagePayment: parseFloat(stats.average_payment) || 0,
                uniqueStudents: parseInt(stats.unique_students),
                feeCategoriesPaid: parseInt(stats.fee_categories_paid),
            },
            trends: trendsResult.rows.map((row) => ({
                date: row.payment_date,
                paymentCount: parseInt(row.payment_count),
                totalAmount: parseFloat(row.total_amount),
                uniqueStudents: parseInt(row.unique_students),
                averagePayment: parseFloat(row.average_payment),
            })),
            paymentMethods: methodAnalysisResult.rows.map((row) => ({
                method: row.payment_method,
                paymentCount: parseInt(row.payment_count),
                totalAmount: parseFloat(row.total_amount),
                averageAmount: parseFloat(row.average_amount),
                minAmount: parseFloat(row.min_amount),
                maxAmount: parseFloat(row.max_amount),
            })),
            categoryPerformance: categoryPerformanceResult.rows.map((row) => ({
                categoryName: row.fee_category_name,
                paymentCount: parseInt(row.payment_count),
                totalCollected: parseFloat(row.total_collected),
                studentsPaid: parseInt(row.students_paid),
                averagePayment: parseFloat(row.average_payment),
            })),
            generatedAt: new Date().toISOString(),
        };
    }
    async exportFeeReportData(format, reportType, filters, userId) {
        if (!['csv', 'json', 'excel'].includes(format)) {
            throw new errorHandler_1.AppError('Invalid export format. Supported formats: csv, json, excel', 400);
        }
        let exportData = [];
        switch (reportType) {
            case 'collection':
                exportData = await this.generateCollectionExportData(filters, userId);
                break;
            case 'outstanding':
                exportData = await this.generateOutstandingExportData(filters, userId);
                break;
            case 'defaulters':
                exportData = await this.generateDefaultersExportData(filters, userId);
                break;
            default:
                exportData = await this.generateCollectionExportData(filters, userId);
        }
        if (format === 'json') {
            return {
                data: exportData,
                exportInfo: {
                    format: 'json',
                    reportType,
                    recordCount: exportData.length,
                    generatedAt: new Date().toISOString(),
                },
            };
        }
        else {
            const csvData = this.convertToCSV(exportData);
            return {
                csvData,
                filename: `fee_report_${reportType}_${Date.now()}.${format === 'excel' ? 'xls' : 'csv'}`,
                mimeType: format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv',
            };
        }
    }
    addAuthorizationFilters(whereClause, queryParams, userId, userRole) {
        if (this.schoolId) {
            whereClause += ` AND sf.school_id = $${queryParams.length + 1}`;
            queryParams.push(this.schoolId);
        }
        if (userRole === 'teacher') {
            whereClause += ` AND (c.teacher_id = $${queryParams.length + 1} OR EXISTS (
        SELECT 1 FROM class_subjects cs
        WHERE cs.class_id = c.id AND cs.teacher_id = $${queryParams.length + 1}
      ))`;
            queryParams.push(userId);
        }
        return whereClause;
    }
    addOptionalFilters(whereClause, queryParams, reportQuery) {
        if (reportQuery.classId) {
            whereClause += ` AND s.class_id = $${queryParams.length + 1}`;
            queryParams.push(reportQuery.classId);
        }
        if (reportQuery.feeCategoryId) {
            whereClause += ` AND sf.fee_category_id = $${queryParams.length + 1}`;
            queryParams.push(reportQuery.feeCategoryId);
        }
        if (reportQuery.status) {
            whereClause += ` AND sf.status = $${queryParams.length + 1}`;
            queryParams.push(reportQuery.status);
        }
        return whereClause;
    }
    async generateStudentFeeReport(whereClause, queryParams, reportQuery) {
        const result = await this.executeQuery(`SELECT 
         s.id as student_id,
         s.student_id as student_number,
         u.first_name,
         u.last_name,
         c.name as class_name,
         c.grade,
         c.section,
         fc.name as fee_category_name,
         sf.amount as fee_amount,
         sf.amount as total_amount,
         sf.status,
         sf.due_date,
         COALESCE(SUM(p.amount), 0) as paid_amount,
         MAX(p.payment_date) as last_payment_date
       FROM student_fees sf
       JOIN students s ON sf.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON s.class_id = c.id
       JOIN fee_categories fc ON sf.fee_category_id = fc.id
       LEFT JOIN payments p ON sf.id = p.student_fee_id
       ${whereClause}
       GROUP BY s.id, s.student_id, u.first_name, u.last_name, c.name, c.grade, c.section,
                fc.name, sf.amount, sf.status, sf.due_date
       ORDER BY u.first_name, u.last_name, fc.name`, queryParams);
        return result.rows.map((row) => ({
            studentId: row.student_id,
            studentName: `${row.first_name} ${row.last_name}`,
            className: `${row.class_name} (${row.grade}-${row.section})`,
            feeCategoryName: row.fee_category_name,
            totalAmount: parseFloat(row.total_amount),
            paidAmount: parseFloat(row.paid_amount),
            pendingAmount: parseFloat(row.total_amount) - parseFloat(row.paid_amount),
            status: row.status,
            dueDate: row.due_date,
            lastPaymentDate: row.last_payment_date,
        }));
    }
    async generateClassFeeReport(whereClause, queryParams, reportQuery) {
        const result = await this.executeQuery(`SELECT 
         c.id as class_id,
         c.name as class_name,
         c.grade,
         c.section,
         COUNT(DISTINCT s.id) as total_students,
         COUNT(sf.id) as total_fees,
         SUM(sf.amount) as total_amount,
         SUM(COALESCE(p.paid_amount, 0)) as total_paid,
         SUM(sf.amount) - SUM(COALESCE(p.paid_amount, 0)) as total_pending,
         ROUND(
           (SUM(COALESCE(p.paid_amount, 0)) / NULLIF(SUM(sf.amount), 0)) * 100, 
           2
         ) as collection_percentage
       FROM student_fees sf
       JOIN students s ON sf.student_id = s.id
       JOIN classes c ON s.class_id = c.id
       LEFT JOIN (
         SELECT student_fee_id, SUM(amount) as paid_amount
         FROM payments
         GROUP BY student_fee_id
       ) p ON sf.id = p.student_fee_id
       ${whereClause}
       GROUP BY c.id, c.name, c.grade, c.section
       ORDER BY c.grade, c.section`, queryParams);
        return result.rows.map((row) => ({
            classId: row.class_id,
            className: row.class_name,
            grade: row.grade,
            section: row.section,
            totalStudents: parseInt(row.total_students),
            totalFees: parseInt(row.total_fees),
            totalAmount: parseFloat(row.total_amount) || 0,
            totalPaid: parseFloat(row.total_paid) || 0,
            totalPending: parseFloat(row.total_pending) || 0,
            collectionPercentage: parseFloat(row.collection_percentage) || 0,
        }));
    }
    async generateCategoryFeeReport(whereClause, queryParams, reportQuery) {
        const result = await this.executeQuery(`SELECT 
         fc.id as fee_category_id,
         fc.name as fee_category_name,
         fc.frequency,
         fc.amount as category_amount,
         COUNT(sf.id) as total_assignments,
         COUNT(DISTINCT s.id) as unique_students,
         SUM(sf.amount) as total_amount,
         SUM(COALESCE(p.paid_amount, 0)) as total_paid,
         SUM(sf.amount) - SUM(COALESCE(p.paid_amount, 0)) as total_pending,
         COUNT(CASE WHEN sf.status = 'paid' THEN 1 END) as paid_count,
         COUNT(CASE WHEN sf.status = 'partial' THEN 1 END) as partial_count,
         COUNT(CASE WHEN sf.status = 'pending' THEN 1 END) as pending_count,
         COUNT(CASE WHEN sf.status = 'overdue' THEN 1 END) as overdue_count,
         ROUND(
           (SUM(COALESCE(p.paid_amount, 0)) / NULLIF(SUM(sf.amount), 0)) * 100, 
           2
         ) as collection_percentage
       FROM student_fees sf
       JOIN students s ON sf.student_id = s.id
       JOIN fee_categories fc ON sf.fee_category_id = fc.id
       LEFT JOIN (
         SELECT student_fee_id, SUM(amount) as paid_amount
         FROM payments
         GROUP BY student_fee_id
       ) p ON sf.id = p.student_fee_id
       ${whereClause}
       GROUP BY fc.id, fc.name, fc.frequency, fc.amount
       ORDER BY fc.name`, queryParams);
        return result.rows.map((row) => ({
            feeCategoryId: row.fee_category_id,
            feeCategoryName: row.fee_category_name,
            frequency: row.frequency,
            categoryAmount: parseFloat(row.category_amount),
            totalAssignments: parseInt(row.total_assignments),
            uniqueStudents: parseInt(row.unique_students),
            totalAmount: parseFloat(row.total_amount) || 0,
            totalPaid: parseFloat(row.total_paid) || 0,
            totalPending: parseFloat(row.total_pending) || 0,
            collectionPercentage: parseFloat(row.collection_percentage) || 0,
            statusBreakdown: {
                paid: parseInt(row.paid_count),
                partial: parseInt(row.partial_count),
                pending: parseInt(row.pending_count),
                overdue: parseInt(row.overdue_count),
            },
        }));
    }
    async generateDateFeeReport(whereClause, queryParams, reportQuery) {
        const result = await this.executeQuery(`SELECT 
         DATE(sf.created_at) as assignment_date,
         COUNT(sf.id) as fees_assigned,
         SUM(sf.amount) as total_assigned_amount,
         COUNT(DISTINCT s.id) as students_assigned,
         COALESCE(payment_data.payment_count, 0) as payments_received,
         COALESCE(payment_data.payment_amount, 0) as total_payment_amount
       FROM student_fees sf
       JOIN students s ON sf.student_id = s.id
       JOIN classes c ON s.class_id = c.id
       LEFT JOIN (
         SELECT 
           DATE(p.payment_date) as payment_date,
           COUNT(p.id) as payment_count,
           SUM(p.amount) as payment_amount
         FROM payments p
         JOIN student_fees sf2 ON p.student_fee_id = sf2.id
         JOIN students s2 ON sf2.student_id = s2.id
         JOIN classes c2 ON s2.class_id = c2.id
         WHERE p.payment_date BETWEEN $1 AND $2
         GROUP BY DATE(p.payment_date)
       ) payment_data ON DATE(sf.created_at) = payment_data.payment_date
       ${whereClause}
       GROUP BY DATE(sf.created_at), payment_data.payment_count, payment_data.payment_amount
       ORDER BY assignment_date`, queryParams);
        return result.rows.map((row) => ({
            date: row.assignment_date,
            feesAssigned: parseInt(row.fees_assigned),
            totalAssignedAmount: parseFloat(row.total_assigned_amount) || 0,
            studentsAssigned: parseInt(row.students_assigned),
            paymentsReceived: parseInt(row.payments_received),
            totalPaymentAmount: parseFloat(row.total_payment_amount) || 0,
        }));
    }
    async calculateFeeSummary(whereClause, queryParams) {
        const result = await this.executeQuery(`SELECT 
         COUNT(DISTINCT s.id) as total_students,
         COUNT(sf.id) as total_fees,
         SUM(sf.amount) as total_amount,
         SUM(COALESCE(p.paid_amount, 0)) as total_paid,
         SUM(sf.amount) - SUM(COALESCE(p.paid_amount, 0)) as total_pending,
         COUNT(CASE WHEN sf.status = 'paid' THEN 1 END) as paid_count,
         COUNT(CASE WHEN sf.status = 'partial' THEN 1 END) as partial_count,
         COUNT(CASE WHEN sf.status = 'pending' THEN 1 END) as pending_count,
         COUNT(CASE WHEN sf.status = 'overdue' THEN 1 END) as overdue_count,
         ROUND(
           (SUM(COALESCE(p.paid_amount, 0)) / NULLIF(SUM(sf.amount), 0)) * 100, 
           2
         ) as collection_percentage
       FROM student_fees sf
       JOIN students s ON sf.student_id = s.id
       JOIN classes c ON s.class_id = c.id
       LEFT JOIN (
         SELECT student_fee_id, SUM(amount) as paid_amount
         FROM payments
         GROUP BY student_fee_id
       ) p ON sf.id = p.student_fee_id
       ${whereClause}`, queryParams);
        const summary = result.rows[0];
        return {
            totalStudents: parseInt(summary.total_students),
            totalAmount: parseFloat(summary.total_amount) || 0,
            totalPaid: parseFloat(summary.total_paid) || 0,
            totalPending: parseFloat(summary.total_pending) || 0,
            collectionPercentage: parseFloat(summary.collection_percentage) || 0,
            statusBreakdown: {
                paid: parseInt(summary.paid_count),
                partial: parseInt(summary.partial_count),
                pending: parseInt(summary.pending_count),
                overdue: parseInt(summary.overdue_count),
            },
        };
    }
    calculateDateRange(period) {
        const today = new Date();
        let startDate;
        let endDate;
        switch (period) {
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                startDate = weekStart.toISOString().split('T')[0];
                endDate = today.toISOString().split('T')[0];
                break;
            case 'month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                endDate = today.toISOString().split('T')[0];
                break;
            case 'quarter':
                const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
                startDate = quarterStart.toISOString().split('T')[0];
                endDate = today.toISOString().split('T')[0];
                break;
            case 'year':
                startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
                endDate = today.toISOString().split('T')[0];
                break;
            default:
                startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                endDate = today.toISOString().split('T')[0];
        }
        return { startDate, endDate };
    }
    async getPaymentTrends(whereClause, queryParams) {
        return await this.executeQuery(`SELECT 
         DATE(p.payment_date) as payment_date,
         COUNT(p.id) as payment_count,
         SUM(p.amount) as total_amount,
         COUNT(DISTINCT sf.student_id) as unique_students,
         AVG(p.amount) as average_payment
       FROM payments p
       JOIN student_fees sf ON p.student_fee_id = sf.id
       JOIN students s ON sf.student_id = s.id
       JOIN classes c ON s.class_id = c.id
       ${whereClause}
       GROUP BY DATE(p.payment_date)
       ORDER BY payment_date`, queryParams);
    }
    async getPaymentMethodAnalysis(whereClause, queryParams) {
        return await this.executeQuery(`SELECT 
         p.payment_method,
         COUNT(p.id) as payment_count,
         SUM(p.amount) as total_amount,
         AVG(p.amount) as average_amount,
         MIN(p.amount) as min_amount,
         MAX(p.amount) as max_amount
       FROM payments p
       JOIN student_fees sf ON p.student_fee_id = sf.id
       JOIN students s ON sf.student_id = s.id
       JOIN classes c ON s.class_id = c.id
       ${whereClause}
       GROUP BY p.payment_method
       ORDER BY total_amount DESC`, queryParams);
    }
    async getCategoryPerformance(whereClause, queryParams) {
        return await this.executeQuery(`SELECT 
         fc.name as fee_category_name,
         COUNT(p.id) as payment_count,
         SUM(p.amount) as total_collected,
         COUNT(DISTINCT sf.student_id) as students_paid,
         AVG(p.amount) as average_payment
       FROM payments p
       JOIN student_fees sf ON p.student_fee_id = sf.id
       JOIN students s ON sf.student_id = s.id
       JOIN classes c ON s.class_id = c.id
       JOIN fee_categories fc ON sf.fee_category_id = fc.id
       ${whereClause}
       GROUP BY fc.id, fc.name
       ORDER BY total_collected DESC`, queryParams);
    }
    async getOverallPaymentStats(whereClause, queryParams) {
        return await this.executeQuery(`SELECT 
         COUNT(p.id) as total_payments,
         SUM(p.amount) as total_amount,
         AVG(p.amount) as average_payment,
         COUNT(DISTINCT sf.student_id) as unique_students,
         COUNT(DISTINCT sf.fee_category_id) as fee_categories_paid
       FROM payments p
       JOIN student_fees sf ON p.student_fee_id = sf.id
       JOIN students s ON sf.student_id = s.id
       JOIN classes c ON s.class_id = c.id
       ${whereClause}`, queryParams);
    }
    async generateCollectionExportData(filters, userId) {
        const result = await this.executeQuery(`SELECT 
         s.student_id as "Student ID",
         u.first_name || ' ' || u.last_name as "Student Name",
         c.name || ' (' || c.grade || '-' || c.section || ')' as "Class",
         fc.name as "Fee Category",
         sf.amount as "Total Amount",
         COALESCE(SUM(p.amount), 0) as "Paid Amount",
         sf.amount - COALESCE(SUM(p.amount), 0) as "Pending Amount",
         sf.status as "Status",
         sf.due_date as "Due Date"
       FROM student_fees sf
       JOIN students s ON sf.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON s.class_id = c.id
       JOIN fee_categories fc ON sf.fee_category_id = fc.id
       LEFT JOIN payments p ON sf.id = p.student_fee_id
       WHERE sf.created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY s.student_id, u.first_name, u.last_name, c.name, c.grade, c.section,
                fc.name, sf.amount, sf.status, sf.due_date
       ORDER BY u.first_name, u.last_name`);
        return result.rows;
    }
    async generateOutstandingExportData(filters, userId) {
        const result = await this.executeQuery(`SELECT 
         s.student_id as "Student ID",
         u.first_name || ' ' || u.last_name as "Student Name",
         u.email as "Email",
         u.phone as "Phone",
         c.name || ' (' || c.grade || '-' || c.section || ')' as "Class",
         fc.name as "Fee Category",
         sf.amount - COALESCE(SUM(p.amount), 0) as "Outstanding Amount",
         sf.due_date as "Due Date",
         CURRENT_DATE - sf.due_date as "Days Overdue"
       FROM student_fees sf
       JOIN students s ON sf.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON s.class_id = c.id
       JOIN fee_categories fc ON sf.fee_category_id = fc.id
       LEFT JOIN payments p ON sf.id = p.student_fee_id
       WHERE sf.status IN ('pending', 'partial', 'overdue')
       GROUP BY s.student_id, u.first_name, u.last_name, u.email, u.phone,
                c.name, c.grade, c.section, fc.name, sf.amount, sf.due_date
       HAVING sf.amount - COALESCE(SUM(p.amount), 0) > 0
       ORDER BY sf.due_date ASC`);
        return result.rows;
    }
    async generateDefaultersExportData(filters, userId) {
        const result = await this.executeQuery(`SELECT 
         s.student_id as "Student ID",
         u.first_name || ' ' || u.last_name as "Student Name",
         u.email as "Email",
         u.phone as "Phone",
         c.name || ' (' || c.grade || '-' || c.section || ')' as "Class",
         COUNT(sf.id) as "Overdue Fees Count",
         SUM(sf.amount) - SUM(COALESCE(p.paid_amount, 0)) as "Total Outstanding",
         MIN(sf.due_date) as "Earliest Due Date",
         MAX(CURRENT_DATE - sf.due_date) as "Max Days Overdue"
       FROM student_fees sf
       JOIN students s ON sf.student_id = s.id
       JOIN users u ON s.user_id = u.id
       JOIN classes c ON s.class_id = c.id
       LEFT JOIN (
         SELECT student_fee_id, SUM(amount) as paid_amount
         FROM payments
         GROUP BY student_fee_id
       ) p ON sf.id = p.student_fee_id
       WHERE sf.status = 'overdue'
       GROUP BY s.student_id, u.first_name, u.last_name, u.email, u.phone,
                c.name, c.grade, c.section
       HAVING SUM(sf.amount) - SUM(COALESCE(p.paid_amount, 0)) > 0
       ORDER BY "Total Outstanding" DESC`);
        return result.rows;
    }
    convertToCSV(data) {
        if (data.length === 0)
            return '';
        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        const csvRows = data.map(row => headers.map(header => {
            const value = row[header];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(','));
        return [csvHeaders, ...csvRows].join('\n');
    }
}
exports.FeeReportService = FeeReportService;
//# sourceMappingURL=feeReportService.js.map