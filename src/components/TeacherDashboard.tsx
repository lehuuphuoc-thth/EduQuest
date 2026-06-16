import React, { useState } from 'react';
import { Database, saveDatabase, generateId, SEED_COSMETICS } from '../utils/db';
import { User, Room, Quest, ShopItem, QuizQuestion, PendingPurchase, CosmeticCatalogItem } from '../types';
import { BookOpen, Award, Plus, Coins, Settings, UserCheck, ShieldAlert, Sparkles, Gift, Trash2, Calendar, ClipboardCheck, Edit3, Check, X, Image, Upload } from 'lucide-react';
import { AvatarWithCosmetics } from './AvatarWithCosmetics';

interface TeacherDashboardProps {
  teacher: User;
  db: Database;
  onRefreshDb: () => void;
  onUpdateTeacherProfile: (updatedProfile: User) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  teacher,
  db,
  onRefreshDb,
  onUpdateTeacherProfile,
}) => {
  // 1. Password overlays for first time login enforce
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [passError, setPassError] = useState('');

  // 2. Class / Room Operations
  const [selectedRoomId, setSelectedRoomId] = useState<string>(db.rooms.find(r => r.teacherId === teacher.id)?.id || '');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('Tin Học');
  const [selectedAdminClass, setSelectedAdminClass] = useState(db.adminClasses && db.adminClasses.length > 0 ? db.adminClasses[0] : 'Lớp 5A');
  const [newRoomDesc, setNewRoomDesc] = useState('');

  // Editing Room states
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [editSubjectName, setEditSubjectName] = useState('');
  const [editAdminClass, setEditAdminClass] = useState('');
  const [editRoomDesc, setEditRoomDesc] = useState('');

  // 3. Quest Architect
  const [isCreatingQuest, setIsCreatingQuest] = useState(false);
  const [questTitle, setQuestTitle] = useState('');
  const [questDesc, setQuestDesc] = useState('');
  const [questType, setQuestType] = useState<'quiz' | 'file'>('quiz');
  const [rewardXp, setRewardXp] = useState(100);
  const [rewardGold, setRewardGold] = useState(50);
  const [penaltyXp, setPenaltyXp] = useState(15);
  const [deadlineDays, setDeadlineDays] = useState(3);

  // Quiz Builder Inside Quest Architect
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    { question: '', options: ['', '', '', ''], correctAnswer: 0 }
  ]);

  // 4. Shop Settings
  const [editingShopItem, setEditingShopItem] = useState<ShopItem | null>(null);
  const [isCreatingShopItem, setIsCreatingShopItem] = useState(false);
  const [shopItemName, setShopItemName] = useState('');
  const [shopItemPrice, setShopItemPrice] = useState(100);
  const [shopItemStock, setShopItemStock] = useState(-1);
  const [shopItemDesc, setShopItemDesc] = useState('');
  const [shopItemImageUrl, setShopItemImageUrl] = useState('');

  // Lucky wheel rates and shop configuration
  const [weight1, setWeight1] = useState<number>(db.wheelWeights ? Number(db.wheelWeights['1'] ?? 45) : 45);
  const [weight2, setWeight2] = useState<number>(db.wheelWeights ? Number(db.wheelWeights['2'] ?? 30) : 30);
  const [weight3, setWeight3] = useState<number>(db.wheelWeights ? Number(db.wheelWeights['3'] ?? 13) : 13);
  const [weight4, setWeight4] = useState<number>(db.wheelWeights ? Number(db.wheelWeights['4'] ?? 9) : 9);
  const [weight5, setWeight5] = useState<number>(db.wheelWeights ? Number(db.wheelWeights['5'] ?? 3) : 3);
  const [shopApprovalState, setShopApprovalState] = useState<boolean>(db.shopApprovalRequired !== false);

  // Custom Avatar/Cosmetic upload form state
  const [isCreatingCustomCosmetic, setIsCreatingCustomCosmetic] = useState(false);
  const [customCosmeticName, setCustomCosmeticName] = useState('');
  const [customCosmeticType, setCustomCosmeticType] = useState<'avatar' | 'frame' | 'effect'>('avatar');
  const [customCosmeticPath, setCustomCosmeticPath] = useState('');
  const [customCosmeticMinLevel, setCustomCosmeticMinLevel] = useState(1);
  const [confirmDeleteRoomId, setConfirmDeleteRoomId] = useState<string | null>(null);

  // 5. Quick actions student picker
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [xpAdjustmentValue, setXpAdjustmentValue] = useState<number>(10);
  const [goldAdjustmentValue, setGoldAdjustmentValue] = useState<number>(10);
  const [selectedGiftId, setSelectedGiftId] = useState<string>(SEED_COSMETICS[2].id); // default cyberpunk spellcaster
  const [giftRecipient, setGiftRecipient] = useState<string>('all-rooms');
  const [giftSuccessMessage, setGiftSuccessMessage] = useState<string | null>(null);

  const myRooms = db.rooms.filter(r => r.teacherId === teacher.id);
  const activeRoom = db.rooms.find(r => r.id === selectedRoomId);
  const activeRoomParticipants = db.participants.filter(p => p.roomId === selectedRoomId);
  
  // Find all student details for this room
  const studentsInActiveRoom = db.users.filter(u => 
    u.role === 'student' && 
    activeRoomParticipants.some(p => p.studentId === u.id)
  );

  const handleForcePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');

    if (newPass.length < 6) {
      setPassError("Mật khẩu mới phải đạt tối thiểu 6 ký tự bảo mật!");
      return;
    }
    if (newPass !== confirmNewPass) {
      setPassError("Mật khẩu xác nhận không khớp!");
      return;
    }

    const updatedProfile = {
      ...teacher,
      passwordHash: newPass,
      isFirstLogin: false,
    };

    // Save profile change
    const updatedUsers = [...db.users];
    const uIdx = updatedUsers.findIndex(u => u.id === teacher.id);
    if (uIdx !== -1) {
      updatedUsers[uIdx] = updatedProfile;
    }
    db.users = updatedUsers;
    saveDatabase(db);
    onUpdateTeacherProfile(updatedProfile);
    onRefreshDb();
    alert("Kích hoạt bảo mật thành công! Chào mừng Thầy/Cô gia nhập giảng đường EduQuest.");
  };

  const getAvailableGrades = (adminClasses: string[]) => {
    const grades = new Set<string>();
    adminClasses.forEach(cls => {
      const match = cls.match(/\d+/);
      if (match) {
        grades.add(`Khối ${match[0]}`);
      } else {
        if (cls.includes('Ba') || cls.includes('3')) grades.add('Khối 3');
        else if (cls.includes('Bốn') || cls.includes('4')) grades.add('Khối 4');
        else if (cls.includes('Năm') || cls.includes('5')) grades.add('Khối 5');
      }
    });
    return Array.from(grades).sort();
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const isGrade = selectedAdminClass.startsWith('Khối');
    const finalRoomName = `${newSubjectName.trim()} - ${selectedAdminClass}`;
    if (!newSubjectName.trim()) {
      alert("Vui lòng điền tên môn học!");
      return;
    }

    const newCode = 'EQ-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const newRoom: Room = {
      id: 'room-' + generateId(),
      roomName: finalRoomName,
      description: newRoomDesc,
      teacherId: teacher.id,
      inviteCode: newCode,
      adminClass: isGrade ? undefined : selectedAdminClass,
      roomType: isGrade ? 'general' : 'specific',
      grade: isGrade ? selectedAdminClass : undefined
    };

    db.rooms.push(newRoom);

    // Find and auto-enroll students belonging to this administrative class or matching grade level
    let studentsInClass: User[] = [];
    if (isGrade) {
      const gradeDigit = selectedAdminClass.replace(/^\D+/g, ''); // Extract e.g. '5' from 'Khối 5'
      studentsInClass = db.users.filter(u => 
        u.role === 'student' && 
        (u.adminClass?.includes(gradeDigit) || u.fullName.includes(`(${gradeDigit}`) || u.fullName.includes(` ${gradeDigit}`))
      );
    } else {
      studentsInClass = db.users.filter(u => 
        u.role === 'student' && 
        (u.adminClass === selectedAdminClass || u.fullName.endsWith(`(${selectedAdminClass})`))
      );
    }

    const newParticipants = studentsInClass.map(student => ({
      id: 'part-' + generateId() + '-' + Math.random().toString(36).substring(2, 5),
      roomId: newRoom.id,
      studentId: student.id,
      currentXp: 0,
      currentLevel: 1,
      goldBalance: 100,
      luckySpins: 1
    }));

    db.participants.push(...newParticipants);
    saveDatabase(db);
    
    setNewSubjectName('Tin Học');
    setNewRoomDesc('');
    setIsCreatingRoom(false);
    setSelectedRoomId(newRoom.id);
    onRefreshDb();
    alert(`Khởi tạo thành công phòng "${finalRoomName}"! Đã liên kết tự động sỉ số ${studentsInClass.length} học sinh.`);
  };

  const addQuizQuestionPlaceholder = () => {
    setQuizQuestions([
      ...quizQuestions,
      { question: '', options: ['', '', '', ''], correctAnswer: 0 }
    ]);
  };

  const updateQuizQuestionField = (qIdx: number, field: string, val: any) => {
    const updated = [...quizQuestions];
    updated[qIdx] = { ...updated[qIdx], [field]: val };
    setQuizQuestions(updated);
  };

  const updateQuizOptionField = (qIdx: number, oIdx: number, text: string) => {
    const updated = [...quizQuestions];
    const opts = [...updated[qIdx].options];
    opts[oIdx] = text;
    updated[qIdx].options = opts;
    setQuizQuestions(updated);
  };

  const handleCreateQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questTitle || !questDesc || !selectedRoomId) return;

    const finalDeadline = new Date(Date.now() + deadlineDays * 24 * 3600 * 1000).toISOString();
    
    // Validate quiz if type is quiz
    let finalQuizData = undefined;
    if (questType === 'quiz') {
      const invalidQuiz = quizQuestions.some(q => !q.question || q.options.some(o => !o));
      if (invalidQuiz) {
        alert("Vui lòng điền nội dung câu hỏi và cả 4 đáp án đầy đủ!");
        return;
      }
      finalQuizData = quizQuestions;
    }

    const newQuest: Quest = {
      id: 'quest-' + generateId(),
      roomId: selectedRoomId,
      title: questTitle,
      description: questDesc,
      questType,
      rewardXp: Number(rewardXp),
      rewardGold: Number(rewardGold),
      penaltyXp: Number(penaltyXp),
      deadline: finalDeadline,
      quizData: finalQuizData
    };

    db.quests.push(newQuest);
    saveDatabase(db);
    
    // Reset Quest Architect Form
    setQuestTitle('');
    setQuestDesc('');
    setQuestType('quiz');
    setRewardXp(100);
    setRewardGold(50);
    setPenaltyXp(15);
    setDeadlineDays(3);
    setQuizQuestions([{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
    setIsCreatingQuest(false);
    onRefreshDb();
    alert("Đã tạo lập Ma trận nhiệm vụ thành công!");
  };

  const handleQuickAdjustScore = (type: 'add' | 'subtract') => {
    if (!selectedStudentId || !selectedRoomId) {
      alert("Vui lòng chọn 1 học sinh trước!");
      return;
    }

    const factor = type === 'add' ? 1 : -1;
    const dbInstance = db;
    const participantIdx = dbInstance.participants.findIndex(p => p.roomId === selectedRoomId && p.studentId === selectedStudentId);

    if (participantIdx !== -1) {
      const part = dbInstance.participants[participantIdx];
      
      const xpDiff = xpAdjustmentValue * factor;
      const goldDiff = goldAdjustmentValue * factor;
      
      const prevLevel = part.currentLevel;
      part.currentXp = Math.max(0, part.currentXp + xpDiff);
      part.goldBalance = Math.max(0, part.goldBalance + goldDiff);

      // Simple auto-level check
      let lvl = part.currentLevel;
      let xp = part.currentXp;
      let spins = part.luckySpins;
      let leveledUp = false;

      let xpRequirement = lvl * 100;
      while (xp >= xpRequirement) {
        xp -= xpRequirement;
        lvl += 1;
        spins += 1; // Reward 1 free spin on level up
        xpRequirement = lvl * 100;
        leveledUp = true;
      }

      part.currentLevel = lvl;
      part.currentXp = xp;
      part.luckySpins = spins;

      saveDatabase(dbInstance);
      onRefreshDb();

      let msg = `Đã ${type === 'add' ? 'Cộng' : 'Trừ'} cho học sinh ${xpAdjustmentValue} XP và ${goldAdjustmentValue} Coin.`;
      if (leveledUp) {
        msg += ` 🎉 Đột phá! Học sinh thăng hạng thăng cấp từ Level ${prevLevel} ➔ ${lvl}!`;
      }
      alert(msg);
    }
  };

  const handleGiftCosmetic = () => {
    const allCosmetics = [...SEED_COSMETICS, ...(db.customCosmetics || [])];
    const item = allCosmetics.find(c => c.id === selectedGiftId);
    if (!item) {
      alert("Vui lòng chọn báu vật để phát!");
      return;
    }

    let addedCount = 0;
    let duplicateCount = 0;
    let targetDetails = "";

    if (giftRecipient === 'all-rooms') {
      const myRoomsList = db.rooms.filter(r => r.teacherId === teacher.id);
      const myRoomIds = myRoomsList.map(r => r.id);
      const eligibleParts = db.participants.filter(p => myRoomIds.includes(p.roomId));

      if (eligibleParts.length === 0) {
        alert("Không tìm thấy học sinh nào thuộc các phòng học của Thầy/Cô để phát quà!");
        return;
      }

      eligibleParts.forEach(p => {
        const isDuplicate = db.inventory.some(inv => 
          inv.studentId === p.studentId && 
          inv.roomId === p.roomId && 
          inv.cosmeticId === selectedGiftId
        );
        if (!isDuplicate) {
          db.inventory.push({
            id: 'inv-' + generateId(),
            studentId: p.studentId,
            roomId: p.roomId,
            cosmeticId: selectedGiftId,
            status: 'unused',
            unlockedAt: new Date().toISOString()
          });
          addedCount++;
        } else {
          duplicateCount++;
        }
      });

      targetDetails = `toàn bộ học sinh thuộc tất cả (${myRoomsList.length}) phòng học quản lý`;
    } else if (giftRecipient.startsWith('room-')) {
      const targetRoomId = giftRecipient.replace('room-', '');
      const roomObj = db.rooms.find(r => r.id === targetRoomId);
      const roomParts = db.participants.filter(p => p.roomId === targetRoomId);

      if (roomParts.length === 0) {
        alert(`Phòng học [${roomObj?.name || 'mục tiêu'}] hiện chưa có học sinh nào tham gia!`);
        return;
      }

      roomParts.forEach(p => {
        const isDuplicate = db.inventory.some(inv => 
          inv.studentId === p.studentId && 
          inv.roomId === p.roomId && 
          inv.cosmeticId === selectedGiftId
        );
        if (!isDuplicate) {
          db.inventory.push({
            id: 'inv-' + generateId(),
            studentId: p.studentId,
            roomId: p.roomId,
            cosmeticId: selectedGiftId,
            status: 'unused',
            unlockedAt: new Date().toISOString()
          });
          addedCount++;
        } else {
          duplicateCount++;
        }
      });

      targetDetails = `toàn bộ học sinh thuộc phòng học [${roomObj?.name || 'mục tiêu'}]`;
    } else if (giftRecipient.startsWith('student-')) {
      const parts = giftRecipient.split('-');
      const targetRoomId = parts[1];
      const targetStudentId = parts[2];

      const studentObj = db.users.find(u => u.id === targetStudentId);
      const roomObj = db.rooms.find(r => r.id === targetRoomId);

      const isDuplicate = db.inventory.some(inv => 
        inv.studentId === targetStudentId && 
        inv.roomId === targetRoomId && 
        inv.cosmeticId === selectedGiftId
      );

      if (isDuplicate) {
        alert(`Học sinh [${studentObj?.fullName || 'mục tiêu'}] đã sở hữu báu vật này trong phòng [${roomObj?.name || 'mục tiêu'}]!`);
        return;
      }

      db.inventory.push({
        id: 'inv-' + generateId(),
        studentId: targetStudentId,
        roomId: targetRoomId,
        cosmeticId: selectedGiftId,
        status: 'unused',
        unlockedAt: new Date().toISOString()
      });
      addedCount = 1;
      targetDetails = `học sinh [${studentObj?.fullName || 'mục tiêu'}] thuộc phòng [${roomObj?.name || 'mục tiêu'}]`;
    } else {
      alert("Vui lòng chọn đối tượng phát quà hợp lệ!");
      return;
    }

    saveDatabase(db);
    onRefreshDb();

    let textConfirm = `Báu vật '${item.name}' (${item.type.toUpperCase()}) đã được phát thành công cho ${targetDetails}. `;
    if (addedCount > 0) {
      textConfirm += `Đã trao thêm vào rương cho ${addedCount} học viên.`;
    }
    if (duplicateCount > 0) {
      textConfirm += ` (Đã bỏ qua ${duplicateCount} học viên đã sở hữu từ trước).`;
    }

    setGiftSuccessMessage(textConfirm);
    alert(`Xác nhận phát thành công!\n\n${textConfirm}`);
  };

  const handleSaveShopItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopItemName || !selectedRoomId) return;

    if (editingShopItem) {
      const idx = db.shopItems.findIndex(i => i.id === editingShopItem.id);
      if (idx !== -1) {
        db.shopItems[idx] = {
          ...db.shopItems[idx],
          itemName: shopItemName,
          coinPrice: Number(shopItemPrice),
          stock: Number(shopItemStock),
          description: shopItemDesc,
          imageUrl: shopItemImageUrl || undefined
        };
      }
      setEditingShopItem(null);
    } else {
      db.shopItems.push({
        id: 'shop-' + generateId(),
        roomId: selectedRoomId,
        itemName: shopItemName,
        description: shopItemDesc,
        coinPrice: Number(shopItemPrice),
        stock: Number(shopItemStock),
        imageUrl: shopItemImageUrl || undefined
      });
    }

    saveDatabase(db);
    setShopItemName('');
    setShopItemPrice(80);
    setShopItemStock(-1);
    setShopItemDesc('');
    setShopItemImageUrl('');
    setIsCreatingShopItem(false);
    onRefreshDb();
    alert("Lưu thông số gian hàng Cửa Hàng Đổi Xu thành công!");
  };

  const handleDeleteRoom = (roomId: string) => {
    db.rooms = db.rooms.filter(r => r.id !== roomId);
    db.participants = db.participants.filter(p => p.roomId !== roomId);
    db.quests = db.quests.filter(q => q.roomId !== roomId);
    
    const remaining = db.rooms.filter(r => r.teacherId === teacher.id);
    setSelectedRoomId(remaining.length > 0 ? remaining[0].id : '');
    
    saveDatabase(db);
    onRefreshDb();
  };

  const startEditRoom = (room: Room) => {
    setIsEditingRoom(true);
    setEditSubjectName(room.roomName.split(' - ')[0] || room.roomName);
    setEditAdminClass(room.adminClass || room.grade || 'Lớp 5A');
    setEditRoomDesc(room.description || '');
  };

  const handleSaveEditedRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSubjectName.trim()) {
      alert("Vui lòng điền tên môn học!");
      return;
    }

    const isGrade = editAdminClass.startsWith('Khối');
    const finalRoomName = `${editSubjectName.trim()} - ${editAdminClass}`;
    
    const rIdx = db.rooms.findIndex(r => r.id === selectedRoomId);
    if (rIdx !== -1) {
      db.rooms[rIdx] = {
        ...db.rooms[rIdx],
        roomName: finalRoomName,
        description: editRoomDesc,
        adminClass: isGrade ? undefined : editAdminClass,
        roomType: isGrade ? 'general' : 'specific',
        grade: isGrade ? editAdminClass : undefined
      };

      // Auto check and enroll new students belonging to matching class / grade
      let studentsInClass: User[] = [];
      if (isGrade) {
        const gradeDigit = editAdminClass.replace(/^\D+/g, '');
        studentsInClass = db.users.filter(u => 
          u.role === 'student' && 
          (u.adminClass?.includes(gradeDigit) || u.fullName.includes(`(${gradeDigit}`) || u.fullName.includes(` ${gradeDigit}`))
        );
      } else {
        studentsInClass = db.users.filter(u => 
          u.role === 'student' && 
          (u.adminClass === editAdminClass || u.fullName.endsWith(`(${editAdminClass})`))
        );
      }

      const existingStudentIds = db.participants.filter(p => p.roomId === selectedRoomId).map(p => p.studentId);
      const newStudents = studentsInClass.filter(s => !existingStudentIds.includes(s.id));

      const newParticipants = newStudents.map(student => ({
        id: 'part-' + generateId() + '-' + Math.random().toString(36).substring(2, 5),
        roomId: selectedRoomId,
        studentId: student.id,
        currentXp: 0,
        currentLevel: 1,
        goldBalance: 100,
        luckySpins: 1
      }));

      db.participants.push(...newParticipants);

      saveDatabase(db);
      setIsEditingRoom(false);
      onRefreshDb();
      alert(`Đã hoàn tất chỉnh sửa thông tin phòng "${finalRoomName}"! Đã liên kết bổ sung ${newParticipants.length} học sinh mới.`);
    }
  };

  const handlePendingPurchaseAction = (reqId: string, action: 'approve' | 'reject') => {
    if (!db.pendingPurchases) {
      db.pendingPurchases = [];
    }
    const reqIndex = db.pendingPurchases.findIndex(p => p.id === reqId);
    if (reqIndex === -1) return;

    const req = db.pendingPurchases[reqIndex];
    if (action === 'approve') {
      db.pendingPurchases[reqIndex].status = 'approved';
      
      const shopItem = db.shopItems.find(i => i.id === req.shopItemId);
      if (shopItem && shopItem.stock > 0) {
        shopItem.stock -= 1;
      }

      const hasInventory = db.inventory.some(inv => 
        inv.studentId === req.studentId && 
        inv.roomId === req.roomId && 
        inv.cosmeticId === req.shopItemId
      );

      if (!hasInventory) {
        db.inventory.push({
          id: 'inv-purch-' + generateId(),
          studentId: req.studentId,
          roomId: req.roomId,
          cosmeticId: req.shopItemId,
          status: 'unused',
          unlockedAt: new Date().toISOString()
        });
      }
      alert(`Đã chấp thuận quy đổi! Học viên '${req.studentName}' sở hữu phần thưởng: [${req.itemName}].`);
    } else {
      db.pendingPurchases[reqIndex].status = 'rejected';
      
      const partIdx = db.participants.findIndex(p => p.roomId === req.roomId && p.studentId === req.studentId);
      if (partIdx !== -1) {
        db.participants[partIdx].goldBalance += req.coinPrice;
      }
      alert(`Đã từ chối đơn đổi xu học sinh! Hoàn ${req.coinPrice}🪙 vàng cho học viên '${req.studentName}'.`);
    }

    saveDatabase(db);
    onRefreshDb();
  };

  const handleSaveWheelSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const total = Number(weight1) + Number(weight2) + Number(weight3) + Number(weight4) + Number(weight5);
    
    // allow ±0.5 error tolerance
    if (Math.abs(total - 100) > 0.5) {
      alert(`Lỗi trọng số: Tổng tỉ lệ hiện tại là ${total}%. Tỉ lệ tỷ trọng bắt buộc phải cộng dồn bằng chính xác 100%! Vui lòng cân đối lại.`);
      return;
    }

    db.wheelWeights = {
      '1': Number(weight1),
      '2': Number(weight2),
      '3': Number(weight3),
      '4': Number(weight4),
      '5': Number(weight5),
    };
    db.shopApprovalRequired = shopApprovalState;
    
    saveDatabase(db);
    onRefreshDb();
    alert("Thiết lập cơ chế kiểm định Cửa Hàng và Vòng Quay May Mắn thành công!");
  };

  const handleCreateCustomCosmetic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCosmeticName.trim() || !customCosmeticPath.trim()) {
      alert("Vui lòng nhập đầy đủ tên và đường dẫn tệp ảnh!");
      return;
    }

    if (!db.customCosmetics) {
      db.customCosmetics = [];
    }

    const newCos: CosmeticCatalogItem = {
      id: 'cos-custom-' + generateId(),
      name: customCosmeticName.trim(),
      type: customCosmeticType,
      filePath: customCosmeticPath.trim(),
      isDefault: false,
      minLevel: Number(customCosmeticMinLevel),
      isUploaded: true
    };

    db.customCosmetics.push(newCos);
    saveDatabase(db);
    
    setCustomCosmeticName('');
    setCustomCosmeticPath('');
    setCustomCosmeticMinLevel(1);
    setIsCreatingCustomCosmetic(false);
    
    onRefreshDb();
    alert(`Kiêu hãnh diện mạo! Đã phê chuẩn mẫu trang trí diện mạo mới: "${newCos.name}".`);
  };

  const handleDeleteQuest = (questId: string) => {
    if (confirm("Xóa nhiệm vụ này? Hành động này sẽ rút lại và hủy bỏ trạng thái điểm bài làm của toàn học viên.")) {
      db.quests = db.quests.filter(q => q.id !== questId);
      db.submissions = db.submissions.filter(s => s.questId !== questId);
      saveDatabase(db);
      onRefreshDb();
    }
  };

  return (
    <div className="relative">
      {/* 1. FORCE FIRST LOGIN CHANGE PASSWORD OVERLAY */}
      {teacher.isFirstLogin && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 border border-amber-300">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="bg-amber-100 p-3 rounded-full text-amber-600 animate-bounce">
                <ShieldAlert className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">KÍCH HOẠT BẢO MẬT BẮT BUỘC</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Mật khẩu của bạn là do Admin cấp tạm thời.Để đảm bảo bí mật chuyên môn và học bạ quốc gia, bạn **bắt buộc phải đổi mật khẩu** mới để tiếp tục.
              </p>
            </div>

            <form onSubmit={handleForcePasswordChange} className="mt-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  placeholder="Độ dài tối thiểu 6 ký tự"
                  className="w-full text-xs p-3 rounded border border-slate-300 focus:ring-1 focus:ring-amber-500 font-mono focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  value={confirmNewPass}
                  onChange={e => setConfirmNewPass(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full text-xs p-3 rounded border border-slate-300 focus:ring-1 focus:ring-amber-500 font-mono focus:outline-none"
                  required
                />
              </div>

              {passError && (
                <p className="text-red-650 text-[11px] font-bold bg-red-50 p-2.5 rounded border border-red-200">
                  ⚠️ {passError}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-amber-600 text-white font-bold text-xs py-3 rounded-lg hover:bg-amber-700 transition shadow"
              >
                CẬP NHẬT MẬT KHẨU & MỞ KHÓA
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Teacher Area */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden" id="teacher-panel">
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 p-6 text-white flex justify-between items-center max-md:flex-col max-md:items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2.5 rounded-lg">
              <BookOpen className="h-6 w-6 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Khu Sư Phạm - {teacher.fullName}</h2>
              <p className="text-indigo-200 text-xs">Phác thảo ma trận rèn luyện, chấm thi thuật toán và phát báu diện mạo.</p>
            </div>
          </div>

          {/* Room quick switcher with Edit & Delete */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-purple-200 uppercase tracking-widest text-[10px]">Phòng giảng:</span>
            <select
              value={selectedRoomId}
              onChange={e => {
                setSelectedRoomId(e.target.value);
                setIsEditingRoom(false);
              }}
              className="bg-indigo-800 text-white border border-indigo-600 rounded text-xs px-2.5 py-1.5 focus:outline-none opacity-90 font-semibold"
            >
              <option value="">-- Chọn phòng học phụ trách --</option>
              {myRooms.map(r => (
                <option key={r.id} value={r.id}>{r.roomName}</option>
              ))}
            </select>
            
            {activeRoom && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    startEditRoom(activeRoom);
                    setIsCreatingRoom(false);
                  }}
                  className="bg-indigo-650 hover:bg-indigo-700 text-white text-xs px-2 py-1.5 rounded inline-flex items-center gap-1 transition-all border border-indigo-500/35"
                  title="Chỉnh sửa chi tiết phòng"
                >
                  <Edit3 className="h-3 w-3" /> Sửa
                </button>
                {confirmDeleteRoomId === activeRoom.id ? (
                  <div className="flex items-center gap-1.5 animate-pulse bg-red-50 border border-red-250 px-2 py-1 rounded">
                    <span className="text-[10px] text-red-700 font-bold whitespace-nowrap">Xác nhận XOÁ?</span>
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteRoom(activeRoom.id);
                        setConfirmDeleteRoomId(null);
                      }}
                      className="bg-red-600 hover:bg-red-750 text-white font-bold text-[10px] px-2 py-1 rounded shadow-xs"
                    >
                      Xóa vĩnh viễn
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteRoomId(null)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] px-2 py-1 rounded"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteRoomId(activeRoom.id)}
                    className="bg-rose-900/80 hover:bg-rose-900 text-rose-100 text-xs px-2 py-1.5 rounded inline-flex items-center gap-1 transition-all border border-rose-800/40"
                    title="Xoá vĩnh viễn phòng"
                  >
                    <Trash2 className="h-3 w-3 block" /> Xoá
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => {
                setIsCreatingRoom(true);
                setIsEditingRoom(false);
              }}
              className="bg-purple-600 hover:bg-purple-500 font-bold text-xs px-2.5 py-1.5 rounded text-white inline-flex items-center gap-0.5"
              title="Khai giảng phòng học mới"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm
            </button>
          </div>
        </div>

        {/* Create room builder */}
        {isCreatingRoom && (
          <div className="p-6 bg-slate-50 border-b border-slate-150">
            <form onSubmit={handleCreateRoom} className="max-w-xl space-y-4">
              <h3 className="font-bold text-indigo-950 text-xs uppercase tracking-wider flex items-center gap-1">
                🏫 KHAI GIẢNG PHÒNG HỌC MỚI (LỚP HOẶC KHỐI CHUNG)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tên Môn học</label>
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={e => setNewSubjectName(e.target.value)}
                    placeholder="Ví dụ: Tin Học, Công Nghệ, Toán Học"
                    className="w-full text-xs p-2 rounded border border-slate-300 focus:outline-none bg-white font-medium"
                    required
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['Tin Học', 'Công Nghệ', 'Toán Học', 'Khoa Học', 'Mỹ Thuật', 'Tiếng Anh'].map(subj => (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => setNewSubjectName(subj)}
                        className="text-[10px] bg-slate-200 hover:bg-slate-300 px-1.5 py-0.5 rounded text-slate-700 font-medium transition"
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Chọn Lớp học / Khối liên kết</label>
                  <select
                    value={selectedAdminClass}
                    onChange={e => setSelectedAdminClass(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded focus:outline-none font-semibold text-slate-800"
                    required
                  >
                    {[
                      ...(db.adminClasses || []),
                      ...getAvailableGrades(db.adminClasses || [])
                    ].map(cls => (
                      <option key={cls} value={cls}>
                        {cls.startsWith('Khối') ? `👑 ${cls} (Tự động liên thông toàn bộ HS các lớp thuộc ${cls})` : `🏫 ${cls}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mô tả tóm lược</label>
                <input
                  type="text"
                  value={newRoomDesc}
                  onChange={e => setNewRoomDesc(e.target.value)}
                  placeholder="VD: Nhập môn tư duy lập trình căn bản..."
                  className="w-full text-xs p-2 rounded border border-slate-300 focus:outline-none bg-white"
                />
              </div>

              {/* LIVE VIEW PREVIEW */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-900">
                📌 <strong>Xem trước tên phòng thực tế:</strong> <span className="font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border ml-1 font-bold">{newSubjectName || '...'} - {selectedAdminClass}</span>
                <p className="text-[10px] text-indigo-600 mt-1">
                  * Hệ thống sẽ tự động thêm toàn bộ học sinh của <span className="font-bold">{selectedAdminClass}</span> vào danh sách học bạ phòng này sau khi khai giảng!
                </p>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="bg-indigo-650 text-white font-bold text-xs px-4 py-2 rounded hover:bg-indigo-700 transition">Khởi Tạo</button>
                <button type="button" onClick={() => setIsCreatingRoom(false)} className="bg-slate-300 text-slate-700 text-xs px-4 py-2 rounded hover:bg-slate-400 transition">Huỷ</button>
              </div>
            </form>
          </div>
        )}

        {/* Edit room builder */}
        {isEditingRoom && activeRoom && (
          <div className="p-6 bg-amber-50/45 border-b border-slate-200">
            <form onSubmit={handleSaveEditedRoom} className="max-w-xl space-y-4">
              <h3 className="font-bold text-amber-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="h-4 w-4 text-amber-655" /> CHỈNH SỬA THÔNG TIN PHÒNG HỌC
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tên Môn học</label>
                  <input
                    type="text"
                    value={editSubjectName}
                    onChange={e => setEditSubjectName(e.target.value)}
                    placeholder="Ví dụ: Tin Học..."
                    className="w-full text-xs p-2 rounded border border-slate-300 focus:outline-none bg-white font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Chọn Lớp học / Khối liên kết</label>
                  <select
                    value={editAdminClass}
                    onChange={e => setEditAdminClass(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded focus:outline-none font-semibold text-slate-800"
                    required
                  >
                    {[
                      ...(db.adminClasses || []),
                      ...getAvailableGrades(db.adminClasses || [])
                    ].map(cls => (
                      <option key={cls} value={cls}>
                        {cls.startsWith('Khối') ? `👑 ${cls} (Tự động liên thông toàn bộ HS các lớp thuộc ${cls})` : `🏫 ${cls}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mô tả tóm lược</label>
                <input
                  type="text"
                  value={editRoomDesc}
                  onChange={e => setEditRoomDesc(e.target.value)}
                  placeholder="Mô tả tóm tắt lớp học mới..."
                  className="w-full text-xs p-2 rounded border border-slate-300 focus:outline-none bg-white"
                />
              </div>

              <div className="bg-amber-100/65 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
                📌 <strong>Xem trước tên phòng cập nhật:</strong> <span className="font-mono text-amber-800 bg-white px-2 py-0.5 rounded border ml-1 font-bold">{editSubjectName || '...'} - {editAdminClass}</span>
                <p className="text-[10px] text-amber-700 mt-1">
                  * Chỉnh sửa lớp liên kết/Khối liên kết sẽ tự động dò tìm và đồng bộ thêm học viên lớp mới vào phòng giảng này!
                </p>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded hover:bg-amber-700 transition">Lưu Thay Đổi</button>
                <button type="button" onClick={() => setIsEditingRoom(false)} className="bg-slate-300 text-slate-700 text-xs px-4 py-2 rounded hover:bg-slate-400 transition">Huỷ</button>
              </div>
            </form>
          </div>
        )}

        {/* Active room features */}
        {activeRoom ? (
          <div className="p-6">
            {/* Split layout: Submissions & Quick Actions / Quests Management */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Box 1: Matrix Quest Architect (Hơn nửa chiều rộng) */}
              <div className="xl:col-span-2 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-indigo-750">
                    <ClipboardCheck className="h-4.5 w-4.5" />
                    Ma trận Nhiệm vụ (Quests) khóa {activeRoom.roomName}
                  </h3>
                  <button
                    onClick={() => setIsCreatingQuest(true)}
                    className="bg-indigo-600 text-white font-bold text-xs px-3 py-1.5 rounded hover:bg-indigo-500 flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Kiến Tạo Nhiệm Vụ
                  </button>
                </div>

                {/* Quest architect form */}
                {isCreatingQuest && (
                  <form onSubmit={handleCreateQuest} className="bg-slate-50 p-5 rounded-lg border border-slate-200 space-y-4 shadow-sm">
                    <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest text-indigo-850">Kiến tạo Nhiệm vụ mới</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tên Nhiệm vụ</label>
                        <input
                          type="text"
                          value={questTitle}
                          onChange={e => setQuestTitle(e.target.value)}
                          placeholder="Nhập tên nhiệm vụ..."
                          className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Thể loại</label>
                        <select
                          value={questType}
                          onChange={e => setQuestType(e.target.value as any)}
                          className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-none"
                        >
                          <option value="quiz">Trắc Nghiệm Tự Chấm</option>
                          <option value="file">Nộp Tệp Tin Tự Chọn</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Yêu cầu, đề bài chi tiết</label>
                      <textarea
                        value={questDesc}
                        onChange={e => setQuestDesc(e.target.value)}
                        placeholder="Nội dung chỉ dẫn thực hành chi tiết..."
                        className="w-full h-20 text-xs p-2 border border-slate-300 rounded focus:outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Phần thưởng XP</label>
                        <input
                          type="number"
                          value={rewardXp}
                          onChange={e => setRewardXp(Number(e.target.value))}
                          className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Phần thưởng Vàng</label>
                        <input
                          type="number"
                          value={rewardGold}
                          onChange={e => setRewardGold(Number(e.target.value))}
                          className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Khấu trừ XP (Phạt trần)</label>
                        <input
                          type="number"
                          value={penaltyXp}
                          onChange={e => setPenaltyXp(Number(e.target.value))}
                          className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-none animate-pulse"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-550 uppercase mb-1">Hạn nộp (Ngày sau)</label>
                        <input
                          type="number"
                          value={deadlineDays}
                          onChange={e => setDeadlineDays(Number(e.target.value))}
                          className="w-full text-xs p-2 border border-slate-300 rounded focus:outline-none"
                          min={1}
                        />
                      </div>
                    </div>

                    {questType === 'quiz' && (
                      <div className="bg-white p-4 rounded border border-slate-200 space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase">
                            Bản câu hỏi Ma Trận Trắc Nghiệm ({quizQuestions.length})
                          </label>
                          <button
                            type="button"
                            onClick={addQuizQuestionPlaceholder}
                            className="text-xs text-indigo-650 hover:underline font-bold"
                          >
                            + Thêm Câu Hỏi
                          </button>
                        </div>

                        {quizQuestions.map((q, qIdx) => (
                          <div key={qIdx} className="p-3 bg-slate-50 rounded border border-slate-150 space-y-2 relative">
                            <span className="absolute top-2 right-2 text-[10px] font-bold text-slate-400">Câu {qIdx+1}</span>
                            <div>
                              <input
                                type="text"
                                value={q.question}
                                onChange={e => updateQuizQuestionField(qIdx, 'question', e.target.value)}
                                placeholder="Viết câu hỏi..."
                                className="w-full text-xs p-2 bg-white border border-slate-200 rounded focus:outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {q.options.map((opt, oIdx) => (
                                <input
                                  key={oIdx}
                                  type="text"
                                  value={opt}
                                  onChange={e => updateQuizOptionField(qIdx, oIdx, e.target.value)}
                                  placeholder={`Đáp án ${oIdx + 1}`}
                                  className="text-[11px] p-1.5 bg-white border border-slate-250 rounded focus:outline-none"
                                />
                              ))}
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-[10px] text-slate-550 font-bold uppercase">Đáp án chính xác:</span>
                              <select
                                value={q.correctAnswer}
                                onChange={e => updateQuizQuestionField(qIdx, 'correctAnswer', Number(e.target.value))}
                                className="text-[10.5px] p-1 border rounded"
                              >
                                {q.options.map((_, index) => (
                                  <option key={index} value={index}>Đáp án {index + 1}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 justify-end">
                      <button type="submit" className="bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs px-4 py-2 rounded">LỰU HỒ SƠ</button>
                      <button type="button" onClick={() => setIsCreatingQuest(false)} className="bg-slate-350 text-slate-700 text-xs px-4 py-2 rounded">HUỶ</button>
                    </div>
                  </form>
                )}

                {/* Quests Listing */}
                <div className="space-y-3">
                  {db.quests.filter(q => q.roomId === selectedRoomId).map(quest => {
                    const isOverdue = new Date(quest.deadline) < new Date();
                    return (
                      <div key={quest.id} className="p-4 rounded-xl border border-slate-150 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              quest.questType === 'quiz' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-850'
                            }`}>
                              {quest.questType === 'quiz' ? 'Trắc Nghiệm Tự Chấm' : 'Nộp File'}
                            </span>
                            <span className="text-slate-405 font-mono text-[10px] flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" />
                              Hạn nộp: {new Date(quest.deadline).toLocaleDateString('vi-VN')} {new Date(quest.deadline).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            {isOverdue && (
                              <span className="text-[9px] font-bold bg-rose-100 text-rose-800 px-1.5 rounded animate-pulse uppercase">
                                Đã quá hạn (Phạt {quest.penaltyXp} XP)
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm leading-tight">{quest.title}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2">{quest.description}</p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-center bg-slate-50 border border-slate-150 rounded px-2.5 py-1 text-slate-650 min-w-28">
                            <div className="text-[9px] font-bold text-slate-400 uppercase">Phần thưởng (Dòng)</div>
                            <div className="text-xs font-bold text-indigo-750 font-mono mt-0.5">+{quest.rewardXp} XP / +{quest.rewardGold} Vàng</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuest(quest.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-650 p-2 rounded border border-red-150 transition"
                            title="Xóa nhiệm vụ này"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {db.quests.filter(q => q.roomId === selectedRoomId).length === 0 && (
                    <div className="p-16 border rounded-xl border-dashed border-slate-300 text-center text-slate-400 italic">
                      Lớp học chưa có nhiệm vụ nào. Hãy thiết lập nhiệm vụ trắc nghiệm bên trên!
                    </div>
                  )}
                </div>
              </div>

              {/* Box 2: Quick Actions & Manual Items Gifting (Một phần_chiều rộng) */}
              <div className="space-y-6">
                
                {/* Panel Quick Actions */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <h3 className="font-bold text-indigo-950 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <Award className="h-4 w-4 text-indigo-600" />
                    Tác vụ Nhanh & Trao Quà Khô Đồ
                  </h3>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Chọn Học sinh trong Phòng</label>
                    <select
                      value={selectedStudentId}
                      onChange={e => setSelectedStudentId(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-350 rounded focus:outline-none font-medium"
                    >
                      <option value="">-- Chọn học sinh xuất sắc --</option>
                      {studentsInActiveRoom.map(student => {
                        const part = activeRoomParticipants.find(p => p.studentId === student.id);
                        return (
                          <option key={student.id} value={student.id}>
                            {student.fullName} (Lvl {part?.currentLevel || 1} - {part?.goldBalance || 0}🪙)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* XP & gold micro adjust */}
                  <div className="bg-white p-3.5 rounded border border-slate-200 space-y-3.5 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Tăng / Giảm Cấp Tốc:
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] text-slate-500 font-bold mb-0.5">Mức XP điều chỉnh</label>
                        <input
                          type="number"
                          value={xpAdjustmentValue}
                          onChange={e => setXpAdjustmentValue(Math.abs(Number(e.target.value)))}
                          className="w-full text-xs p-1.5 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-500 font-bold mb-0.5">Mức Xu điều chỉnh</label>
                        <input
                          type="number"
                          value={goldAdjustmentValue}
                          onChange={e => setGoldAdjustmentValue(Math.abs(Number(e.target.value)))}
                          className="w-full text-xs p-1.5 border rounded"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickAdjustScore('add')}
                        className="flex-1 bg-indigo-600 text-white font-bold text-[10.5px] py-2 rounded hover:bg-indigo-700 transition"
                      >
                        + Thưởng Điểm
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdjustScore('subtract')}
                        className="flex-1 bg-amber-600 text-white font-bold text-[10.5px] py-2 rounded hover:bg-amber-700 transition"
                      >
                        - Phạt Điểm
                      </button>
                    </div>
                  </div>

                  {/* Manual cosmetics gifting form */}
                  <div className="bg-white p-3.5 rounded border border-slate-200 space-y-3.5 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1 text-purple-750">
                      <Gift className="h-3.5 w-3.5 text-purple-650 animate-pulse" />
                      Phát Báu Vật Diện Mạo Thủ Công
                    </span>
                    
                    {giftSuccessMessage && (
                      <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs p-3 rounded-lg flex flex-col gap-1 shadow-inner animate-bounce">
                        <span className="font-bold flex items-center gap-1 text-emerald-700">
                          <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
                          Xác nhận phát thành công!
                        </span>
                        <p className="text-[10.5px] leading-relaxed text-emerald-600 font-medium">
                          {giftSuccessMessage}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wide">1. Phát cho đối tượng (Combobox phân cấp)</label>
                        <select
                          value={giftRecipient}
                          onChange={e => {
                            setGiftRecipient(e.target.value);
                            setGiftSuccessMessage(null);
                          }}
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:border-purple-500 font-semibold text-slate-850"
                        >
                          <optgroup label="🌐 Hạng mục toàn bộ">
                            <option value="all-rooms">🌌 Toàn phòng (Tất cả học sinh ở mọi lớp) ({myRooms.length} phòng)</option>
                          </optgroup>

                          <optgroup label="🏫 Hạng mục phòng học (Tất cả HS trong lớp)">
                            {myRooms.map(r => {
                              const pCount = db.participants.filter(p => p.roomId === r.id).length;
                              return (
                                <option key={`room-gift-${r.id}`} value={`room-${r.id}`}>
                                  🏢 Phòng: {r.name} ({pCount} HS)
                                </option>
                              );
                            })}
                          </optgroup>

                          <optgroup label="👤 Hạng mục cá nhân (Học sinh cụ thể)">
                            {myRooms.map(r => {
                              const rParts = db.participants.filter(p => p.roomId === r.id);
                              return rParts.map(p => {
                                const u = db.users.find(usr => usr.id === p.studentId && usr.role === 'student');
                                if (!u) return null;
                                return (
                                  <option key={`student-gift-${r.id}-${u.id}`} value={`student-${r.id}-${u.id}`}>
                                    👤 [{r.name}] {u.fullName}
                                  </option>
                                );
                              });
                            })}
                          </optgroup>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-1 uppercase tracking-wide">2. Chọn báu vật phát tặng</label>
                        <select
                          value={selectedGiftId}
                          onChange={e => {
                            setSelectedGiftId(e.target.value);
                            setGiftSuccessMessage(null);
                          }}
                          className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:border-purple-500 font-semibold text-slate-850"
                        >
                          <option value="">-- Chọn báu vật phát tặng --</option>
                          {[...SEED_COSMETICS, ...(db.customCosmetics || [])].map(item => (
                            <option key={item.id} value={item.id}>
                              [{item.type.toUpperCase()}] {item.name} {item.isUploaded ? '🎨' : ''} (Lvl {item.minLevel || 1}+)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGiftCosmetic}
                      className="w-full bg-purple-600 hover:bg-purple-750 text-white font-bold text-xs py-2.5 rounded flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.98]"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-pulse" />
                      Phân Phát Quà / Báu Vật
                    </button>
                  </div>

                  {/* CUSTOM AVATAR TEMPLATE UPLOAD */}
                  <div className="bg-white p-3.5 rounded border border-slate-200 space-y-3 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1 text-violet-750 font-bold">
                      <Upload className="h-3.5 w-3.5 text-violet-600" />
                      Đăng Ký Ảnh Diện Mạo Mẫu (Upload)
                    </span>
                    
                    <form onSubmit={handleCreateCustomCosmetic} className="space-y-2.5">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Tên vật phẩm trang trí</label>
                        <input
                          type="text"
                          value={customCosmeticName}
                          onChange={e => setCustomCosmeticName(e.target.value)}
                          placeholder="Ví dụ: Avatar Phi Hành Gia, Khung Vũ Trụ..."
                          className="w-full text-[11px] p-2 bg-slate-50 border border-slate-200 rounded focus:outline-none font-medium text-slate-800"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Phân loại trang phục</label>
                          <select
                            value={customCosmeticType}
                            onChange={e => setCustomCosmeticType(e.target.value as any)}
                            className="w-full text-[11px] p-1.5 border rounded bg-white"
                          >
                            <option value="avatar">Avatar (Ảnh đại diện)</option>
                            <option value="frame">Frame (Khung viền)</option>
                            <option value="badge">Badge (Danh hiệu)</option>
                            <option value="effect">Effect (Hiệu ứng cấp)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Yêu cầu Cấp độ</label>
                          <input
                            type="number"
                            value={customCosmeticMinLevel}
                            onChange={e => setCustomCosmeticMinLevel(Number(e.target.value))}
                            className="w-full text-[11px] p-1 border rounded"
                            min={1}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Ảnh địa chỉ (Image URL)</label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={customCosmeticPath}
                            onChange={e => setCustomCosmeticPath(e.target.value)}
                            placeholder="http://... hoặc chọn mẫu ảnh"
                            className="flex-1 text-[11px] p-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none font-mono text-xs"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const randomAvatars = [
                                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
                                "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
                                "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200",
                                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
                              ];
                              setCustomCosmeticPath(randomAvatars[Math.floor(Math.random() * randomAvatars.length)]);
                            }}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 rounded whitespace-nowrap"
                          >
                            Mẫu nhanh
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Hoặc tải lên từ máy tính (PC Upload)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                if (evt.target?.result) {
                                  setCustomCosmeticPath(evt.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-violet-50 file:text-violet-750 hover:file:bg-violet-100"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-violet-600 text-white font-bold text-[11px] py-1.5 rounded hover:bg-violet-750 transition-all font-mono tracking-wide"
                      >
                        + DUYỆT ĐĂNG MẪU ĐỒ
                      </button>
                    </form>
                  </div>

                  {/* VISUAL GALLERY OF REGISTERED COSMETICS */}
                  <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-3 shadow-inner">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1 text-slate-705">
                      🔮 Báu Vật / Diện Mạo Hiện Có ({[...SEED_COSMETICS, ...(db.customCosmetics || [])].length})
                    </span>
                    
                    <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                      {[...SEED_COSMETICS, ...(db.customCosmetics || [])].map(item => (
                        <div key={item.id} className="p-2 border border-slate-200 rounded-lg bg-white flex flex-col items-center justify-between text-center gap-1.5 relative group hover:border-violet-300 transition-all shadow-xs">
                          {item.isUploaded && (
                            <button
                              type="button"
                              onClick={() => {
                                db.customCosmetics = (db.customCosmetics || []).filter(c => c.id !== item.id);
                                saveDatabase(db);
                                onRefreshDb();
                              }}
                              className="absolute top-1 right-1 bg-red-50 hover:bg-red-150 text-red-650 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all border border-red-205"
                              title="Xóa báu vật này"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                          
                          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-50 border overflow-hidden">
                            {item.isUploaded ? (
                              <img src={item.filePath} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              item.type === 'avatar' ? (
                                <span className="text-xl">🧙</span>
                              ) : item.type === 'frame' ? (
                                <span className="text-xl">🖼️</span>
                              ) : (
                                <span className="text-xl">✨</span>
                              )
                            )}
                          </div>
                          
                          <div className="space-y-0.5">
                            <div className="text-[10px] font-bold text-slate-805 truncate max-w-[100px]">{item.name}</div>
                            <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">
                              {item.type === 'avatar' ? 'Ảnh đại diện' : item.type === 'frame' ? 'Khung viền' : 'Hiệu ứng'}
                            </div>
                            <div className="text-[8.5px] font-mono text-violet-700 bg-violet-50 px-1 rounded inline-block">
                              Lvl {item.minLevel || 1}+
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* LUCKY WHEEL SETTINGS & COIN SHOP COMPONENT CONTROL */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <h3 className="font-bold text-indigo-950 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <Coins className="h-4 w-4 text-indigo-600" />
                    Cơ chế Cửa Hàng & Vòng Quay May Mắn
                  </h3>

                  {/* Config weights and approval toggle */}
                  <form onSubmit={handleSaveWheelSettings} className="bg-white p-3.5 rounded border border-slate-200 space-y-3.5 shadow-sm text-xs">
                    <div className="font-bold text-[10px] uppercase text-slate-500 tracking-wider flex items-center justify-between">
                      <span>Cấu hình tỉ lệ Vòng Quay %:</span>
                      <span className="text-indigo-600 font-mono">Tổng: {Number(weight1) + Number(weight2) + Number(weight3) + Number(weight4) + Number(weight5)}%</span>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span>❌ May mắn lần sau:</span>
                          <span className="font-bold">{weight1}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={weight1}
                          onChange={e => setWeight1(Number(e.target.value))}
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span>🪙 Nhận thêm 30 xu vàng:</span>
                          <span className="font-bold text-amber-600">{weight2}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={weight2}
                          onChange={e => setWeight2(Number(e.target.value))}
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span>✨ Thẻ nhân đôi XP:</span>
                          <span className="font-bold text-indigo-650">{weight3}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={weight3}
                          onChange={e => setWeight3(Number(e.target.value))}
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span>🔮 Avatar "Học giả":</span>
                          <span className="font-bold text-violet-600">{weight4}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={weight4}
                          onChange={e => setWeight4(Number(e.target.value))}
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span>🎟️ Thẻ Miễn Bài Tập:</span>
                          <span className="font-bold text-rose-600">{weight5}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={weight5}
                          onChange={e => setWeight5(Number(e.target.value))}
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={shopApprovalState}
                          onChange={e => setShopApprovalState(e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span>🔒 Yêu cầu giáo viên phê duyệt quy đổi vật phẩm cửa hàng</span>
                      </label>
                      <p className="text-[10px] text-slate-400 mt-1 pl-6">
                        Nếu kích hoạt, khi học sinh mua hàng xu của họ sẽ bị trừ tạm thời và chuyển vào trạng thái chờ giáo viên xác nhận. Nếu bị từ chối, xu sẽ hoàn trả lập tức.
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-600 text-white font-bold text-[11px] py-1.5 rounded hover:bg-indigo-700 transition"
                    >
                      Áp Dụng Thiết Lập Giáo Vụ
                    </button>
                  </form>

                  {/* COIN SHOP PENDING PURCHASES APPROVAL MANAGER */}
                  {(db.pendingPurchases || []).filter(p => p.roomId === selectedRoomId && p.status === 'pending').length > 0 && (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3.5 space-y-2.5">
                      <span className="text-[10px] font-extrabold text-amber-850 uppercase tracking-wider flex items-center gap-1">
                        🟡 Danh Sách Chờ Phê Duyệt Đổi Xu
                      </span>
                      
                      <div className="space-y-2">
                        {(db.pendingPurchases || [])
                          .filter(p => p.roomId === selectedRoomId && p.status === 'pending')
                          .map(p => (
                            <div key={p.id} className="bg-white p-2.5 rounded border border-amber-200 text-xs shadow-xs space-y-1">
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-slate-800">{p.studentName}</span>
                                <span className="font-mono text-amber-600 font-extrabold">{p.coinPrice}🪙</span>
                              </div>
                              <div className="text-[10.5px] text-slate-500">
                                Muốn mua: <strong className="text-slate-750">{p.itemName}</strong>
                              </div>
                              <div className="flex gap-1.5 justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => handlePendingPurchaseAction(p.id, 'approve')}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2 py-1 rounded flex items-center gap-0.5"
                                >
                                  <Check className="h-3 w-3" /> Chấp nhận
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePendingPurchaseAction(p.id, 'reject')}
                                  className="bg-rose-650 hover:bg-rose-700 text-white font-bold text-[10px] px-2 py-1 rounded flex items-center gap-0.5"
                                >
                                  <X className="h-3 w-3" /> Từ chối
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Add shop items manager */}
                  <div className="space-y-2 border-t border-slate-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-550 uppercase font-bold text-slate-700">Điều Chỉnh Gian Hàng Đổi Xu</span>
                      <button
                        onClick={() => {
                          setIsCreatingShopItem(true);
                          setEditingShopItem(null);
                          setShopItemImageUrl('');
                        }}
                        className="text-[10.5px] text-indigo-650 hover:underline font-bold"
                      >
                        + Thêm Mặt Hàng
                      </button>
                    </div>

                    {(isCreatingShopItem || editingShopItem) && (
                      <form onSubmit={handleSaveShopItem} className="bg-white p-3.5 rounded border border-slate-200 space-y-3 shadow-sm text-xs">
                        <h4 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">
                          {editingShopItem ? "Sửa mặt hàng" : "Vật phẩm quà tặng mới"}
                        </h4>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Tên Vật phẩm</label>
                            <input
                              type="text"
                              value={shopItemName}
                              onChange={e => setShopItemName(e.target.value)}
                              placeholder="Thước kẻ, bút vẽ, sách lập trình..."
                              className="w-full text-xs p-1.5 border rounded focus:outline-none"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Giá tiền xu</label>
                              <input
                                type="number"
                                value={shopItemPrice}
                                onChange={e => setShopItemPrice(Number(e.target.value))}
                                className="w-full text-xs p-1.5 border rounded focus:outline-none"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Kho hàng (-1 v.hạn)</label>
                              <input
                                type="number"
                                value={shopItemStock}
                                onChange={e => setShopItemStock(Number(e.target.value))}
                                className="w-full text-xs p-1.5 border rounded focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Mô tả vật phẩm</label>
                            <input
                              type="text"
                              value={shopItemDesc}
                              onChange={e => setShopItemDesc(e.target.value)}
                              placeholder="Mô tả công dụng hoặc đặc quyền..."
                              className="w-full text-xs p-1.5 border rounded focus:outline-none"
                            />
                          </div>

                          {/* IMAGE INPUT FIELD WITH PREVIEW GENERATOR */}
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Ảnh minh họa sản phẩm (Hình ảnh URL)</label>
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={shopItemImageUrl}
                                onChange={e => setShopItemImageUrl(e.target.value)}
                                placeholder="http://... hoặc ảnh"
                                className="flex-1 text-xs p-1.5 border rounded focus:outline-none font-mono text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const shopPics = [
                                    "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=200", // gift
                                    "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?auto=format&fit=crop&q=80&w=200", // notebook
                                    "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=200"  // book
                                  ];
                                  setShopItemImageUrl(shopPics[Math.floor(Math.random() * shopPics.length)]);
                                }}
                                className="bg-indigo-50 hover:bg-indigo-100 text-[10px] px-2 font-bold rounded text-indigo-700 whitespace-nowrap"
                              >
                                Thử ảnh
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Hoặc tải sản phẩm từ máy tính (PC Upload)</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (evt) => {
                                    if (evt.target?.result) {
                                      setShopItemImageUrl(evt.target.result as string);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="w-full text-[10px] text-slate-550 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-750 hover:file:bg-indigo-100"
                            />
                          </div>

                          <div className="flex gap-1 justify-end pt-1">
                            <button type="submit" className="bg-indigo-600 text-white font-bold text-[10px] px-2 py-1 rounded">Lưu sản phẩm</button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreatingShopItem(false);
                                setEditingShopItem(null);
                                setShopItemImageUrl('');
                              }}
                              className="bg-slate-200 text-slate-700 text-[10px] px-2 py-1 rounded"
                            >
                              Huỷ
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    {/* Shop list */}
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {db.shopItems.filter(i => i.roomId === selectedRoomId).map(item => (
                        <div key={item.id} className="text-[11px] bg-white p-2 rounded border border-slate-150 flex items-center justify-between gap-2 shadow-sm">
                          <div className="flex items-center gap-2">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.itemName} className="h-8 w-8 object-cover rounded border border-slate-200 bg-slate-50" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="h-8 w-8 rounded border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 text-[10px] font-bold">No img</div>
                            )}
                            <div>
                              <span className="font-bold text-slate-800">{item.itemName}</span>
                              <div className="text-[10px] text-slate-400">
                                Giá: <span className="font-bold text-amber-600">{item.coinPrice}🪙</span> | Stock: {item.stock === -1 ? 'Vô hạn' : item.stock}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingShopItem(item);
                                setIsCreatingShopItem(false);
                                setShopItemName(item.itemName);
                                setShopItemPrice(item.coinPrice);
                                setShopItemStock(item.stock);
                                setShopItemDesc(item.description || '');
                                setShopItemImageUrl(item.imageUrl || '');
                              }}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold"
                            >
                              Sửa
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        ) : (
          <div className="p-16 text-center text-slate-400 italic text-sm">
            Vui lòng khai giảng hoặc lựa chọn phòng học từ hộp chọn switch trên thanh tiêu đề để vận hành giáo vụ.
          </div>
        )}
      </div>
    </div>
  );
};
