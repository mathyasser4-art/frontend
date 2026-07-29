import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import API_BASE_URL, { SHOW_PRICING, ENABLE_CUSTOM_QUESTION_BANK } from './config/api.config';
import Footer from './components/footer/Footer';
import LiveChatWidget from './components/liveChat/LiveChatWidget';
import DashboardLoading from './components/dashboardLoading/DashboardLoading';
import ErrorBoundary from './components/errorBoundary/ErrorBoundary';
import MobileAppDownloadPopup from './components/mobileAppPopup/MobileAppDownloadPopup';
import { Analytics } from '@vercel/analytics/react';

// Lazy-loaded route components for optimal bundle splitting
const Home = lazy(() => import('./pages/Home/Home'));
const About = lazy(() => import('./pages/about/About'));
const Privacy = lazy(() => import('./pages/privacy/Privacy'));
const Login = lazy(() => import('./pages/login/Login'));
const Register = lazy(() => import('./pages/register/Register'));
const System = lazy(() => import('./pages/system/System'));
const User = lazy(() => import('./pages/user/User'));
const ContactMobile = lazy(() => import('./pages/contactMobile/ContactMobile'));
const Question = lazy(() => import('./pages/question/Question'));
const VerifyAccount = lazy(() => import('./pages/verifyAccount/VerifyAccount'));
const ResPasEmail = lazy(() => import('./pages/resPasEmail/ResPasEmail'));
const ResPasCode = lazy(() => import('./pages/resPasCode/ResPasCode'));
const ResetPassword = lazy(() => import('./pages/resetPassword/ResetPassword'));
const Unit = lazy(() => import('./pages/unit/Unit'));
const DashboardSchool = lazy(() => import('./pages/dashboardSchool/DashboardSchool'));
const Student = lazy(() => import('./pages/student/Student'));
const Class = lazy(() => import('./pages/class/Class'));
const Subject = lazy(() => import('./pages/subject/Subject'));
const Teacher = lazy(() => import('./pages/teacher/Teacher'));
const StudentDashboard = lazy(() => import('./pages/studentDashboard/StudentDashboard'));
const TeacherDashboard = lazy(() => import('./pages/teacherDashboard/TeacherDashboard'));
const TeacherRegistrationPage = lazy(() => import('./pages/teacherRegistrationPage/TeacherRegistrationPage'));
const Assignment = lazy(() => import('./pages/assignment/Assignment'));
const AssignmentReport = lazy(() => import('./pages/assignmentReport/AssignmentReport'));
const StudentReport = lazy(() => import('./pages/studentReport/StudentReport'));
const IT = lazy(() => import('./pages/IT/IT'));
const Supervisor = lazy(() => import('./pages/supervisor/Supervisor'));
const SupervisorDashboard = lazy(() => import('./pages/supervisorDashboard/SupervisorDashboard'));
const TeacherAssignmentReports = lazy(() => import('./components/teacherReports/TeacherAssignmentReports'));
const StudentHistory = lazy(() => import('./components/studentHistory/StudentHistory'));
const Pricing = lazy(() => import('./pages/pricing/Pricing'));
const MathRacer = lazy(() => import('./pages/games/MathRacer'));
const SuperMarioGame = lazy(() => import('./pages/games/SuperMarioGame'));
const CaveRunner = lazy(() => import('./pages/games/CaveRunner'));
const MazeGame = lazy(() => import('./pages/games/MazeGame'));
const JetSkiGame = lazy(() => import('./pages/games/JetSkiGame'));
const CartoonAirplanesGame = lazy(() => import('./pages/games/CartoonAirplanesGame'));
const SudokuGame = lazy(() => import('./pages/games/SudokuGame'));
const KenKenGame = lazy(() => import('./pages/games/KenKenGame'));
const AbacusMatchGame = lazy(() => import('./pages/games/AbacusMatchGame'));
const TanksGame = lazy(() => import('./pages/games/TanksGame'));
const MinigolfGame = lazy(() => import('./pages/games/MinigolfGame'));
const GamesMenu = lazy(() => import('./pages/studentDashboard/GamesMenu'));
const ChatManagement = lazy(() => import('./pages/dashboardSchool/ChatManagement'));
const ReportedQuestions = lazy(() => import('./pages/dashboardSchool/ReportedQuestions'));
const ClassHomework = lazy(() => import('./pages/classHomework/ClassHomework'));
const TeacherCompetitionLobby = lazy(() => import('./pages/teacherDashboard/TeacherCompetitionLobby'));
const StudentCompetition = lazy(() => import('./pages/studentDashboard/StudentCompetition'));
const TeacherQuestionBank = lazy(() => import('./pages/teacherDashboard/TeacherQuestionBank'));
const Shop = lazy(() => import('./pages/shop/Shop'));
const LiveAdminDashboard = lazy(() => import('./pages/dashboardSchool/LiveAdminDashboard'));

function App() {
  const isAuth = localStorage.getItem('O_authWEB');
  const role = localStorage.getItem('auth_role');
  const location = useLocation();

  useEffect(() => {
    localStorage.removeItem('cartona');
  }, []);

  // Heartbeat mechanism for live dashboard tracking
  useEffect(() => {
    let sessionId = localStorage.getItem('site_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('site_session_id', sessionId);
    }

    const pingHeartbeat = () => {
      // Pause heartbeat ping when page is hidden to preserve resources on mobile
      if (document.visibilityState === 'hidden') return;

      fetch(`${API_BASE_URL}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userId: localStorage.getItem('pp_id') || null,
          role: localStorage.getItem('auth_role') || 'Visitor',
          userName: localStorage.getItem('pp_name') || 'Anonymous'
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

