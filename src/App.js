import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import API_BASE_URL from './config/api.config';
import Home from './pages/Home/Home'
import About from './pages/about/About'
import Privacy from './pages/privacy/Privacy'
import Footer from './components/footer/Footer'
import Login from './pages/login/Login'
import Register from './pages/register/Register'
import System from './pages/system/System'
import User from './pages/user/User'
import ContactMobile from './pages/contactMobile/ContactMobile'
import Question from './pages/question/Question'
import VerifyAccount from './pages/verifyAccount/VerifyAccount'
import ResPasEmail from './pages/resPasEmail/ResPasEmail'
import ResPasCode from './pages/resPasCode/ResPasCode'
import ResetPassword from './pages/resetPassword/ResetPassword'
import Unit from './pages/unit/Unit';
import DashboardSchool from './pages/dashboardSchool/DashboardSchool';
import Student from './pages/student/Student';
import Class from './pages/class/Class';
import Subject from './pages/subject/Subject';
import Teacher from './pages/teacher/Teacher';
import StudentDashboard from './pages/studentDashboard/StudentDashboard';
import TeacherDashboard from './pages/teacherDashboard/TeacherDashboard';
import TeacherRegistrationPage from './pages/teacherRegistrationPage/TeacherRegistrationPage';
import Assignment from './pages/assignment/Assignment';
import AssignmentReport from './pages/assignmentReport/AssignmentReport';
import StudentReport from './pages/studentReport/StudentReport';
import IT from './pages/IT/IT';
import Supervisor from './pages/supervisor/Supervisor';
import SupervisorDashboard from './pages/supervisorDashboard/SupervisorDashboard'
import TeacherAssignmentReports from './components/teacherReports/TeacherAssignmentReports';
import StudentHistory from './components/studentHistory/StudentHistory';
import Pricing from './pages/pricing/Pricing';
import MathRacer from './pages/games/MathRacer';
import { SHOW_PRICING, ENABLE_CUSTOM_QUESTION_BANK } from './config/api.config';
import SuperMarioGame from './pages/games/SuperMarioGame';
import CaveRunner from './pages/games/CaveRunner';
import MazeGame from './pages/games/MazeGame';
import JetSkiGame from './pages/games/JetSkiGame';
import CartoonAirplanesGame from './pages/games/CartoonAirplanesGame';
import SudokuGame from './pages/games/SudokuGame';
import KenKenGame from './pages/games/KenKenGame';
import AbacusMatchGame from './pages/games/AbacusMatchGame';
import TanksGame from './pages/games/TanksGame';
import MinigolfGame from './pages/games/MinigolfGame';
import GamesMenu from './pages/studentDashboard/GamesMenu';
import LiveChatWidget from './components/liveChat/LiveChatWidget';
import ChatManagement from './pages/dashboardSchool/ChatManagement';
import ReportedQuestions from './pages/dashboardSchool/ReportedQuestions';
import ClassHomework from './pages/classHomework/ClassHomework';

import TeacherCompetitionLobby from './pages/teacherDashboard/TeacherCompetitionLobby';
import StudentCompetition from './pages/studentDashboard/StudentCompetition';
import TeacherQuestionBank from './pages/teacherDashboard/TeacherQuestionBank';
import Shop from './pages/shop/Shop';
import LiveAdminDashboard from './pages/dashboardSchool/LiveAdminDashboard';
import { Analytics } from '@vercel/analytics/react';

function App() {
  const isAuth = localStorage.getItem('O_authWEB')
  const role = localStorage.getItem('auth_role')
  const location = useLocation()

  useEffect(() => {
    localStorage.removeItem('cartona')
  }, [])

  // Heartbeat mechanism for live dashboard tracking
  useEffect(() => {
    let sessionId = localStorage.getItem('site_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('site_session_id', sessionId);
    }

    const pingHeartbeat = () => {
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
    <>
      <Analytics />
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
      {location.pathname === '/' && (!role || role === 'Student') && <LiveChatWidget />}
      {['/', '/pricing', '/about', '/privacy', '/contact'].includes(location.pathname) && <Footer />}
    </>
  )
}

export default App;
