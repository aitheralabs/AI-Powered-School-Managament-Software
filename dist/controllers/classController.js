"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeStudentFromClass = exports.getClassStats = exports.getClassSubjects = exports.getClassStudents = exports.transferStudent = exports.bulkEnrollStudentsToClass = exports.enrollStudentToClass = exports.getClassStatistics = exports.removeSubjectFromClass = exports.assignSubjectToClass = exports.deleteClass = exports.updateClass = exports.getClassById = exports.getClasses = exports.createClass = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const classService_1 = require("../services/classService");
const connection_1 = require("../database/connection");
const classService = new classService_1.ClassService();
exports.createClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const classInfo = await classService.forSchool(req.schoolId).createClass(req.body);
    res.status(201).json({ success: true, message: 'Class created successfully', data: { class: classInfo } });
});
exports.getClasses = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await classService.forSchool(req.schoolId).getClasses(req);
    res.json({ success: true, data: result });
});
exports.getClassById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const classInfo = await classService.forSchool(req.schoolId).getClassById(req.params.id);
    res.json({ success: true, data: { class: classInfo } });
});
exports.updateClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const classInfo = await classService.forSchool(req.schoolId).updateClass(req.params.id, req.body);
    res.json({ success: true, message: 'Class updated successfully', data: { class: classInfo } });
});
exports.deleteClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await classService.forSchool(req.schoolId).deleteClass(req.params.id);
    res.json({ success: true, message: 'Class deleted successfully' });
});
exports.assignSubjectToClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const svc = classService.forSchool(req.schoolId);
    const result = await svc.assignSubjectToClass(req.params.id, req.body.subjectId, req.body.teacherId);
    res.status(201).json({ success: true, message: 'Subject assigned to class successfully', data: result });
});
exports.removeSubjectFromClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const svc = classService.forSchool(req.schoolId);
    await svc.removeSubjectFromClass(req.params.id, req.params.subjectId);
    res.json({ success: true, message: 'Subject removed from class successfully' });
});
exports.getClassStatistics = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const svc = classService.forSchool(req.schoolId);
    const result = await svc.getClassStatistics(req.params.id);
    res.json({ success: true, data: result });
});
exports.enrollStudentToClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const svc = classService.forSchool(req.schoolId);
    const result = await svc.enrollStudentToClass(req.params.id, req.body.studentId);
    res.status(201).json({ success: true, message: 'Student enrolled to class successfully', data: result });
});
exports.bulkEnrollStudentsToClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const svc = classService.forSchool(req.schoolId);
    const result = await svc.bulkEnrollStudentsToClass(req.params.id, req.body.studentIds);
    res.status(201).json({ success: true, message: 'Students enrolled to class successfully', data: result });
});
exports.transferStudent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const svc = classService.forSchool(req.schoolId);
    const result = await svc.transferStudent(req.body.studentId, req.body.targetClassId);
    res.json({ success: true, message: 'Student transferred successfully', data: result });
});
exports.getClassStudents = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const svc = classService.forSchool(req.schoolId);
    const result = await svc.getClassStudents(req.params.id);
    res.json({ success: true, data: result });
});
exports.getClassSubjects = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const svc = classService.forSchool(req.schoolId);
    const result = await svc.getClassSubjects(req.params.id);
    res.json({ success: true, data: result });
});
exports.getClassStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const schoolId = req.schoolId;
    const [totalRes, activeRes, capacityRes] = await Promise.all([
        (0, connection_1.query)(`SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE is_active = true)  AS active,
              COUNT(*) FILTER (WHERE is_active = false) AS inactive
       FROM classes WHERE school_id = $1`, [schoolId]),
        (0, connection_1.query)(`SELECT c.name, COUNT(s.id) AS student_count, c.capacity
       FROM classes c
       LEFT JOIN students s ON s.class_id = c.id AND s.is_active = true
       WHERE c.school_id = $1 AND c.is_active = true
       GROUP BY c.id, c.name, c.capacity
       ORDER BY student_count DESC
       LIMIT 5`, [schoolId]),
        (0, connection_1.query)(`SELECT
         COALESCE(SUM(capacity), 0) AS total_capacity,
         COUNT(DISTINCT s.id) AS total_students
       FROM classes c
       LEFT JOIN students s ON s.class_id = c.id AND s.is_active = true
       WHERE c.school_id = $1 AND c.is_active = true`, [schoolId]),
    ]);
    const r = totalRes.rows[0];
    const cap = capacityRes.rows[0];
    const totalCapacity = parseInt(cap.total_capacity, 10);
    const totalStudents = parseInt(cap.total_students, 10);
    res.json({
        success: true,
        data: {
            total: parseInt(r.total, 10),
            active: parseInt(r.active, 10),
            inactive: parseInt(r.inactive, 10),
            totalCapacity,
            totalStudents,
            occupancyRate: totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0,
            topClasses: activeRes.rows.map((row) => ({
                name: row.name,
                studentCount: parseInt(row.student_count, 10),
                capacity: parseInt(row.capacity, 10),
            })),
        },
    });
});
exports.removeStudentFromClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const schoolId = req.schoolId;
    const { id: classId, studentId } = req.params;
    await (0, connection_1.query)(`UPDATE students SET class_id = NULL
     WHERE id = $1 AND class_id = $2 AND school_id = $3`, [studentId, classId, schoolId]);
    res.json({ success: true, message: 'Student removed from class successfully' });
});
//# sourceMappingURL=classController.js.map