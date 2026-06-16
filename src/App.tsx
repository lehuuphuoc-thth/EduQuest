import React, { useState, useEffect } from 'react';
import { loadDatabase, Database, DeviceFingerprint, getStoredDevice } from './utils/db';
import { User } from './types';
import { SimulatedDevicePanel } from './components/SimulatedDevicePanel';
import { AdminDashboard } from './components/AdminDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { Shield, Sparkles, LogOut, Laptop, BookOpen, GraduationCap, Coins } from 'lucide-react';

export default function App() {
  const [db, setDb] = useState<Database | null>(null);
  
  // Current active role perspective for development/demo (default 'student' or 'teacher' or 'admin')
  const [activeRolePerspective, setActiveRolePerspective] = useState<'admin' | 'teacher' | 'student'>('student');
  
  // Currently authenticated identities in each role
  const [activeAdmin, setActiveAdmin] = useState<User | null>(null);
  const [activeTeacher, setActiveTeacher] = useState<User | null>(null);
  const [activeStudent, setActiveStudent] = useState<User | null>(null);

  // Authenticate states
  const [teacherEmailInput, setTeacherEmailInput] = useState('');
  const [teacherPassInput, setTeacherPassInput] = useState('');
  const [teacherLoginError, setTeacherLoginError] = useState('');

  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPassInput, setAdminPassInput] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  // Handle live device fingerprint simulation
  const [simDevice, setSimDevice] = useState<DeviceFingerprint>(getStoredDevice());

  // Load db on mount
  useEffect(() => {
    const loaded = loadDatabase();
    setDb(loaded);
  }, []);

  const refreshDbState = () => {
    const freshDb = loadDatabase();
    setDb(freshDb);
    
    // update current identity links
    if (activeAdmin) {
      const freshAdminObj = freshDb.users.find(u => u.id === activeAdmin.id);
      if (freshAdminObj) setActiveAdmin(freshAdminObj);
    }
    if (activeTeacher) {
      const freshTeacherObj = freshDb.users.find(u => u.id === activeTeacher.id);
      if (freshTeacherObj) setActiveTeacher(freshTeacherObj);
    }
    if (activeStudent) {
      const freshStudentObj = freshDb.users.find(u => u.id === activeStudent.id);
      if (freshStudentObj) setActiveStudent(freshStudentObj);
    }
  };

  // TEACHER AUTHENTICATION PROCESS
  const handleTeacherLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherLoginError('');

    if (!db) return;

    const matchedTeacher = db.users.find(
      u => u.role === 'teacher' && u.email?.toLowerCase() === teacherEmailInput.trim().toLowerCase()
    );

    if (!matchedTeacher) {
      setTeacherLoginError("Email giáo vụ không tồn tại trong học bạ!");
      return;
    }

    if (matchedTeacher.passwordHash !== teacherPassInput) {
      setTeacherLoginError("Mật khẩu không trùng khớp! Hãy xem danh sách ở tab Admin.");
      return;
    }

    setActiveTeacher(matchedTeacher);
    setTeacherEmailInput('');
    setTeacherPassInput('');
  };

  // ADMIN AUTHENTICATION PROCESS
  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');

    if (!db) return;

    const matchedAdmin = db.users.find(
      u => u.role === 'admin' && u.email?.toLowerCase() === adminEmailInput.trim().toLowerCase()
    );

    if (!matchedAdmin) {
      setAdminLoginError("Tài khoản admin không tồn tại!");
      return;
    }

    if (matchedAdmin.passwordHash !== adminPassInput) {
      setAdminLoginError("Mật khẩu admin sai lệch!");
      return;
    }

    setActiveAdmin(matchedAdmin);
    setAdminEmailInput('');
    setAdminPassInput('');
  };

  if (!db) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-650" />
          <span className="text-xs font-bold text-slate-500">Đang khởi tạo cơ sở dữ liệu EduQuest...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900 pb-20">
      
      {/* 1. TOP DEVICE FINGERPRINT SIMULATOR PANEL */}
      <SimulatedDevicePanel onDeviceChange={(device) => setSimDevice(device)} />

      {/* 2. DEMO COMMAND DECK (ROLE Perspective SWITCHER) */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2">
            <div className="bg-indigo-650 p-2 rounded-xl text-white shadow-md shadow-indigo-650/30">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-slate-900 leading-none">EDUQUEST ENGINE</h1>
              <span className="text-[10px] font-bold text-slate-400">Gamified School Architecture v3.0</span>
            </div>
          </div>

          {/* Selector pills */}
          <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => setActiveRolePerspective('student')}
              className={`px-3 py-1.5 text-xs rounded-md font-bold transition flex items-center gap-1 ${
                activeRolePerspective === 'student'
                  ? 'bg-white text-indigo-700 shadow font-extrabold'
                  : 'text-slate-550 hover:text-slate-800'
              }`}
            >
              🎓 CỦA HỌC SINH
            </button>
            <button
              onClick={() => setActiveRolePerspective('teacher')}
              className={`px-3 py-1.5 text-xs rounded-md font-bold transition flex items-center gap-1 ${
                activeRolePerspective === 'teacher'
                  ? 'bg-white text-indigo-700 shadow font-extrabold'
                  : 'text-slate-550 hover:text-slate-800'
              }`}
            >
              🏫 CỦA GIÁO VIÊN
            </button>
            <button
              onClick={() => setActiveRolePerspective('admin')}
              className={`px-3 py-1.5 text-xs rounded-md font-bold transition flex items-center gap-1 ${
                activeRolePerspective === 'admin'
                  ? 'bg-white text-red-700 shadow font-extrabold'
                  : 'text-slate-550 hover:text-slate-800'
              }`}
            >
              🛡️ CỦA ADMIN
            </button>
          </div>

          {/* Quick Active session display / Logout */}
          <div className="flex items-center gap-3">
            {activeRolePerspective === 'student' && activeStudent && (
              <div className="flex items-center gap-2 text-xs bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg text-indigo-850">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold">Lớp HS: {activeStudent.fullName}</span>
                <button
                  onClick={() => setActiveStudent(null)}
                  className="text-slate-400 hover:text-red-500 transition ml-1"
                  title="Đăng xuất"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {activeRolePerspective === 'teacher' && activeTeacher && (
              <div className="flex items-center gap-2 text-xs bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg text-purple-850">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="font-bold">Lớp GV: {activeTeacher.fullName}</span>
                <button
                  onClick={() => setActiveTeacher(null)}
                  className="text-slate-400 hover:text-red-500 transition ml-1"
                  title="Đăng xuất"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {activeRolePerspective === 'admin' && activeAdmin && (
              <div className="flex items-center gap-2 text-xs bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg text-red-850">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="font-bold">Khu: ADMIN</span>
                <button
                  onClick={() => setActiveAdmin(null)}
                  className="text-slate-400 hover:text-red-600 transition ml-1"
                  title="Đăng xuất"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 3. WORKING PERSPECTIVE VIEWPORT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        
        {/* STUDENT SHIELD PERSPECTIVE */}
        {activeRolePerspective === 'student' && (
          <StudentDashboard
            db={db}
            onRefreshDb={refreshDbState}
            onStudentLogin={(stu) => setActiveStudent(stu)}
            activeStudent={activeStudent}
            onLogout={() => setActiveStudent(null)}
          />
        )}

        {/* TEACHER SHIELD PERSPECTIVE */}
        {activeRolePerspective === 'teacher' && (
          <div>
            {!activeTeacher ? (
              // Teacher login required
              <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden" id="teacher-login-box">
                <div className="bg-gradient-to-r from-purple-700 to-indigo-900 p-6 text-white text-center">
                  <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest block bg-white/10 px-3 py-1 rounded-full w-fit mx-auto mb-2">
                    Giáo Viên Cổng Đăng Nhập
                  </span>
                  <h2 className="text-lg font-extrabold tracking-tight">Vào Văn Phòng Khoa</h2>
                  <p className="text-indigo-200 text-xs">Vận hành giám lý học bạ lớp, thiết lập ma trận đề thi tự động.</p>
                </div>

                <form onSubmit={handleTeacherLoginSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Email sư phạm</label>
                    <input
                      type="email"
                      value={teacherEmailInput}
                      onChange={e => setTeacherEmailInput(e.target.value)}
                      placeholder="bichvan@eduquest.com hoặc duyhung@eduquest.com"
                      className="w-full text-xs p-3 rounded-lg border border-slate-350 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Mật khẩu</label>
                    <input
                      type="password"
                      value={teacherPassInput}
                      onChange={e => setTeacherPassInput(e.target.value)}
                      placeholder="password123 hoặc password456"
                      className="w-full text-xs p-3 rounded-lg border border-slate-355 focus:outline-none focus:ring-1 focus:ring-indigo-505 bg-white font-mono"
                      required
                    />
                  </div>

                  {teacherLoginError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs font-bold">
                      ⚠️ {teacherLoginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-indigo-650 text-white font-bold text-xs py-3 rounded-lg hover:bg-indigo-700 transition shadow"
                  >
                    BẮT ĐẦU VẬN HÀNH
                  </button>
                </form>
              </div>
            ) : (
              <TeacherDashboard
                teacher={activeTeacher}
                db={db}
                onRefreshDb={refreshDbState}
                onUpdateTeacherProfile={(upd) => setActiveTeacher(upd)}
              />
            )}
          </div>
        )}

        {/* ADMIN PERSPECTIVE SHIELD */}
        {activeRolePerspective === 'admin' && (
          <div>
            {!activeAdmin ? (
              // Admin login required
              <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden" id="admin-login-box">
                <div className="bg-gradient-to-r from-red-650 to-orange-700 p-6 text-white text-center">
                  <span className="text-[10px] font-bold text-red-200 tracking-wider uppercase bg-white/10 px-3 py-1 rounded bg-red-100 w-fit mx-auto mb-2 block">
                    Hội Đồng Quản Trị Hệ Thống
                  </span>
                  <h2 className="text-lg font-bold tracking-tight">Khu Vực Quản Trị Tối Cao</h2>
                  <p className="text-red-100 text-xs mt-1">Cấp quyền giáo viên, giải phóng khóa thiết bị, kiểm soát học bạ.</p>
                </div>

                <form onSubmit={handleAdminLoginSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Email Admin</label>
                    <input
                      type="email"
                      value={adminEmailInput}
                      onChange={e => setAdminEmailInput(e.target.value)}
                      placeholder="admin@eduquest.com"
                      className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Mật khẩu tối cao</label>
                    <input
                      type="password"
                      value={adminPassInput}
                      onChange={e => setAdminPassInput(e.target.value)}
                      placeholder="Mật khẩu (mặc định: admin)"
                      className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none font-mono"
                      required
                    />
                  </div>

                  {adminLoginError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs font-bold">
                      ⚠️ {adminLoginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-red-600 text-white font-bold text-xs py-3 rounded-lg hover:bg-red-700 transition"
                  >
                    MỞ KHÓA TRUNG TÂM
                  </button>
                </form>
              </div>
            ) : (
              <AdminDashboard
                db={db}
                onRefreshDb={refreshDbState}
              />
            )}
          </div>
        )}

      </main>

    </div>
  );
}
