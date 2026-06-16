import { User, Room, RoomParticipant, Quest, QuestSubmission, CosmeticCatalogItem, InventoryItem, ShopItem, PendingPurchase } from '../types';

// Helper to generate IDs
export const generateId = () => Math.random().toString(36).substring(2, 9);

// Device Fingerprint Simulator Helper
export interface DeviceFingerprint {
  id: string;
  name: string;
  userAgent: string;
}

export const DEMO_DEVICES: DeviceFingerprint[] = [
  { id: 'dev-safari-mac', name: 'MacBook Pro (Safari)', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15' },
  { id: 'dev-chrome-windows', name: 'Windows 11 (Chrome)', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  { id: 'dev-iphone-ios', name: 'iPhone 15 Pro (Safari)', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' },
  { id: 'dev-android-chrome', name: 'Samsung Galaxy S24 (Chrome)', userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36' },
];

export const getStoredDevice = (): DeviceFingerprint => {
  const stored = localStorage.getItem('eduquest_sim_device');
  if (stored) {
    return JSON.parse(stored);
  }
  return DEMO_DEVICES[0]; // Default device Macbook Safari
};

export const setStoredDevice = (device: DeviceFingerprint) => {
  localStorage.setItem('eduquest_sim_device', JSON.stringify(device));
};

// Seeding standard assets
export const SEED_COSMETICS: CosmeticCatalogItem[] = [
  { id: 'cos-avatar-nam', name: 'Avatar Nam (Mặc định)', type: 'avatar', filePath: 'default_nam.png', isDefault: true },
  { id: 'cos-avatar-nu', name: 'Avatar Nữ (Mặc định)', type: 'avatar', filePath: 'default_nu.png', isDefault: true },
  { id: 'cos-avatar-cyberpunk', name: 'Pháp sư Công nghệ (Cyberpunk)', type: 'avatar', filePath: 'avatar_cyberpunk.png', isDefault: false, minLevel: 3 },
  { id: 'cos-avatar-wizard', name: 'Tuyệt Đại Hiền Triết (Wizard)', type: 'avatar', filePath: 'avatar_wizard.png', isDefault: false, minLevel: 6 },
  { id: 'cos-avatar-scholar', name: 'Cú Đêm Học Thuật (Owl Scholar)', type: 'avatar', filePath: 'avatar_scholar.png', isDefault: false, minLevel: 1 },

  { id: 'cos-frame-wood', name: 'Khung Gỗ Tân Thủ', type: 'frame', filePath: 'frame_wood.png', isDefault: true },
  { id: 'cos-frame-bronze', name: 'Khung Đồng Học Giả', type: 'frame', filePath: 'frame_bronze.png', isDefault: false, minLevel: 5 },
  { id: 'cos-frame-silver', name: 'Khung Bạc Chuyên Gia', type: 'frame', filePath: 'frame_silver.png', isDefault: false, minLevel: 10 },
  { id: 'cos-frame-gold', name: 'Khung Vàng Bậc Thầy', type: 'frame', filePath: 'frame_gold.png', isDefault: false, minLevel: 15 },

  { id: 'cos-effect-sparkle', name: 'Hào Quang Sao Lấp Lánh', type: 'effect', filePath: 'effect_sparkle.gif', isDefault: false, minLevel: 7 },
  { id: 'cos-effect-neon', name: 'Viền Neon Cực Quang', type: 'effect', filePath: 'effect_neon_glow.mp4', isDefault: false, minLevel: 11 },
  { id: 'cos-effect-fire', name: 'Hoả Vân Long Phổ', type: 'effect', filePath: 'effect_fire_aura.json', isDefault: false, minLevel: 16 },
];

export interface Database {
  users: User[];
  rooms: Room[];
  participants: RoomParticipant[];
  quests: Quest[];
  submissions: QuestSubmission[];
  inventory: InventoryItem[];
  shopItems: ShopItem[];
  adminClasses: string[];
  wheelWeights?: Record<string, number>;
  shopApprovalRequired?: boolean;
  pendingPurchases?: PendingPurchase[];
  customCosmetics?: CosmeticCatalogItem[];
}

export const loadDatabase = (): Database => {
  const data = localStorage.getItem('eduquest_db');
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (!parsed.adminClasses) {
        parsed.adminClasses = ['Lớp 5A', 'Lớp 5B', 'Lớp 5C'];
      }
      if (!parsed.wheelWeights) {
        parsed.wheelWeights = { '1': 45, '2': 30, '3': 13, '4': 9, '5': 3 };
      }
      if (parsed.shopApprovalRequired === undefined) {
        parsed.shopApprovalRequired = true; // wait for teacher confirmation by default
      }
      if (!parsed.pendingPurchases) {
        parsed.pendingPurchases = [];
      }
      if (!parsed.customCosmetics) {
        parsed.customCosmetics = [];
      }
      return parsed as Database;
    } catch (e) {
      console.error("Failed to parse database", e);
    }
  }

  // First-time Seeding
  const users: User[] = [
    {
      id: 'usr-admin',
      role: 'admin',
      email: 'admin@eduquest.com',
      passwordHash: 'admin', // Simple cleartext password since it is a prototype
      fullName: 'Trần Quốc Bảo (Tổng Quản Trị)',
      activeAvatarPath: 'default_nam.png',
      activeFramePath: null,
      activeEffectPath: null,
    },
    {
      id: 'usr-teacher-1',
      role: 'teacher',
      email: 'bichvan@eduquest.com',
      passwordHash: 'password123',
      fullName: 'Cô Nguyễn Thị Bích Vân',
      isFirstLogin: true, // Needs mandatory password change
      activeAvatarPath: 'default_nu.png',
      activeFramePath: null,
      activeEffectPath: null,
    },
    {
      id: 'usr-teacher-2',
      role: 'teacher',
      email: 'duyhung@eduquest.com',
      passwordHash: 'password456',
      fullName: 'Thầy Trần Duy Hưng',
      isFirstLogin: true, // Needs mandatory password change
      activeAvatarPath: 'default_nam.png',
      activeFramePath: null,
      activeEffectPath: null,
    },
    {
      id: 'usr-student-1',
      role: 'student',
      fullName: 'Lê Minh Triết',
      studentCode: 'HS-2026-001',
      registeredDeviceId: null, // First login will lock to active device!
      activeAvatarPath: 'default_nam.png',
      activeFramePath: null,
      activeEffectPath: null,
      adminClass: 'Lớp 5A',
    },
    {
      id: 'usr-student-2',
      role: 'student',
      fullName: 'Phạm Đăng Khoa',
      studentCode: 'HS-2026-002',
      registeredDeviceId: 'dev-chrome-windows', // Already locked to Windows 11 Chrome!
      activeAvatarPath: 'avatar_scholar.png',
      activeFramePath: 'frame_wood.png',
      activeEffectPath: null,
      adminClass: 'Lớp 5A',
    },
  ];

  const rooms: Room[] = [
    { id: 'room-1', roomName: 'Tin Học Khóa 5A', description: 'Học lập trình kéo thả Scratch và tư duy thuật toán nâng cao.', teacherId: 'usr-teacher-1', inviteCode: 'TINHOC5A' },
    { id: 'room-2', roomName: 'Công Nghệ Khóa 5B', description: 'Khám phá thế giới IoT và lắp ráp mạch điện thông minh trẻ em.', teacherId: 'usr-teacher-2', inviteCode: 'CONGNGHE5B' },
  ];

  const participants: RoomParticipant[] = [
    { id: 'part-1', roomId: 'room-1', studentId: 'usr-student-1', currentXp: 80, currentLevel: 1, goldBalance: 150, luckySpins: 2 },
    { id: 'part-2', roomId: 'room-1', studentId: 'usr-student-2', currentXp: 120, currentLevel: 5, goldBalance: 350, luckySpins: 1 },
    { id: 'part-3', roomId: 'room-2', studentId: 'usr-student-1', currentXp: 20, currentLevel: 1, goldBalance: 50, luckySpins: 0 },
  ];

  const quests: Quest[] = [
    {
      id: 'quest-1',
      roomId: 'room-1',
      title: 'Lập trình Scratch Cơ Bản',
      description: 'Hoàn thành bài kiểm tra ngắn về khối lệnh Motion và Loops trong Scratch. Trả lời đúng cả 3 câu hỏi để hoàn thành xuất sắc!',
      questType: 'quiz',
      quizData: [
        {
          question: 'Khối lệnh nào được dùng để thực hiện di chuyển nhân vật về phía trước?',
          options: ['say Hello for 2 seconds', 'move 10 steps', 'turn right 15 degrees', 'go to random position'],
          correctAnswer: 1
        },
        {
          question: 'Khối lệnh lặp "repeat 10" thuộc nhóm khối lệnh màu nào?',
          options: ['Màu vàng nhạt (Events)', 'Màu hồng (My Blocks)', 'Màu xanh lục (Operators)', 'Màu cam (Control)'],
          correctAnswer: 3
        },
        {
          question: 'Để nhân vật nhảy lên và rơi xuống như tác dụng của trọng lực, ta điều chỉnh trục nào?',
          options: ['Trục X', 'Trục Y', 'Trục Z', 'Góc hướng đi (Direction)'],
          correctAnswer: 1
        },
      ],
      rewardXp: 125,
      rewardGold: 100,
      penaltyXp: 20,
      deadline: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(), // 2 days in future
    },
    {
      id: 'quest-2',
      roomId: 'room-1',
      title: 'Tự động hóa Slide PowerPoint',
      description: 'Nộp tệp tin Scratch (.sb3) hoặc mô tả thuật toán trình chiếu PowerPoint chuyển trang kết hợp animation nâng cao.',
      questType: 'file',
      rewardXp: 150,
      rewardGold: 80,
      penaltyXp: 30,
      deadline: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(), // 4 days in future
    },
    {
      id: 'quest-o-1',
      roomId: 'room-1',
      title: '[Quá hạn] Luyện gõ phím 10 ngón',
      description: 'Nhiệm vụ rèn luyện gõ phím nhanh đạt tốc độ tối thiểu 35 WPM. Hạn nộp đã trôi qua hôm qua.',
      questType: 'quiz',
      quizData: [
        {
          question: 'Phím F và J trên bàn phím có gờ nổi biểu trưng điều gì?',
          options: ['Đặt ngón tay cái vào vị trí này', 'Đặt hai ngón tay trỏ làm điểm tựa chuẩn mực', 'Các phím này dễ bấm hỏng nhất', 'Dùng gõ dấu câu tiếng Việt'],
          correctAnswer: 1
        }
      ],
      rewardXp: 100,
      rewardGold: 60,
      penaltyXp: 40,
      deadline: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), // Yesterday
    }
  ];

  const submissions: QuestSubmission[] = [
    {
      id: 'sub-1',
      questId: 'quest-1',
      studentId: 'usr-student-2',
      submissionValue: JSON.stringify([1, 3, 1]), // answers chosen by student 2 (all correct)
      status: 'passed',
      submittedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      gradedAt: new Date(Date.now() - 3500 * 1000).toISOString()
    }
  ];

  const inventory: InventoryItem[] = [
    // Starting defaults
    { id: 'inv-def-1', studentId: 'usr-student-1', roomId: 'room-1', cosmeticId: 'cos-avatar-nam', status: 'used', unlockedAt: new Date().toISOString() },
    { id: 'inv-def-2', studentId: 'usr-student-1', roomId: 'room-1', cosmeticId: 'cos-frame-wood', status: 'unused', unlockedAt: new Date().toISOString() },
    { id: 'inv-def-3', studentId: 'usr-student-2', roomId: 'room-1', cosmeticId: 'cos-avatar-scholar', status: 'used', unlockedAt: new Date().toISOString() },
    { id: 'inv-def-4', studentId: 'usr-student-2', roomId: 'room-1', cosmeticId: 'cos-frame-wood', status: 'used', unlockedAt: new Date().toISOString() },
  ];

  const shopItems: ShopItem[] = [
    { id: 'shop-1', roomId: 'room-1', itemName: 'Bình nước Phi Hành Gia 3D', description: 'Thực tế! Nhận trực tiếp tại tủ đồ của Giáo viên Vân.', coinPrice: 200, stock: 4 },
    { id: 'shop-2', roomId: 'room-1', itemName: 'Bóng Cầu Vồng Lực Học', description: 'Đồ chơi giảm căng thẳng cực độc đáo hít bóng khí dẻo dai.', coinPrice: 80, stock: 15 },
    { id: 'shop-3', roomId: 'room-1', itemName: 'Thẻ Miễn Bài Tập Về Nhà (Homework Free Pass)', description: 'Sử dụng để thông qua ngay lập tức mọi bài tập về nhà được thầy/cô giao phó.', coinPrice: 150, stock: -1 },
    { id: 'shop-4', roomId: 'room-1', itemName: 'Bao Thăng Cấp Thần Tốc (+100 XP)', description: 'Tăng ngay 100 điểm kinh nghiệm trực tiếp vào lớp học hiện thời.', coinPrice: 120, stock: -1 },
  ];

  const initialDb: Database = {
    users,
    rooms,
    participants,
    quests,
    submissions,
    inventory,
    shopItems,
    adminClasses: ['Lớp 5A', 'Lớp 5B', 'Lớp 5C'],
    wheelWeights: { '1': 45, '2': 30, '3': 13, '4': 9, '5': 3 },
    shopApprovalRequired: true,
    pendingPurchases: [],
    customCosmetics: [],
  };

  saveDatabase(initialDb);
  return initialDb;
};

export const saveDatabase = (db: Database) => {
  localStorage.setItem('eduquest_db', JSON.stringify(db));
};

// Automation loops trigger helper
export const runDailyAutomationLoop = (): { penalisedCount: number; changedIds: string[] } => {
  const db = loadDatabase();
  const now = new Date();
  let penalisedCount = 0;
  const changedIds: string[] = [];

  // 1. Quét quests quá hạn và chưa hoàn thành
  db.quests.forEach(quest => {
    const deadlineDate = new Date(quest.deadline);
    if (deadlineDate < now) {
      // Find students in this room
      const participantsInRoom = db.participants.filter(p => p.roomId === quest.roomId);
      
      participantsInRoom.forEach(p => {
        // Check if student has submitted this quest
        const submission = db.submissions.find(sub => sub.questId === quest.id && sub.studentId === p.studentId);
        
        // If not submitted or still pending (not passed yet)
        if (!submission || (submission.status !== 'passed' && submission.status !== 'failed')) {
          let currentSub = submission;
          if (!currentSub) {
            currentSub = {
              id: 'sub-auto-' + generateId(),
              questId: quest.id,
              studentId: p.studentId,
              status: 'failed',
              submittedAt: undefined,
              gradedAt: now.toISOString()
            };
            db.submissions.push(currentSub);
          } else {
            currentSub.status = 'failed';
            currentSub.gradedAt = now.toISOString();
          }

          // Penalize student
          const originalXp = p.currentXp;
          p.currentXp = Math.max(0, p.currentXp - quest.penaltyXp);
          
          penalisedCount++;
          changedIds.push(`${p.studentId}-${quest.id}`);
        }
      });
    }
  });

  if (penalisedCount > 0) {
    saveDatabase(db);
  }

  return { penalisedCount, changedIds };
};
