import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  orderBy,
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
  CLASS_ID,
  TEACHER_EMAIL,
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
} from '../types';

// Root class document reference
const classDocRef = doc(db, 'classes', CLASS_ID);

// Subcollection references
const studentsColRef = collection(db, 'classes', CLASS_ID, 'students');
const privateStudentColRef = collection(db, 'classes', CLASS_ID, 'privateStudentData');
const rulesColRef = collection(db, 'classes', CLASS_ID, 'pointRules');
const transactionsColRef = collection(db, 'classes', CLASS_ID, 'transactions');
const dayLocksColRef = collection(db, 'classes', CLASS_ID, 'dayLocks');
const weekLocksColRef = collection(db, 'classes', CLASS_ID, 'weekLocks');
const groupBonusesColRef = collection(db, 'classes', CLASS_ID, 'groupBonuses');
const schoolRankingsColRef = collection(db, 'classes', CLASS_ID, 'schoolRankings');
const timetableColRef = collection(db, 'classes', CLASS_ID, 'timetable');
const homeworkColRef = collection(db, 'classes', CLASS_ID, 'homeworkTasks');
const cleaningDutiesColRef = collection(db, 'classes', CLASS_ID, 'cleaningDuties');
const remindersColRef = collection(db, 'classes', CLASS_ID, 'reminders');
const cleaningAssignmentsColRef = collection(db, 'classes', CLASS_ID, 'cleaningAssignments');
const auditLogsColRef = collection(db, 'classes', CLASS_ID, 'auditLogs');
const authorizedUsersColRef = collection(db, 'classes', CLASS_ID, 'authorizedUsers');

// Default initial config
export const DEFAULT_INITIAL_CONFIG: ClassConfig = {
  id: CLASS_ID,
  className: '11B6',
  schoolName: 'Trường THCS & THPT Lê Lợi',
  academicYear: '2026 – 2027',
  teacherName: 'Cô Võ Thị Kim Liên',
  themeTitle: 'Vườn Ươm 11B6 - Nơi Ươm Mầm Tri Thức & Nhân Cách',
  slogan: 'Mỗi tuần một bước tiến – Cùng nhau vun đắp',
  week1StartDate: '2026-08-03',
  totalWeeks: 38,
  activeMonth: 8,
  activeWeek: 3,
  periodsPerDay: 8,
  morningPeriods: 5,
  afternoonPeriods: 3,
  scheduleStructure: 'standard8',
  subjects: [
    'Toán', 'Ngữ Văn', 'Tiếng Anh', 'Vật Lý', 'Hóa Học', 'Sinh Học',
    'Lịch Sử', 'Địa Lý', 'GDCD', 'Tin Học', 'Công Nghệ', 'Thể Dục',
    'HĐTN-HN', 'Chào cờ', 'Sinh hoạt lớp'
  ],
  cleaningTasks: [
    'Quét lớp & hành lang',
    'Lau sàn & lau bảng',
    'Kê ngay ngắn bàn ghế',
    'Đổ rác & thay túi mới',
    'Kiểm tra cửa sổ, quạt & đèn',
    'Tưới cây góc xanh'
  ],
};

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

// In-memory cache for instant real-time sync
let latestFullData: FullClassData = {
  config: DEFAULT_INITIAL_CONFIG,
  students: [],
  rules: DEFAULT_RULES,
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
};

// Listeners tracking
const activeUnsubscribes: Unsubscribe[] = [];
const authDependentUnsubscribes: Unsubscribe[] = [];
const privateStudentCache = new Map<string, PrivateStudentData>();

export const api = {
  // -------------------------------------------------------------
  // AUTHENTICATION (Firebase Authentication onAuthStateChanged)
  // -------------------------------------------------------------

  login: async (payload: {
    email: string;
    password?: string;
  }): Promise<{ success: boolean; session: UserSession; message: string }> => {
    const { email, password } = payload;
    const cleanEmail = (email || TEACHER_EMAIL).trim();

    if (!password) {
      throw new Error('Vui lòng nhập mật khẩu tài khoản.');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const isTeacher = userCredential.user.email?.toLowerCase() === TEACHER_EMAIL.toLowerCase();

      let role: UserRole = 'guest';
      let username = userCredential.user.email || 'Người dùng';

      if (isTeacher) {
        role = 'gvcn';
        username = 'Cô Võ Thị Kim Liên (GVCN)';
      } else {
        // Check if user is in authorizedUsers collection
        try {
          const authUserDoc = await getDoc(doc(authorizedUsersColRef, userCredential.user.uid));
          if (authUserDoc.exists()) {
            role = 'bcs';
            username = authUserDoc.data().displayName || `Ban Cán Sự (${userCredential.user.email})`;
          } else {
            role = 'student';
          }
        } catch {
          role = 'student';
        }
      }

      const session: UserSession = {
        role,
        username,
        expiresAt: Date.now() + 7 * 24 * 3600 * 1000,
      };

      return {
        success: true,
        session,
        message: `Đăng nhập thành công (${cleanEmail}).`,
      };
    } catch (err: any) {
      let msg = 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Mật khẩu không chính xác.';
      } else if (err.code === 'auth/user-not-found') {
        msg = `Tài khoản ${cleanEmail} chưa tồn tại trên Firebase Authentication. Vui lòng đăng ký trên Firebase Console.`;
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
  },

  getCurrentSession: async (): Promise<UserSession> => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      return {
        role: 'guest',
        username: 'Khách / Thành Viên Lớp',
        expiresAt: 0,
      };
    }

    const isTeacher = currentUser.email.toLowerCase() === TEACHER_EMAIL.toLowerCase();
    if (isTeacher) {
      return {
        role: 'gvcn',
        username: 'Cô Võ Thị Kim Liên (GVCN)',
        expiresAt: Date.now() + 7 * 24 * 3600 * 1000,
      };
    }

    // Check authorizedUsers
    try {
      const authUserDoc = await getDoc(doc(authorizedUsersColRef, currentUser.uid));
      if (authUserDoc.exists()) {
        return {
          role: 'bcs',
          username: authUserDoc.data().displayName || `Ban Cán Sự (${currentUser.email})`,
          expiresAt: Date.now() + 7 * 24 * 3600 * 1000,
        };
      }
    } catch {
      // Fall through
    }

    return {
      role: 'student',
      username: currentUser.email,
      expiresAt: Date.now() + 7 * 24 * 3600 * 1000,
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

      const isTeacher = user.email.toLowerCase() === TEACHER_EMAIL.toLowerCase();
      if (isTeacher) {
        callback({
          role: 'gvcn',
          username: 'Cô Võ Thị Kim Liên (GVCN)',
          expiresAt: Date.now() + 7 * 24 * 3600 * 1000,
        });
        return;
      }

      try {
        const authUserDoc = await getDoc(doc(authorizedUsersColRef, user.uid));
        if (authUserDoc.exists()) {
          callback({
            role: 'bcs',
            username: authUserDoc.data().displayName || `Ban Cán Sự (${user.email})`,
            expiresAt: Date.now() + 7 * 24 * 3600 * 1000,
          });
          return;
        }
      } catch {
        // Fall through
      }

      callback({
        role: 'student',
        username: user.email,
        expiresAt: Date.now() + 7 * 24 * 3600 * 1000,
      });
    });
  },

  // -------------------------------------------------------------
  // REAL-TIME FIRESTORE SUBSCRIPTIONS
  // -------------------------------------------------------------

  subscribeFullClassData: (callback: (data: FullClassData) => void): (() => void) => {
    if (!isFirebaseConfigured()) {
      callback(latestFullData);
      return () => {};
    }

    // Clean previous subscriptions if any
    activeUnsubscribes.forEach((unsub) => unsub());
    activeUnsubscribes.length = 0;

    const notifyUpdate = () => {
      callback({ ...latestFullData });
    };

    try {
      // 1. Class Config Doc
      const unsubConfig = onSnapshot(
        classDocRef,
        (snap) => {
          if (snap.exists()) {
            latestFullData.config = {
              ...DEFAULT_INITIAL_CONFIG,
              ...snap.data(),
              id: snap.id,
            } as ClassConfig;
          } else {
            latestFullData.config = DEFAULT_INITIAL_CONFIG;
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
          const publicStudents = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as PublicStudent[];

          latestFullData.students = publicStudents.map((ps) => {
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
            latestFullData.rules = snap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            })) as PointRule[];
          } else {
            latestFullData.rules = DEFAULT_RULES;
          }
          notifyUpdate();
        },
        (err) => console.warn('Rules snapshot error:', err)
      );
      activeUnsubscribes.push(unsubRules);

      // 4. Authenticated Subscriptions: Point Transactions & Private Student Data
      const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
        // Clean previous auth-dependent subscriptions
        authDependentUnsubscribes.forEach((u) => u());
        authDependentUnsubscribes.length = 0;

        if (currentUser) {
          const isTeacher =
            currentUser.email?.toLowerCase() === TEACHER_EMAIL.toLowerCase() ||
            currentUser.email?.toLowerCase() === 'vothikimlien.pq@gmail.com';

          let isAuthorized = isTeacher;
          if (!isAuthorized) {
            try {
              const authDoc = await getDoc(doc(authorizedUsersColRef, currentUser.uid));
              if (authDoc.exists()) isAuthorized = true;
            } catch {
              isAuthorized = false;
            }
          }

          if (isAuthorized) {
            // Subscribe to transactions
            const unsubTx = onSnapshot(
              transactionsColRef,
              (snap) => {
                latestFullData.transactions = snap.docs.map((d) => ({
                  id: d.id,
                  ...d.data(),
                })) as PointTransaction[];
                notifyUpdate();
              },
              (err) => {
                console.warn('Transactions snapshot error:', err);
                latestFullData.transactions = [];
                notifyUpdate();
              }
            );
            authDependentUnsubscribes.push(unsubTx);
          } else {
            latestFullData.transactions = [];
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
                latestFullData.students = latestFullData.students.map((s) => {
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
            latestFullData.students = latestFullData.students.map((s) => ({
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
          latestFullData.transactions = [];
          latestFullData.students = latestFullData.students.map((s) => ({
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
          latestFullData.dayLocks = snap.docs.map((d) => ({
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
          latestFullData.weekLocks = snap.docs.map((d) => ({
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
          latestFullData.groupBonuses = snap.docs.map((d) => ({
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
          latestFullData.schoolRankings = snap.docs.map((d) => ({
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
          latestFullData.timetable = snap.docs.map((d) => ({
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
          latestFullData.homeworkTasks = snap.docs.map((d) => ({
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
          latestFullData.cleaningDuties = snap.docs.map((d) => ({
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
          latestFullData.reminders = snap.docs.map((d) => ({
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
          latestFullData.cleaningAssignments = snap.docs.map((d) => ({
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
      activeUnsubscribes.forEach((unsub) => unsub());
      activeUnsubscribes.length = 0;
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

  initializeClassData: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const batch = writeBatch(db);

      // 1. Set Class Config
      batch.set(classDocRef, DEFAULT_INITIAL_CONFIG, { merge: true });

      // 2. Set Standard 30 Rules
      DEFAULT_RULES.forEach((rule) => {
        const ruleDoc = doc(rulesColRef, rule.id);
        batch.set(ruleDoc, rule);
      });

      await batch.commit();

      return {
        success: true,
        message: 'Khởi tạo cấu hình và 30 quy chế thi đua Lớp 11B6 lên Cloud Firestore thành công!',
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'classes/11b6-2026-2027');
    }
  },

  // -------------------------------------------------------------
  // CONFIG MANAGEMENT
  // -------------------------------------------------------------

  updateClassConfig: async (config: Partial<ClassConfig>): Promise<{ success: boolean; message: string }> => {
    try {
      await setDoc(classDocRef, config, { merge: true });
      return { success: true, message: 'Cập nhật cấu hình lớp học thành công!' };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'classes/11b6-2026-2027');
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
      const qty = payload.quantity || 1;
      const totalPts = payload.points * qty;
      const txId = `TX_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      const currentSession = await api.getCurrentSession();
      const newTx: PointTransaction = {
        id: txId,
        studentId: payload.studentId,
        studentName: payload.studentName,
        groupNumber: payload.groupNumber,
        month: payload.month,
        week: payload.week,
        dayOfWeek: payload.dayOfWeek,
        ruleId: payload.ruleId,
        ruleContent: payload.ruleContent,
        type: payload.type,
        points: payload.points,
        quantity: qty,
        totalPoints: totalPts,
        subject: payload.subject,
        examType: payload.examType,
        reason: payload.reason,
        createdBy: currentSession.username,
        creatorRole: currentSession.role === 'gvcn' ? 'gvcn' : 'bcs',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(transactionsColRef, txId), newTx);

      return {
        success: true,
        transaction: newTx,
        message: `Đã ghi nhận ${payload.type === 'plus' ? 'điểm cộng' : 'điểm trừ'} cho học sinh ${payload.studentName}.`,
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
      const updateData = {
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(txDocRef, updateData);
      return {
        success: true,
        transaction: { ...payload, id } as PointTransaction,
        message: 'Đã cập nhật mục thi đua.',
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `transactions/${id}`);
    }
  },

  deleteTransaction: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      await deleteDoc(doc(transactionsColRef, id));
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
      const parentCode = studentData.parentCode || `PH11B6-${orderNumber < 10 ? '0' + orderNumber : orderNumber}`;

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
      await batch.commit();

      // Update cache
      privateStudentCache.set(studentId, privateData);

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
      if (studentData.parentCode !== undefined) privateUpdates.parentCode = studentData.parentCode;
      if (studentData.notes !== undefined) privateUpdates.notes = studentData.notes;

      if (Object.keys(privateUpdates).length > 0) {
        privateUpdates.updatedAt = new Date().toISOString();
        batch.set(doc(privateStudentColRef, id), privateUpdates, { merge: true });

        // Update local cache
        const existingPrivate = privateStudentCache.get(id) || { id };
        privateStudentCache.set(id, { ...existingPrivate, ...privateUpdates });
      }

      await batch.commit();

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
      const batch = writeBatch(db);
      batch.delete(doc(studentsColRef, id));
      batch.delete(doc(privateStudentColRef, id));
      await batch.commit();
      privateStudentCache.delete(id);
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
        const parentCode = s.parentCode || `PH11B6-${orderNum < 10 ? '0' + orderNum : orderNum}`;

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

        privateStudentCache.set(studentId, privateData);
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
        const order = s.orderNumber || 1;
        const newCode = `PH11B6-${order < 10 ? '0' + order : order}`;
        // Strictly NEVER write parentCode to studentsColRef
        batch.set(
          doc(privateStudentColRef, s.id),
          { parentCode: newCode, updatedAt: new Date().toISOString() },
          { merge: true }
        );
        const existing = privateStudentCache.get(s.id) || { id: s.id };
        privateStudentCache.set(s.id, { ...existing, parentCode: newCode });
      });
      await batch.commit();
      return {
        success: true,
        message: 'Đã tái tạo mã phụ huynh chuẩn vào vùng dữ liệu riêng tư.',
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
      const entryId = entry.id || `TT_${entry.dayOfWeek}_${entry.session || 'morning'}_${entry.period}`;
      const fullEntry: TimetableEntry = {
        id: entryId,
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
      return { success: true, message: 'Đã lưu thời khóa biểu thành công.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'timetable');
    }
  },

  deleteTimetableEntry: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      await deleteDoc(doc(timetableColRef, id));
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

      const currentTimetable = latestFullData.timetable;
      const batch = writeBatch(db);
      currentTimetable.forEach((entry) => {
        const newId = `TT_M${tgtM}_W${tgtW}_${entry.dayOfWeek}_${entry.session}_${entry.period}`;
        batch.set(doc(timetableColRef, newId), {
          ...entry,
          id: newId,
          month: tgtM,
          week: tgtW,
        });
      });
      await batch.commit();
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
      const batch = writeBatch(db);
      entries.forEach((entry) => {
        const id = entry.id || `TT_${entry.dayOfWeek}_${entry.session || 'morning'}_${entry.period}`;
        batch.set(doc(timetableColRef, id), { ...entry, id }, { merge: true });
      });
      await batch.commit();
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
      return { success: true, message: 'Đã lưu báo bài tập về nhà.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'homeworkTasks');
    }
  },

  deleteHomeworkTask: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      await deleteDoc(doc(homeworkColRef, id));
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
      const m = rank.month || 8;
      const w = rank.week || 3;
      const rankId = rank.id || `RANK_M${m}_W${w}`;
      const record: SchoolRankRecord = {
        id: rankId,
        month: m,
        week: w,
        schoolRank: Number(rank.schoolRank) || 1,
        totalSchoolClasses: Number(rank.totalSchoolClasses) || 30,
        gradeRank: Number(rank.gradeRank) || 1,
        totalGradeClasses: Number(rank.totalGradeClasses) || 10,
        competitionPoints: Number(rank.competitionPoints) || 100,
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
      await setDoc(doc(authorizedUsersColRef, payload.uid), {
        uid: payload.uid,
        email: payload.email,
        displayName: payload.displayName,
        role: payload.role,
        grantedAt: new Date().toISOString(),
      });
      return { success: true, message: `Đã cấp quyền Ban Cán Sự cho tài khoản ${payload.email}.` };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `authorizedUsers/${payload.uid}`);
    }
  },

  removeAuthorizedUser: async (uid: string): Promise<{ success: boolean; message: string }> => {
    try {
      await deleteDoc(doc(authorizedUsersColRef, uid));
      return { success: true, message: 'Đã thu hồi quyền truy cập.' };
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `authorizedUsers/${uid}`);
    }
  },
};
