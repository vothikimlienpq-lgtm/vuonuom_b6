export type UserRole = 'guest' | 'student' | 'bcs' | 'gvcn' | 'parent';

export type DayOfWeek = 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6' | 'Thứ 7';

export interface ClassConfig {
  id: string;
  className: string;
  schoolName: string;
  academicYear: string;
  teacherName: string;
  themeTitle: string;
  slogan: string;
  week1StartDate: string; // YYYY-MM-DD
  totalWeeks: number;
  activeMonth: number;
  activeWeek: number;
  periodsPerDay?: number; // 5, 8, 10, etc.
  morningPeriods?: number; // default 5
  afternoonPeriods?: number; // default 3
  scheduleStructure?: 'standard8' | 'standard5' | 'custom';
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
  groupNumber: number; // 1, 2, 3, 4
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
  updatedDate: string;
  note: string;
}

export interface TimetableEntry {
  id: string;
  month?: number;
  week?: number;
  dayOfWeek: DayOfWeek;
  session?: 'morning' | 'afternoon';
  period: number; // 1..5
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

export interface UserSession {
  role: UserRole;
  username: string;
  studentId?: string;
  studentName?: string;
  groupNumber?: number;
  expiresAt: number; // timestamp ms
  bcsTimeRemaining?: number; // seconds
  parentView?: ParentViewData;
}

export interface ParentViewData {
  code: string;
  active: boolean;
  studentId: string;
  studentName: string;
  group: number;
  currentScore: number;
  allowTimetable: boolean;
  conductData: {
    plusPoints: number;
    minusPoints: number;
    totalScore: number;
    violations: number;
  };
  weeklyHomework?: {
    title?: string;
    content?: string;
    weekNumber?: number;
  };
  timetable?: TimetableEntry[];
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
  currentSession?: UserSession;
}
