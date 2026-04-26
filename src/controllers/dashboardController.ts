import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../database/connection';
import { asyncHandler, AppError } from '../middleware/errorHandler';

// ─── Super-admin secret (mirrors superadmin.ts) ────────────────────────────
const SUPER_ADMIN_SECRET =
  process.env.SUPER_ADMIN_JWT_SECRET ||
  (process.env.JWT_SECRET ?? '') + '_superadmin';

// ─── Admin / Staff Dashboard ────────────────────────────────────────────────
export const adminDashboard = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.schoolId!;

  // Parallel stat queries
  const [
    studentsRes,
    teachersRes,
    classesRes,
    staffRes,
    attendanceRes,
    feesRes,
    recentPaymentsRes,
    recentEnrollmentsRes,
    monthlyRevenueRes,
  ] = await Promise.all([
    query(
      'SELECT COUNT(*) AS count FROM students WHERE school_id = $1 AND is_active = true',
      [schoolId]
    ),
    query(
      'SELECT COUNT(*) AS count FROM teachers WHERE school_id = $1 AND is_active = true',
      [schoolId]
    ),
    query(
      'SELECT COUNT(*) AS count FROM classes WHERE school_id = $1 AND is_active = true',
      [schoolId]
    ),
    query(
      'SELECT COUNT(*) AS count FROM staff WHERE school_id = $1 AND is_active = true',
      [schoolId]
    ),
    query(
      `SELECT status, COUNT(*) AS count
         FROM attendance
        WHERE school_id = $1 AND date = CURRENT_DATE
        GROUP BY status`,
      [schoolId]
    ),
    query(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'paid'    THEN amount END), 0) AS collected,
         COALESCE(SUM(CASE WHEN status = 'pending' THEN amount END), 0) AS pending,
         COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount END), 0) AS overdue
       FROM student_fees
       WHERE school_id = $1`,
      [schoolId]
    ),
    query(
      `SELECT
         u.first_name || ' ' || u.last_name AS student_name,
         p.amount,
         p.payment_date AS date,
         p.payment_method AS method
       FROM payments p
       JOIN student_fees sf ON sf.id = p.student_fee_id
       JOIN students s       ON s.id  = sf.student_id
       JOIN users u          ON u.id  = s.user_id
       WHERE sf.school_id = $1
       ORDER BY p.payment_date DESC
       LIMIT 5`,
      [schoolId]
    ),
    query(
      `SELECT
         u.first_name || ' ' || u.last_name AS name,
         c.name AS class,
         s.enrollment_date
       FROM students s
       JOIN users u   ON u.id = s.user_id
       JOIN classes c ON c.id = s.class_id
       WHERE s.school_id = $1
       ORDER BY s.enrollment_date DESC
       LIMIT 5`,
      [schoolId]
    ),
    query(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', p.payment_date), 'Mon YYYY') AS month,
         COALESCE(SUM(p.amount), 0) AS amount
       FROM payments p
       JOIN student_fees sf ON sf.id = p.student_fee_id
       WHERE sf.school_id = $1
         AND p.payment_date >= DATE_TRUNC('month', NOW()) - INTERVAL '11 months'
       GROUP BY DATE_TRUNC('month', p.payment_date)
       ORDER BY DATE_TRUNC('month', p.payment_date) ASC`,
      [schoolId]
    ),
  ]);

  // Attendance aggregation
  const attendanceMap: Record<string, number> = {};
  for (const row of attendanceRes.rows) {
    attendanceMap[row.status] = parseInt(row.count, 10);
  }
  const todayPresent = attendanceMap['present'] ?? 0;
  const todayAbsent  = attendanceMap['absent']  ?? 0;
  const totalMarked  = Object.values(attendanceMap).reduce((a, b) => a + b, 0);
  const todayPercentage =
    totalMarked > 0 ? Math.round((todayPresent / totalMarked) * 100) : 0;

  // Fees
  const feesRow = feesRes.rows[0];
  const totalCollected = parseFloat(feesRow.collected);
  const totalPending   = parseFloat(feesRow.pending);
  const totalOverdue   = parseFloat(feesRow.overdue);
  const totalFees      = totalCollected + totalPending + totalOverdue;
  const collectionRate =
    totalFees > 0 ? Math.round((totalCollected / totalFees) * 100) : 0;

  res.json({
    success: true,
    data: {
      stats: {
        totalStudents: parseInt(studentsRes.rows[0].count, 10),
        totalTeachers: parseInt(teachersRes.rows[0].count, 10),
        totalClasses:  parseInt(classesRes.rows[0].count, 10),
        totalStaff:    parseInt(staffRes.rows[0].count, 10),
      },
      attendance: {
        todayPresent,
        todayAbsent,
        todayPercentage,
        totalMarked,
      },
      fees: {
        totalCollected,
        totalPending,
        totalOverdue,
        collectionRate,
      },
      recentPayments: recentPaymentsRes.rows,
      recentEnrollments: recentEnrollmentsRes.rows,
      monthlyRevenue: monthlyRevenueRes.rows.map((r: Record<string, string>) => ({
        month:  r.month,
        amount: parseFloat(r.amount),
      })),
    },
  });
});

// ─── Teacher Dashboard ───────────────────────────────────────────────────────
export const teacherDashboard = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.schoolId!;
  const userId   = req.user!.id;

  // Resolve teacher record
  const teacherRes = await query(
    `SELECT t.id, t.employee_id, t.specialization, u.first_name || ' ' || u.last_name AS name
       FROM teachers t
       JOIN users u ON u.id = t.user_id
      WHERE t.user_id = $1 AND t.school_id = $2`,
    [userId, schoolId]
  );

  if (teacherRes.rows.length === 0) {
    throw new AppError('Teacher profile not found', 404);
  }

  const teacher = teacherRes.rows[0];

  const [
    myClassesRes,
    markedTodayRes,
    thisWeekRes,
    pendingClassesRes,
    recentGradesRes,
    totalStudentsRes,
    subjectsRes,
    avgAttendanceRes,
  ] = await Promise.all([
    query(
      `SELECT c.id, c.name, c.grade,
              COUNT(DISTINCT s.id) AS student_count
         FROM classes c
         LEFT JOIN students s ON s.class_id = c.id AND s.is_active = true
        WHERE c.teacher_id = $1 AND c.school_id = $2 AND c.is_active = true
        GROUP BY c.id, c.name, c.grade`,
      [teacher.id, schoolId]
    ),
    query(
      `SELECT COUNT(DISTINCT a.class_id) AS count
         FROM attendance a
        WHERE a.marked_by = $1
          AND a.school_id = $2
          AND a.date = CURRENT_DATE`,
      [userId, schoolId]
    ),
    query(
      `SELECT COUNT(*) AS count
         FROM attendance a
        WHERE a.marked_by = $1
          AND a.school_id = $2
          AND a.date >= DATE_TRUNC('week', CURRENT_DATE)`,
      [userId, schoolId]
    ),
    query(
      `SELECT COUNT(*) AS count
         FROM classes c
        WHERE c.teacher_id = $1
          AND c.school_id = $2
          AND c.is_active = true
          AND c.id NOT IN (
            SELECT DISTINCT a.class_id
              FROM attendance a
             WHERE a.marked_by = $1
               AND a.date = CURRENT_DATE
          )`,
      [teacher.id, schoolId]
    ),
    query(
      `SELECT g.marks_obtained AS score, g.percentage, g.grade_letter AS grade, g.created_at AS date,
              sub.name AS subject,
              u.first_name || ' ' || u.last_name AS student_name
         FROM grades g
         JOIN subjects sub ON sub.id = g.subject_id
         JOIN students st  ON st.id  = g.student_id
         JOIN users u      ON u.id   = st.user_id
        WHERE g.recorded_by = $1 AND g.school_id = $2
        ORDER BY g.created_at DESC
        LIMIT 10`,
      [userId, schoolId]
    ),
    query(
      `SELECT COUNT(DISTINCT s.id) AS count
         FROM students s
         JOIN classes c ON c.id = s.class_id
        WHERE c.teacher_id = $1 AND c.school_id = $2 AND s.is_active = true`,
      [teacher.id, schoolId]
    ),
    query(
      `SELECT COUNT(DISTINCT ts.subject_id) AS count
         FROM teacher_subjects ts
        WHERE ts.teacher_id = $1`,
      [teacher.id]
    ),
    query(
      `SELECT ROUND(
         100.0 * COUNT(*) FILTER (WHERE a.status = 'present') / NULLIF(COUNT(*), 0)
       , 1) AS avg_attendance
         FROM attendance a
         JOIN classes c ON c.id = a.class_id
        WHERE c.teacher_id = $1
          AND a.school_id  = $2
          AND a.date >= NOW() - INTERVAL '30 days'`,
      [teacher.id, schoolId]
    ),
  ]);

  const markedToday     = parseInt(markedTodayRes.rows[0].count, 10) > 0;
  const thisWeekCount   = parseInt(thisWeekRes.rows[0].count, 10);
  const pendingClasses  = parseInt(pendingClassesRes.rows[0].count, 10);
  const totalStudents   = parseInt(totalStudentsRes.rows[0].count, 10);
  const classesCount    = myClassesRes.rows.length;
  const subjectsCount   = parseInt(subjectsRes.rows[0].count, 10);
  const avgAttendance   = parseFloat(avgAttendanceRes.rows[0].avg_attendance ?? '0');

  res.json({
    success: true,
    data: {
      teacher: {
        name:           teacher.name,
        employeeId:     teacher.employee_id,
        specialization: teacher.specialization ?? [],
      },
      myClasses: myClassesRes.rows.map((r: Record<string, string>) => ({
        id:           r.id,
        name:         r.name,
        gradeLevel:   r.grade,
        studentCount: parseInt(r.student_count, 10),
      })),
      attendanceSummary: {
        markedToday,
        thisWeek:       thisWeekCount,
        pendingClasses,
      },
      recentGrades: recentGradesRes.rows,
      stats: {
        totalStudents,
        classesCount,
        subjectsCount,
        avgAttendance,
      },
    },
  });
});

// ─── Student Dashboard ───────────────────────────────────────────────────────
export const studentDashboard = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.schoolId!;
  const userId   = req.user!.id;

  // Resolve student record
  const studentRes = await query(
    `SELECT s.id, s.student_id, s.enrollment_date,
            u.first_name || ' ' || u.last_name AS name,
            c.name AS class_name
       FROM students s
       JOIN users u   ON u.id = s.user_id
       LEFT JOIN classes c ON c.id = s.class_id
      WHERE s.user_id = $1 AND s.school_id = $2`,
    [userId, schoolId]
  );

  if (studentRes.rows.length === 0) {
    throw new AppError('Student profile not found', 404);
  }

  const student = studentRes.rows[0];

  const [
    attendanceRes,
    feesRes,
    recentGradesRes,
  ] = await Promise.all([
    query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'present') AS present,
         COUNT(*) FILTER (WHERE status = 'absent')  AS absent,
         COUNT(*) FILTER (WHERE status = 'late')    AS late,
         COUNT(*) AS total_days
       FROM attendance
       WHERE student_id = $1 AND school_id = $2`,
      [student.id, schoolId]
    ),
    query(
      `SELECT
         COALESCE(SUM(CASE WHEN status IN ('pending','overdue') THEN amount END), 0) AS total_due,
         COALESCE(SUM(CASE WHEN status = 'paid'    THEN amount END), 0) AS paid,
         COALESCE(SUM(CASE WHEN status = 'pending' THEN amount END), 0) AS pending,
         COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount END), 0) AS overdue,
         MIN(due_date) FILTER (WHERE status IN ('pending','overdue')) AS next_due_date
       FROM student_fees
       WHERE student_id = $1 AND school_id = $2`,
      [student.id, schoolId]
    ),
    query(
      `SELECT g.marks_obtained AS score, g.percentage, g.grade_letter AS grade, g.created_at AS date,
              sub.name AS subject
         FROM grades g
         JOIN subjects sub ON sub.id = g.subject_id
        WHERE g.student_id = $1 AND g.school_id = $2
        ORDER BY g.created_at DESC
        LIMIT 10`,
      [student.id, schoolId]
    ),
  ]);

  const att       = attendanceRes.rows[0];
  const present   = parseInt(att.present,    10);
  const absent    = parseInt(att.absent,     10);
  const late      = parseInt(att.late,       10);
  const totalDays = parseInt(att.total_days, 10);
  const percentage =
    totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

  const fee = feesRes.rows[0];

  res.json({
    success: true,
    data: {
      student: {
        name:           student.name,
        studentId:      student.student_id,
        class:          student.class_name,
        enrollmentDate: student.enrollment_date,
      },
      attendance: {
        present,
        absent,
        late,
        percentage,
        totalDays,
      },
      fees: {
        totalDue:    parseFloat(fee.total_due),
        paid:        parseFloat(fee.paid),
        pending:     parseFloat(fee.pending),
        overdue:     parseFloat(fee.overdue),
        nextDueDate: fee.next_due_date ?? null,
      },
      recentGrades:  recentGradesRes.rows,
      announcements: [],
    },
  });
});

// ─── Parent Dashboard ────────────────────────────────────────────────────────
export const parentDashboard = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.schoolId!;
  const userId   = req.user!.id;

  // Resolve parent details
  const parentRes = await query(
    'SELECT first_name || \' \' || last_name AS name, email FROM users WHERE id = $1',
    [userId]
  );

  if (parentRes.rows.length === 0) {
    throw new AppError('Parent profile not found', 404);
  }

  const parent = parentRes.rows[0];

  // Get all children via student_parents junction
  const childrenRes = await query(
    `SELECT s.id, s.student_id,
            u.first_name || ' ' || u.last_name AS name,
            c.name AS class_name
       FROM student_parents sp
       JOIN students s ON s.id = sp.student_id
       JOIN users u    ON u.id = s.user_id
       LEFT JOIN classes c ON c.id = s.class_id
      WHERE sp.parent_user_id = $1 AND sp.school_id = $2`,
    [userId, schoolId]
  );

  // For each child, load attendance, fees, grades in parallel
  const children = await Promise.all(
    childrenRes.rows.map(async (child: Record<string, string>) => {
      const [attRes, feeRes, gradesRes] = await Promise.all([
        query(
          `SELECT
             COUNT(*) FILTER (WHERE status = 'present') AS present,
             COUNT(*) FILTER (WHERE status = 'absent')  AS absent,
             COUNT(*) AS total_days
           FROM attendance
           WHERE student_id = $1 AND school_id = $2`,
          [child.id, schoolId]
        ),
        query(
          `SELECT
             COALESCE(SUM(CASE WHEN status = 'pending' THEN amount END), 0) AS pending,
             COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount END), 0) AS overdue,
             COALESCE(SUM(CASE WHEN status = 'paid'    THEN amount END), 0) AS paid
           FROM student_fees
           WHERE student_id = $1 AND school_id = $2`,
          [child.id, schoolId]
        ),
        query(
          `SELECT g.marks_obtained AS score, g.percentage, g.grade_letter AS grade, g.created_at AS date,
                  sub.name AS subject
             FROM grades g
             JOIN subjects sub ON sub.id = g.subject_id
            WHERE g.student_id = $1 AND g.school_id = $2
            ORDER BY g.created_at DESC
            LIMIT 5`,
          [child.id, schoolId]
        ),
      ]);

      const att       = attRes.rows[0];
      const present   = parseInt(att.present,    10);
      const absent    = parseInt(att.absent,     10);
      const totalDays = parseInt(att.total_days, 10);
      const percentage =
        totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

      const fee = feeRes.rows[0];

      return {
        id:        child.id,
        name:      child.name,
        studentId: child.student_id,
        class:     child.class_name,
        attendance: {
          percentage,
          present,
          absent,
          totalDays,
        },
        fees: {
          pending: parseFloat(fee.pending),
          overdue: parseFloat(fee.overdue),
          paid:    parseFloat(fee.paid),
        },
        recentGrades: gradesRes.rows,
      };
    })
  );

  res.json({
    success: true,
    data: {
      parent: {
        name:  parent.name,
        email: parent.email,
      },
      children,
    },
  });
});

// ─── Super-Admin Dashboard ───────────────────────────────────────────────────
export const superAdminDashboard = asyncHandler(async (req: Request, res: Response) => {
  // Verify super-admin JWT (no tenant context here)
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Super-admin authentication required', 401);
  }

  const token = authHeader.substring(7);

  let decoded: { id?: string; type?: string };
  try {
    decoded = jwt.verify(token, SUPER_ADMIN_SECRET) as { id?: string; type?: string };
  } catch {
    throw new AppError('Invalid or expired super-admin token', 401);
  }

  if (decoded.type !== 'super_admin') {
    throw new AppError('Invalid super-admin token', 401);
  }

  const [
    platformStatsRes,
    recentSchoolsRes,
    subscriptionBreakdownRes,
    monthlyGrowthRes,
  ] = await Promise.all([
    query(
      `SELECT
         COUNT(*) AS total_schools,
         COUNT(*) FILTER (WHERE is_active = true)  AS active_schools,
         (SELECT COUNT(*) FROM students) AS total_students,
         (SELECT COUNT(*) FROM teachers) AS total_teachers,
         (SELECT COALESCE(SUM(amount), 0) FROM payments) AS total_revenue
       FROM schools`
    ),
    query(
      `SELECT
         sc.name,
         sc.plan,
         sc.subscription_status AS status,
         sc.created_at,
         COUNT(s.id) AS student_count
       FROM schools sc
       LEFT JOIN students s ON s.school_id = sc.id AND s.is_active = true
       GROUP BY sc.id, sc.name, sc.plan, sc.subscription_status, sc.created_at
       ORDER BY sc.created_at DESC
       LIMIT 5`
    ),
    query(
      `SELECT plan, COUNT(*) AS count
         FROM schools
        GROUP BY plan
        ORDER BY count DESC`
    ),
    query(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
         COUNT(*) AS count
       FROM schools
       WHERE created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '11 months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY DATE_TRUNC('month', created_at) ASC`
    ),
  ]);

  const stats = platformStatsRes.rows[0];

  res.json({
    success: true,
    data: {
      platformStats: {
        totalSchools:   parseInt(stats.total_schools,  10),
        activeSchools:  parseInt(stats.active_schools, 10),
        totalStudents:  parseInt(stats.total_students, 10),
        totalTeachers:  parseInt(stats.total_teachers, 10),
        totalRevenue:   parseFloat(stats.total_revenue),
      },
      recentSchools: recentSchoolsRes.rows.map((r: Record<string, string>) => ({
        name:         r.name,
        plan:         r.plan,
        status:       r.status,
        studentCount: parseInt(r.student_count, 10),
        createdAt:    r.created_at,
      })),
      subscriptionBreakdown: subscriptionBreakdownRes.rows.map((r: Record<string, string>) => ({
        plan:  r.plan,
        count: parseInt(r.count, 10),
      })),
      monthlyGrowth: monthlyGrowthRes.rows.map((r: Record<string, string>) => ({
        month: r.month,
        count: parseInt(r.count, 10),
      })),
    },
  });
});
