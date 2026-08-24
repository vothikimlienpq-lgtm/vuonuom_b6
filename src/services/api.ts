import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  orderBy,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  User,
} from 'firebase/auth';
import {
  db,
  auth,
  DEFAULT_CLASS_ID,
  isFirebaseConfigured,
  handleFirestoreError,
  OperationType,
} from '../firebase/config';
import {
  FullClassData,
  UserRole,
  UserSession,
  PointTransaction,
  DayOfWeek,
  TimetableEntry,
  WeeklyReminder,
  CleaningAssignment,
  Student,
  PublicStudent,
  PrivateStudentData,
  PointRule,
  SchoolRankRecord,
  GroupBonus,
  HomeworkTask,
  CleaningDutyEntry,
  ClassConfig,
  DayLock,
  WeekLock,
  ParentViewDocument,
} from '../types';

// Root class document reference
let activeClassId = DEFAULT_CLASS_ID;
let classDocRef = doc(db, 'classes', activeClassId);

// Subcollection references
let studentsColRef = collection(db, 'classes', activeClassId, 'students');
let privateStudentColRef = collection(db, 'classes', activeClassId, 'privateStudentData');
let rulesColRef = collection(db, 'classes', activeClassId, 'pointRules');
let transactionsColRef = collection(db, 'classes', activeClassId, 'transactions');
let dayLocksColRef = collection(db, 'classes', activeClassId, 'dayLocks');
let weekLocksColRef = collection(db, 'classes', activeClassId, 'weekLocks');
let groupBonusesColRef = collection(db, 'classes', activeClassId, 'groupBonuses');
let schoolRankingsColRef = collection(db, 'classes', activeClassId, 'schoolRankings');
let timetableColRef = collection(db, 'classes', activeClassId, 'timetable');
let homeworkColRef = collection(db, 'classes', activeClassId, 'homeworkTasks');
let cleaningDutiesColRef = collection(db, 'classes', activeClassId, 'cleaningDuties');
let remindersColRef = collection(db, 'classes', activeClassId, 'reminders');
let cleaningAssignmentsColRef = collection(db, 'classes', activeClassId, 'cleaningAssignments');
let auditLogsColRef = collection(db, 'classes', activeClassId, 'auditLogs');
let membersColRef = collection(db, 'classes', activeClassId, 'members');
let parentViewLinksColRef = collection(db, 'classes', activeClassId, 'parentViewLinks');
const parentViewsColRef = collection(db, 'parentViews');

const selectClass = (classId: string) => {
  const normalizedClassId = normalizeLoginName(classId);
  if (!normalizedClassId) throw new Error('Class ID không hợp lệ.');

  // A class switch is a hard security boundary. Stop every listener and erase
  // all cached records before binding Firestore references to the next class.
  disposeClassListeners();
  classContextVersion += 1;
  activeClassId = normalizedClassId;
  classDocRef = doc(db, 'classes', activeClassId);
  studentsColRef = collection(db, 'classes', activeClassId, 'students');
  privateStudentColRef = collection(db, 'classes', activeClassId, 'privateStudentData');
  rulesColRef = collection(db, 'classes', activeClassId, 'pointRules');
  transactionsColRef = collection(db, 'classes', activeClassId, 'transactions');
  dayLocksColRef = collection(db, 'classes', activeClassId, 'dayLocks');
  weekLocksColRef = collection(db, 'classes', activeClassId, 'weekLocks');
  groupBonusesColRef = collection(db, 'classes', activeClassId, 'groupBonuses');
  schoolRankingsColRef = collection(db, 'classes', activeClassId, 'schoolRankings');
  timetableColRef = collection(db, 'classes', activeClassId, 'timetable');
  homeworkColRef = collection(db, 'classes', activeClassId, 'homeworkTasks');
  cleaningDutiesColRef = collection(db, 'classes', activeClassId, 'cleaningDuties');
  remindersColRef = collection(db, 'classes', activeClassId, 'reminders');
  cleaningAssignmentsColRef = collection(db, 'classes', activeClassId, 'cleaningAssignments');
  auditLogsColRef = collection(db, 'classes', activeClassId, 'auditLogs');
  membersColRef = collection(db, 'classes', activeClassId, 'members');
  parentViewLinksColRef = collection(db, 'classes', activeClassId, 'parentViewLinks');
  privateStudentCache.clear();
  latestFullData = createEmptyClassData(activeClassId);
  return activeClassId;
};

const normalizeLoginName = (value: string) => value
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9._-]/g, '');

const internalEmail = (username: string, classId = activeClassId || DEFAULT_CLASS_ID) =>
  `${normalizeLoginName(username)}.${normalizeLoginName(classId)}@lop.local`;

const withoutUndefined = <T extends Record<string, unknown>>(value: T): T =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;

const normalizeParentCode = (value: string) => value
  .trim()
  .toUpperCase()
  .replace(/\s+/g, '')
  .replace(/[^A-Z0-9-]/g, '');

const generateParentCode = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
  const classPrefix = (activeClassId.split('-')[0] || 'LOP').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `PH${classPrefix}-${token.slice(0, 4)}-${token.slice(4)}`;
};

const toPublicStudent = (student: Student | PublicStudent): PublicStudent => ({
  id: student.id,
  orderNumber: Number(student.orderNumber) || 0,
  fullName: String(student.fullName || '').trim(),
  gender: student.gender,
  groupNumber: Number(student.groupNumber) || 0,
  position: student.position || 'Thành viên',
});

const makeParentView = (student: Student | PublicStudent): ParentViewDocument => {
  const view: ParentViewDocument = {
    schemaVersion: 1,
    classId: activeClassId,
    studentId: student.id,
    updatedAt: new Date().toISOString(),
    config: latestFullData.config,
    student: toPublicStudent(student),
    transactions: latestFullData.transactions.filter((tx) => tx.studentId === student.id),
    timetable: latestFullData.timetable,
    homeworkTasks: latestFullData.homeworkTasks,
  };
  // Firestore rejects undefined values even when they are nested inside arrays.
  // Parent views are plain JSON projections, so this safely removes every
  // optional undefined field before the document is written.
  return JSON.parse(JSON.stringify(view)) as ParentViewDocument;
};

const fullDataFromParentView = (view: ParentViewDocument): FullClassData => ({
  config: view.config,
  students: [view.student],
  rules: [],
  transactions: view.transactions || [],
  dayLocks: [],
  weekLocks: [],
  groupBonuses: [],
  schoolRankings: [],
  timetable: view.timetable || [],
  homeworkTasks: view.homeworkTasks || [],
  cleaningDuties: [],
  reminders: [],
  cleaningAssignments: [],
});

const sessionFromParentView = (view: ParentViewDocument): UserSession => ({
  role: 'parent',
  username: `Phụ huynh em ${view.student.fullName}`,
  classId: view.classId,
  studentId: view.studentId,
  studentName: view.student.fullName,
  groupNumber: view.student.groupNumber,
  expiresAt: Date.now() + 2 * 3600 * 1000,
});

const findParentCodeForStudent = async (studentId: string): Promise<string | null> => {
  const linkSnap = await getDoc(doc(parentViewLinksColRef, studentId));
  if (!linkSnap.exists()) return null;
  const code = normalizeParentCode(String(linkSnap.data().code || ''));
  return code || null;
};

const syncParentViewForStudent = async (studentId: string, explicitCode?: string): Promise<void> => {
  const student = latestFullData.students.find((item) => item.id === studentId);
  if (!student) return;
  const linkedCode = await findParentCodeForStudent(studentId);
  const cachedCode = normalizeParentCode(String(privateStudentCache.get(studentId)?.parentCode || ''));
  const code = normalizeParentCode(explicitCode || '') || linkedCode || cachedCode;
  if (!code) return;
  if (!linkedCode && auth.currentUser) {
    await setDoc(doc(parentViewLinksColRef, studentId), {
      classId: activeClassId,
      studentId,
      code,
      updatedAt: new Date().toISOString(),
    });
  }
  await setDoc(doc(parentViewsColRef, code), withoutUndefined(makeParentView(student) as unknown as Record<string, unknown>));
};

const syncAllParentViews = async (): Promise<void> => {
  const linkSnaps = await getDocs(parentViewLinksColRef);
  if (linkSnaps.empty) return;
  const batch = writeBatch(db);
  linkSnaps.docs.forEach((linkSnap) => {
    const student = latestFullData.students.find((item) => item.id === linkSnap.id);
    const code = normalizeParentCode(String(linkSnap.data().code || ''));
    if (student && code) {
      batch.set(doc(parentViewsColRef, code), withoutUndefined(makeParentView(student) as unknown as Record<string, unknown>));
    }
  });
  await batch.commit();
};

const safelySyncParentViewForStudent = async (studentId: string, explicitCode?: string): Promise<void> => {
  try {
    await syncParentViewForStudent(studentId, explicitCode);
  } catch (error) {
    console.warn('Parent view sync error:', error);
  }
};

const safelySyncAllParentViews = async (): Promise<void> => {
  try {
    await syncAllParentViews();
  } catch (error) {
    console.warn('Parent views sync error:', error);
  }
};

async function sessionFromMember(user: User): Promise<UserSession> {
  const memberSnap = await getDoc(doc(membersColRef, user.uid));
  if (!memberSnap.exists() || memberSnap.data().active !== true) {
    throw new Error('Tài khoản này chưa được giáo viên cấp quyền vào lớp.');
  }
  const member = memberSnap.data();
  const roleMap: Record<string, UserRole> = {
    teacher: 'gvcn', gvcn: 'gvcn', bcs: 'bcs', student: 'student', parent: 'parent',
  };
  const role = roleMap[String(member.role || '')] || 'student';
  return {
    role,
    username: member.displayName || user.email || 'Thành viên lớp',
    email: user.email || undefined,
    classId: activeClassId,
    studentId: member.studentId || undefined,
    studentName: member.studentName || undefined,
    groupNumber: member.groupNumber || undefined,
    expiresAt: Date.now() + 8 * 3600 * 1000,
  };
}

const DEFAULT_SUBJECTS = [
  'Toán', 'Ngữ Văn', 'Tiếng Anh', 'Vật Lý', 'Hóa Học', 'Sinh Học',
  'Lịch Sử', 'Địa Lý', 'GDCD', 'Tin Học', 'Công Nghệ', 'Thể Dục',
  'HĐTN-HN', 'Chào cờ', 'Sinh hoạt lớp',
];

const DEFAULT_CLEANING_TASKS = [
  'Quét lớp & hành lang',
  'Lau sàn & lau bảng',
  'Kê ngay ngắn bàn ghế',
  'Đổ rác & thay túi mới',
  'Kiểm tra cửa sổ, quạt & đèn',
  'Tưới cây góc xanh',
];

const classLabelFromId = (classId: string) =>
  (normalizeLoginName(classId).split('-')[0] || 'lop-hoc').toUpperCase();

const academicYearFromId = (classId: string) => {
  const match = normalizeLoginName(classId).match(/(20\d{2})-(20\d{2})$/);
  return match ? `${match[1]} – ${match[2]}` : 'Chưa cập nhật';
};

export const createInitialClassConfig = (
  classId: string,
  overrides: Partial<ClassConfig> = {}
): ClassConfig => {
  const normalizedClassId = normalizeLoginName(classId) || DEFAULT_CLASS_ID;
  const className = classLabelFromId(normalizedClassId);
  return {
    initialized: false,
    className,
    schoolName: 'Chưa cập nhật',
    academicYear: academicYearFromId(normalizedClassId),
    teacherName: 'Chưa cập nhật',
    themeTitle: `Vườn Ươm ${className}`,
    slogan: 'Mỗi tuần một bước tiến – Cùng nhau vun đắp',
    week1StartDate: new Date().toISOString().slice(0, 10),
    totalWeeks: 38,
    activeMonth: new Date().getMonth() + 1,
    activeWeek: 1,
    periodsPerDay: 8,
    morningPeriods: 5,
    afternoonPeriods: 3,
    scheduleStructure: 'standard8',
    subjects: [...DEFAULT_SUBJECTS],
    cleaningTasks: [...DEFAULT_CLEANING_TASKS],
    ...overrides,
    id: normalizedClassId,
  };
};

// Giữ nguyên cấu hình lớp đang vận hành để bản nâng cấp không làm đổi dữ liệu 11B6.
export const DEFAULT_INITIAL_CONFIG: ClassConfig = createInitialClassConfig(DEFAULT_CLASS_ID, {
  initialized: true,
  className: '11B6',
  schoolName: 'Trường THCS & THPT Lê Lợi',
  academicYear: '2026 – 2027',
  teacherName: 'Cô Võ Thị Kim Liên',
  themeTitle: 'Vườn Ươm 11B6 - Nơi Ươm Mầm Tri Thức & Nhân Cách',
  week1StartDate: '2026-08-03',
  activeMonth: 8,
  activeWeek: 3,
});

// Default standard 30 point rules
export const DEFAULT_RULES: PointRule[] = [
  // Plus Rules
  { id: 'R_PLUS_01', type: 'plus', content: 'Đạt điểm 7', defaultPoints: 1, requiresSubjectAndExamType: true, category: 'academic', isActive: true },
  { id: 'R_PLUS_02', type: 'plus', content: 'Đạt điểm 8', defaultPoints: 2, requiresSubjectAndExamType: true, category: 'academic', isActive: true },
  { id: 'R_PLUS_03', type: 'plus', content: 'Đạt điểm 9', defaultPoints: 3, requiresSubjectAndExamType: true, category: 'academic', isActive: true },
  { id: 'R_PLUS_04', type: 'plus', content: 'Đạt điểm 10', defaultPoints: 5, requiresSubjectAndExamType: true, category: 'academic', isActive: true },
  { id: 'R_PLUS_05', type: 'plus', content: 'Tích cực phát biểu xây dựng bài', defaultPoints: 5, isFlexiblePoints: true, category: 'academic', isActive: true },
  { id: 'R_PLUS_06', type: 'plus', content: 'Được giáo viên bộ môn khen tích cực', defaultPoints: 20, category: 'academic', isActive: true },
  { id: 'R_PLUS_07', type: 'plus', content: 'Ban cán sự hoàn thành tốt nhiệm vụ', defaultPoints: 10, maxPerWeek: 1, category: 'task', isActive: true },
  { id: 'R_PLUS_08', type: 'plus', content: 'Đi học chuyên cần cả ngày / tuần', defaultPoints: 20, maxPerWeek: 1, category: 'attendance', isActive: true },
  { id: 'R_PLUS_09', type: 'plus', content: 'Đi học đúng giờ và đã điểm danh', defaultPoints: 2, category: 'attendance', isActive: true },
  { id: 'R_PLUS_10', type: 'plus', content: 'Trang phục chỉnh tề, đầu tóc gọn, đúng đồng phục', defaultPoints: 10, maxPerWeek: 1, category: 'conduct', isActive: true },
  { id: 'R_PLUS_11', type: 'plus', content: 'Chỗ ngồi sạch sẽ, không có rác', defaultPoints: 5, maxPerWeek: 1, category: 'conduct', isActive: true },

  // Minus Rules
  { id: 'R_MINUS_01', type: 'minus', content: 'Không thuộc bài hoặc học đối phó', defaultPoints: 20, category: 'academic', requiresSubjectAndExamType: true, isActive: true },
  { id: 'R_MINUS_02', type: 'minus', content: 'Không chuẩn bị bài, thiếu bài tập hoặc đồ dùng', defaultPoints: 30, category: 'academic', requiresSubjectAndExamType: true, isActive: true },
  { id: 'R_MINUS_03', type: 'minus', content: 'Bỏ tiết hoặc trốn tiết', defaultPoints: 20, category: 'attendance', isActive: true },
  { id: 'R_MINUS_04', type: 'minus', content: 'Ngủ, làm việc riêng hoặc nằm lên bàn', defaultPoints: 30, category: 'conduct', isActive: true },
  { id: 'R_MINUS_05', type: 'minus', content: 'Để vật dụng thiếu gọn gàng', defaultPoints: 10, category: 'conduct', isActive: true },
  { id: 'R_MINUS_06', type: 'minus', content: 'Nói chuyện riêng bị Ban cán sự nhắc', defaultPoints: 5, category: 'conduct', isActive: true },
  { id: 'R_MINUS_07', type: 'minus', content: 'Đi trễ', defaultPoints: 10, category: 'attendance', isActive: true },
  { id: 'R_MINUS_08', type: 'minus', content: 'Vắng học có phép', defaultPoints: 10, category: 'attendance', isActive: true },
  { id: 'R_MINUS_09', type: 'minus', content: 'Vắng học không phép', defaultPoints: 20, category: 'attendance', isActive: true },
  { id: 'R_MINUS_10', type: 'minus', content: 'Ban cán sự làm sai hoặc không hoàn thành nhiệm vụ', defaultPoints: 40, category: 'task', isActive: true },
  { id: 'R_MINUS_11', type: 'minus', content: 'Xếp hàng vào lớp lộn xộn hoặc đùa giỡn', defaultPoints: 5, category: 'conduct', isActive: true },
  { id: 'R_MINUS_12', type: 'minus', content: 'Làm hư hại tài sản nhà trường', defaultPoints: 50, category: 'conduct', requiresReason: true, isActive: true },
  { id: 'R_MINUS_13', type: 'minus', content: 'Không đúng tác phong hoặc đồng phục', defaultPoints: 50, category: 'conduct', isActive: true },
  { id: 'R_MINUS_14', type: 'minus', content: 'Đem đồ ăn hoặc thức uống vào lớp', defaultPoints: 20, category: 'conduct', isActive: true },
  { id: 'R_MINUS_15', type: 'minus', content: 'Sử dụng điện thoại sai quy định', defaultPoints: 40, category: 'conduct', isActive: true },
  { id: 'R_MINUS_16', type: 'minus', content: 'Vào lớp trễ hơn giáo viên', defaultPoints: 10, category: 'attendance', isActive: true },
  { id: 'R_MINUS_17', type: 'minus', content: 'Nói tục', defaultPoints: 50, category: 'conduct', isActive: true },
  { id: 'R_MINUS_18', type: 'minus', content: 'Trực nhật dơ hoặc không trực nhật', defaultPoints: 30, category: 'task', isActive: true },
  { id: 'R_MINUS_19', type: 'minus', content: 'Yêu cầu viết bản kiểm điểm', defaultPoints: 0, category: 'conduct', requiresReason: true, isActive: true },
];

const createEmptyClassData = (classId: string): FullClassData => ({
  config: classId === DEFAULT_CLASS_ID
    ? { ...DEFAULT_INITIAL_CONFIG, subjects: [...DEFAULT_INITIAL_CONFIG.subjects], cleaningTasks: [...DEFAULT_INITIAL_CONFIG.cleaningTasks] }
    : createInitialClassConfig(classId),
  students: [],
  rules: DEFAULT_RULES.map((rule) => ({ ...rule })),
  transactions: [],
  dayLocks: [],
  weekLocks: [],
  groupBonuses: [],
  schoolRankings: [],
  timetable: [],
  homeworkTasks: [],
  cleaningDuties: [],
  reminders: [],
  cleaningAssignments: [],
});

let classContextVersion = 0;

// In-memory cache is scoped to the currently verified class.
let latestFullData: FullClassData = createEmptyClassData(activeClassId);

// Listeners tracking
const activeUnsubscribes: Unsubscribe[] = [];
const authDependentUnsubscribes: Unsubscribe[] = [];
const privateStudentCache = new Map<string, PrivateStudentData>();

function disposeClassListeners() {
  activeUnsubscribes.splice(0).forEach((unsubscribe) => unsubscribe());
  authDependentUnsubscribes.splice(0).forEach((unsubscribe) => unsubscribe());
}

export const api = {
  // -------------------------------------------------------------
  // AUTHENTICATION (Firebase Authentication onAuthStateChanged)
  // -------------------------------------------------------------

  lookupParentCode: async (rawCode: string, expectedClassId?: string): Promise<{
    classId: string;
    normalizedCode: string;
    data: FullClassData;
    session: UserSession;
  }> => {
    const code = normalizeParentCode(rawCode);
    if (code.length < 12) {
      throw new Error('Đây là mã phụ huynh kiểu cũ hoặc chưa đủ an toàn. GVCN cần vào Cài đặt → Danh sách lớp → Tạo mới mã PH, rồi cấp lại mã mới.');
    }
    try {
      if (auth.currentUser) await signOut(auth).catch(() => undefined);
      const snap = await getDocFromServer(doc(parentViewsColRef, code));
      if (!snap.exists()) {
        throw new Error('Không tìm thấy mã tra cứu. Vui lòng kiểm tra lại hoặc liên hệ GVCN.');
      }
      const view = snap.data() as ParentViewDocument;
      if (view.schemaVersion !== 1 || !view.student?.id || !view.classId) {
        throw new Error('Dữ liệu tra cứu chưa được khởi tạo đúng. Vui lòng liên hệ GVCN.');
      }
      if (expectedClassId && normalizeLoginName(view.classId) !== normalizeLoginName(expectedClassId)) {
        throw new Error('Mã tra cứu không thuộc lớp vừa được xác thực. Vui lòng kiểm tra lại mã.');
      }
      return {
        classId: view.classId,
        normalizedCode: code,
        data: fullDataFromParentView(view),
        session: sessionFromParentView(view),
      };
    } catch (err: any) {
      if (
        err?.message?.includes('Không tìm thấy')
        || err?.message?.includes('chưa được khởi tạo')
        || err?.message?.includes('không thuộc lớp')
      ) throw err;
      if (err?.code === 'permission-denied' || err?.code === 'firestore/permission-denied') {
        throw new Error('Firestore Rules chưa cho phép đọc parentViews. GVCN cần dán đúng tệp firestore.rules mới và bấm Publish.');
      }
      if (err?.code === 'unavailable' || err?.code === 'firestore/unavailable') {
        throw new Error('Không kết nối được Firestore. Vui lòng kiểm tra mạng và thử lại.');
      }
      throw new Error('Không thể tra cứu mã phụ huynh. Nếu vừa cập nhật hệ thống, GVCN hãy bấm “Tạo mới mã PH” một lần rồi dùng mã mới.');
    }
  },

  subscribeParentView: (
    rawCode: string,
    callback: (data: FullClassData, session: UserSession) => void,
    onError?: (message: string) => void
  ): Unsubscribe => {
    const code = normalizeParentCode(rawCode);
    return onSnapshot(
      doc(parentViewsColRef, code),
      (snap) => {
        if (!snap.exists()) {
          onError?.('Mã tra cứu đã hết hiệu lực. Vui lòng liên hệ GVCN để nhận mã mới.');
          return;
        }
        const view = snap.data() as ParentViewDocument;
        callback(fullDataFromParentView(view), sessionFromParentView(view));
      },
      () => onError?.('Không thể đồng bộ cổng phụ huynh. Vui lòng thử lại sau.')
    );
  },

  verifyClassAccess: async (payload: {
    classId: string;
    password: string;
  }): Promise<{ success: boolean; message: string; classId: string }> => {
    const classId = normalizeLoginName(payload.classId);
    if (!classId || !payload.password) throw new Error('Vui lòng nhập Class ID và mật khẩu lớp.');
    try {
      await signInWithEmailAndPassword(auth, `${classId}@lop.local`, payload.password);
      await signOut(auth);
      selectClass(classId);
      return { success: true, message: 'Đã xác thực Class ID.', classId };
    } catch (err: any) {
      if (auth.currentUser) await signOut(auth).catch(() => undefined);
      if (err.code === 'auth/too-many-requests') throw new Error('Nhập sai quá nhiều lần. Vui lòng thử lại sau.');
      throw new Error('Class ID hoặc mật khẩu lớp không chính xác.');
    }
  },

  login: async (payload: {
    username: string;
    classId?: string;
    password?: string;
  }): Promise<{ success: boolean; session: UserSession; message: string }> => {
    const { username, password } = payload;
    const input = username.trim();
    if (payload.classId) selectClass(payload.classId);
    const cleanEmail = input.includes('@') ? input.toLowerCase() : internalEmail(input, payload.classId);

    if (!password) {
      throw new Error('Vui lòng nhập mật khẩu tài khoản.');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const session = await sessionFromMember(userCredential.user);

      return {
        success: true,
        session,
        message: `Đăng nhập thành công với vai trò ${session.role}.`,
      };
    } catch (err: any) {
      let msg = 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Mật khẩu không chính xác.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'Tên đăng nhập chưa tồn tại hoặc chưa được tạo trên Firebase Authentication.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Nhập sai quá nhiều lần. Thiết bị tạm khóa để bảo vệ an toàn.';
      } else if (err.message) {
        msg = err.message;
      }
      throw new Error(msg);
    }
  },

  logout: async () => {
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch {
      // Ignore
    }
    disposeClassListeners();
    classContextVersion += 1;
    privateStudentCache.clear();
    latestFullData = createEmptyClassData(activeClassId);
  },

  getActiveClassId: () => activeClassId,

  getCurrentAuthEmail: () => auth.currentUser?.email || '',

  getCurrentSession: async (): Promise<UserSession> => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      return {
        role: 'guest',
        username: 'Khách / Thành Viên Lớp',
        expiresAt: 0,
      };
    }

    try {
      return await sessionFromMember(currentUser);
    } catch {
      await signOut(auth).catch(() => undefined);
    }

    return {
      role: 'guest', username: 'Chưa đăng nhập', expiresAt: 0,
    };
  },

  onAuthStateChanged: (callback: (session: UserSession) => void): Unsubscribe => {
    return onAuthStateChanged(auth, async (user: User | null) => {
      if (!user || !user.email) {
        callback({
          role: 'guest',
          username: 'Khách / Thành Viên Lớp',
          expiresAt: 0,
        });
        return;
      }

      try {
        callback(await sessionFromMember(user));
        return;
      } catch {
        await signOut(auth).catch(() => undefined);
      }

      callback({
        role: 'guest', username: 'Chưa đăng nhập', expiresAt: 0,
      });
    });
  },

  // -------------------------------------------------------------
  // REAL-TIME FIRESTORE SUBSCRIPTIONS
  // -------------------------------------------------------------

  subscribeFullClassData: (callback: (data: FullClassData) => void, session?: UserSession): (() => void) => {
    if (!isFirebaseConfigured()) {
      callback(latestFullData);
      return () => {};
    }

    disposeClassListeners();
    const subscribedClassId = activeClassId;
    const subscriptionVersion = classContextVersion;
    const contextData = createEmptyClassData(subscribedClassId);
    latestFullData = contextData;

    const notifyUpdate = () => {
      if (subscriptionVersion !== classContextVersion || subscribedClassId !== activeClassId) return;
      latestFullData = contextData;
      callback({ ...contextData });
    };

    try {
      // 1. Class Config Doc
      const unsubConfig = onSnapshot(
        classDocRef,
        (snap) => {
          if (snap.exists()) {
            contextData.config = {
              ...createInitialClassConfig(subscribedClassId),
              ...snap.data(),
              id: snap.id,
              initialized: true,
            } as ClassConfig;
          } else {
            contextData.config = createInitialClassConfig(subscribedClassId);
          }
          notifyUpdate();
        },
        (err) => console.warn('Config snapshot error:', err)
      );
      activeUnsubscribes.push(unsubConfig);

      // 2. Students Collection (Public data only)
      const studentsQuery = query(studentsColRef, orderBy('orderNumber', 'asc'));
      const unsubStudents = onSnapshot(
        studentsQuery,
        (snap) => {
          const publicStudents = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as PublicStudent[];

          contextData.students = publicStudents.map((ps) => {
            const privateInfo = privateStudentCache.get(ps.id);
            return {
              ...ps,
              ...(privateInfo || {}),
            } as Student;
          });
          notifyUpdate();
        },
        (err) => console.warn('Students snapshot error:', err)
      );
      activeUnsubscribes.push(unsubStudents);

      // 3. Point Rules Collection
      const unsubRules = onSnapshot(
        rulesColRef,
        (snap) => {
          if (!snap.empty) {
            contextData.rules = snap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            })) as PointRule[];
          } else {
            contextData.rules = DEFAULT_RULES.map((rule) => ({ ...rule }));
          }
          notifyUpdate();
        },
        (err) => console.warn('Rules snapshot error:', err)
      );
      activeUnsubscribes.push(unsubRules);

      // 4. Authenticated Subscriptions: Point Transactions & Private Student Data
      const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
        if (subscriptionVersion !== classContextVersion || subscribedClassId !== activeClassId) return;
        // Clean previous auth-dependent subscriptions
        authDependentUnsubscribes.forEach((u) => u());
        authDependentUnsubscribes.length = 0;

        if (currentUser) {
          const memberDoc = await getDoc(doc(membersColRef, currentUser.uid));
          if (subscriptionVersion !== classContextVersion || subscribedClassId !== activeClassId) return;
          const member = memberDoc.exists() ? memberDoc.data() : null;
          const isAuthorized = member?.active === true;
          const isTeacher = member?.role === 'teacher' || member?.role === 'gvcn';

          if (isAuthorized) {
            // Subscribe to transactions
            const txSource = member?.role === 'parent' && member?.studentId
              ? query(transactionsColRef, where('studentId', '==', member.studentId))
              : transactionsColRef;
            const unsubTx = onSnapshot(
              txSource,
              (snap) => {
                contextData.transactions = snap.docs.map((d) => ({
                  id: d.id,
                  ...d.data(),
                })) as PointTransaction[];
                notifyUpdate();
              },
              (err) => {
                console.warn('Transactions snapshot error:', err);
                contextData.transactions = [];
                notifyUpdate();
              }
            );
            authDependentUnsubscribes.push(unsubTx);
          } else {
            contextData.transactions = [];
            notifyUpdate();
          }

          // If GVCN, subscribe to privateStudentData
          if (isTeacher) {
            const unsubPrivate = onSnapshot(
              privateStudentColRef,
              (snap) => {
                privateStudentCache.clear();
                snap.docs.forEach((d) => {
                  privateStudentCache.set(d.id, d.data() as PrivateStudentData);
                });

                // Merge private fields into students list
                contextData.students = contextData.students.map((s) => {
                  const priv = privateStudentCache.get(s.id);
                  return {
                    ...s,
                    ...(priv || {}),
                  };
                });
                notifyUpdate();
              },
              (err) => {
                console.warn('Private student data snapshot error:', err);
              }
            );
            authDependentUnsubscribes.push(unsubPrivate);
          } else {
            privateStudentCache.clear();
            contextData.students = contextData.students.map((s) => ({
              id: s.id,
              orderNumber: s.orderNumber,
              fullName: s.fullName,
              gender: s.gender,
              groupNumber: s.groupNumber,
              position: s.position,
            }));
            notifyUpdate();
          }
        } else {
          // Guest mode: clear transactions and strip private student fields
          privateStudentCache.clear();
          contextData.transactions = [];
          contextData.students = contextData.students.map((s) => ({
            id: s.id,
            orderNumber: s.orderNumber,
            fullName: s.fullName,
            gender: s.gender,
            groupNumber: s.groupNumber,
            position: s.position,
          }));
          notifyUpdate();
        }
      });
      activeUnsubscribes.push(unsubAuth);

      // 5. Day Locks
      const unsubDayLocks = onSnapshot(
        dayLocksColRef,
        (snap) => {
          contextData.dayLocks = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as DayLock[];
          notifyUpdate();
        },
        (err) => console.warn('DayLocks snapshot error:', err)
      );
      activeUnsubscribes.push(unsubDayLocks);

      // 6. Week Locks
      const unsubWeekLocks = onSnapshot(
        weekLocksColRef,
        (snap) => {
          contextData.weekLocks = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as WeekLock[];
          notifyUpdate();
        },
        (err) => console.warn('WeekLocks snapshot error:', err)
      );
      activeUnsubscribes.push(unsubWeekLocks);

      // 7. Group Bonuses
      const unsubBonuses = onSnapshot(
        groupBonusesColRef,
        (snap) => {
          contextData.groupBonuses = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as GroupBonus[];
          notifyUpdate();
        },
        (err) => console.warn('GroupBonuses snapshot error:', err)
      );
      activeUnsubscribes.push(unsubBonuses);

      // 8. School Rankings
      const unsubRankings = onSnapshot(
        schoolRankingsColRef,
        (snap) => {
          contextData.schoolRankings = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as SchoolRankRecord[];
          notifyUpdate();
        },
        (err) => console.warn('SchoolRankings snapshot error:', err)
      );
      activeUnsubscribes.push(unsubRankings);

      // 9. Timetable
      const unsubTimetable = onSnapshot(
        timetableColRef,
        (snap) => {
          contextData.timetable = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as TimetableEntry[];
          notifyUpdate();
        },
        (err) => console.warn('Timetable snapshot error:', err)
      );
      activeUnsubscribes.push(unsubTimetable);

      // 10. Homework Tasks
      const unsubHomework = onSnapshot(
        homeworkColRef,
        (snap) => {
          contextData.homeworkTasks = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as HomeworkTask[];
          notifyUpdate();
        },
        (err) => console.warn('Homework snapshot error:', err)
      );
      activeUnsubscribes.push(unsubHomework);

      // 11. Cleaning Duties
      const unsubDuties = onSnapshot(
        cleaningDutiesColRef,
        (snap) => {
          contextData.cleaningDuties = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as CleaningDutyEntry[];
          notifyUpdate();
        },
        (err) => console.warn('CleaningDuties snapshot error:', err)
      );
      activeUnsubscribes.push(unsubDuties);

      // 12. Reminders
      const unsubReminders = onSnapshot(
        remindersColRef,
        (snap) => {
          contextData.reminders = snap.docs.map((d) => ({
            ...d.data(),
          })) as WeeklyReminder[];
          notifyUpdate();
        },
        (err) => console.warn('Reminders snapshot error:', err)
      );
      activeUnsubscribes.push(unsubReminders);

      // 13. Cleaning Assignments
      const unsubAssignments = onSnapshot(
        cleaningAssignmentsColRef,
        (snap) => {
          contextData.cleaningAssignments = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as CleaningAssignment[];
          notifyUpdate();
        },
        (err) => console.warn('CleaningAssignments snapshot error:', err)
      );
      activeUnsubscribes.push(unsubAssignments);

    } catch (error) {
      console.error('Subscription error:', error);
    }

    return () => {
      if (subscriptionVersion === classContextVersion) disposeClassListeners();
    };
  },

  getFullClassData: async (): Promise<FullClassData> => {
    return { ...latestFullData };
  },

  getFullData: async (): Promise<FullClassData> => {
    return { ...latestFullData };
  },

  // -------------------------------------------------------------
  // ONE-CLICK DATABASE INITIALIZATION (SEEDING)
  // -------------------------------------------------------------

  initializeClassData: async (initialConfig: Partial<ClassConfig> = {}): Promise<{ success: boolean; message: string }> => {
    try {
      const batch = writeBatch(db);
      const config = createInitialClassConfig(activeClassId, {
        ...initialConfig,
        initialized: true,
      });

      // 1. Set Class Config
      batch.set(classDocRef, config, { merge: true });

      // 2. Set Standard 30 Rules
      DEFAULT_RULES.forEach((rule) => {
        const ruleDoc = doc(rulesColRef, rule.id);
        batch.set(ruleDoc, rule);
      });

      await batch.commit();

      return {
        success: true,
        message: `Khởi tạo cấu hình và 30 quy chế thi đua lớp ${config.className} thành công!`,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `classes/${activeClassId}`);
    }
  },

  // -------------------------------------------------------------
  // CONFIG MANAGEMENT
  // -------------------------------------------------------------

  updateClassConfig: async (config: Partial<ClassConfig>): Promise<{ success: boolean; message: string }> => {
    try {
      const safeConfig = { ...config, id: activeClassId, initialized: true };
      await setDoc(classDocRef, safeConfig, { merge: true });
      latestFullData.config = { ...latestFullData.config, ...safeConfig };
      await safelySyncAllParentViews();
      return { success: true, message: 'Cập nhật cấu hình lớp học thành công!' };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `classes/${activeClassId}`);
    }
  },

  updateConfig: async (config: Partial<ClassConfig>): Promise<{ success: boolean; message: string }> => {
    return api.updateClassConfig(config);
  },

  // -------------------------------------------------------------
  // POINT RULES (CRUD)
  // -------------------------------------------------------------

  saveRule: async (rule: Partial<PointRule> & { id?: string }): Promise<{ success: boolean; message: string }> => {
    try {
      const ruleId = rule.id || `R_CUSTOM_${Date.now()}`;
      const fullRule: PointRule = {
        id: ruleId,
        type: rule.type || 'plus',
        content: rule.content || '',
        defaultPoints: Number(rule.defaultPoints) || 1,
        category: rule.category || 'academic',
        isActive: rule.isActive !== undefined ? rule.isActive : true,
        isFlexiblePoints: rule.isFlexiblePoints,
        requiresSubjectAndExamType: rule.requiresSubjectAndExamType,
        requiresReason: rule.requiresReason,
        maxPerWeek: rule.maxPerWeek,
      };
      await setDoc(doc(rulesColRef, ruleId), fullRule);
      return { success: true, message: 'Đã lưu quy định thi đua thành công!' };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'pointRules');
    }
  },

  deleteRule: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      await deleteDoc(doc(rulesColRef, id));
      return { success: true, message: 'Đã xóa quy định thi đua thành công.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `pointRules/${id}`);
    }
  },

  // -------------------------------------------------------------
  // POINT TRANSACTIONS (CRUD)
  // -------------------------------------------------------------

  addTransaction: async (payload: {
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
    quantity?: number;
    subject?: string;
    examType?: string;
    reason?: string;
  }): Promise<{ success: boolean; transaction: PointTransaction; message: string }> => {
    try {
      const txId = `TX_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const selectedStudent = latestFullData.students.find((student) => student.id === payload.studentId);
      const selectedRule = latestFullData.rules.find((rule) => rule.id === payload.ruleId);
      const safeStudentName = String(payload.studentName || selectedStudent?.fullName || '').trim();
      const safeGroupNumber = Number(payload.groupNumber ?? selectedStudent?.groupNumber);
      const safeRuleContent = String(payload.ruleContent || selectedRule?.content || '').trim();
      const safeType = payload.type || selectedRule?.type;
      const safePoints = Math.abs(Number(payload.points ?? selectedRule?.defaultPoints));

      if (!payload.studentId || !safeStudentName) {
        throw new Error('Không xác định được học sinh. Vui lòng chọn lại học sinh trước khi lưu điểm.');
      }
      if (!Number.isFinite(safeGroupNumber)) {
        throw new Error('Không xác định được tổ của học sinh. Vui lòng kiểm tra lại danh sách lớp.');
      }
      if (!safeRuleContent || (safeType !== 'plus' && safeType !== 'minus') || !Number.isFinite(safePoints)) {
        throw new Error('Quy định điểm chưa đầy đủ. Vui lòng chọn lại quy định trước khi lưu.');
      }

      const qty = Math.max(1, Math.abs(Number(payload.quantity) || 1));
      const absoluteTotal = safePoints * qty;
      const totalPts = safeType === 'minus' ? -absoluteTotal : absoluteTotal;

      const currentSession = await api.getCurrentSession();
      const newTx: PointTransaction = {
        id: txId,
        studentId: payload.studentId,
        studentName: safeStudentName,
        groupNumber: safeGroupNumber,
        month: payload.month,
        week: payload.week,
        dayOfWeek: payload.dayOfWeek,
        ruleId: payload.ruleId,
        ruleContent: safeRuleContent,
        type: safeType,
        points: safePoints,
        quantity: qty,
        totalPoints: totalPts,
        subject: payload.subject,
        examType: payload.examType,
        reason: payload.reason,
        createdBy: currentSession.username,
        creatorRole: currentSession.role === 'gvcn' ? 'gvcn' : 'bcs',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(transactionsColRef, txId), withoutUndefined(newTx as unknown as Record<string, unknown>));
      latestFullData.transactions = [
        ...latestFullData.transactions.filter((tx) => tx.id !== txId),
        newTx,
      ];
      await safelySyncParentViewForStudent(payload.studentId);

      return {
        success: true,
        transaction: newTx,
        message: `Đã ghi nhận ${payload.type === 'plus' ? 'điểm cộng' : 'điểm trừ'} cho học sinh ${safeStudentName}.`,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'transactions');
    }
  },

  createTransaction: async (payload: any) => {
    return api.addTransaction(payload);
  },

  updateTransaction: async (
    id: string,
    payload: Partial<PointTransaction>
  ): Promise<{ success: boolean; transaction: PointTransaction; message: string }> => {
    try {
      const txDocRef = doc(transactionsColRef, id);
      const existing = latestFullData.transactions.find((tx) => tx.id === id);
      const merged = { ...(existing || {}), ...payload, id } as PointTransaction;
      const normalizedPoints = Math.abs(Number(merged.points) || 0);
      const normalizedQuantity = Math.max(1, Math.abs(Number(merged.quantity) || 1));
      const normalizedPayload = {
        ...payload,
        points: normalizedPoints,
        quantity: normalizedQuantity,
        totalPoints: merged.type === 'minus'
          ? -(normalizedPoints * normalizedQuantity)
          : normalizedPoints * normalizedQuantity,
      };
      const updateData = withoutUndefined({
        ...normalizedPayload,
        updatedAt: new Date().toISOString(),
      });
      await updateDoc(txDocRef, updateData);
      const updated = { ...(existing || {}), ...normalizedPayload, id } as PointTransaction;
      latestFullData.transactions = latestFullData.transactions.map((tx) => tx.id === id ? updated : tx);
      if (existing?.studentId && existing.studentId !== updated.studentId) {
        await safelySyncParentViewForStudent(existing.studentId);
      }
      if (updated.studentId) await safelySyncParentViewForStudent(updated.studentId);
      return {
        success: true,
        transaction: updated,
        message: 'Đã cập nhật mục thi đua.',
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `transactions/${id}`);
    }
  },

  deleteTransaction: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const existing = latestFullData.transactions.find((tx) => tx.id === id);
      await deleteDoc(doc(transactionsColRef, id));
      latestFullData.transactions = latestFullData.transactions.filter((tx) => tx.id !== id);
      if (existing?.studentId) await safelySyncParentViewForStudent(existing.studentId);
      return { success: true, message: 'Đã xóa mục thi đua thành công.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `transactions/${id}`);
    }
  },

  // -------------------------------------------------------------
  // STUDENTS MANAGEMENT & PRIVATE DATA SEPARATION
  // -------------------------------------------------------------

  addStudent: async (studentData: {
    fullName: string;
    gender: 'Nam' | 'Nữ';
    groupNumber: number;
    position?: string;
    phone?: string;
    parentName?: string;
    parentPhone?: string;
    parentCode?: string;
    notes?: string;
  }): Promise<{ success: boolean; student: Student; message: string }> => {
    try {
      const studentId = `STU_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const currentStudents = latestFullData.students;
      const orderNumber = currentStudents.length > 0 ? Math.max(...currentStudents.map((s) => s.orderNumber || 0)) + 1 : 1;
      const parentCode = normalizeParentCode(studentData.parentCode || '') || generateParentCode();

      // 1. Public student doc (No sensitive contact info or parent codes)
      const publicStudent: PublicStudent = {
        id: studentId,
        orderNumber,
        fullName: studentData.fullName.trim(),
        gender: studentData.gender,
        groupNumber: studentData.groupNumber,
        position: studentData.position || 'Thành viên',
      };

      // 2. Private student data (Strictly GVCN only)
      const privateData: PrivateStudentData = {
        id: studentId,
        phone: studentData.phone || '',
        parentName: studentData.parentName || '',
        parentPhone: studentData.parentPhone || '',
        parentCode: parentCode,
        notes: studentData.notes || '',
        updatedAt: new Date().toISOString(),
      };

      const batch = writeBatch(db);
      batch.set(doc(studentsColRef, studentId), publicStudent);
      batch.set(doc(privateStudentColRef, studentId), privateData);
      batch.set(doc(parentViewLinksColRef, studentId), {
        classId: activeClassId,
        studentId,
        code: parentCode,
        updatedAt: new Date().toISOString(),
      });
      batch.set(doc(parentViewsColRef, parentCode), withoutUndefined(makeParentView(publicStudent) as unknown as Record<string, unknown>));
      await batch.commit();

      // Update cache
      privateStudentCache.set(studentId, privateData);
      latestFullData.students = [...latestFullData.students, { ...publicStudent, ...privateData }];

      return {
        success: true,
        student: { ...publicStudent, ...privateData },
        message: `Đã thêm học sinh ${publicStudent.fullName} vào danh sách lớp.`,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'students');
    }
  },

  saveStudent: async (studentData: any): Promise<{ success: boolean; student?: Student; message: string }> => {
    if (studentData.id) {
      return api.updateStudent(studentData.id, studentData);
    }
    return api.addStudent(studentData);
  },

  updateStudent: async (
    idOrData: string | (Partial<Student> & { id: string; parentName?: string }),
    maybeData?: Partial<Student> & { parentName?: string }
  ): Promise<{ success: boolean; student: Student; message: string }> => {
    try {
      const id = typeof idOrData === 'string' ? idOrData : idOrData.id;
      const studentData = typeof idOrData === 'string' ? (maybeData || {}) : idOrData;
      const existingStudent = latestFullData.students.find((student) => student.id === id);
      const oldCode = normalizeParentCode(String(privateStudentCache.get(id)?.parentCode || ''));

      const batch = writeBatch(db);

      // Public updates (ONLY non-sensitive public fields)
      const publicUpdates: Partial<PublicStudent> = {};
      if (studentData.fullName !== undefined) publicUpdates.fullName = studentData.fullName.trim();
      if (studentData.gender !== undefined) publicUpdates.gender = studentData.gender;
      if (studentData.groupNumber !== undefined) publicUpdates.groupNumber = Number(studentData.groupNumber);
      if (studentData.position !== undefined) publicUpdates.position = studentData.position;
      if (studentData.orderNumber !== undefined) publicUpdates.orderNumber = Number(studentData.orderNumber);

      if (Object.keys(publicUpdates).length > 0) {
        batch.update(doc(studentsColRef, id), publicUpdates);
      }

      // Private updates (Strictly in privateStudentData)
      const privateUpdates: Partial<PrivateStudentData> = {};
      if (studentData.phone !== undefined) privateUpdates.phone = studentData.phone;
      if (studentData.parentPhone !== undefined) privateUpdates.parentPhone = studentData.parentPhone;
      if (studentData.parentName !== undefined) privateUpdates.parentName = studentData.parentName;
      const requestedCode = studentData.parentCode !== undefined
        ? (normalizeParentCode(studentData.parentCode) || generateParentCode())
        : undefined;
      if (requestedCode !== undefined) privateUpdates.parentCode = requestedCode;
      if (studentData.notes !== undefined) privateUpdates.notes = studentData.notes;

      if (Object.keys(privateUpdates).length > 0) {
        privateUpdates.updatedAt = new Date().toISOString();
        batch.set(doc(privateStudentColRef, id), privateUpdates, { merge: true });

        // Update local cache
        const existingPrivate = privateStudentCache.get(id) || { id };
        privateStudentCache.set(id, { ...existingPrivate, ...privateUpdates });
      }

      const nextStudent = {
        ...(existingStudent || { id }),
        ...publicUpdates,
        ...privateUpdates,
        id,
      } as Student;
      if (requestedCode) {
        batch.set(doc(parentViewLinksColRef, id), {
          classId: activeClassId,
          studentId: id,
          code: requestedCode,
          updatedAt: new Date().toISOString(),
        });
        batch.set(doc(parentViewsColRef, requestedCode), withoutUndefined(makeParentView(nextStudent) as unknown as Record<string, unknown>));
        if (oldCode && oldCode !== requestedCode) batch.delete(doc(parentViewsColRef, oldCode));
      }

      await batch.commit();
      latestFullData.students = latestFullData.students.map((student) => student.id === id ? nextStudent : student);
      await safelySyncParentViewForStudent(id, requestedCode);

      return {
        success: true,
        student: { id, ...studentData } as Student,
        message: 'Đã cập nhật thông tin học sinh.',
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `students/${typeof idOrData === 'string' ? idOrData : idOrData.id}`);
    }
  },

  deleteStudent: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const linkedCode = await findParentCodeForStudent(id);
      const cachedCode = normalizeParentCode(String(privateStudentCache.get(id)?.parentCode || ''));
      const batch = writeBatch(db);
      batch.delete(doc(studentsColRef, id));
      batch.delete(doc(privateStudentColRef, id));
      batch.delete(doc(parentViewLinksColRef, id));
      if (linkedCode || cachedCode) batch.delete(doc(parentViewsColRef, linkedCode || cachedCode));
      await batch.commit();
      privateStudentCache.delete(id);
      latestFullData.students = latestFullData.students.filter((student) => student.id !== id);
      latestFullData.transactions = latestFullData.transactions.filter((tx) => tx.studentId !== id);
      return { success: true, message: 'Đã xóa học sinh khỏi danh sách lớp.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `students/${id}`);
    }
  },

  batchImportStudents: async (
    studentsInput:
      | string
      | Array<{
          orderNumber?: number;
          fullName: string;
          gender: 'Nam' | 'Nữ';
          groupNumber: number;
          position?: string;
          phone?: string;
          parentPhone?: string;
          parentName?: string;
          parentCode?: string;
          notes?: string;
        }>
  ): Promise<{ success: boolean; message: string }> => {
    try {
      let parsedList: Array<{
        orderNumber?: number;
        fullName: string;
        gender: 'Nam' | 'Nữ';
        groupNumber: number;
        position?: string;
        phone?: string;
        parentPhone?: string;
        parentName?: string;
        parentCode?: string;
        notes?: string;
      }> = [];

      if (typeof studentsInput === 'string') {
        const lines = studentsInput.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
        parsedList = lines.map((line, idx) => {
          const parts = line.split(/[\t,|;]/).map((p) => p.trim());
          const name = parts[0] || `Học sinh ${idx + 1}`;
          const gender = parts[1] === 'Nữ' || parts[1] === 'Nu' ? 'Nữ' : 'Nam';
          const groupNum = parseInt(parts[2]) || (idx % 4) + 1;
          const pos = parts[3] || 'Thành viên';
          const phone = parts[4] || '';
          const parentPhone = parts[5] || '';
          return {
            orderNumber: idx + 1,
            fullName: name,
            gender: gender as 'Nam' | 'Nữ',
            groupNumber: groupNum,
            position: pos,
            phone,
            parentPhone,
          };
        });
      } else {
        parsedList = studentsInput;
      }

      const batch = writeBatch(db);

      parsedList.forEach((s, idx) => {
        const studentId = `STU_${Date.now()}_${idx + 1}`;
        const orderNum = s.orderNumber || idx + 1;
        const parentCode = normalizeParentCode(s.parentCode || '') || generateParentCode();

        const publicData: PublicStudent = {
          id: studentId,
          orderNumber: orderNum,
          fullName: s.fullName.trim(),
          gender: s.gender || 'Nam',
          groupNumber: s.groupNumber || (idx % 4) + 1,
          position: s.position || 'Thành viên',
        };

        const privateData: PrivateStudentData = {
          id: studentId,
          phone: s.phone || '',
          parentName: s.parentName || '',
          parentPhone: s.parentPhone || '',
          parentCode,
          notes: s.notes || '',
          updatedAt: new Date().toISOString(),
        };

        batch.set(doc(studentsColRef, studentId), publicData);
        batch.set(doc(privateStudentColRef, studentId), privateData);
        batch.set(doc(parentViewLinksColRef, studentId), {
          classId: activeClassId,
          studentId,
          code: parentCode,
          updatedAt: new Date().toISOString(),
        });
        batch.set(doc(parentViewsColRef, parentCode), withoutUndefined(makeParentView(publicData) as unknown as Record<string, unknown>));

        privateStudentCache.set(studentId, privateData);
        latestFullData.students.push({ ...publicData, ...privateData });
      });

      await batch.commit();

      return {
        success: true,
        message: `Đã nạp thành công ${parsedList.length} học sinh vào hệ thống.`,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'students');
    }
  },

  regenerateParentCodes: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const batch = writeBatch(db);
      latestFullData.students.forEach((s) => {
        const oldCode = normalizeParentCode(String(privateStudentCache.get(s.id)?.parentCode || ''));
        const newCode = generateParentCode();
        // Strictly NEVER write parentCode to studentsColRef
        batch.set(
          doc(privateStudentColRef, s.id),
          { parentCode: newCode, updatedAt: new Date().toISOString() },
          { merge: true }
        );
        batch.set(doc(parentViewLinksColRef, s.id), {
          classId: activeClassId,
          studentId: s.id,
          code: newCode,
          updatedAt: new Date().toISOString(),
        });
        batch.set(doc(parentViewsColRef, newCode), withoutUndefined(makeParentView(s) as unknown as Record<string, unknown>));
        if (oldCode && oldCode !== newCode) batch.delete(doc(parentViewsColRef, oldCode));
        const existing = privateStudentCache.get(s.id) || { id: s.id };
        privateStudentCache.set(s.id, { ...existing, parentCode: newCode });
      });
      await batch.commit();
      return {
        success: true,
        message: 'Đã tạo mã phụ huynh ngẫu nhiên mới, cập nhật cổng tra cứu và vô hiệu hóa các mã cũ.',
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'students');
    }
  },

  // -------------------------------------------------------------
  // LOCKS & PERMISSIONS
  // -------------------------------------------------------------

  toggleDayLock: async (payload: {
    month: number;
    week: number;
    dayOfWeek: DayOfWeek;
    isLocked: boolean;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const lockId = `M${payload.month}_W${payload.week}_${payload.dayOfWeek}`;
      const currentSession = await api.getCurrentSession();
      const lockData: DayLock = {
        id: lockId,
        month: payload.month,
        week: payload.week,
        dayOfWeek: payload.dayOfWeek,
        isLocked: payload.isLocked,
        lockedBy: currentSession.username,
        lockedAt: new Date().toISOString(),
      };
      await setDoc(doc(dayLocksColRef, lockId), lockData);
      return {
        success: true,
        message: payload.isLocked ? `Đã khóa sổ ${payload.dayOfWeek} Tuần ${payload.week}.` : `Đã mở khóa sổ ${payload.dayOfWeek}.`,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `dayLocks/${payload.dayOfWeek}`);
    }
  },

  lockDay: async (payload: {
    month: number;
    week: number;
    dayOfWeek: DayOfWeek;
    isLocked: boolean;
  }) => {
    return api.toggleDayLock(payload);
  },

  toggleWeekLock: async (payload: {
    month: number;
    week: number;
    isLocked: boolean;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const lockId = `M${payload.month}_W${payload.week}`;
      const currentSession = await api.getCurrentSession();
      const lockData: WeekLock = {
        id: lockId,
        month: payload.month,
        week: payload.week,
        isLocked: payload.isLocked,
        lockedBy: currentSession.username,
        lockedAt: new Date().toISOString(),
      };
      await setDoc(doc(weekLocksColRef, lockId), lockData);
      return {
        success: true,
        message: payload.isLocked ? `Đã chốt sổ thi đua Tuần ${payload.week}.` : `Đã mở khóa sổ thi đua Tuần ${payload.week}.`,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `weekLocks/W${payload.week}`);
    }
  },

  lockWeek: async (payload: {
    month: number;
    week: number;
    isLocked: boolean;
  }) => {
    return api.toggleWeekLock(payload);
  },

  // -------------------------------------------------------------
  // GROUP BONUSES
  // -------------------------------------------------------------

  updateGroupBonus: async (payload: {
    month: number;
    week: number;
    groupNumber: number;
    bonusPoints: number;
    reason: string;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const bonusId = `M${payload.month}_W${payload.week}_G${payload.groupNumber}`;
      const bonusData: GroupBonus = {
        id: bonusId,
        month: payload.month,
        week: payload.week,
        groupNumber: payload.groupNumber,
        bonusPoints: payload.bonusPoints,
        reason: payload.reason,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(groupBonusesColRef, bonusId), bonusData);
      return { success: true, message: `Đã cập nhật điểm thưởng Tổ ${payload.groupNumber}.` };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `groupBonuses/${payload.groupNumber}`);
    }
  },

  saveGroupBonus: async (payload: {
    month: number;
    week: number;
    groupNumber: number;
    bonusPoints: number;
    reason: string;
  }) => {
    return api.updateGroupBonus(payload);
  },

  // -------------------------------------------------------------
  // TIMETABLE & HOMEWORK
  // -------------------------------------------------------------

  saveTimetableEntry: async (entry: Partial<TimetableEntry>): Promise<{ success: boolean; message: string }> => {
    try {
      const month = Number(entry.month) || latestFullData.config.activeMonth || 1;
      const week = Number(entry.week) || latestFullData.config.activeWeek || 1;
      const entryId = entry.id || `TT_M${month}_W${week}_${entry.dayOfWeek}_${entry.session || 'morning'}_${entry.period}`;
      const fullEntry: TimetableEntry = {
        id: entryId,
        month,
        week,
        dayOfWeek: entry.dayOfWeek || 'Thứ 2',
        session: entry.session || 'morning',
        period: entry.period || 1,
        subject: entry.subject || '',
        teacher: entry.teacher || '',
        lessonName: entry.lessonName || '',
        homework: entry.homework || '',
        materials: entry.materials || '',
        dueDate: entry.dueDate || '',
        tag: entry.tag || 'Bình thường',
        note: entry.note || '',
      };
      await setDoc(doc(timetableColRef, entryId), fullEntry);
      latestFullData.timetable = [
        ...latestFullData.timetable.filter((item) => item.id !== entryId),
        fullEntry,
      ];
      await safelySyncAllParentViews();
      return { success: true, message: 'Đã lưu thời khóa biểu thành công.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'timetable');
    }
  },

  deleteTimetableEntry: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      await deleteDoc(doc(timetableColRef, id));
      latestFullData.timetable = latestFullData.timetable.filter((item) => item.id !== id);
      await safelySyncAllParentViews();
      return { success: true, message: 'Đã xóa tiết học.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `timetable/${id}`);
    }
  },

  copyWeekTimetable: async (
    arg1: number | { sourceWeek: number; targetWeek: number; month?: number },
    fromWeek?: number,
    toMonth?: number,
    toWeek?: number
  ): Promise<{ success: boolean; message: string }> => {
    try {
      let srcW = 1;
      let tgtW = 2;
      let tgtM = 8;

      if (typeof arg1 === 'object') {
        srcW = arg1.sourceWeek;
        tgtW = arg1.targetWeek;
        tgtM = arg1.month || 8;
      } else {
        srcW = fromWeek || 1;
        tgtM = toMonth || 8;
        tgtW = toWeek || 2;
      }

      const currentTimetable = latestFullData.timetable.filter(entry => entry.week === srcW);
      if (currentTimetable.length === 0) {
        throw new Error(`Tuần ${srcW} chưa có thời khóa biểu để sao chép.`);
      }
      const batch = writeBatch(db);
      currentTimetable.forEach((entry) => {
        const newId = `TT_M${tgtM}_W${tgtW}_${entry.dayOfWeek}_${entry.session}_${entry.period}`;
        const copiedEntry = {
          ...entry,
          id: newId,
          month: tgtM,
          week: tgtW,
        };
        batch.set(doc(timetableColRef, newId), copiedEntry);
        latestFullData.timetable = [
          ...latestFullData.timetable.filter((item) => item.id !== newId),
          copiedEntry,
        ];
      });
      await batch.commit();
      await safelySyncAllParentViews();
      return { success: true, message: `Đã sao chép TKB sang Tuần ${tgtW}!` };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'timetable');
    }
  },

  batchPasteTimetable: async (
    arg:
      | Array<Partial<TimetableEntry>>
      | { month?: number; week?: number; timetableData: Array<Partial<TimetableEntry>> }
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const entries = Array.isArray(arg) ? arg : arg.timetableData || [];
      const month = Array.isArray(arg) ? undefined : arg.month;
      const week = Array.isArray(arg) ? undefined : arg.week;
      const batch = writeBatch(db);
      entries.forEach((entry) => {
        const entryMonth = Number(entry.month || month) || latestFullData.config.activeMonth || 1;
        const entryWeek = Number(entry.week || week) || latestFullData.config.activeWeek || 1;
        const session = entry.session || ((Number(entry.period) || 1) <= (Number(latestFullData.config.morningPeriods) || 5) ? 'morning' : 'afternoon');
        const id = entry.id || `TT_M${entryMonth}_W${entryWeek}_${entry.dayOfWeek}_${session}_${entry.period}`;
        const normalizedEntry = { ...entry, id, month: entryMonth, week: entryWeek, session };
        batch.set(doc(timetableColRef, id), normalizedEntry, { merge: true });
        const existing = latestFullData.timetable.find((item) => item.id === id);
        latestFullData.timetable = [
          ...latestFullData.timetable.filter((item) => item.id !== id),
          { ...(existing || {}), ...normalizedEntry } as TimetableEntry,
        ];
      });
      await batch.commit();
      await safelySyncAllParentViews();
      return { success: true, message: `Đã cập nhật ${entries.length} tiết học TKB.` };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'timetable');
    }
  },

  saveHomeworkTask: async (task: Partial<HomeworkTask>): Promise<{ success: boolean; message: string }> => {
    try {
      const taskId = task.id || `HW_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const currentSession = await api.getCurrentSession();
      const fullTask: HomeworkTask = {
        id: taskId,
        month: task.month || 8,
        week: task.week || 3,
        dayOfWeek: task.dayOfWeek || 'Thứ 2',
        subject: task.subject || '',
        title: task.title || '',
        content: task.content || '',
        dueDate: task.dueDate || '',
        createdBy: currentSession.username,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(homeworkColRef, taskId), fullTask);
      latestFullData.homeworkTasks = [
        ...latestFullData.homeworkTasks.filter((item) => item.id !== taskId),
        fullTask,
      ];
      await safelySyncAllParentViews();
      return { success: true, message: 'Đã lưu báo bài tập về nhà.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'homeworkTasks');
    }
  },

  deleteHomeworkTask: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      await deleteDoc(doc(homeworkColRef, id));
      latestFullData.homeworkTasks = latestFullData.homeworkTasks.filter((item) => item.id !== id);
      await safelySyncAllParentViews();
      return { success: true, message: 'Đã xóa nhiệm vụ báo bài.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `homeworkTasks/${id}`);
    }
  },

  // -------------------------------------------------------------
  // CLEANING DUTIES & ASSIGNMENTS
  // -------------------------------------------------------------

  saveCleaningDuty: async (duty: Partial<CleaningDutyEntry>): Promise<{ success: boolean; message: string }> => {
    try {
      const dutyId = duty.id || `DUTY_M${duty.month}_W${duty.week}_${duty.dayOfWeek}`;
      const fullDuty: CleaningDutyEntry = {
        id: dutyId,
        month: duty.month || 8,
        week: duty.week || 3,
        dayOfWeek: duty.dayOfWeek || 'Thứ 2',
        groupNumber: duty.groupNumber || 1,
        assignedStudents: duty.assignedStudents || [],
        tasks: duty.tasks || [],
        status: duty.status || 'pending',
        note: duty.note || '',
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(cleaningDutiesColRef, dutyId), fullDuty);
      return { success: true, message: 'Đã lưu phân công trực nhật.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'cleaningDuties');
    }
  },

  saveCleaningAssignment: async (assignment: Partial<CleaningAssignment>): Promise<{ success: boolean; message: string }> => {
    try {
      const assignmentId = assignment.id || `ASSIGN_${assignment.month}_${assignment.week}_${assignment.dayOfWeek}_${assignment.taskId}`;
      const fullAssignment: CleaningAssignment = {
        id: assignmentId,
        month: assignment.month || 8,
        week: assignment.week || 3,
        dayOfWeek: assignment.dayOfWeek || 'Thứ 2',
        taskId: assignment.taskId || '',
        taskName: assignment.taskName || '',
        studentIds: assignment.studentIds || [],
        studentNames: assignment.studentNames || [],
        status: assignment.status || 'pending',
        note: assignment.note || '',
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(cleaningAssignmentsColRef, assignmentId), fullAssignment);
      return { success: true, message: 'Đã lưu việc phân công trực nhật chi tiết.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'cleaningAssignments');
    }
  },

  deleteCleaningAssignment: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      await deleteDoc(doc(cleaningAssignmentsColRef, id));
      return { success: true, message: 'Đã xóa phân công trực nhật.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `cleaningAssignments/${id}`);
    }
  },

  copyWeekCleaning: async (
    arg1: number | { sourceWeek: number; targetWeek: number; month?: number },
    fromWeek?: number,
    toMonth?: number,
    toWeek?: number
  ): Promise<{ success: boolean; message: string }> => {
    try {
      let srcW = 1;
      let tgtW = 2;
      let tgtM = 8;

      if (typeof arg1 === 'object') {
        srcW = arg1.sourceWeek;
        tgtW = arg1.targetWeek;
        tgtM = arg1.month || 8;
      } else {
        srcW = fromWeek || 1;
        tgtM = toMonth || 8;
        tgtW = toWeek || 2;
      }

      const currentAssignments = latestFullData.cleaningAssignments.filter(
        (a) => a.week === srcW
      );
      const batch = writeBatch(db);
      currentAssignments.forEach((assign) => {
        const newId = `ASSIGN_${tgtM}_${tgtW}_${assign.dayOfWeek}_${assign.taskId}`;
        batch.set(doc(cleaningAssignmentsColRef, newId), {
          ...assign,
          id: newId,
          month: tgtM,
          week: tgtW,
          status: 'pending',
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
      return { success: true, message: `Đã sao chép lịch trực nhật sang Tuần ${tgtW}!` };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'cleaningAssignments');
    }
  },

  updateCleaningTasks: async (tasks: string[]): Promise<{ success: boolean; message: string }> => {
    return api.updateClassConfig({ cleaningTasks: tasks });
  },

  // -------------------------------------------------------------
  // REMINDERS & SCHOOL RANKINGS
  // -------------------------------------------------------------

  saveReminder: async (reminder: WeeklyReminder): Promise<{ success: boolean; message: string }> => {
    try {
      const reminderId = `REM_M${reminder.month}_W${reminder.week}`;
      await setDoc(doc(remindersColRef, reminderId), reminder);
      return { success: true, message: 'Đã lưu lời nhắc nề nếp tuần.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'reminders');
    }
  },

  deleteReminder: async (month: number, week: number): Promise<{ success: boolean; message: string }> => {
    try {
      const reminderId = `REM_M${month}_W${week}`;
      await deleteDoc(doc(remindersColRef, reminderId));
      return { success: true, message: 'Đã xóa lời nhắc tuần.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `reminders/${month}_${week}`);
    }
  },

  saveSchoolRank: async (
    rank: Partial<SchoolRankRecord> & { month?: number; week?: number }
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const m = Number(rank.month) || latestFullData.config.activeMonth || 8;
      const w = Number(rank.week) || latestFullData.config.activeWeek || 1;
      const rankId = rank.id || `RANK_M${m}_W${w}`;
      const competitionPoints = Number(rank.competitionPoints);
      const deductedPoints = Math.max(0, Number(rank.deductedPoints) || 0);
      const record: SchoolRankRecord = {
        id: rankId,
        month: m,
        week: w,
        schoolRank: Number(rank.schoolRank) || 1,
        totalSchoolClasses: Number(rank.totalSchoolClasses) || 30,
        gradeRank: Number(rank.gradeRank) || 1,
        totalGradeClasses: Number(rank.totalGradeClasses) || 10,
        competitionPoints: Number.isFinite(competitionPoints) ? competitionPoints : Math.max(0, 100 - deductedPoints),
        deductedPoints,
        deductionReason: String(rank.deductionReason || rank.note || '').trim(),
        updatedDate: rank.updatedDate || new Date().toISOString().split('T')[0],
        note: rank.note || '',
      };
      await setDoc(doc(schoolRankingsColRef, rankId), record);
      return { success: true, message: 'Đã cập nhật kết quả xếp hạng toàn trường.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'schoolRankings');
    }
  },

  deleteSchoolRank: async (idOrMonth: string | number, maybeWeek?: number): Promise<{ success: boolean; message: string }> => {
    try {
      const rankId = typeof idOrMonth === 'string' ? idOrMonth : `RANK_M${idOrMonth}_W${maybeWeek}`;
      await deleteDoc(doc(schoolRankingsColRef, rankId));
      return { success: true, message: 'Đã xóa kết quả xếp hạng tuần.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `schoolRankings/${idOrMonth}`);
    }
  },

  // -------------------------------------------------------------
  // PASSWORD UPDATE FOR GVCN (FIREBASE AUTH)
  // -------------------------------------------------------------

  updateGvcnPassword: async (newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!auth.currentUser) {
        throw new Error('Bạn cần đăng nhập tài khoản GVCN để đổi mật khẩu.');
      }
      await updatePassword(auth.currentUser, newPassword.trim());
      return {
        success: true,
        message: 'Đã đổi mật khẩu tài khoản GVCN trên Firebase Authentication thành công!',
      };
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        throw new Error('Phiên đăng nhập đã quá lâu. Vui lòng đăng xuất và đăng nhập lại trước khi đổi mật khẩu.');
      }
      throw new Error(err.message || 'Lỗi khi đổi mật khẩu.');
    }
  },

  // -------------------------------------------------------------
  // AUTHORIZED USERS (BCS / Assigned Class Managers)
  // -------------------------------------------------------------

  addAuthorizedUser: async (payload: {
    uid: string;
    email: string;
    displayName: string;
    role: 'bcs';
  }): Promise<{ success: boolean; message: string }> => {
    try {
      await setDoc(doc(membersColRef, payload.uid), {
        uid: payload.uid,
        email: payload.email,
        displayName: payload.displayName,
        role: payload.role,
        active: true,
        joinedAt: new Date().toISOString(),
      });
      return { success: true, message: `Đã cấp quyền Ban Cán Sự cho tài khoản ${payload.email}.` };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `authorizedUsers/${payload.uid}`);
    }
  },

  removeAuthorizedUser: async (uid: string): Promise<{ success: boolean; message: string }> => {
    try {
      await deleteDoc(doc(membersColRef, uid));
      return { success: true, message: 'Đã thu hồi quyền truy cập.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `authorizedUsers/${uid}`);
    }
  },
};
