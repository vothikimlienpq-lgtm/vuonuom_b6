export type UserRole = 'guest' | 'student' | 'bcs' | 'gvcn' | 'parent';

export type DayOfWeek = 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6' | 'Thứ 7';

export interface ConductThresholds {
  /** Điểm tối thiểu để xếp loại Tốt. */
  totMin: number;
  /** Điểm tối thiểu để xếp loại Khá. */
  khaMin: number;
  /** Điểm tối thiểu để xếp loại Đạt; thấp hơn mức này là Chưa đạt. */
  datMin: number;
}

export interface ClassConfig {
  id: string;
  initialized?: boolean;
  className: string;
  schoolName: string;
  educationDepartment?: string;
  province?: string;
  academicYear: string;
  teacherName: string;
  themeTitle: string;
  slogan: string;
  week1StartDate: string; // YYYY-MM-DD
  totalWeeks: number;
  semester1Weeks?: number; // Số tuần thuộc Học kỳ I; HKII nhận các tuần còn lại
  activeMonth: number;
  activeWeek: number;
  /** Số tổ thi đua của lớp; là nguồn cấu hình chung cho toàn hệ thống. */
  groupCount?: 4 | 6;
  periodsPerDay?: number; // 5, 8, 10, etc.
  morningPeriods?: number; // default 5
  afternoonPeriods?: number; // default 3
  scheduleStructure?: 'standard8' | 'standard5' | 'split7' | 'split10' | 'custom';
  /** Ngưỡng xếp loại do GVCN tự cấu hình; bỏ trống thì chưa thực hiện xếp loại bằng điểm. */
  conductThresholds?: Partial<ConductThresholds>;
  subjects: string[];
  cleaningTasks: string[];
  hasGvcnPassword?: boolean;
  hasBcsPassword?: boolean;
  hasStudentPassword?: boolean;
}

export interface PublicStudent {
  id: string;
  orderNumber: number;
  fullName: string;
  gender: 'Nam' | 'Nữ';
  groupNumber: number; // 1 đến số tổ được cấu hình cho lớp
  position: string;
}

export interface PrivateStudentData {
  id: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  parentCode?: string;
  notes?: string;
  updatedAt?: string;
}

export interface Student extends PublicStudent {
  // Sensitive fields only available in GVCN private session
  parentCode?: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  notes?: string;
}

export interface PointRule {
  id: string;
  type: 'plus' | 'minus';
  content: string;
  defaultPoints: number;
  isFlexiblePoints?: boolean;
  requiresSubjectAndExamType?: boolean;
  requiresReason?: boolean;
  category: 'conduct' | 'academic' | 'attendance' | 'task';
  maxPerWeek?: number;
  isActive: boolean;
  isDeleted?: boolean; // Dấu xóa cho quy định chuẩn được hợp nhất ở phía máy khách
}

export interface PointTransaction {
  id: string;
  studentId: string;
  studentName: string;
  groupNumber: number;
  month: number;
  week: number;
  dayOfWeek: DayOfWeek;
  ruleId: string;
  ruleContent: string;
  type: 'plus' | 'minus';
  points: number;
  quantity: number;
  totalPoints: number;
  subject?: string;
  examType?: string;
  reason?: string;
  createdBy: string;
  creatorRole: 'gvcn' | 'bcs';
  createdAt: string;
  updatedAt?: string;
  isLocked?: boolean;
}

export interface DayLock {
  id: string; // "M{m}_W{w}_{day}"
  month: number;
  week: number;
  dayOfWeek: DayOfWeek;
  isLocked: boolean;
  lockedBy: string;
  lockedAt: string;
}

export interface WeekLock {
  id: string; // "M{m}_W{w}"
  month: number;
  week: number;
  isLocked: boolean;
  lockedBy: string;
  lockedAt: string;
}

export interface GroupBonus {
  id: string; // "M{m}_W{w}_G{g}"
  month: number;
  week: number;
  groupNumber: number;
  bonusPoints: number;
  reason: string;
  isLocked?: boolean;
  updatedAt?: string;
}

export interface SchoolRankRecord {
  id: string;
  month: number;
  week: number;
  schoolRank: number;
  totalSchoolClasses: number;
  gradeRank: number;
  totalGradeClasses: number;
  competitionPoints: number;
  deductedPoints?: number;
  deductionReason?: string;
  updatedDate: string;
  note: string;
}

export interface TimetableEntry {
  id: string;
  month?: number;
  week?: number;
  dayOfWeek: DayOfWeek;
  session?: 'morning' | 'afternoon';
  period: number; // Số tiết trong buổi hoặc số tiết liên tục trong ngày, tùy cấu hình
  subject: string;
  teacher?: string;
  lessonName?: string;
  homework?: string;
  materials?: string;
  dueDate?: string;
  tag?: 'Kiểm tra' | 'Cần nộp' | 'Mang tài liệu' | 'Quan trọng' | 'Bình thường';
  note?: string;
}

export interface HomeworkTask {
  id: string;
  month: number;
  week: number;
  dayOfWeek: DayOfWeek;
  subject: string;
  title: string;
  content: string;
  dueDate: string;
  createdBy?: string;
  createdAt?: string;
}

export interface CleaningDutyEntry {
  id: string;
  month: number;
  week: number;
  dayOfWeek: DayOfWeek;
  groupNumber: number;
  assignedStudents: string[];
  tasks: string[];
  status: 'pending' | 'completed' | 'failed';
  note?: string;
  updatedAt?: string;
}

export interface WeeklyReminderItem {
  id: string;
  content: string;
  isDone: boolean;
  priority: 'high' | 'normal';
}

export interface WeeklyReminder {
  month: number;
  week: number;
  reminders: WeeklyReminderItem[];
}

export interface CleaningAssignment {
  id: string;
  month: number;
  week: number;
  dayOfWeek: DayOfWeek;
  taskId: string;
  taskName: string;
  studentIds: string[];
  studentNames: string[];
  status: 'pending' | 'completed' | 'failed';
  note?: string;
  updatedAt: string;
}

export type TeacherDeskSide = 'left' | 'right';

export interface ClassroomLayout {
  id: 'main';
  /** Mẫu 4 tổ (3 bàn/tổ) hoặc 6 tổ (2 bàn/tổ). */
  layoutMode: 4 | 6;
  /** Thứ tự các tổ trên sơ đồ, đọc từ trái sang phải và từ trên xuống dưới. */
  groupOrder: number[];
  teacherDeskSide: TeacherDeskSide;
  doorSide: TeacherDeskSide;
  teacherDeskLabel: string;
  doorLabel: string;
  aisleLabel: string;
  /** Khóa là G{tổ}D{bàn}S{chỗ}, giá trị là ID học sinh. */
  assignments: Record<string, string>;
  /** Các trường cũ chỉ dùng để đọc và chuyển đổi sơ đồ phiên bản trước. */
  rows?: number;
  columns?: number;
  seatsPerDesk?: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface UserSession {
  role: UserRole;
  username: string;
  email?: string;
  classId?: string;
  studentId?: string;
  studentName?: string;
  groupNumber?: number;
  expiresAt: number; // timestamp ms
  bcsTimeRemaining?: number; // seconds
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: UserRole;
  action: string;
  details: string;
}

export interface FullClassData {
  config: ClassConfig;
  students: Student[];
  rules: PointRule[];
  transactions: PointTransaction[];
  dayLocks: DayLock[];
  weekLocks: WeekLock[];
  groupBonuses: GroupBonus[];
  schoolRankings: SchoolRankRecord[];
  timetable: TimetableEntry[];
  homeworkTasks: HomeworkTask[];
  cleaningDuties: CleaningDutyEntry[];
  reminders: WeeklyReminder[];
  cleaningAssignments: CleaningAssignment[];
  classroomLayout?: ClassroomLayout;
  currentSession?: UserSession;
}

/**
 * Public, code-scoped projection used by the parent portal.
 *
 * A parent reads exactly one document at `parentViews/{lookupCode}`. The
 * document deliberately contains only the parent's child plus the class
 * timetable/homework that the portal is allowed to display.
 */
export interface ParentViewDocument {
  schemaVersion: 1;
  classId: string;
  studentId: string;
  updatedAt: string;
  config: ClassConfig;
  student: PublicStudent;
  transactions: PointTransaction[];
  timetable: TimetableEntry[];
  homeworkTasks: HomeworkTask[];
}
