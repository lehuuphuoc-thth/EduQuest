import React, { useState, useEffect } from 'react';
import { Database, saveDatabase, generateId, SEED_COSMETICS, getStoredDevice } from '../utils/db';
import { User, RoomParticipant, Quest, QuestSubmission, ShopItem, InventoryItem, CosmeticCatalogItem, PendingPurchase } from '../types';
import { Sparkles, Trophy, ShoppingBag, Landmark, Key, ToggleLeft, ShieldAlert, CircleHelp, RefreshCcw, ScrollText, CheckCircle, Flame, Star, Coins, User as UserIcon, Clock } from 'lucide-react';
import { AvatarWithCosmetics } from './AvatarWithCosmetics';

interface StudentDashboardProps {
  db: Database;
  onRefreshDb: () => void;
  onStudentLogin: (student: User) => void;
  activeStudent: User | null;
  onLogout: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  db,
  onRefreshDb,
  onStudentLogin,
  activeStudent,
  onLogout,
}) => {
  // Login phase
  const [studentCodeInput, setStudentCodeInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeDevice, setActiveDevice] = useState(getStoredDevice());

  // Room view selector
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [inviteCodeJoinInput, setInviteCodeJoinInput] = useState('');

  // Active active tabs: 'quests' | 'shop' | 'customization' | 'lucky'
  const [activeTab, setActiveTab] = useState<'quests' | 'shop' | 'customization' | 'lucky'>('quests');

  // Multi-choice quiz taker state
  const [activeQuizQuest, setActiveQuizQuest] = useState<Quest | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizCompletedScore, setQuizCompletedScore] = useState<{ correct: number; total: number; xpGained: number; goldGained: number } | null>(null);
  const [randomizedQuestions, setRandomizedQuestions] = useState<{
    originalIndex: number;
    question: string;
    options: { text: string; originalIndex: number }[];
    correctAnswerOriginalIndex: number;
  }[]>([]);
  const [currentQuizQuestionIndex, setCurrentQuizQuestionIndex] = useState<number>(0);

  // Wheel state
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [spinDegree, setSpinDegree] = useState(0);
  const [leaderboardFilter, setLeaderboardFilter] = useState<'class' | 'grade'>('class');

  // New UI states for XP float up & Level-up firework celebration
  const [xpFloatValue, setXpFloatValue] = useState<{ amount: number; key: number } | null>(null);
  const [levelUpCelebration, setLevelUpCelebration] = useState<{ newLevel: number; spinsGained: number; key: number } | null>(null);

  // Audio synthesizer using Web Audio API for immersive ticks, level ups, and success fanfare
  const playSound = (type: 'tick' | 'success' | 'xp' | 'levelUp') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === 'tick') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'success') {
        // Grand landing bell arpeggio C4->E4->G4->C5 with high-volume bell decay
        const now = ctx.currentTime;
        [261.63, 329.63, 392.00, 523.25, 659.25].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.12);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.15, now + i * 0.12 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.9);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.95);
        });
      } else if (type === 'xp') {
        // Golden harp rise frequency sweep
        const now = ctx.currentTime;
        const notes = [349.23, 440.00, 523.25, 587.33, 698.46, 880.00, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          gain.gain.setValueAtTime(0.05, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.3);
        });
      } else if (type === 'levelUp') {
        // Retro epic level up chime - rapid arpeggios that sustain wonderfully
        const now = ctx.currentTime;
        const chord = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);
          gain.gain.setValueAtTime(0.12, now + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 1.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 1.3);
        });
      }
    } catch (e) {
      console.warn("Web Audio is unsupported or blocked by browser gesture yet.", e);
    }
  };

  // Consolidate Experience, Money, and level verification in a unified secure flow
  const awardXpAndGold = (xpGained: number, goldGained: number, alertOnNoLevelUpMessage?: string) => {
    if (!activeParticipant || !activeStudent) return;

    activeParticipant.currentXp += xpGained;
    activeParticipant.goldBalance += goldGained;

    let lvl = activeParticipant.currentLevel;
    let xp = activeParticipant.currentXp;
    let spins = activeParticipant.luckySpins;
    let levelDiff = 0;

    let xpRequirement = lvl * 100;
    while (xp >= xpRequirement) {
      xp -= xpRequirement;
      lvl += 1;
      spins += 1; // Award 1 bonus lucky spin on level up
      xpRequirement = lvl * 100;
      levelDiff++;
    }

    activeParticipant.currentLevel = lvl;
    activeParticipant.currentXp = xp;
    activeParticipant.luckySpins = spins;

    // Trigger visual float indicator
    if (xpGained > 0) {
      setXpFloatValue({ amount: xpGained, key: Date.now() });
      playSound('xp');
    }

    saveDatabase(db);
    onRefreshDb();

    if (levelDiff > 0) {
      // open the celebratory pháo hoa modal
      setLevelUpCelebration({
        newLevel: lvl,
        spinsGained: levelDiff,
        key: Date.now()
      });
      playSound('levelUp');
    } else if (alertOnNoLevelUpMessage) {
      alert(alertOnNoLevelUpMessage);
    }
  };

  // Automatic clean up of XP float up bubble
  useEffect(() => {
    if (xpFloatValue) {
      const timer = setTimeout(() => {
        setXpFloatValue(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [xpFloatValue]);

  // Sync simulated device changes in platform
  useEffect(() => {
    const handleDeviceChange = () => {
      setActiveDevice(getStoredDevice());
    };
    window.addEventListener('device-changed', handleDeviceChange);
    return () => window.removeEventListener('device-changed', handleDeviceChange);
  }, []);

  // Auto-enroll new or imported student accounts into classrooms of their matching adminClass
  useEffect(() => {
    if (activeStudent && activeStudent.role === 'student') {
      const studentClass = activeStudent.adminClass;
      if (studentClass) {
        let changed = false;
        db.rooms.forEach(room => {
          const rClass = (room.adminClass || '').trim().toLowerCase();
          const sClass = studentClass.trim().toLowerCase();
          const rName = room.roomName.toLowerCase();
          
          const isMatchingClass = 
            rClass === sClass || 
            (rClass && sClass.includes(rClass)) || 
            (sClass && rClass.includes(sClass)) ||
            rName.includes(sClass) ||
            rName.includes(sClass.replace(/\s+/g, '')) ||
            rName.replace(/\s+/g, '').includes(sClass.replace(/\s+/g, ''));

          if (isMatchingClass) {
            const alreadyParticipant = db.participants.some(
              p => p.roomId === room.id && p.studentId === activeStudent.id
            );
            if (!alreadyParticipant) {
              const newParticipant: RoomParticipant = {
                id: 'part-' + generateId() + '-' + Math.random().toString(36).substring(2, 5),
                roomId: room.id,
                studentId: activeStudent.id,
                currentXp: 0,
                currentLevel: 1,
                goldBalance: 100, // starting gift
                luckySpins: 1,
              };
              db.participants.push(newParticipant);
              changed = true;
            }
          }
        });
        if (changed) {
          saveDatabase(db);
          onRefreshDb();
        }
      }
    }
  }, [activeStudent, db.rooms, db.rooms.length, db.participants, db.participants.length, onRefreshDb]);

  // Filter student classrooms
  const studentMyRooms = activeStudent 
    ? db.rooms.filter(r => db.participants.some(p => p.roomId === r.id && p.studentId === activeStudent.id))
    : [];

  // Active student participant parameters for the enrolled classroom
  const activeParticipant: RoomParticipant | undefined = (activeStudent && selectedRoomId)
    ? db.participants.find(p => p.roomId === selectedRoomId && p.studentId === activeStudent.id)
    : undefined;

  // Set default selected room on login or when classrooms list updates
  useEffect(() => {
    if (activeStudent && studentMyRooms.length > 0) {
      if (!selectedRoomId || !studentMyRooms.some(r => r.id === selectedRoomId)) {
        setSelectedRoomId(studentMyRooms[0].id);
      }
    } else {
      setSelectedRoomId('');
    }
    setSpinDegree(0);
    setSpinResult(null);
    setIsSpinning(false);
  }, [activeStudent?.id, studentMyRooms.length]);

  // LOGIN THREAD WITH STRICT DEVICE LOCK
  const handlePasswordlessLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!studentCodeInput.trim()) {
      setLoginError("Mã học sinh không được rỗng!");
      return;
    }

    const studentUser = db.users.find(
      u => u.role === 'student' && u.studentCode?.toLowerCase() === studentCodeInput.trim().toLowerCase()
    );

    if (!studentUser) {
      setLoginError("Mã học sinh không tồn tại trong học bạ quốc gia! Vui lòng nhờ Admin thêm qua mục Excel.");
      return;
    }

    const deviceFingerprint = activeDevice.id;

    // RULE 1: First login registers this particular device irrevocably
    if (studentUser.registeredDeviceId === null) {
      const updatedUsers = [...db.users];
      const sIdx = updatedUsers.findIndex(u => u.id === studentUser.id);
      if (sIdx !== -1) {
        updatedUsers[sIdx].registeredDeviceId = deviceFingerprint;
        db.users = updatedUsers;
        saveDatabase(db);
        onRefreshDb();
      }
      
      onStudentLogin(updatedUsers[sIdx]);
      alert(`Chào mừng đăng nhập lần đầu! Thiết bị [${activeDevice.name}] đã khóa định danh vĩnh viễn với học kỳ này.`);
      return;
    }

    // RULE 2: From second login, mismatch gets immediately blocked
    if (studentUser.registeredDeviceId !== deviceFingerprint) {
      setLoginError(
        `CẢNH BÁO AN NINH: Thiết bị của bạn (${activeDevice.name}) KHÔNG TRÙNG KHỚP với máy chủ đã ký gửi! Hãy nhờ Giáo viên hoặc Admin tổng quản gỡ khóa.`
      );
      return;
    }

    onStudentLogin(studentUser);
  };

  // JOIN CLASSROOM
  const handleJoinByInviteCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent || !inviteCodeJoinInput.trim()) return;

    const matchedRoom = db.rooms.find(r => r.inviteCode.toUpperCase() === inviteCodeJoinInput.trim().toUpperCase());
    if (!matchedRoom) {
      alert("Mã mời gia nhập lớp không hợp lệ hoặc đã thu hồi!");
      return;
    }

    const alreadyEnrolled = db.participants.some(
      p => p.roomId === matchedRoom.id && p.studentId === activeStudent.id
    );

    if (alreadyEnrolled) {
      alert("Bạn đã gia nhập lớp học này từ trước!");
      setSelectedRoomId(matchedRoom.id);
      setInviteCodeJoinInput('');
      return;
    }

    // Enroll in participant
    const newParticipant: RoomParticipant = {
      id: 'part-' + generateId(),
      roomId: matchedRoom.id,
      studentId: activeStudent.id,
      currentXp: 0,
      currentLevel: 1,
      goldBalance: 100, // starting gift
      luckySpins: 1,
    };

    db.participants.push(newParticipant);
    saveDatabase(db);
    setSelectedRoomId(matchedRoom.id);
    setInviteCodeJoinInput('');
    onRefreshDb();
    alert(`🎉 Chúc mừng học sinh gia nhập khóa học '${matchedRoom.roomName}'! Nhận nóng quạt khởi động +100 Vàng & 1 vòng xoay.`);
  };

  // AUTOMATED QUIZ GRADER
  const handleAnswerChange = (qIdx: number, oIdx: number) => {
    setQuizAnswers({
      ...quizAnswers,
      [qIdx]: oIdx
    });
  };

  const submitQuizAnswers = () => {
    if (!activeStudent || !activeQuizQuest || !activeParticipant) return;
    const questions = activeQuizQuest.quizData || [];

    // Check all questions answered
    if (Object.keys(quizAnswers).length < questions.length) {
      alert("Vui lòng hoàn thiện câu hỏi khảo sát trước khi nộp!");
      return;
    }

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });

    const isPassed = correctCount === questions.length; // 100% correct is perfect pass

    // Calculate score points (proportional to success)
    const successRatio = correctCount / questions.length;
    const xpGained = Math.round(activeQuizQuest.rewardXp * successRatio);
    const goldGained = Math.round(activeQuizQuest.rewardGold * successRatio);

    // Save submission
    const nowStr = new Date().toISOString();
    const existingSubIdx = db.submissions.findIndex(s => s.questId === activeQuizQuest.id && s.studentId === activeStudent.id);
    
    const submissionObj: QuestSubmission = {
      id: 'sub-' + generateId(),
      questId: activeQuizQuest.id,
      studentId: activeStudent.id,
      submissionValue: JSON.stringify(quizAnswers),
      status: isPassed ? 'passed' : 'failed',
      submittedAt: nowStr,
      gradedAt: nowStr
    };

    if (existingSubIdx !== -1) {
      db.submissions[existingSubIdx] = submissionObj;
    } else {
      db.submissions.push(submissionObj);
    }

    // Distribute rewards to participant using consolidated flow
    awardXpAndGold(xpGained, goldGained);

    setQuizCompletedScore({
      correct: correctCount,
      total: questions.length,
      xpGained,
      goldGained
    });
  };

  // AUTO-VOUCHER bypass homework rule
  const handleUseFreePassVoucher = (quest: Quest) => {
    if (!activeStudent || !selectedRoomId || !activeParticipant) return;

    // Check if user has homework pass in inventory
    const voucherCosmetic = SEED_COSMETICS.find(c => c.id === 'cos-effect-sparkle'); // wait, let's look at inventories
    // Let's check for any inventory item corresponding to the Homework Free Pass item or let them spend it.
    // In our seed database, standard shop item 3 is "Thẻ Miễn Bài Tập Về Nhà".
    // Let's look up physical items or cosmetics. Since Homework Pass is stored dynamically as a cosmetic unlocked, let's treat any inventory record with "Thẻ Miễn Bài Tập Về Nhà" name or corresponding cosmeticId.
    // Alternatively, look for a custom inventory item by name: "Thẻ Miễn Bài Tập"
    const passIdx = db.inventory.findIndex(inv => 
      inv.studentId === activeStudent.id && 
      inv.roomId === selectedRoomId &&
      inv.cosmeticId === 'shop-3' // we saved custom item code 'shop-3' in shop or inventory
    );

    if (passIdx === -1) {
      alert("Báo lỗi: Bạn không sở học 'Thẻ Miễn Bài Tập Về Nhà' trong kho đồ cá nhân!");
      return;
    }

    if (!confirm("Bấm đồng ý để tiêu thụ 'Thẻ Miễn Bài Tập Về Nhà', hoàn thành tự động bài học này không cần làm bài?")) {
      return;
    }

    // Consume Voucher index
    db.inventory.splice(passIdx, 1);

    // Auto mark quest passed
    const nowStr = new Date().toISOString();
    const existingSubIdx = db.submissions.findIndex(s => s.questId === quest.id && s.studentId === activeStudent.id);
    
    // Awards minimal pass rewards automatically
    const autoXp = Math.floor(quest.rewardXp * 0.6); // 60% standard
    const autoGold = Math.floor(quest.rewardGold * 0.6);

    const submissionObj: QuestSubmission = {
      id: 'sub-' + generateId(),
      questId: quest.id,
      studentId: activeStudent.id,
      status: 'passed',
      isVoucherUsed: true,
      submittedAt: nowStr,
      gradedAt: nowStr
    };

    if (existingSubIdx !== -1) {
      db.submissions[existingSubIdx] = submissionObj;
    } else {
      db.submissions.push(submissionObj);
    }

    awardXpAndGold(autoXp, autoGold, `🎟️ Kích hoạt bùa hộ mệnh thành công! Tiêu hao 1 Thẻ, tự động đạt cột mốc Đạt [Passed]. Nhận nhẹ +${autoXp} XP.`);
  };

  // COIN SHOP PURCHASES
  const handleBuyShopItem = (item: ShopItem) => {
    if (!activeStudent || !activeParticipant) return;

    if (activeParticipant.goldBalance < item.coinPrice) {
      alert(`Thiếu vàng! Bạn chỉ có ${activeParticipant.goldBalance}🪙 cần ${item.coinPrice}🪙 để mua.`);
      return;
    }

    if (item.stock === 0) {
      alert("Hết hàng tồn!");
      return;
    }

    // Deduct cost immediately as required "xu trừ đi"
    activeParticipant.goldBalance -= item.coinPrice;

    // Check if teacher approval is enabled (active by default)
    const approvalRequired = db.shopApprovalRequired !== false;

    if (approvalRequired) {
      if (!db.pendingPurchases) db.pendingPurchases = [];

      const payload: PendingPurchase = {
        id: 'purch-' + generateId(),
        studentId: activeStudent.id,
        studentName: activeStudent.fullName,
        roomId: selectedRoomId,
        roomName: db.rooms.find(r => r.id === selectedRoomId)?.roomName || 'Lớp học',
        shopItemId: item.id,
        itemName: item.itemName,
        coinPrice: item.coinPrice,
        status: 'pending',
        purchasedAt: new Date().toISOString()
      };

      db.pendingPurchases.push(payload);
      saveDatabase(db);
      onRefreshDb();
      alert(`🏷️ Đã gửi Đề xuất Đổi Xu cho '${item.itemName}'! Số tiền ${item.coinPrice}🪙 đã được giữ và đang chờ giáo viên phê duyệt kiểm duyệt.`);
    } else {
      // Direct instant fulfillment
      if (item.stock > 0) {
        item.stock -= 1;
      }

      if (item.itemName.includes("Thăng Cấp") || item.itemName.includes("+100 XP")) {
        awardXpAndGold(100, 0, "⚡ Mở nhanh Bao thăng cấp! Nhận ngay +100 XP.");
      } else {
        db.inventory.push({
          id: 'inv-purch-' + generateId(),
          studentId: activeStudent.id,
          roomId: selectedRoomId,
          cosmeticId: item.id,
          status: 'unused',
          unlockedAt: new Date().toISOString()
        });
      }

      saveDatabase(db);
      onRefreshDb();
      alert(`🛍️ Đổi vật phẩm thành công! Đã chuyển '${item.itemName}' vào hành trang kho đồ.`);
    }
  };

  // EQUIP COSMETICS
  const handleEquipCosmetic = (catalogItem: CosmeticCatalogItem) => {
    if (!activeStudent || !selectedRoomId || !activeParticipant) return;

    const isUnlocked = catalogItem.isDefault || 
      db.inventory.some(inv => inv.studentId === activeStudent.id && inv.roomId === selectedRoomId && inv.cosmeticId === catalogItem.id) ||
      (catalogItem.minLevel && activeParticipant.currentLevel >= catalogItem.minLevel);

    if (!isUnlocked) {
      alert("Vật phẩm đang bị khóa cấp độ hoặc bạn chưa quy đổi trong cửa hàng!");
      return;
    }

    const updatedUsers = [...db.users];
    const sIdx = updatedUsers.findIndex(u => u.id === activeStudent.id);
    if (sIdx !== -1) {
      if (catalogItem.type === 'avatar') {
        updatedUsers[sIdx].activeAvatarPath = catalogItem.filePath;
      } else if (catalogItem.type === 'frame') {
        updatedUsers[sIdx].activeFramePath = catalogItem.filePath;
      } else if (catalogItem.type === 'effect') {
        updatedUsers[sIdx].activeEffectPath = catalogItem.filePath;
      }
      db.users = updatedUsers;
      saveDatabase(db);
      onRefreshDb();
      // Update context profile
      onStudentLogin(updatedUsers[sIdx]);
    }
  };

  const handleClearEquippedFrame = () => {
    if (!activeStudent) return;
    const updatedUsers = [...db.users];
    const sIdx = updatedUsers.findIndex(u => u.id === activeStudent.id);
    if (sIdx !== -1) {
      updatedUsers[sIdx].activeFramePath = null;
      db.users = updatedUsers;
      saveDatabase(db);
      onRefreshDb();
      onStudentLogin(updatedUsers[sIdx]);
    }
  };

  const handleClearEquippedEffect = () => {
    if (!activeStudent) return;
    const updatedUsers = [...db.users];
    const sIdx = updatedUsers.findIndex(u => u.id === activeStudent.id);
    if (sIdx !== -1) {
      updatedUsers[sIdx].activeEffectPath = null;
      db.users = updatedUsers;
      saveDatabase(db);
      onRefreshDb();
      onStudentLogin(updatedUsers[sIdx]);
    }
  };

  // WEIGHTED LUCKY WHEEL SPINNING WHEEL
  const spinLuckyWheel = () => {
    if (!activeStudent || !selectedRoomId || !activeParticipant) return;

    if (activeParticipant.luckySpins <= 0) {
      alert("Hết lượt quay may mắn! Hãy hoàn thành nhiệm vụ xuất sắc để tích thêm lượt.");
      return;
    }

    if (isSpinning) return;

    setIsSpinning(true);
    setSpinResult(null);

    // 1. Get Weighted prizes from database wheelWeights config or default
    const weights = db.wheelWeights || { '1': 45, '2': 30, '3': 13, '4': 9, '5': 3 };

    const rewards = [
      { id: '1', name: "Chúc bạn may mắn lần sau", weight: Number(weights['1'] ?? 45) },
      { id: '2', name: "Cộng thêm +30 tiền vàng", weight: Number(weights['2'] ?? 30) },
      { id: '3', name: "Thẻ Nhân Đôi XP bài tiếp theo", weight: Number(weights['3'] ?? 13) },
      { id: '4', name: "Avatar 'Phù Thủy Học Thuật'", weight: Number(weights['4'] ?? 9) },
      { id: '5', name: "Voucher Miễn Bài Tập Về Nhà", weight: Number(weights['5'] ?? 3) }
    ];

    let totalWeight = rewards.reduce((acc, r) => acc + r.weight, 0);
    if (totalWeight <= 0) {
      rewards[0].weight = 100;
      totalWeight = 100;
    }
    let randomNumber = Math.floor(Math.random() * totalWeight) + 1;
    
    let selectedReward = rewards[0];
    let cumulativeWeight = 0;
    for (let r of rewards) {
      cumulativeWeight += r.weight;
      if (randomNumber <= cumulativeWeight) {
        selectedReward = r;
        break;
      }
    }

    const prizeAngles: Record<string, number> = {
      '1': 270,
      '2': 342,
      '3': 54,
      '4': 126,
      '5': 198
    };

    const targetCenterAngle = prizeAngles[selectedReward.id] || 270;
    const targetRotation = (360 - targetCenterAngle) % 360;

    // Calculate clockwise cumulative degrees starting from current rotation (12 full rotations = 4320 deg for dramatic speed)
    const currentRot = spinDegree;
    let extraDegrees = targetRotation - (currentRot % 360);
    if (extraDegrees <= 0) {
      extraDegrees += 360;
    }
    const addedDegree = currentRot + 4320 + extraDegrees;
    setSpinDegree(addedDegree);

    // Audio tickers decoration exactly synchronized with CSS rotation of 6000ms duration
    const totalTicks = 28; 
    const durationMs = 6000;
    for (let i = 0; i < totalTicks; i++) {
      const progress = i / (totalTicks - 1);
      // Logarithmic mechanical tick spacing matching deceleration physics
      const delay = Math.pow(progress, 2.3) * (durationMs - 500);
      setTimeout(() => {
        playSound('tick');
      }, delay);
    }

    setTimeout(() => {
      // 2. Consume 1 free spin
      activeParticipant.luckySpins -= 1;

      // 3. Handout reward
      if (selectedReward.id === '2') {
        activeParticipant.goldBalance += 30;
      } else if (selectedReward.id === '3') {
        db.inventory.push({
          id: 'inv-wheel-' + generateId(),
          studentId: activeStudent.id,
          roomId: selectedRoomId,
          cosmeticId: 'cos-effect-sparkle', 
          status: 'unused',
          unlockedAt: new Date().toISOString()
        });
      } else if (selectedReward.id === '4') {
        db.inventory.push({
          id: 'inv-wheel-' + generateId(),
          studentId: activeStudent.id,
          roomId: selectedRoomId,
          cosmeticId: 'cos-avatar-wizard',
          status: 'unused',
          unlockedAt: new Date().toISOString()
        });
      } else if (selectedReward.id === '5') {
        db.inventory.push({
          id: 'inv-wheel-' + generateId(),
          studentId: activeStudent.id,
          roomId: selectedRoomId,
          cosmeticId: 'shop-3', 
          status: 'unused',
          unlockedAt: new Date().toISOString()
        });
      }

      saveDatabase(db);
      onRefreshDb();
      setIsSpinning(false);
      setSpinResult(selectedReward.name);
      
      // Play landing sound fanfare exactly as the wheel stops rotating
      playSound('success');
    }, durationMs + 100);
  };

  // Simulating the daily cron loop with a quick test action
  const handleForceMidnightCronJob = () => {
    const dbInst = db;
    const now = new Date();
    let penalized = 0;

    dbInst.quests.forEach(quest => {
      const deadlineDate = new Date(quest.deadline);
      if (deadlineDate < now) {
        const participantsInRoom = dbInst.participants.filter(p => p.roomId === quest.roomId);
        participantsInRoom.forEach(p => {
          const submission = dbInst.submissions.find(sub => sub.questId === quest.id && sub.studentId === p.studentId);
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
              dbInst.submissions.push(currentSub);
            } else {
              currentSub.status = 'failed';
              currentSub.gradedAt = now.toISOString();
            }

            p.currentXp = Math.max(0, p.currentXp - quest.penaltyXp);
            // deduct a small gold fine as per specifications
            p.goldBalance = Math.max(0, p.goldBalance - 10);
            penalized++;
          }
        });
      }
    });

    if (penalized > 0) {
      saveDatabase(dbInst);
      onRefreshDb();
      alert(`⚙️ CRON JOB 00:00 TRIGGERED: Tìm thấy bài tập đã quá hạn và chưa đạt! Trừ điểm phạt thành công cho ${penalized} lượt học sinh.`);
    } else {
      alert("⚙️ CRON JOB 00:00 TRIGGERED: Toàn bộ học sinh đã nộp bài đầy đủ hoặc không tìm thấy việc quá hạn mới!");
    }
  };

  // LEADERBOARD RENDER FOR CLASS OR GRADE
  const getLeaderboard = () => {
    if (!selectedRoomId) return [];
    
    const activeRoom = db.rooms.find(r => r.id === selectedRoomId);
    if (!activeRoom) return [];

    let participantsIn: typeof db.participants = [];
    
    if (leaderboardFilter === 'class') {
      participantsIn = db.participants.filter(p => p.roomId === selectedRoomId);
    } else {
      // Find active room's grade, default to "Khối 5" if undefined and activeRoom name or adminClass has 5
      const gradeName = activeRoom.grade || 
                       (activeRoom.adminClass?.includes('5') ? 'Khối 5' : 
                        activeRoom.adminClass?.includes('4') ? 'Khối 4' : 
                        activeRoom.adminClass?.includes('3') ? 'Khối 3' : 'Khối 5');
      
      // Get all rooms that are in this grade
      const gradeRooms = db.rooms.filter(r => {
        if (r.grade === gradeName) return true;
        const cls = r.adminClass || '';
        if (gradeName === 'Khối 5' && cls.includes('5')) return true;
        if (gradeName === 'Khối 4' && cls.includes('4')) return true;
        if (gradeName === 'Khối 3' && cls.includes('3')) return true;
        return false;
      });

      const gradeRoomIds = gradeRooms.map(r => r.id);
      
      // Find all participants in those rooms
      const allParts = db.participants.filter(p => gradeRoomIds.includes(p.roomId));
      
      // Group by studentId so each student appears only once on the grade leaderboard, with their highest level/xp record
      const uniqueStudentsMap: Record<string, typeof allParts[0]> = {};
      allParts.forEach(p => {
        if (!uniqueStudentsMap[p.studentId] || uniqueStudentsMap[p.studentId].currentLevel < p.currentLevel || (uniqueStudentsMap[p.studentId].currentLevel === p.currentLevel && uniqueStudentsMap[p.studentId].currentXp < p.currentXp)) {
          uniqueStudentsMap[p.studentId] = p;
        }
      });
      participantsIn = Object.values(uniqueStudentsMap);
    }
    
    return participantsIn
      .map(part => {
        const studentInfo = db.users.find(u => u.id === part.studentId);
        return {
          id: part.studentId,
          fullName: studentInfo?.fullName || 'Ẩn danh',
          level: part.currentLevel,
          xp: part.currentXp,
          gold: part.goldBalance,
          avatarPath: studentInfo?.activeAvatarPath || 'default_nam.png',
          framePath: studentInfo?.activeFramePath || null,
          effectPath: studentInfo?.activeEffectPath || null,
          adminClass: studentInfo?.adminClass || 'Học viên',
        };
      })
      .sort((a, b) => b.level !== a.level ? b.level - a.level : b.xp - a.xp);
  };

  // If student NOT logged in, show login form
  if (!activeStudent) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden max-w-md mx-auto" id="student-login-box">
        <div className="bg-gradient-to-r from-blue-650 via-indigo-650 to-indigo-800 p-6 text-white text-center">
          <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest block bg-white/10 px-3 py-1 rounded-full w-fit mx-auto mb-2">
            Học Sinh Cổng Đăng Nhập
          </span>
          <h2 className="text-xl font-extrabold tracking-tight">Khu Phiêu Lưu Học Tập</h2>
          <p className="text-indigo-200 text-xs mt-1">Sử dụng Mã học sinh (Không dùng mật khẩu) để bước vào hành trình phiêu lưu cày vàng.</p>
        </div>

        <form onSubmit={handlePasswordlessLogin} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Mã Học sinh cá nhân</label>
            <div className="relative">
              <Key className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={studentCodeInput}
                onChange={e => setStudentCodeInput(e.target.value)}
                placeholder="Ví dụ: HS-2026-001 hoặc HS-2026-002"
                className="w-full text-xs pl-9 pr-3.5 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                required
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
              *Hãy thử mã: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-bold">HS-2026-001</code> (Thiết bị mới) hoặc <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-bold">HS-2026-002</code> (Bị khóa với máy ảo Windows 11 Chrome).
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-50 border border-rose-150 rounded-lg text-rose-800 font-medium text-[11.5px] leading-relaxed flex gap-1.5">
              <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold text-xs py-3 rounded-lg hover:bg-indigo-700 transition shadow"
          >
            BƯỚC VÀO PHÒNG HỌC
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Visual Header containing game stats */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="absolute right-0 top-0 w-80 h-40 bg-indigo-800/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Profile Card left */}
        <div className="flex items-center gap-4 relative z-10">
          <AvatarWithCosmetics
            avatarPath={activeStudent.activeAvatarPath}
            framePath={activeStudent.activeFramePath}
            effectPath={activeStudent.activeEffectPath}
            size="lg"
            level={activeParticipant?.currentLevel || 1}
          />

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest bg-indigo-900/60 border border-indigo-700 px-2 py-0.5 rounded">Học Sinh</span>
            <h3 className="text-lg font-black tracking-tight">{activeStudent.fullName}</h3>
            <p className="text-xs text-indigo-200 font-mono">Mã số: {activeStudent.studentCode}</p>
          </div>
        </div>

        {/* Selected Class Parameter right */}
        {selectedRoomId ? (
          <div className="flex flex-wrap items-center gap-4 lg:gap-8 bg-black/20 border border-white/5 p-4 rounded-xl relative z-10 w-full lg:w-auto">
            {/* XP progress */}
            <div className="min-w-44 shrink-0 flex-1 relative z-10">
              {/* Floating +XP Indicator */}
              {xpFloatValue && (
                <div 
                  key={xpFloatValue.key}
                  className="absolute -top-7 right-0 text-[11px] font-black text-emerald-400 bg-emerald-950/90 border border-emerald-500/50 px-2 py-0.5 rounded-full shadow-md z-30 xp-float-animate pointer-events-none whitespace-nowrap"
                >
                  +{xpFloatValue.amount} XP ✨
                </div>
              )}

              <div className="flex justify-between items-center text-[10px] font-mono text-slate-300 font-bold mb-1">
                <span>XP KINH NGHIỆM</span>
                <span>{activeParticipant?.currentXp || 0} / {(activeParticipant?.currentLevel || 1) * 100} XP</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
                <div
                  className="bg-gradient-to-r from-indigo-400 to-cyan-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((activeParticipant?.currentXp || 0) / ((activeParticipant?.currentLevel || 1) * 100)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Gold balance */}
            <div className="text-center shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Hòm Coins</span>
              <div className="text-xl font-bold text-amber-400 font-mono mt-0.5 flex items-center gap-1">
                <Coins className="h-4.5 w-4.5 text-amber-400" />
                {activeParticipant?.goldBalance || 0}🪙
              </div>
            </div>

            {/* Spins */}
            <div className="text-center shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Lượt Quay</span>
              <div className="text-xl font-black text-rose-450 font-mono mt-0.5 flex items-center justify-center gap-1">
                <Sparkles className="h-4 w-4 text-rose-400" />
                {activeParticipant?.luckySpins || 0}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs italic text-indigo-200 z-10">Lớp học chưa được gán phòng tương ứng.</p>
        )}
      </div>

      {/* Classroom Switcher / Class enrolling panel */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Switch classroom selectors */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Chỉnh Môn Học:</span>
          {studentMyRooms.length > 0 ? (
            <div className="flex gap-1.5 flex-wrap">
              {studentMyRooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`text-xs px-3 py-1.5 rounded-full font-bold transition ${
                    selectedRoomId === room.id
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-white border border-slate-300 text-slate-650 hover:bg-slate-100'
                  }`}
                >
                  {room.roomName}
                </button>
              ))}
            </div>
          ) : (
            <span className="text-xs italic text-slate-400">Bạn chưa có phòng học tự động nào cho lớp.</span>
          )}
        </div>
      </div>

      {/* Primary Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Main workspace left (cols: 3/4) */}
          <div className="xl:col-span-3 space-y-6">
            
            {/* Header Tabs Navigation */}
            <div className="flex border-b border-slate-150 bg-white rounded-t-xl overflow-hidden shadow-sm">
              <button
                onClick={() => { setActiveTab('quests'); setActiveQuizQuest(null); setQuizCompletedScore(null); }}
                className={`flex-1 py-3.5 text-xs font-bold transition ${
                  activeTab === 'quests' ? 'bg-indigo-50 border-b-2 border-indigo-650 text-indigo-650' : 'text-slate-600 hover:bg-slate-50/50'
                }`}
              >
                📜 BẢNG NHIỆM VỤ ({db.quests.filter(q => q.roomId === selectedRoomId).length})
              </button>
              <button
                onClick={() => { setActiveTab('shop'); setActiveQuizQuest(null); }}
                className={`flex-1 py-3.5 text-xs font-bold transition ${
                  activeTab === 'shop' ? 'bg-indigo-50 border-b-2 border-indigo-650 text-indigo-650' : 'text-slate-600 hover:bg-slate-50/50'
                }`}
              >
                🛍️ CỬA HÀNG ĐỔI XU
              </button>
              <button
                onClick={() => { setActiveTab('customization'); setActiveQuizQuest(null); }}
                className={`flex-1 py-3.5 text-xs font-bold transition ${
                  activeTab === 'customization' ? 'bg-indigo-50 border-b-2 border-indigo-650 text-indigo-650' : 'text-slate-600 hover:bg-slate-50/50'
                }`}
              >
                👑 KHU DIỆN MẠO CỦA TÔI
              </button>
              <button
                onClick={() => { setActiveTab('lucky'); setActiveQuizQuest(null); }}
                className={`flex-1 py-3.5 text-xs font-bold transition ${
                  activeTab === 'lucky' ? 'bg-indigo-50 border-b-2 border-indigo-650 text-indigo-650' : 'text-slate-600 hover:bg-slate-50/50'
                }`}
              >
                🎡 VÒNG QUAY MAY MẮN
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="bg-white p-6 rounded-b-xl border-x border-b border-slate-150 shadow-sm min-h-96">
              
              {/* TAB 1: QUEST BOARD & INTERACTIVE QUIZ */}
              {activeTab === 'quests' && (
                <div className="space-y-6">
                  {!selectedRoomId ? (
                    <div className="py-12 px-6 flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4">
                      <div className="bg-indigo-50 p-4 rounded-full text-indigo-500 border-4 border-indigo-100 shadow-inner animate-pulse">
                        <ScrollText className="h-10 w-10 text-indigo-500" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center justify-center gap-1.5">
                          🔒 Bảng Nhiệm Vụ Đã Bị Khóa
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Học sinh <span className="font-bold text-indigo-700">{activeStudent.fullName}</span> hiện tại chưa tham gia vào phòng học nào. Bảng nhiệm vụ đã bị khóa.
                        </p>
                        <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3.5 text-[11px] text-amber-800 font-semibold leading-relaxed max-w-md mx-auto shadow-sm">
                          💡 <strong>Ghép phòng tự động:</strong> Khi Giáo viên khởi tạo hoặc gán phòng học cho lớp của bạn (<span className="font-bold text-indigo-700">Lớp {activeStudent.adminClass || 'chưa xác định'}</span>) - Ví dụ: <strong>"Môn học X - {activeStudent.adminClass || '5B'}"</strong>, hệ thống sẽ tự động ghép bạn vào phòng học tương ứng và mở khóa Bảng nhiệm vụ này!
                        </div>
                      </div>
                    </div>
                  ) : !activeQuizQuest ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Ma Trận Bài Tập Trong Tháng</h4>
                        <button
                          onClick={handleForceMidnightCronJob}
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded border border-slate-200 font-bold"
                          title="Simulate 00:00 Auto Penalty system"
                        >
                          Chạy nhanh Midnight 00:00 Penalty ⚡
                        </button>
                      </div>

                      <div className="space-y-4">
                        {db.quests.filter(q => q.roomId === selectedRoomId).map(quest => {
                          const submission = db.submissions.find(s => s.questId === quest.id && s.studentId === activeStudent.id);
                          const isOver = new Date(quest.deadline) < new Date();
                          
                          // Check if student has Homework Voucher inside hòm đồ
                          const hasOmitVoucher = db.inventory.some(inv => 
                            inv.studentId === activeStudent.id && 
                            inv.roomId === selectedRoomId &&
                            inv.cosmeticId === 'shop-3' // voucher
                          );

                          return (
                            <div key={quest.id} className="p-4.5 rounded-xl border border-slate-150 bg-white/70 hover:shadow-md transition duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {submission ? (
                                    submission.status === 'passed' ? (
                                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border border-emerald-250 inline-flex items-center gap-0.5 shadow-sm">
                                        ✓ Hoàn thành
                                      </span>
                                    ) : (
                                      <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border border-rose-250 inline-flex items-center gap-0.5 animate-pulse">
                                        ✗ Thất bại (Trừ XP)
                                      </span>
                                    )
                                  ) : (
                                    <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border border-amber-200">
                                      Chờ hoàn thành
                                    </span>
                                  )}

                                  <span className="text-slate-400 text-[10px] font-mono">
                                    Hạn: {new Date(quest.deadline).toLocaleDateString('vi-VN')} {isOver && "⚠️ Quá hạn"}
                                  </span>
                                </div>
                                <h5 className="font-extrabold text-slate-900 text-[14.5px] leading-snug">{quest.title}</h5>
                                <p className="text-xs text-slate-500 max-w-xl leading-relaxed">{quest.description}</p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                                {/* Auto voucher bypass homework loop button */}
                                {!submission && hasOmitVoucher && (
                                  <button
                                    onClick={() => handleUseFreePassVoucher(quest)}
                                    className="bg-purple-650 hover:bg-purple-700 text-white font-extrabold text-[10.5px] px-3 py-2 rounded-lg flex items-center gap-1 border border-purple-500 shadow-sm"
                                    title="Sử dụng Thẻ Miễn Bài Tập Về Nhà không cần chấm bài"
                                  >
                                    <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-pulse" />
                                    Bỏ Qua Bài Tập (Miễn)
                                  </button>
                                )}

                                {!submission && !isOver && (
                                  quest.questType === 'quiz' ? (
                                    <button
                                      onClick={() => {
                                        const rawQuestions = quest.quizData || [];
                                        const shuffled = rawQuestions.map((q, qIdx) => {
                                          const mappedOpts = q.options.map((opt, oIdx) => ({
                                            text: opt,
                                            originalIndex: oIdx,
                                          }));
                                          // Shuffle the options
                                          const shuffledOpts = [...mappedOpts];
                                          for (let i = shuffledOpts.length - 1; i > 0; i--) {
                                            const j = Math.floor(Math.random() * (i + 1));
                                            const temp = shuffledOpts[i];
                                            shuffledOpts[i] = shuffledOpts[j];
                                            shuffledOpts[j] = temp;
                                          }
                                          return {
                                            originalIndex: qIdx,
                                            question: q.question,
                                            options: shuffledOpts,
                                            correctAnswerOriginalIndex: q.correctAnswer,
                                          };
                                        });

                                        // Shuffle the questions list itself
                                        const shuffledQuestions = [...shuffled];
                                        for (let i = shuffledQuestions.length - 1; i > 0; i--) {
                                          const j = Math.floor(Math.random() * (i + 1));
                                          const temp = shuffledQuestions[i];
                                          shuffledQuestions[i] = shuffledQuestions[j];
                                          shuffledQuestions[j] = temp;
                                        }

                                        setRandomizedQuestions(shuffledQuestions);
                                        setCurrentQuizQuestionIndex(0);
                                        setActiveQuizQuest(quest);
                                        setQuizAnswers({});
                                        setQuizCompletedScore(null);
                                      }}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition"
                                    >
                                      Bắt đầu Kiểm tra (Tự Chấm)
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        if (confirm("Nộp tệp tin cho nhiệm vụ này? Nhấn Đồng ý để nộp ngay bản file nháp.")) {
                                          const dbInst = db;
                                          dbInst.submissions.push({
                                            id: 'sub-' + generateId(),
                                            questId: quest.id,
                                            studentId: activeStudent.id,
                                            status: 'passed',
                                            submittedAt: new Date().toISOString(),
                                            gradedAt: new Date().toISOString()
                                          });
                                          // award points manually using consolidated helper
                                          awardXpAndGold(quest.rewardXp, quest.rewardGold, "Nộp tệp tin hoàn tất! Giáo vụ đã ký số tự chấm.");
                                        }
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition"
                                    >
                                      Ký Nộp File Dự Án
                                    </button>
                                  )
                                )}

                                {submission && (
                                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                                    Đã ghi nhận kết quả
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {db.quests.filter(q => q.roomId === selectedRoomId).length === 0 && (
                          <div className="py-16 text-center text-slate-450 italic">
                            Giáo viên chưa đăng tải nhiệm vụ nào.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // ACTIVE MULTIPLE-CHOICE QUIZ TASK RENDER
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">KHẢO SÁT CHUYÊN MÔN:</span>
                          <h4 className="font-extrabold text-slate-800 text-base">{activeQuizQuest.title}</h4>
                        </div>
                        <button
                          onClick={() => setActiveQuizQuest(null)}
                          className="text-xs text-slate-500 hover:text-slate-800 font-bold border border-slate-200 rounded px-2.5 py-1"
                        >
                          Quay Lại
                        </button>
                      </div>

                      {!quizCompletedScore ? (
                        <div className="space-y-6 max-w-2xl">
                          {randomizedQuestions.length > 0 && currentQuizQuestionIndex < randomizedQuestions.length && (
                            (() => {
                              const questionObj = randomizedQuestions[currentQuizQuestionIndex];
                              const hasAnsweredCurrent = quizAnswers[questionObj.originalIndex] !== undefined;
                              const isLastQuestion = currentQuizQuestionIndex === randomizedQuestions.length - 1;

                              return (
                                <div className="space-y-5">
                                  {/* Progress tracker */}
                                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                    <span className="text-xs font-bold text-indigo-900">
                                      Tiến độ kiểm tra: Câu {currentQuizQuestionIndex + 1} / {randomizedQuestions.length}
                                    </span>
                                    <div className="w-1/2 bg-slate-200 rounded-full h-2 overflow-hidden">
                                      <div
                                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${((currentQuizQuestionIndex + 1) / randomizedQuestions.length) * 100}%` }}
                                      />
                                    </div>
                                  </div>

                                  {/* Question box */}
                                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-205 space-y-3 shadow-inner">
                                    <span className="font-extrabold text-indigo-700 text-[11px] tracking-wider uppercase block">
                                      CÂU HỎI {currentQuizQuestionIndex + 1} SỐ HẬU BỊ:
                                    </span>
                                    <p className="font-extrabold text-slate-800 text-sm leading-relaxed">
                                      {questionObj.question}
                                    </p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                                      {questionObj.options.map((opt, oIdx) => {
                                        const isChecked = quizAnswers[questionObj.originalIndex] === opt.originalIndex;
                                        return (
                                          <button
                                            key={oIdx}
                                            type="button"
                                            onClick={() => handleAnswerChange(questionObj.originalIndex, opt.originalIndex)}
                                            className={`p-3 text-left text-xs rounded-lg border font-medium transition flex items-center justify-between ${
                                              isChecked
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow font-bold'
                                                : 'bg-white hover:bg-slate-100 border-slate-250 text-slate-700'
                                            }`}
                                          >
                                            <span>{oIdx + 1}. {opt.text}</span>
                                            {isChecked && <CheckCircle className="h-4 w-4 text-white shrink-0" />}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Action button */}
                                  <div className="pt-2">
                                    {!isLastQuestion ? (
                                      <button
                                        type="button"
                                        disabled={!hasAnsweredCurrent}
                                        onClick={() => setCurrentQuizQuestionIndex((prev) => prev + 1)}
                                        className={`font-black text-xs px-6 py-3.5 rounded-lg shadow transition w-full text-center ${
                                          hasAnsweredCurrent
                                            ? 'bg-indigo-700 hover:bg-indigo-850 text-white cursor-pointer'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                                        }`}
                                      >
                                        {!hasAnsweredCurrent 
                                          ? 'Vui Lòng Chọn Đáp Án Để Xác Nhận' 
                                          : 'Xác Nhận & Qua Câu Tiếp Theo ➔'}
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={!hasAnsweredCurrent}
                                        onClick={submitQuizAnswers}
                                        className={`font-black text-xs px-6 py-3.5 rounded-lg shadow-md transition w-full text-center ${
                                          hasAnsweredCurrent
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                                        }`}
                                      >
                                        {!hasAnsweredCurrent 
                                          ? 'Vui Lòng Chọn Đáp Án Để Nộp Bài' 
                                          : 'Nộp Gửi Bài Làm & Tự Chấm Thang Điểm ✓'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })()
                          )}
                        </div>
                      ) : (
                        // SUCCESS EVALUATION PANEL
                        <div className="p-8 text-center bg-slate-50 border rounded-2xl max-w-md mx-auto space-y-4">
                          <div className="bg-emerald-100 p-3.5 rounded-full w-fit mx-auto text-emerald-650">
                            <Trophy className="h-10 w-10 animate-bounce" />
                          </div>
                          
                          <div>
                            <h5 className="font-black text-slate-900 text-base">CHẤM THI HOÀN TẤT</h5>
                            <p className="text-xs text-slate-500 mt-1">Hệ thống thông minh đã hoàn tât so khớp bài làm!</p>
                          </div>

                          <div className="bg-white p-4 rounded-xl border border-slate-150 inline-block font-mono text-sm font-bold min-w-44 text-slate-700">
                            Số câu trả lời đúng:<br />
                            <span className="text-xl text-indigo-700">{quizCompletedScore.correct} / {quizCompletedScore.total}</span>
                          </div>

                          <div className="text-xs leading-relaxed text-slate-500">
                            Bạn đã nhận được: <span className="font-bold text-indigo-650">+{quizCompletedScore.xpGained} XP</span> và{' '}
                            <span className="font-bold text-amber-500">+{quizCompletedScore.goldGained} Vàng</span> tích lũy!
                          </div>

                          <button
                            onClick={() => setActiveQuizQuest(null)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg"
                          >
                            Đồng Ý
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: COIN SHOP */}
              {activeTab === 'shop' && (
                <div className="space-y-6">
                  {!selectedRoomId ? (
                    <div className="py-12 px-6 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
                      <div className="bg-slate-100 p-4 rounded-full text-slate-400 border-4 border-slate-200 shadow-inner">
                        <ShoppingBag className="h-10 w-10 text-slate-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">🛍️ Cửa Hàng Đang Khóa</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Vui lòng đợi Giáo viên khởi tạo hoặc gán phòng học cho lớp của bạn để mở khóa cửa hàng đổi thưởng!</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest flex items-center gap-1.5 pb-2">
                          <ShoppingBag className="h-4 w-4 text-indigo-650" />
                          Gian Hàng Sắc Diện Đổi Thưởng
                        </h4>
                        <p className="text-xs text-slate-500">Tiêu dùng số tiền vàng bạn cày cuốc học tập được để lấy các bùa lợi, thẻ bài và báu diện mạo.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {db.shopItems.filter(i => i.roomId === selectedRoomId).map(item => {
                          const isHomeworkVoucher = item.id === 'shop-3';
                          const isOutOfStock = item.stock === 0;
                          
                          return (
                            <div key={item.id} className="bg-slate-50/50 border border-slate-150 rounded-xl p-4 flex flex-col justify-between space-y-4 hover:shadow-sm transition">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase">
                                    {isHomeworkVoucher ? '🎟️ Đặc quyền miễn' : '🛍️ Tiêu dùng thực'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Kho hàng: {item.stock === -1 ? 'Bao la' : `${item.stock}`}
                                  </span>
                                </div>

                                {/* Custom Uploaded image presentation banner if defined */}
                                {item.imageUrl && (
                                  <div className="w-full h-24 rounded-lg bg-white border border-slate-150 overflow-hidden flex items-center justify-center p-1">
                                    <img 
                                      src={item.imageUrl} 
                                      alt={item.itemName} 
                                      className="max-h-full max-w-full object-contain" 
                                      referrerPolicy="no-referrer" 
                                    />
                                  </div>
                                )}

                                <h5 className="font-bold text-slate-850 text-sm leading-tight">{item.itemName}</h5>
                                <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                              </div>

                              <div className="flex items-center justify-between border-t border-slate-150 pt-2.5">
                                <span className="font-extrabold text-[#D97706] text-sm flex items-center gap-1">
                                  <Coins className="h-4.5 w-4.5 text-amber-500" />
                                  {item.coinPrice}🪙
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleBuyShopItem(item)}
                                  disabled={isOutOfStock}
                                  className={`text-xs font-bold px-3 py-2 rounded-lg transition ${
                                    isOutOfStock
                                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                                  }`}
                                >
                                  {isOutOfStock ? 'Hết hàng' : 'Đổi Xu'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* INDIVIDUAL PENDING APPROVAL LIST FOR STUDENT FOR CLASSROOM TRANSPARENCY */}
                      <div className="bg-white border border-slate-200 rounded-xl p-5 mt-8 space-y-4 shadow-sm">
                        <div className="border-b pb-2 flex items-center justify-between">
                          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 text-indigo-700">
                            <Clock className="h-4 w-4 text-indigo-500" />
                            Đơn Đổi Xu Gần Đây Của Bạn ({db.pendingPurchases ? db.pendingPurchases.filter(p => p.studentId === activeStudent.id && p.roomId === selectedRoomId).length : 0})
                          </h4>
                          <span className="text-[10px] text-slate-400">Xu của bạn sẽ được hoàn lại tự động nếu Giáo viên hủy đơn</span>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {db.pendingPurchases && db.pendingPurchases.filter(p => p.studentId === activeStudent.id && p.roomId === selectedRoomId).length > 0 ? (
                            db.pendingPurchases.filter(p => p.studentId === activeStudent.id && p.roomId === selectedRoomId).slice().reverse().map(req => (
                              <div key={req.id} className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center justify-between gap-3 text-xs">
                                <div>
                                  <span className="font-bold text-slate-800">{req.itemName}</span>
                                  <div className="text-[10px] text-slate-450 mt-0.5">
                                    Đã trừ: <span className="text-amber-600 font-bold">{req.coinPrice}🪙</span> • Ngày quy đổi: {new Date(req.purchasedAt).toLocaleDateString('vi-VN')}
                                  </div>
                                </div>
                                <div>
                                  {req.status === 'pending' && (
                                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded">⏳ Chờ duyệt...</span>
                                  )}
                                  {req.status === 'approved' && (
                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded">✓ Đã nhận</span>
                                  )}
                                  {req.status === 'rejected' && (
                                    <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-1 rounded">✕ Từ chối & Hoàn xu</span>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-[11px] text-slate-400 italic text-center py-4">Bạn chưa thực hiện đơn đề xuất đổi xu nào trong lớp học này.</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 3: CUSTOMIZATION WARDROBE */}
              {activeTab === 'customization' && (
                <div className="space-y-6">
                  {!selectedRoomId ? (
                    <div className="py-12 px-6 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
                      <div className="bg-slate-50 p-4 rounded-full text-indigo-500 border-4 border-indigo-100 shadow-inner">
                        <UserIcon className="h-10 w-10 text-indigo-500" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">👑 Trang Hoàng Diện Mạo Bị Khóa</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Bạn cần gia nhập phòng học của lớp để có thể kích hoạt hòm đồ trang hoàng diện mạo cá nhân!</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest pb-1">Trang Hoàng Cá Nhân</h4>
                        <p className="text-xs text-slate-500">Khoe sắc diện mạo của học viên. Một vài khung viền hay hiệu ứng đặc biệt sẽ khóa mở lần lượt theo mốc Cấp độ.</p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Character Card Preview */}
                        <div className="bg-slate-900 text-white rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4 border border-slate-800 relative shadow-inner">
                          <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-500">Live preview</div>
                          
                          <AvatarWithCosmetics
                            avatarPath={activeStudent.activeAvatarPath}
                            framePath={activeStudent.activeFramePath}
                            effectPath={activeStudent.activeEffectPath}
                            size="xl"
                            level={activeParticipant?.currentLevel}
                          />

                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Level {activeParticipant?.currentLevel || 1} Scholar</span>
                            <h5 className="font-black text-white text-base leading-none">{activeStudent.fullName}</h5>
                            <p className="text-xs font-mono text-slate-400 mt-2">
                              Lớp phụ trách: {db.rooms.find(r => r.id === selectedRoomId)?.roomName}
                            </p>
                          </div>

                          <div className="flex gap-1.5 w-full pt-2">
                            {activeStudent.activeFramePath && (
                              <button
                                onClick={handleClearEquippedFrame}
                                className="flex-1 bg-white/10 hover:bg-white/15 text-[10.5px] font-semibold py-1 px-1.5 rounded transition"
                              >
                                Gỡ Khung
                              </button>
                            )}
                            {activeStudent.activeEffectPath && (
                              <button
                                onClick={handleClearEquippedEffect}
                                className="flex-1 bg-white/10 hover:bg-white/15 text-[10.5px] font-semibold py-1 px-1.5 rounded transition"
                              >
                                Gỡ Hiệu Ứng
                              </button>
                            )}
                          </div>
                        </div>

                    {/* Choose catalog options */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Avatars */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest border-b pb-1 block">Hình ảnh đại diện (Avatars):</span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {([
                            ...SEED_COSMETICS.filter(c => c.type === 'avatar'),
                            ...(db.customCosmetics ? db.customCosmetics.filter(c => c.type === 'avatar') : [])
                          ]).map(item => {
                            const isEquipped = activeStudent.activeAvatarPath === item.filePath;
                            const levelReqMet = !item.minLevel || (activeParticipant && activeParticipant.currentLevel >= item.minLevel);
                            const ownsItem = item.isDefault || db.inventory.some(inv => inv.studentId === activeStudent.id && inv.roomId === selectedRoomId && (inv.cosmeticId === item.id || inv.cosmeticId === item.filePath));
                            const isClickable = ownsItem || levelReqMet;

                            return (
                              <button
                                key={item.id}
                                onClick={() => handleEquipCosmetic(item)}
                                className={`p-2.5 rounded-lg border text-xs flex flex-col items-center justify-center text-center gap-1.5 transition ${
                                  !isClickable
                                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                    : isEquipped
                                      ? 'bg-indigo-50 border-indigo-650 text-indigo-755 font-bold shadow-sm'
                                      : 'bg-white hover:bg-slate-50 border-slate-250 text-slate-705'
                                }`}
                              >
                                <span className="text-xl flex items-center justify-center h-8 w-8">
                                  {item.isUploaded ? (
                                    <img src={item.filePath} alt={item.name} className="h-7 w-7 rounded-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    item.filePath.includes('cyberpunk') ? '🧙' : item.filePath.includes('wizard') ? '🔮' : item.filePath.includes('scholar') ? '🦉' : item.filePath.includes('nu') ? '👧' : '👦'
                                  )}
                                </span>
                                <span className="text-[10px] font-sans h-8 leading-tight line-clamp-2">{item.name.replace(" (Mặc định)", "")}</span>
                                {!isClickable && item.minLevel && (
                                  <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1 font-mono rounded">
                                    Lvl {item.minLevel}+
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Frames */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-505 uppercase tracking-widest border-b pb-1 block">Khung Avatar (Frames):</span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {([
                            ...SEED_COSMETICS.filter(c => c.type === 'frame'),
                            ...(db.customCosmetics ? db.customCosmetics.filter(c => c.type === 'frame') : [])
                          ]).map(item => {
                            const isEquipped = activeStudent.activeFramePath === item.filePath;
                            const levelReqMet = !item.minLevel || (activeParticipant && activeParticipant.currentLevel >= item.minLevel);
                            const ownsItem = item.isDefault || db.inventory.some(inv => inv.studentId === activeStudent.id && inv.roomId === selectedRoomId && (inv.cosmeticId === item.id || inv.cosmeticId === item.filePath));
                            const isClickable = ownsItem || levelReqMet;

                            return (
                              <button
                                key={item.id}
                                onClick={() => handleEquipCosmetic(item)}
                                className={`p-2 rounded-lg border text-xs flex flex-col items-center justify-center text-center gap-1.5 transition ${
                                  !isClickable
                                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                    : isEquipped
                                      ? 'bg-indigo-50 border-indigo-650 text-indigo-755 font-bold shadow-sm'
                                      : 'bg-white hover:bg-slate-50 border-slate-250 text-slate-705'
                                }`}
                              >
                                {item.isUploaded ? (
                                  <img src={item.filePath} alt={item.name} className="h-8 w-8 rounded object-cover border border-slate-200" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className={`w-8 h-8 rounded-full border-3 flex items-center justify-center text-[10px] font-extrabold ${
                                    item.filePath.includes('gold') ? 'border-[#FFD700]' : item.filePath.includes('silver') ? 'border-[#C0C0C0]' : item.filePath.includes('bronze') ? 'border-[#CD7F32]' : 'border-[#8B5A2B]'
                                  }`}>
                                    ⭐
                                  </div>
                                )}
                                <span className="text-[10px] leading-snug">{item.name}</span>
                                {!isClickable && item.minLevel && (
                                  <span className="text-[8.5px] bg-red-100 text-red-700 px-1 font-mono rounded">
                                    Lvl {item.minLevel}+
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Frame Effects (neon / sparks) */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-505 uppercase tracking-widest border-b pb-1 block">Hiệu ứng Aura bao quanh (Dynamic Effects):</span>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {([
                            ...SEED_COSMETICS.filter(c => c.type === 'effect'),
                            ...(db.customCosmetics ? db.customCosmetics.filter(c => c.type === 'effect') : [])
                          ]).map(item => {
                            const isEquipped = activeStudent.activeEffectPath === item.filePath;
                            const levelReqMet = !item.minLevel || (activeParticipant && activeParticipant.currentLevel >= item.minLevel);
                            const ownsItem = db.inventory.some(inv => inv.studentId === activeStudent.id && inv.roomId === selectedRoomId && (inv.cosmeticId === item.id || inv.cosmeticId === item.filePath));
                            const isClickable = ownsItem || levelReqMet;

                            return (
                              <button
                                key={item.id}
                                onClick={() => handleEquipCosmetic(item)}
                                className={`p-2 rounded-lg border text-xs flex flex-col items-center justify-center text-center gap-1.5 transition ${
                                  !isClickable
                                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                                    : isEquipped
                                      ? 'bg-indigo-50 border-indigo-650 text-indigo-755 font-bold shadow-sm'
                                      : 'bg-white hover:bg-slate-50 border-slate-250 text-slate-705'
                                }`}
                              >
                                {item.isUploaded ? (
                                  <img src={item.filePath} alt={item.name} className="h-8 w-8 rounded object-cover border border-slate-200" referrerPolicy="no-referrer" />
                                ) : (
                                  <span className="text-xl animate-pulse">✨</span>
                                )}
                                <span className="text-[10px] leading-snug">{item.name}</span>
                                {!isClickable && item.minLevel && (
                                  <span className="text-[8.5px] bg-indigo-100 text-indigo-700 px-1 font-mono rounded">
                                    Lvl {item.minLevel}+
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 4: LUCKY WHEEL */}
              {activeTab === 'lucky' && (
                <div className="space-y-6 flex flex-col items-center">
                  {!selectedRoomId ? (
                    <div className="py-12 px-6 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
                      <div className="bg-slate-100 p-4 rounded-full text-indigo-500 border-4 border-indigo-100 shadow-inner animate-spin-slow">
                        <Sparkles className="h-10 w-10 text-indigo-500" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">🎡 Vòng Quay May Mắn Khóa</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Hãy đợi cho đến khi bạn tham gia vào phòng học của lớp mình để nhận và sử dụng những lượt quay may mắn!</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-center space-y-1 w-full max-w-md">
                        <h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest flex items-center justify-center gap-1">
                          🎡 Thần Thoại Vòng Quay May Mắn
                        </h4>
                        <p className="text-xs text-slate-550 leading-relaxed">
                          Sử dụng 1 lượt quay thăng cấp thưởng để rinh quà hiếm! Hệ thống sử dụng **Thuật toán ngẫu nhiên có trọng số (Weighted Random)**.
                        </p>
                      </div>

                  {/* Wheel visual spinner */}
                  <div className="flex flex-col items-center space-y-6 pt-6 relative" id="lucky-wheel-container">
                    {/* Golden-glowing outer indicator needle */}
                    <div className="absolute top-2 z-40 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[22px] border-t-rose-600 drop-shadow-[0_2px_4px_rgba(220,38,38,0.4)] pointer-events-none" />
                    
                    <div className="relative w-64 h-64 border-8 border-indigo-950 rounded-full flex items-center justify-center shadow-[0_10px_35px_rgba(30,27,75,0.4)] bg-slate-900 overflow-hidden ring-4 ring-indigo-500/20">
                      
                      {/* Spin wrapper */}
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center relative z-20"
                        style={{
                          transform: `rotate(${spinDegree}deg)`,
                          transition: isSpinning ? 'transform 6000ms cubic-bezier(0.1, 0.8, 0.1, 1)' : 'transform 1000ms cubic-bezier(0.1, 0.8, 0.1, 1)',
                          background: 'conic-gradient(from 18deg, #0d9488 0deg 72deg, #7c3aed 72deg 144deg, #e11d48 144deg 216deg, #312e81 216deg 288deg, #d97706 288deg 360deg)',
                        }}
                      >
                        {/* Segment separators */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div style={{ transform: 'rotate(18deg)' }} className="absolute top-0 bottom-0 left-[calc(50%-1px)] right-[calc(50%-1px)] bg-white/25" />
                          <div style={{ transform: 'rotate(90deg)' }} className="absolute top-0 bottom-0 left-[calc(50%-1px)] right-[calc(50%-1px)] bg-white/25" />
                          <div style={{ transform: 'rotate(162deg)' }} className="absolute top-0 bottom-0 left-[calc(50%-1px)] right-[calc(50%-1px)] bg-white/25" />
                          <div style={{ transform: 'rotate(234deg)' }} className="absolute top-0 bottom-0 left-[calc(50%-1px)] right-[calc(50%-1px)] bg-white/25" />
                          <div style={{ transform: 'rotate(306deg)' }} className="absolute top-0 bottom-0 left-[calc(50%-1px)] right-[calc(50%-1px)] bg-white/25" />
                        </div>

                        {/* Wheel sectors names overlay visual mockup */}
                        <div className="absolute inset-0 pointer-events-none text-white">
                          <div 
                            className="absolute left-1/2 top-1/2 flex flex-col items-center"
                            style={{ transform: 'translate(-50%, -50%) rotate(270deg) translateY(-82px)' }}
                          >
                            <span className="text-sm filter drop-shadow">🍀</span>
                            <span className="text-[9px] font-black tracking-wide text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)] uppercase text-center max-w-[80px]">Mất lượt</span>
                          </div>
                          <div 
                            className="absolute left-1/2 top-1/2 flex flex-col items-center"
                            style={{ transform: 'translate(-50%, -50%) rotate(342deg) translateY(-82px)' }}
                          >
                            <span className="text-sm filter drop-shadow">🪙</span>
                            <span className="text-[9px] font-black tracking-wide text-amber-100 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)] uppercase text-center max-w-[80px] text-amber-100">+30 Vàng</span>
                          </div>
                          <div 
                            className="absolute left-1/2 top-1/2 flex flex-col items-center"
                            style={{ transform: 'translate(-50%, -50%) rotate(54deg) translateY(-82px)' }}
                          >
                            <span className="text-sm filter drop-shadow">⚡</span>
                            <span className="text-[9px] font-black tracking-wide text-teal-100 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)] uppercase text-center max-w-[80px]">Double XP</span>
                          </div>
                          <div 
                            className="absolute left-1/2 top-1/2 flex flex-col items-center"
                            style={{ transform: 'translate(-50%, -50%) rotate(126deg) translateY(-82px)' }}
                          >
                            <span className="text-sm filter drop-shadow">🔮</span>
                            <span className="text-[9px] font-black tracking-wide text-violet-100 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)] uppercase text-center max-w-[80px]">Phù Thuỷ</span>
                          </div>
                          <div 
                            className="absolute left-1/2 top-1/2 flex flex-col items-center"
                            style={{ transform: 'translate(-50%, -50%) rotate(198deg) translateY(-82px)' }}
                          >
                            <span className="text-sm filter drop-shadow">🎟️</span>
                            <span className="text-[9px] font-black tracking-wide text-rose-100 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)] uppercase text-center max-w-[80px]">Thẻ Miễn</span>
                          </div>
                        </div>
                      </div>

                      {/* Center pin button */}
                      <button
                        type="button"
                        onClick={spinLuckyWheel}
                        disabled={isSpinning || !activeParticipant || activeParticipant.luckySpins <= 0}
                        className={`absolute w-16 h-16 rounded-full z-30 font-black border-4 flex items-center justify-center text-center text-[11px] leading-tight shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all ${
                          isSpinning
                            ? 'bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed'
                            : !activeParticipant || activeParticipant.luckySpins <= 0
                              ? 'bg-rose-100 border-rose-200 text-rose-700 cursor-not-allowed'
                              : 'bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-500 border-amber-300 text-white hover:scale-105 active:scale-95 cursor-pointer shadow-md'
                        }`}
                      >
                        {isSpinning ? 'Xoay...' : 'QUAY!'}
                      </button>
                    </div>

                    <div className="text-center space-y-2">
                      <p className="text-xs font-mono font-bold text-slate-600">
                        Số lượt quay khả dụng: <span className="text-rose-600 text-sm font-black">{activeParticipant?.luckySpins || 0}</span>
                      </p>

                      {spinResult && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-bold text-xs animate-bounce">
                          🎉 CHÚC MỪNG: Bạn đã trúng thưởng '{spinResult}'!
                        </div>
                      )}
                    </div>
                  </div>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Leaderboard rail right (cols: 1/4) */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <div className="border-b border-slate-200 pb-2.5">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest flex items-center gap-1.5 mb-2">
                  <Trophy className="h-4.5 w-4.5 text-yellow-500" />
                  BẢNG VINH DANH
                </h3>
                {/* Segemented Class vs Grade leaderboard Toggle */}
                <div className="flex bg-slate-200/60 p-1 rounded-lg border border-slate-300/80">
                  <button
                    type="button"
                    onClick={() => setLeaderboardFilter('class')}
                    className={`flex-1 py-1 text-[10px] font-black rounded-md transition ${
                      leaderboardFilter === 'class' ? 'bg-white text-indigo-650 shadow-sm' : 'text-slate-505 hover:text-slate-850'
                    }`}
                  >
                    LỚP MÌNH 🏫
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaderboardFilter('grade')}
                    className={`flex-1 py-1 text-[10px] font-black rounded-md transition ${
                      leaderboardFilter === 'grade' ? 'bg-white text-indigo-650 shadow-sm' : 'text-slate-505 hover:text-slate-850'
                    }`}
                  >
                    CẢ KHỐI 🏆
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
                {getLeaderboard().map((pObj, index) => {
                  const isTopOne = index === 0;
                  const isTopTwo = index === 1;
                  const isTopThree = index === 2;
                  const isActive = pObj.id === activeStudent.id;

                  return (
                    <div
                      key={pObj.id}
                      className={`p-2.5 rounded-lg border flex items-center justify-between gap-2.5 transition duration-200 ${
                        isActive
                          ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                          : 'bg-white border-slate-150'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {/* Rank indicator color */}
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                          isTopOne
                            ? 'bg-yellow-500 text-white ring-2 ring-yellow-300'
                            : isTopTwo
                              ? 'bg-slate-400 text-white'
                              : isTopThree
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-100 text-slate-500'
                        }`}>
                          {index + 1}
                        </div>

                        {/* Avatar */}
                        <AvatarWithCosmetics
                          avatarPath={pObj.avatarPath}
                          framePath={pObj.framePath}
                          effectPath={pObj.effectPath}
                          size="sm"
                        />

                        <div>
                          <div className={`text-xs font-bold leading-tight ${isActive ? 'text-indigo-900' : 'text-slate-800'} flex items-center flex-wrap gap-1`}>
                            <span>{pObj.fullName.split(' (')[0]}</span>
                            {leaderboardFilter === 'grade' && (
                              <span className="font-mono text-[8px] bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded leading-none">
                                {pObj.adminClass}
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] text-slate-405 font-mono">
                            Level {pObj.level} | {pObj.gold}🪙
                          </div>
                        </div>
                      </div>

                      {isTopOne && <Flame className="h-4 w-4 text-orange-500 fill-orange-500 shrink-0" />}
                    </div>
                  );
                })}
                {getLeaderboard().length === 0 && (
                  <p className="text-xs italic text-slate-400 text-center py-6">Chưa có bảng tổng sắp.</p>
                )}
              </div>
            </div>
          </div>

        </div>

      {/* INJECT ANIMATIONS STYLESHEET */}
      <style>{`
        @keyframes xpFloatUp {
          0% { transform: translateY(12px) scale(0.6); opacity: 0; }
          15% { transform: translateY(-5px) scale(1.15); opacity: 1; }
          100% { transform: translateY(-45px) scale(0.95); opacity: 0; }
        }
        .xp-float-animate {
          animation: xpFloatUp 2s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
        }
        
        @keyframes fwLaunch {
          0% { transform: scale(0.1) translateY(120px) rotate(-15deg); opacity: 0; }
          50% { transform: scale(1.1) translateY(-20px) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) translateY(0) rotate(0); opacity: 1; }
        }
        .fw-card-animate {
          animation: fwLaunch 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes bgScrollSlow {
          0% { background-position: 0px 0px; }
          100% { background-position: 50% 50%; }
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* FLOAT POPUP result of the Lucky Wheel with confirmation trigger */}
      {spinResult && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-indigo-100 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative overflow-hidden animate-fade-in fw-card-animate">
            {/* Top gold bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500" />
            
            <div className="mx-auto w-16 h-16 bg-amber-50 border-2 border-amber-200 rounded-full flex items-center justify-center text-3xl animate-bounce">
              🎁
            </div>
            
            <div className="space-y-1">
              <h3 className="font-black text-slate-900 text-[17px] uppercase tracking-wide">QUAY THƯỞNG THÀNH CÔNG</h3>
              <p className="text-[11px] text-slate-450 leading-tight">Món quà thần kỳ đã được chuyển thụ vào hành trang!</p>
            </div>
            
            <div className="bg-indigo-50/70 border border-indigo-100/80 rounded-2xl p-4 my-2 shadow-inner">
              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block mb-0.5">PHẦN THƯỞNG ĐẠT ĐƯỢC:</span>
              <p className="text-[13.5px] font-extrabold text-indigo-900 leading-snug">
                {spinResult}
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => {
                setSpinResult(null);
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer text-center"
            >
              OK, ĐÃ THU NHẬN KHO BÁU ✓
            </button>
          </div>
        </div>
      )}

      {/* CELEBRATORY LEVEL UP FIREWORKS CONGRATS MODAL */}
      {levelUpCelebration && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-hidden">
          
          {/* CSS-based simulated visual fireworks bursts in background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 text-4xl animate-ping duration-1000 opacity-60">🎇</div>
            <div className="absolute top-1/3 right-1/4 text-4xl animate-ping duration-1000 opacity-60 delay-300">🎆</div>
            <div className="absolute bottom-1/3 left-1/3 text-4xl animate-ping duration-1000 opacity-60 delay-700">🎇</div>
            <div className="absolute bottom-1/4 right-1/3 text-4xl animate-ping duration-1000 opacity-60 delay-500">🎆</div>
            
            {/* Sparkles */}
            <span className="absolute top-10 left-10 text-xl animate-pulse text-yellow-300">✨</span>
            <span className="absolute top-20 right-20 text-xl animate-pulse text-amber-305 delay-150">⭐</span>
            <span className="absolute bottom-20 left-40 text-xl animate-pulse text-indigo-300 delay-300">✨</span>
            <span className="absolute bottom-10 right-40 text-xl animate-pulse text-cyan-305 delay-500">⭐</span>
          </div>
          
          <div className="bg-white border-2 border-indigo-600 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl relative z-10 fw-card-animate">
            {/* Celebrate ribbons */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 via-emerald-500 via-indigo-500 via-purple-500 rounded-t-3xl" />
            
            {/* Large trophy */}
            <div className="w-18 h-18 bg-amber-50 border-2 border-amber-300 rounded-full mx-auto flex items-center justify-center shadow-lg animate-bounce">
              <Trophy className="h-9 w-9 text-amber-500" />
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] font-black tracking-widest text-amber-600 uppercase block">CỘT MỐC DANH VỌNG MỚI</span>
              <h3 className="font-extrabold text-slate-900 text-xl leading-none uppercase">THĂNG CẤP ĐỘ! KHỞI SẮC!</h3>
            </div>
            
            <div className="py-3 px-2 border-y border-slate-100 flex items-center justify-around bg-slate-50/50 rounded-xl">
              <div className="text-center">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">ĐẲNG CẤP MỚI</span>
                <span className="text-2xl font-black text-indigo-700 font-mono">
                  {levelUpCelebration.newLevel}
                </span>
              </div>
              <div className="text-center">
                <span className="block text-[10px] text-slate-400 font-bold uppercase">LƯỢT QUAY MIỄN PHÍ</span>
                <span className="text-2xl font-black text-rose-500 font-mono flex items-center justify-center gap-0.5">
                  +{levelUpCelebration.spinsGained} 🎡
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Sự nỗ lực không ngừng nghỉ đã đưa bạn vươn lên đỉnh cao trí tuệ. Hãy tiếp tục tinh thần chiến binh quả cảm này!
              </p>
              
              <button
                type="button"
                onClick={() => {
                  setLevelUpCelebration(null);
                }}
                className="w-full bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer text-center"
              >
                TẬP TRUNG CHIẾN ĐẤU TIẾP ➔
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};
