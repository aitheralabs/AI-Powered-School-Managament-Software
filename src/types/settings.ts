export interface UserSettings {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  darkMode: boolean;
  compactView: boolean;
  profileVisibility: boolean;
  activityStatus: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdateSettingsDTO {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  smsNotifications?: boolean;
  darkMode?: boolean;
  compactView?: boolean;
  profileVisibility?: boolean;
  activityStatus?: boolean;
}

// Data Export Types
export interface UserDataExport {
  profile: UserProfile;
  settings: UserSettings;
  roleSpecificData: RoleSpecificData;
  auditLogs: AuditLog[];
  exportMetadata: ExportMetadata;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  dateOfBirth?: Date;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleSpecificData {
  teacher?: TeacherData;
  student?: StudentData;
  parent?: ParentData;
  staff?: StaffData;
}

export interface TeacherData {
  classes: ClassInfo[];
  subjects: SubjectInfo[];
  assignments: AssignmentInfo[];
}

export interface StudentData {
  enrollments: EnrollmentInfo[];
  grades: GradeInfo[];
  attendance: AttendanceInfo[];
  fees: FeeInfo[];
}

export interface ParentData {
  children: StudentInfo[];
  communications: CommunicationInfo[];
}

export interface StaffData {
  department?: string;
  position?: string;
  responsibilities?: string[];
}

export interface ClassInfo {
  id: string;
  name: string;
  academicYear: string;
  semester?: string;
}

export interface SubjectInfo {
  id: string;
  name: string;
  code: string;
}

export interface AssignmentInfo {
  id: string;
  title: string;
  dueDate: Date;
  classId: string;
}

export interface EnrollmentInfo {
  id: string;
  className: string;
  academicYear: string;
  enrollmentDate: Date;
}

export interface GradeInfo {
  id: string;
  subject: string;
  grade: string;
  semester: string;
  academicYear: string;
}

export interface AttendanceInfo {
  date: Date;
  status: string;
  className: string;
}

export interface FeeInfo {
  id: string;
  amount: number;
  dueDate: Date;
  status: string;
  description: string;
}

export interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string;
  className?: string;
}

export interface CommunicationInfo {
  id: string;
  date: Date;
  subject: string;
  type: string;
}

export interface AuditLog {
  id: string;
  action: string;
  timestamp: Date;
  details?: any;
}

export interface ExportMetadata {
  exportDate: Date;
  exportedBy: string;
  dataVersion: string;
  recordCount: number;
}

export interface ExportResult {
  jsonUrl: string;
  pdfUrl: string;
  expiresAt: Date;
  fileSize: {
    json: number;
    pdf: number;
  };
}

// Account Deletion Types
export interface DeleteAccountRequest {
  password: string;
  confirmation: boolean;
}

export interface DeletionResult {
  success: boolean;
  deletedAt: Date;
  recordsAffected: {
    user: number;
    roleSpecific: number;
    sessions: number;
  };
}
