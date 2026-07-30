import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import API_BASE_URL, { SHOW_PRICING, ENABLE_CUSTOM_QUESTION_BANK } from './config/api.config';
import Footer from './components/footer/Footer';
import LiveChatWidget from './components/liveChat/LiveChatWidget';
import DashboardLoading from './components/dashboardLoading/DashboardLoading';
import ErrorBoundary from './components/errorBoundary/ErrorBoundary';
import MobileAppDownloadPopup from './components/mobileAppPopup/MobileAppDownloadPopup';
import { Analytics } from '@vercel/analytics/react';
import { safeLocalStorage, safeSessionStorage } from './utils/safeStorage';

// Safe lazy import with auto-retry on dynamic chunk loading failures (common on mobile networks)
const safeLazy = (importFn) => lazy(async () => {
  try {
    return await importFn();
  } catch (error) {
    const hasReloaded = safeSessionStorage.getItem('chunk_reload_attempted');
    if (!hasReloaded) {
      safeSessionStorage.setItem('chunk_reload_attempted', 'true');
      window.location.reload();
    }
    throw error;
  }
});

// Lazy-loaded route components for optimal bundle splitting
const Home = safeLazy(() => import('./pages/Home/Home'));
const About = safeLazy(() => import('./pages/about/About'));
const Privacy = safeLazy(() => import('./pages/privacy/Privacy'));
const Login = safeLazy(() => import('./pages/login/Login'));
const Register = safeLazy(() => import('./pages/register/Register'));
const System = safeLazy(() => import('./pages/system/System'));
const User = safeLazy(() => import('./pages/user/User'));
const ContactMobile = safeLazy(() => import('./pages/contactMobile/ContactMobile'));
const Question = safeLazy(() => import('./pages/question/Question'));
const VerifyAccount = safeLazy(() => import('./pages/verifyAccount/VerifyAccount'));
const ResPasEmail = safeLazy(() => import('./pages/resPasEmail/ResPasEmail'));
const ResPasCode = safeLazy(() => import('./pages/resPasCode/ResPasCode'));
const ResetPassword = safeLazy(() => import('./pages/resetPassword/ResetPassword'));
const Unit = safeLazy(() => import('./pages/unit/Unit'));
const DashboardSchool = safeLazy(() => import('./pages/dashboardSchool/DashboardSchool'));
const Student = safeLazy(() => import('./pages/student/Student'));
const Class = safeLazy(() => import('./pages/class/Class'));
const Subject = safeLazy(() => import('./pages/subject/Subject'));
const Teacher = safeLazy(() => import('./pages/teacher/Teacher'));
const StudentDashboard = safeLazy(() => import('./pages/studentDashboard/StudentDashboard'));
const TeacherDashboard = safeLazy(() => import('./pages/teacherDashboard/TeacherDashboard'));
const TeacherRegistrationPage = safeLazy(() => import('./pages/teacherRegistrationPage/TeacherRegistrationPage'));
const Assignment = safeLazy(() => import('./pages/assignment/Assignment'));
const AssignmentReport = safeLazy(() => import('./pages/assignmentReport/AssignmentReport'));
const StudentReport = safeLazy(() => import('./pages/studentReport/StudentReport'));
const IT = safeLazy(() => import('./pages/IT/IT'));
const Supervisor = safeLazy(() => import('./pages/supervisor/Supervisor'));
const SupervisorDashboard = safeLazy(() => import('./pages/supervisorDashboard/SupervisorDashboard'));
const TeacherAssignmentReports = safeLazy(() => import('./components/teacherReports/TeacherAssignmentReports'));
const StudentHistory = safeLazy(() => import('./components/studentHistory/StudentHistory'));
const Pricing = safeLazy(() => import('./pages/pricing/Pricing'));
const MathRacer = safeLazy(() => import('./pages/games/MathRacer'));
const SuperMarioGame = safeLazy(() => import('./pages/games/SuperMarioGame'));
const CaveRunner = safeLazy(() => import('./pages/games/CaveRunner'));
const MazeGame = safeLazy(() => import('./pages/games/MazeGame'));
const JetSkiGame = safeLazy(() => import('./pages/games/JetSkiGame'));
const CartoonAirplanesGame = safeLazy(() => import('./pages/games/CartoonAirplanesGame'));
const SudokuGame = safeLazy(() => import('./pages/games/SudokuGame'));
const KenKenGame = safeLazy(() => import('./pages/games/KenKenGame'));
const AbacusMatchGame = safeLazy(() => import('./pages/games/AbacusMatchGame'));
const TanksGame = safeLazy(() => import('./pages/games/TanksGame'));
const MinigolfGame = safeLazy(() => import('./pages/games/MinigolfGame'));
const GamesMenu = safeLazy(() => import('./pages/studentDashboard/GamesMenu'));
const ChatManagement = safeLazy(() => import('./pages/dashboardSchool/ChatManagement'));
const ReportedQuestions = safeLazy(() => import('./pages/dashboardSchool/ReportedQuestions'));
const ClassHomework = safeLazy(() => import('./pages/classHomework/ClassHomework'));
const TeacherCompetitionLobby = safeLazy(() => import('./pages/teacherDashboard/TeacherCompetitionLobby'));
const StudentCompetition = safeLazy(() => import('./pages/studentDashboard/StudentCompetition'));
const TeacherQuestionBank = safeLazy(() => import('./pages/teacherDashboard/TeacherQuestionBank'));
const Shop = safeLazy(() => import('./pages/shop/Shop'));
const LiveAdminDashboard = safeLazy(() => import('./pages/dashboardSchool/LiveAdminDashboard'));

function App() {
  const isAuth = safeLocalStorage.getItem('O_authWEB');
  const role = safeLocalStorage.getItem('auth_role');
  const location = useLocation();

  useEffect(() => {
    safeLocalStorage.removeItem('cartona');
  }, []);

  // Heartbeat mechanism for live dashboard tracking
  useEffect(() => {
    let sessionId = safeLocalStorage.getItem('site_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      safeLocalStorage.setItem('site_session_id', sessionId);
    }

    const pingHeartbeat = () => {
      // Pause heartbeat ping when page is hidden to preserve resources on mobile
      if (document.visibilityState === 'hidden') return;

      fetch(`${API_BASE_URL}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId: safeLocalStorage.getItem('pp_id') || null,
          role: safeLocalStorage.getItem('auth_role') || 'Visitor',
          userName: safeLocalStorage.getItem('pp_name') || 'Anonymous'
        })
      }).catch(err => console.error("Heartbeat error", err));
    };

    pingHeartbeat();
    const interval = setInterval(pingHeartbeat, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ErrorBoundary>
      <Analytics />
      <Suspense fallback={<DashboardLoading />}>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/about' element={<About />} />
          <Route path='/privacy' element={<Privacy />} />
          <Route path='/auth/login' element={isAuth ? <Navigate to='/' /> : <Login />} />
          <Route path='/auth/register' element={isAuth ? <Navigate to='/' /> : <Register />} />
          <Route path='/verify/:email' element={isAuth ? <Navigate to='/' /> : <VerifyAccount />} />
          <Route path='/resetPassword/email' element={isAuth ? <Navigate to='/' /> : <ResPasEmail />} />
          <Route path='/resetPassword/code/:email' element={isAuth ? <Navigate to='/' /> : <ResPasCode />} />
          <Route path='/resetPassword/:email' element={isAuth ? <Navigate to='/' /> : <ResetPassword />} />
          <Route path='/system/:questionTypeID' element={<System />} />
          <Route path='/Unit/:questionTypeID/:subjectID' element={<Unit />} />
          <Route path='/user/info' element={<User />} />
          <Route path='/contact' element={<ContactMobile />} />
          <Route path='/question/:chapterID/:questionTypeID/:subjectID' element={<Question />} />
          <Route path='/dashboard-school' element={isAuth && (role === 'School' || role === 'IT') ? <DashboardSchool /> : <Navigate to='/' />} />
          <Route path='/dashboard-school/student' element={isAuth && (role === 'School' || role === 'IT') ? <Student /> : <Navigate to='/' />} />
          <Route path='/dashboard-school/class' element={isAuth && (role === 'School' || role === 'IT' || role === 'Teacher') ? <Class /> : <Navigate to='/' />} />
          <Route path='/dashboard-school/class/:classID/homework' element={isAuth && (role === 'School' || role === 'IT' || role === 'Teacher') ? <ClassHomework /> : <Navigate to='/' />} />
          <Route path='/dashboard-school/subject' element={isAuth && (role === 'School' || role === 'IT') ? <Subject /> : <Navigate to='/' />} />
          <Route path='/dashboard-school/teacher' element={isAuth && (role === 'School' || role === 'IT') ? <Teacher /> : <Navigate to='/' />} />
          <Route path='/dashboard-school/it' element={isAuth && (role === 'School' || role === 'IT') ? <IT /> : <Navigate to='/' />} />
          <Route path='/dashboard-school/supervisor' element={isAuth && (role === 'School' || role === 'IT') ? <Supervisor /> : <Navigate to='/' />} />
          <Route path='/dashboard-school/chats' element={isAuth && (role === 'School' || role === 'IT') ? <ChatManagement /> : <Navigate to='/' />} />
          <Route path='/dashboard-school/reported-questions' element={isAuth && (role === 'School' || role === 'IT') ? <ReportedQuestions /> : <Navigate to='/' />} />
          <Route path='/dashboard-school/live' element={isAuth && (role === 'School' || role === 'IT') ? <LiveAdminDashboard /> : <Navigate to='/' />} />

          <Route path='/dashboard/student' element={isAuth && role === 'Student' ? <StudentDashboard /> : <Navigate to='/' />} />
          <Route path='/student/assignment/:assignmentID' element={isAuth && role === 'Student' ? <Assignment /> : <Navigate to='/' />} />
          <Route path='/student/competition/:competitionId' element={<StudentCompetition />} />
          <Route path='/dashboard/teacher' element={isAuth && role === 'Teacher' ? <TeacherDashboard /> : <Navigate to='/' />} />
          <Route path='/teacher/competition/:competitionId' element={isAuth && role === 'Teacher' ? <TeacherCompetitionLobby /> : <Navigate to='/' />} />
          <Route path='/teacher/question-bank' element={isAuth && role === 'Teacher' && ENABLE_CUSTOM_QUESTION_BANK ? <TeacherQuestionBank /> : <Navigate to='/' />} />
          <Route path='/teacher/registration' element={<TeacherRegistrationPage />} />
          <Route path='/dashboard/supervisor' element={isAuth && role === 'Supervisor' ? <SupervisorDashboard /> : <Navigate to='/' />} />
          <Route path='/teacher/assignmentReport/:studentID/:assignmentID' element={isAuth && role === 'Teacher' ? <AssignmentReport /> : <Navigate to='/' />} />
          <Route path='/student/myReport/:assignmentID' element={isAuth && role === 'Student' ? <StudentReport /> : <Navigate to='/' />} />
          <Route path="/assignment/:assignmentID/reports" element={<TeacherAssignmentReports />} />
          <Route path='/teacher/student/:studentID/history' element={isAuth ? <StudentHistory /> : <Navigate to='/' />} />
          <Route path='/pricing' element={SHOW_PRICING ? <Pricing /> : <Navigate to='/contact' />} />
          <Route path='/student/games/math-racer' element={<MathRacer />} />
          <Route path='/student/games/super-mario' element={<SuperMarioGame />} />
          <Route path='/student/games/cave-runner' element={<CaveRunner />} />
          <Route path='/student/games/maze' element={<MazeGame />} />
          <Route path='/student/games/jetski' element={<JetSkiGame />} />
          <Route path='/student/games/airplanes' element={<CartoonAirplanesGame />} />
          <Route path='/student/games/sudoku' element={<SudokuGame />} />
          <Route path='/student/games/kenken' element={<KenKenGame />} />
          <Route path='/student/games/abacus-match' element={<AbacusMatchGame />} />
          <Route path='/student/games/tanks' element={<TanksGame />} />
          <Route path='/student/games/minigolf' element={<MinigolfGame />} />
          <Route path='/student/games-menu' element={<GamesMenu />} />
          <Route path='/shop' element={isAuth ? <Shop /> : <Navigate to='/' />} />
        </Routes>
      </Suspense>
      {location.pathname === '/' && (!role || role === 'Student') && <LiveChatWidget />}
      {['/', '/pricing', '/about', '/privacy', '/contact'].includes(location.pathname) && <Footer />}
      <MobileAppDownloadPopup />
    </ErrorBoundary>
  );
}

export default App;

