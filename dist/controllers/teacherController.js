"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeacherSubjects = exports.getTeacherClasses = exports.getTeacherStats = exports.getOptimalTeacherSuggestions = exports.checkAssignmentConflicts = exports.getAllTeacherAssignments = exports.removeTeacherFromClassSubject = exports.assignTeacherToClassSubject = exports.removeTeacherFromClass = exports.getTeacherWorkload = exports.assignTeacherToClass = exports.removeTeacherFromSubject = exports.assignTeacherToSubject = exports.deleteTeacher = exports.updateTeacher = exports.getTeacherById = exports.getTeachers = exports.createTeacher = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const teacherService_1 = require("../services/teacherService");
const connection_1 = require("../database/connection");
const teacherService = new teacherService_1.TeacherService();
exports.createTeacher = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const teacher = await teacherService.forSchool(req.schoolId).createTeacher(req.body);
    res.status(201).json({ success: true, message: 'Teacher profile created successfully', data: teacher });
});
exports.getTeachers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await teacherService.forSchool(req.schoolId).getTeachers(req);
    res.json({ success: true, data: result.teachers, pagination: result.pagination });
});
exports.getTeacherById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const teacher = await teacherService.forSchool(req.schoolId).getTeacherById(req.params.id);
    res.json({ success: true, data: teacher });
});
exports.updateTeacher = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const teacher = await teacherService.forSchool(req.schoolId).updateTeacher(req.params.id, req.body);
    res.json({ success: true, message: 'Teacher profile updated successfully', data: teacher });
});
exports.deleteTeacher = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await teacherService.forSchool(req.schoolId).deleteTeacher(req.params.id);
    res.json({ success: true, message: 'Teacher deactivated successfully' });
});
exports.assignTeacherToSubject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { teacherId, subjectId } = req.body;
    const assignment = await teacherService.forSchool(req.schoolId).assignTeacherToSubject(teacherId, subjectId);
    res.status(201).json({ success: true, message: 'Teacher assigned to subject successfully', data: assignment });
});
exports.removeTeacherFromSubject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { teacherId, subjectId } = req.params;
    await teacherService.forSchool(req.schoolId).removeTeacherFromSubject(teacherId, subjectId);
    res.json({ success: true, message: 'Teacher removed from subject successfully' });
});
exports.assignTeacherToClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { teacherId, classId } = req.body;
    const assignment = await teacherService.forSchool(req.schoolId).assignTeacherToClass(teacherId, classId);
    res.json({ success: true, message: 'Teacher assigned to class successfully', data: assignment });
});
exports.getTeacherWorkload = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const workload = await teacherService.forSchool(req.schoolId).getTeacherWorkload(req.params.id);
    res.json({ success: true, data: workload });
});
exports.removeTeacherFromClass = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await teacherService.forSchool(req.schoolId).removeTeacherFromClass(req.params.classId);
    res.json({ success: true, message: 'Teacher removed from class successfully' });
});
exports.assignTeacherToClassSubject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { teacherId, classId, subjectId } = req.body;
    const assignment = await teacherService.forSchool(req.schoolId).assignTeacherToClassSubject(teacherId, classId, subjectId);
    res.status(201).json({ success: true, message: 'Teacher assigned to class-subject successfully', data: assignment });
});
exports.removeTeacherFromClassSubject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { classId, subjectId } = req.params;
    await teacherService.forSchool(req.schoolId).removeTeacherFromClassSubject(classId, subjectId);
    res.json({ success: true, message: 'Teacher removed from class-subject assignment successfully' });
});
exports.getAllTeacherAssignments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await teacherService.forSchool(req.schoolId).getAllTeacherAssignments(req);
    res.json({ success: true, data: result.assignments, pagination: result.pagination });
});
exports.checkAssignmentConflicts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { teacherId, classId, subjectId } = req.body;
    const conflicts = await teacherService.forSchool(req.schoolId).checkAssignmentConflicts(teacherId, classId, subjectId);
    res.json({ success: true, data: conflicts });
});
exports.getOptimalTeacherSuggestions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { classId, subjectId } = req.params;
    const suggestions = await teacherService.forSchool(req.schoolId).getOptimalTeacherSuggestions(classId, subjectId);
    res.json({ success: true, data: suggestions });
});
exports.getTeacherStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const schoolId = req.schoolId;
    const [totalRes, specializationRes, classLoadRes] = await Promise.all([
        (0, connection_1.query)(`SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE is_active = true) AS active,
              COUNT(*) FILTER (WHERE is_active = false) AS inactive
       FROM teachers WHERE school_id = $1`, [schoolId]),
        (0, connection_1.query)(`SELECT specialization AS spec, COUNT(*) AS count
       FROM teachers
       WHERE school_id = $1 AND is_active = true AND specialization IS NOT NULL AND specialization <> ''
       GROUP BY specialization ORDER BY count DESC LIMIT 5`, [schoolId]),
        (0, connection_1.query)(`SELECT AVG(class_count) AS avg_classes FROM (
         SELECT COUNT(c.id) AS class_count
         FROM teachers t
         LEFT JOIN classes c ON c.teacher_id = t.id AND c.is_active = true
         WHERE t.school_id = $1 AND t.is_active = true
         GROUP BY t.id
       ) sub`, [schoolId]),
    ]);
    res.json({
        success: true,
        data: {
            total: parseInt(totalRes.rows[0].total, 10),
            active: parseInt(totalRes.rows[0].active, 10),
            inactive: parseInt(totalRes.rows[0].inactive, 10),
            avgClassLoad: parseFloat(classLoadRes.rows[0].avg_classes ?? '0').toFixed(1),
            bySpecialization: specializationRes.rows.map((r) => ({ spec: r.spec, count: parseInt(r.count, 10) })),
        },
    });
});
exports.getTeacherClasses = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const schoolId = req.schoolId;
    const { id } = req.params;
    const result = await (0, connection_1.query)(`SELECT c.id, c.name, c.grade_level, c.section,
            COUNT(DISTINCT s.id) AS student_count
     FROM classes c
     LEFT JOIN students s ON s.class_id = c.id AND s.is_active = true
     WHERE c.teacher_id = $1 AND c.school_id = $2 AND c.is_active = true
     GROUP BY c.id, c.name, c.grade_level, c.section`, [id, schoolId]);
    res.json({ success: true, data: result.rows });
});
exports.getTeacherSubjects = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const schoolId = req.schoolId;
    const { id } = req.params;
    const result = await (0, connection_1.query)(`SELECT s.id, s.name, s.code, s.description
     FROM teacher_subjects ts
     JOIN subjects s ON s.id = ts.subject_id
     WHERE ts.teacher_id = $1 AND s.school_id = $2 AND s.is_active = true`, [id, schoolId]);
    res.json({ success: true, data: result.rows });
});
//# sourceMappingURL=teacherController.js.map