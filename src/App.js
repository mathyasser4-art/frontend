import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import Home from './pages/Home/Home'
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
import SuperMarioGame from './pages/games/SuperMarioGame';
import CaveRunner from './pages/games/CaveRunner';
import JetSkiGame from './pages/games/JetSkiGame';
import CartoonAirplanesGame from './pages/games/CartoonAirplanesGame';
import SudokuGame from './pages/games/SudokuGame';
import KenKenGame from './pages/games/KenKenGame';
import HexGLGame from './pages/games/HexGLGame';
import GamesMenu from './pages/studentDashboard/GamesMenu';
import LiveChatWidget from './components/liveChat/LiveChatWidget';
import ChatManagement from './pages/dashboardSchool/ChatManagement';

function App() {
  const isAuth = localStorage.getItem('O_authWEB')
  const role = localStorage.getItem('auth_role')

  useEffect(() => {
    localStorage.removeItem('cartona')
  }, [])
  return (
    <>
      <Routes>
        <Route path='/' element={<Home />} />
      <Route path='/auth/login' element={isAuth ? <Navigate to='/' /> : <Login />} />
      <Route path='/auth/register' element={<Navigate to='/auth/login' />} />
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
      <Route path='/dashboard-school/class' element={isAuth && (role === 'School' || role === 'IT') ? <Class /> : <Navigate to='/' />} />
      <Route path='/dashboard-school/subject' element={isAuth && (role === 'School' || role === 'IT') ? <Subject /> : <Navigate to='/' />} />
      <Route path='/dashboard-school/teacher' element={isAuth && (role === 'School' || role === 'IT') ? <Teacher /> : <Navigate to='/' />} />
      <Route path='/dashboard-school/it' element={isAuth && (role === 'School' || role === 'IT') ? <IT /> : <Navigate to='/' />} />
      <Route path='/dashboard-school/supervisor' element={isAuth && (role === 'School' || role === 'IT') ? <Supervisor /> : <Navigate to='/' />} />
      <Route path='/dashboard-school/chats' element={isAuth && (role === 'School' || role === 'IT') ? <ChatManagement /> : <Navigate to='/' />} />
      <Route path='/dashboard/student' element={isAuth && role === 'Student' ? <StudentDashboard /> : <Navigate to='/' />} />
      <Route path='/student/assignment/:assignmentID' element={isAuth && role === 'Student' ? <Assignment /> : <Navigate to='/' />} />
      <Route path='/dashboard/teacher' element={isAuth && role === 'Teacher' ? <TeacherDashboard /> : <Navigate to='/' />} />
      <Route path='/dashboard/supervisor' element={isAuth && role === 'Supervisor' ? <SupervisorDashboard /> : <Navigate to='/' />} />
      <Route path='/teacher/assignmentReport/:studentID/:assignmentID' element={isAuth && role === 'Teacher' ? <AssignmentReport /> : <Navigate to='/' />} />
      <Route path='/student/myReport/:assignmentID' element={isAuth && role === 'Student' ? <StudentReport /> : <Navigate to='/' />} />
      <Route path="/assignment/:assignmentID/reports" element={<TeacherAssignmentReports />} />
      <Route path='/teacher/student/:studentID/history' element={isAuth ? <StudentHistory /> : <Navigate to='/' />} />
      <Route path='/pricing' element={<Pricing />} />
      <Route path='/student/games/math-racer' element={<MathRacer />} />
      <Route path='/student/games/super-mario' element={<SuperMarioGame />} />
      <Route path='/student/games/cave-runner' element={<CaveRunner />} />
      <Route path='/student/games/jetski' element={<JetSkiGame />} />
      <Route path='/student/games/airplanes' element={<CartoonAirplanesGame />} />
      <Route path='/student/games/sudoku' element={<SudokuGame />} />
      <Route path='/student/games/kenken' element={<KenKenGame />} />
      <Route path='/student/games/hexgl' element={<HexGLGame />} />
      <Route path='/student/games-menu' element={<GamesMenu />} />

      </Routes>
      {(!role || role === 'Student') && <LiveChatWidget />}
    </>
  )
}

export default App;
