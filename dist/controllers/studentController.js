"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentStats = exports.exportStudents = exports.bulkUpdateStudents = exports.getStudentsByClass = exports.getStudentClassHistory = exports.getStudentSummary = exports.deleteStudent = exports.updateStudent = exports.getStudentById = exports.getStudents = exports.createStudent = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const studentService_1 = require("../services/studentService");
const connection_1 = require("../database/connection");
const studentService = new studentService_1.StudentService();
exports.createStudent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const student = await studentService.forSchool(req.schoolId).createStudent(req.body);
    res.status(201).json({ success: true, message: 'Student created successfully', data: student });
});
exports.getStudents = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await studentService.forSchool(req.schoolId).getStudents(req);
    res.json({ success: true, data: result });
});
exports.getStudentById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const student = await studentService.forSchool(req.schoolId).getStudentById(req.params.id);
    res.json({ success: true, data: { student } });
});
exports.updateStudent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const student = await studentService.forSchool(req.schoolId).updateStudent(req.params.id, req.body);
    res.json({ success: true, message: 'Student updated successfully', data: student });
});
exports.deleteStudent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await studentService.forSchool(req.schoolId).deleteStudent(req.params.id);
    res.json({ success: true, message: 'Student deactivated successfully' });
});
exports.getStudentSummary = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const summary = await studentService.forSchool(req.schoolId).getStudentSummary(req.params.id);
    res.json({ success: true, data: summary });
});
exports.getStudentClassHistory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const history = await studentService.forSchool(req.schoolId).getStudentClassHistory(req.params.id);
    res.json({ success: true, data: history });
});
exports.getStudentsByClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { classId } = req.params;
    const { page = '1', limit = '50' } = req.query;
    const result = await studentService.forSchool(req.schoolId).getStudentsByClass(classId, {
        page: parseInt(page),
        limit: parseInt(limit),
    });
    res.json({ success: true, data: result.students, pagination: result.pagination });
});
exports.bulkUpdateStudents = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { studentIds, updateData } = req.body;
    const result = await studentService.forSchool(req.schoolId).bulkUpdateStudents(studentIds, updateData);
    res.json({ success: true, message: `Successfully updated ${result.updatedCount} students`, data: result });
});
exports.exportStudents = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const schoolId = req.schoolId;
    const format = req.query.format || 'csv';
    const result = await (0, connection_1.query)(`SELECT s.id, u.first_name, u.last_name, u.email, u.phone,
            u.date_of_birth, u.address,
            s.student_id, s.guardian_name, s.guardian_phone, s.is_active,
            c.name AS class_name, s.enrollment_date, s.created_at
     FROM students s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN classes c ON c.id = s.class_id
     WHERE s.school_id = $1
     ORDER BY u.first_name, u.last_name`, [schoolId]);
    const rows = result.rows;
    if (format === 'csv') {
        const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Date of Birth',
            'Address', 'Student ID', 'Guardian Name', 'Guardian Phone',
            'Class', 'Enrollment Date', 'Active', 'Created At'];
        const csvRows = rows.map((r) => [
            r.id, r.first_name, r.last_name, r.email || '', r.phone || '',
            r.date_of_birth ? new Date(r.date_of_birth).toISOString().split('T')[0] : '',
            `"${(r.address || '').replace(/"/g, '""')}"`,
            r.student_id || '', r.guardian_name || '', r.guardian_phone || '',
            r.class_name || '',
            r.enrollment_date ? new Date(r.enrollment_date).toISOString().split('T')[0] : '',
            r.is_active ? 'Yes' : 'No',
            new Date(r.created_at).toISOString().split('T')[0],
        ].join(','));
        const csv = [headers.join(','), ...csvRows].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="students.csv"');
        res.send(csv);
    }
    else {
        res.json({ success: true, data: rows });
    }
});
exports.getStudentStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const schoolId = req.schoolId;
    const [totalRes, newRes, genderRes, classRes] = await Promise.all([
        (0, connection_1.query)(`SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE is_active = true) AS active,
              COUNT(*) FILTER (WHERE is_active = false) AS inactive
       FROM students WHERE school_id = $1`, [schoolId]),
        (0, connection_1.query)(`SELECT COUNT(*) AS count FROM students
       WHERE school_id = $1 AND created_at >= NOW() - INTERVAL '30 days' AND is_active = true`, [schoolId]),
        (0, connection_1.query)(`SELECT gender, COUNT(*) AS count FROM students WHERE school_id = $1 AND is_active = true GROUP BY gender`, [schoolId]),
        (0, connection_1.query)(`SELECT c.name, COUNT(s.id) AS count FROM students s
       JOIN classes c ON c.id = s.class_id
       WHERE s.school_id = $1 AND s.is_active = true
       GROUP BY c.name ORDER BY count DESC LIMIT 5`, [schoolId]),
    ]);
    const genderMap = {};
    for (const row of genderRes.rows) {
        genderMap[row.gender || 'unspecified'] = parseInt(row.count, 10);
    }
    res.json({
        success: true,
        data: {
            total: parseInt(totalRes.rows[0].total, 10),
            active: parseInt(totalRes.rows[0].active, 10),
            inactive: parseInt(totalRes.rows[0].inactive, 10),
            newThisMonth: parseInt(newRes.rows[0].count, 10),
            byGender: genderMap,
            byClass: classRes.rows.map((r) => ({ class: r.name, count: parseInt(r.count, 10) })),
        },
    });
});
//# sourceMappingURL=studentController.js.map