export interface TimetableSlot {
  id: string;
  dayOfWeek: number;    // 1=Mon … 7=Sun
  startTime: string;
  endTime: string;
  room?: string;
  isActive: boolean;
  academicYearId?: string;
  semesterId?: string;
  class:   { id: string; name: string; grade: string; section: string };
  subject: { id: string; name: string; code: string; color?: string };
  teacher?: { id: string; name: string; employeeId?: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimetableSlot {
  classId: string;
  subjectId: string;
  teacherId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  academicYearId?: string;
  semesterId?: string;
}

export interface WeeklyTimetable {
  class: { id: string; name: string; grade: string; section: string };
  timetable: { [day: string]: TimetableSlot[] };
}

export interface Exam {
  id: string;
  name: string;
  examType: string;
  startDate: string;
  endDate: string;
  instructions?: string;
  isPublished: boolean;
  academicYearId?: string;
  semesterId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamSchedule {
  id: string;
  examId: string;
  examDate: string;
  startTime?: string;
  endTime?: string;
  room?: string;
  maxMarks?: number;
  passMarks?: number;
  class:   { id: string; name: string; grade: string; section: string };
  subject: { id: string; name: string; code: string };
}

export const DAY_NAMES: Record<number, string> = {
  1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
  4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday',
};

export const EXAM_TYPES = ['unit_test', 'midterm', 'final', 'practical', 'other'];
