import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import API_BASE_URL from '../../config/api.config';
import soundEffects from '../../utils/soundEffects';
import '../../reusable.css';
import './TeacherReports.css';

function TeacherAssignmentReports() {
  const [students, setStudents] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [sortBy, setSortBy] = useState('score-desc');
  const { assignmentID } = useParams();
  const navigate = useNavigate();

  // ✅ Time formatting utility to convert "0:00" or "0 00" to "Untimed" and others to "2m 15s"
  const formatTimeSpent = (timeStr) => {
    if (!timeStr || timeStr === '0:00' || timeStr === '0 00' || timeStr === '00:00' || timeStr === '—') {
      return 'Untimed';
    }
    if (timeStr.includes('m') || timeStr.includes('s')) return timeStr;

    const parts = timeStr.split(/[:\s]+/);
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10) || 0;
      const seconds = parseInt(parts[1], 10) || 0;
      if (minutes === 0 && seconds === 0) return 'Untimed';
      return `${minutes}m ${seconds}s`;
    }
    return timeStr;
  };

  // ✅ Fetch all student results for this assignment
  useEffect(() => {
    const fetchStudentResults = async () => {
      try {
        console.log('📊 Fetching student results for assignment:', assignmentID);

        const token = localStorage.getItem('O_authWEB');
        if (!token) {
          setError({
            type: 'auth',
            message: 'You are not logged in. Please login as a teacher to view reports.'
          });
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/assignment/${assignmentID}/student-results`, {
          headers: {
            authrization: 'pracYas09' + token,
          }
        });

        console.log('📡 Response status:', response.status);
        const data = await response.json();
        console.log('📦 Full API response:', data);
        
        if (response.status === 502 || response.status === 401 || response.status === 403) {
          setError({
            type: 'auth',
            message: 'Authentication failed. Your session may have expired or you may not have teacher permissions.',
            details: data.message
          });
          setLoading(false);
          return;
        }

        if (data.message === 'success') {
          console.log('✅ Real API data loaded:', data.students?.length, 'students');
          
          // Filter students who have completed the assignment (have a score)
          const completedStudents = (data.students || []).filter(student => 
            student.score !== undefined && student.score !== null
          );
          
          setStudents(completedStudents);
          setAssignment(data.assignment);
        } else {
          setError({
            type: 'api',
            message: 'Failed to load student results',
            details: data.message
          });
        }
      } catch (error) {
        console.error('❌ Error fetching student results:', error);
        setError({
          type: 'network',
          message: 'Network error occurred while fetching results',
          details: error.message
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudentResults();
  }, [assignmentID]);

  // Handle logout and clear authentication
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllStudents = () => {
    setSelectedStudents(students.map(student => student._id));
  };

  const deselectAllStudents = () => {
    setSelectedStudents([]);
  };

  // Format date and time for display
  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Calculate grade letter based on percentage
  const getGradeLetter = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  // Get visually distinct grade class
  const getGradeClass = (percentage) => {
    if (percentage >= 90) return 'grade-a';
    if (percentage >= 80) return 'grade-b';
    if (percentage >= 60) return 'grade-cd';
    return 'grade-f';
  };

  // Get corresponding trophy/icon for the card
  const getGradeBadge = (percentage) => {
    if (percentage >= 90) return <span className="grade-trophy-badge">🏆 Grade A</span>;
    if (percentage >= 80) return <span className="grade-trophy-badge">🥈 Grade B</span>;
    if (percentage >= 60) return <span className="grade-trophy-badge">⭐ Grade C/D</span>;
    return <span className="grade-trophy-badge">🚩 Grade F</span>;
  };

  // Dynamic sorting logic
  const getSortedStudents = () => {
    return [...students].sort((a, b) => {
      if (sortBy === 'score-desc') return b.score - a.score;
      if (sortBy === 'score-asc') return a.score - b.score;
      if (sortBy === 'name-asc') return (a.userName || '').localeCompare(b.userName || '');
      if (sortBy === 'time-asc') {
        const parseTime = (t) => {
          if (!t || t === '0:00' || t === '0 00' || t === '—') return 999999;
          const parts = t.split(':');
          return parts.length === 2 ? parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) : parseInt(t, 10) || 999999;
        };
        return parseTime(a.timeSpent) - parseTime(b.timeSpent);
      }
      if (sortBy === 'date-desc') return new Date(b.completedAt) - new Date(a.completedAt);
      return 0;
    });
  };

  // Generate individual student PDF with improved layout
  const generateStudentPDF = async (student) => {
    try {
      const studentName = student.userName || 'Unknown Student';
      console.log('📄 Generating PDF for student:', studentName);
      
      // Show loading message
      const singleLoadingDiv = document.createElement('div');
      singleLoadingDiv.id = 'pdf-loading-single';
      singleLoadingDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 10000; text-align: center;';
      singleLoadingDiv.innerHTML = '<i class="fa fa-spinner fa-spin" style="font-size: 36px; color: #28a745;"></i><p style="margin-top: 15px; font-size: 16px;">Generating PDF Report...</p>';
      document.body.appendChild(singleLoadingDiv);

      const gradeLetter = getGradeLetter(student.percentage);
      const completedDate = formatDateTime(student.completedAt);
      const timeSpentFormatted = formatTimeSpent(student.timeSpent);

      const tempDiv = document.createElement('div');
      tempDiv.className = 'student-report-pdf';
      tempDiv.style.padding = '40px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.width = '800px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      
      tempDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #28a745; padding-bottom: 20px;">
          <h1 style="color: #28a745; margin-bottom: 10px; font-size: 32px;">Student Assignment Report</h1>
          <h2 style="color: #666; margin: 5px 0; font-size: 20px;">${assignment?.title || 'N/A'}</h2>
        </div>

        <div style="margin-bottom: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
          <h3 style="color: #333; margin-bottom: 15px; font-size: 20px; border-bottom: 2px solid #28a745; padding-bottom: 8px;">Student Information</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 16px;">
            <div>
              <p style="margin: 8px 0;"><strong style="color: #555;">Student Name:</strong> <span style="color: #000; font-weight: bold;">${studentName}</span></p>
              <p style="margin: 8px 0;"><strong style="color: #555;">Email:</strong> <span style="color: #000;">${student.email || 'N/A'}</span></p>
            </div>
            <div>
              <p style="margin: 8px 0;"><strong style="color: #555;">Completed On:</strong> <span style="color: #000;">${completedDate}</span></p>
              <p style="margin: 8px 0;"><strong style="color: #555;">Time Spent:</strong> <span style="color: #000; font-weight: 600;">${timeSpentFormatted}</span></p>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px; padding: 25px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h3 style="color: white; margin-bottom: 20px; font-size: 22px;">FINAL GRADE: ${gradeLetter}</h3>
          <div style="background-color: rgba(255,255,255,0.95); border-radius: 8px; padding: 20px; margin-bottom: 15px;">
            <p style="margin: 0; font-size: 48px; font-weight: bold; color: #333;">
              ${student.score} / ${student.totalPossible}
            </p>
            <p style="margin: 10px 0 0 0; font-size: 16px; color: #666;">Points Earned</p>
          </div>
          <div style="display: grid; grid-template-columns: 1fr; gap: 15px; max-width: 200px; margin: 0 auto;">
            <div style="background-color: rgba(255,255,255,0.95); border-radius: 8px; padding: 15px;">
              <p style="margin: 0; font-size: 36px; font-weight: bold; color: #28a745;">${student.percentage}%</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Percentage</p>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #333; margin-bottom: 15px; font-size: 20px; border-bottom: 2px solid #28a745; padding-bottom: 8px;">Assignment Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
            <tbody>
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: 600; color: #555; width: 50%;">Total Possible Points</td>
                <td style="padding: 12px; border: 1px solid #ddd; text-align: center; color: #000;">${student.totalPossible}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: 600; color: #555;">Points Earned</td>
                <td style="padding: 12px; border: 1px solid #ddd; text-align: center; color: #28a745; font-weight: 600;">${student.score}</td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 12px; border: 1px solid #ddd; font-weight: 600; color: #555;">Time Duration</td>
                <td style="padding: 12px; border: 1px solid #ddd; text-align: center; color: #000; font-weight: 600;">${timeSpentFormatted}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #999; font-size: 12px;">
          <p style="margin: 0;">Report Generated: ${new Date().toLocaleString()}</p>
          <p style="margin: 5px 0 0 0;">Abacus Heroes - Educational Platform</p>
        </div>
      `;

      document.body.appendChild(tempDiv);
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      document.body.removeChild(tempDiv);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= 277;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= 277;
      }

      const fileName = `${studentName.replace(/[^a-z0-9]/gi, '_')}_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);

      document.body.removeChild(singleLoadingDiv);
      
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      alert('❌ Failed to generate PDF. Please try again.');
      
      const singleLoadingDiv = document.getElementById('pdf-loading-single');
      if (singleLoadingDiv && document.body.contains(singleLoadingDiv)) {
        document.body.removeChild(singleLoadingDiv);
      }
    }
  };

  // Generate combined PDF for selected students
  const generateCombinedPDF = async () => {
    if (selectedStudents.length === 0) {
      alert('⚠️ Please select at least one student to generate a combined report');
      return;
    }

    try {
      console.log('📄 Generating combined PDF for', selectedStudents.length, 'students');
      
      const combinedLoadingDiv = document.createElement('div');
      combinedLoadingDiv.id = 'pdf-loading-combined';
      combinedLoadingDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 10000; text-align: center;';
      combinedLoadingDiv.innerHTML = `<i class="fa fa-spinner fa-spin" style="font-size: 36px; color: #28a745;"></i><p style="margin-top: 15px; font-size: 16px;">Generating Combined PDF for ${selectedStudents.length} student(s)...</p>`;
      document.body.appendChild(combinedLoadingDiv);

      const combinedPDF = new jsPDF('p', 'mm', 'a4');
      const selectedStudentsData = students.filter(student =>
        selectedStudents.includes(student._id)
      );

      const totalStudents = selectedStudentsData.length;
      const averageScore = Math.round(
        selectedStudentsData.reduce((sum, s) => sum + s.score, 0) / totalStudents
      );
      const averagePercentage = Math.round(
        selectedStudentsData.reduce((sum, s) => sum + s.percentage, 0) / totalStudents
      );
      const highestScore = Math.max(...selectedStudentsData.map(s => s.score));
      const lowestScore = Math.min(...selectedStudentsData.map(s => s.score));

      // Cover Page
      combinedPDF.setFontSize(24);
      combinedPDF.setTextColor(40, 167, 69);
      combinedPDF.text('Class Assignment Report', 105, 40, { align: 'center' });

      combinedPDF.setFontSize(16);
      combinedPDF.setTextColor(0, 0, 0);
      combinedPDF.text(`Assignment: ${assignment?.title || 'N/A'}`, 105, 55, { align: 'center' });
      
      combinedPDF.setFontSize(12);
      combinedPDF.setTextColor(100, 100, 100);
      combinedPDF.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 65, { align: 'center' });

      // Statistics Box
      combinedPDF.setDrawColor(40, 167, 69);
      combinedPDF.setFillColor(248, 249, 250);
      combinedPDF.roundedRect(20, 80, 170, 60, 3, 3, 'FD');

      combinedPDF.setFontSize(14);
      combinedPDF.setTextColor(40, 167, 69);
      combinedPDF.text('Class Statistics', 105, 90, { align: 'center' });

      combinedPDF.setFontSize(11);
      combinedPDF.setTextColor(0, 0, 0);
      combinedPDF.text(`Total Students: ${totalStudents}`, 30, 105);
      combinedPDF.text(`Average Score: ${averageScore}/${assignment?.totalPoints || 'N/A'}`, 30, 115);
      combinedPDF.text(`Average Percentage: ${averagePercentage}%`, 30, 125);
      combinedPDF.text(`Highest Score: ${highestScore}`, 120, 105);
      combinedPDF.text(`Lowest Score: ${lowestScore}`, 120, 115);

      let currentPage = 1;

      // Individual Pages in Combined PDF
      for (let i = 0; i < selectedStudentsData.length; i++) {
        const student = selectedStudentsData[i];
        const studentName = student.userName || 'Unknown Student';
        const timeSpentFormatted = formatTimeSpent(student.timeSpent);

        combinedPDF.addPage();
        currentPage++;

        combinedPDF.setFontSize(18);
        combinedPDF.setTextColor(40, 167, 69);
        combinedPDF.text(`Student: ${studentName}`, 20, 25);

        combinedPDF.setFontSize(11);
        combinedPDF.setTextColor(100, 100, 100);
        combinedPDF.text(`Completed: ${formatDateTime(student.completedAt)}`, 20, 35);
        combinedPDF.text(`Time Spent: ${timeSpentFormatted}`, 20, 42);

        // Grade Header Box
        combinedPDF.setDrawColor(102, 126, 234);
        combinedPDF.setFillColor(102, 126, 234);
        combinedPDF.roundedRect(20, 50, 170, 35, 3, 3, 'F');

        combinedPDF.setTextColor(255, 255, 255);
        combinedPDF.setFontSize(12);
        combinedPDF.text('FINAL MARK', 105, 60, { align: 'center' });

        combinedPDF.setFontSize(24);
        combinedPDF.text(`${student.score} / ${student.totalPossible}`, 80, 75);

        combinedPDF.setFontSize(20);
        combinedPDF.text(`${student.percentage}%`, 140, 75);

        // Metrics Table
        const startY = 95;
        combinedPDF.setFontSize(10);
        combinedPDF.setTextColor(0, 0, 0);

        combinedPDF.setFillColor(248, 249, 250);
        combinedPDF.rect(20, startY, 170, 8, 'F');
        combinedPDF.text('Metric', 25, startY + 6);
        combinedPDF.text('Value', 165, startY + 6, { align: 'right' });

        const results = [
          ['Points Earned', student.score.toString()],
          ['Total Possible Points', student.totalPossible.toString()],
          ['Time Duration', timeSpentFormatted],
          ['Percentage Score', `${student.percentage}%`]
        ];

        let yPos = startY + 8;
        results.forEach(([label, value], index) => {
          if (index % 2 === 0) {
            combinedPDF.setFillColor(245, 245, 245);
            combinedPDF.rect(20, yPos, 170, 8, 'F');
          }
          combinedPDF.text(label, 25, yPos + 6);
          combinedPDF.text(value.toString(), 165, yPos + 6, { align: 'right' });
          yPos += 8;
        });

        combinedPDF.setFontSize(8);
        combinedPDF.setTextColor(150, 150, 150);
        combinedPDF.text(`Page ${currentPage} of ${selectedStudentsData.length + 1}`, 105, 285, { align: 'center' });
      }

      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const fileName = `Class_Report_${assignment?.title?.replace(/[^a-z0-9]/gi, '_') || 'Assignment'}_${timestamp}.pdf`;
      combinedPDF.save(fileName);

      if (combinedLoadingDiv && document.body.contains(combinedLoadingDiv)) {
        document.body.removeChild(combinedLoadingDiv);
      }
      
    } catch (error) {
      console.error('❌ Error generating combined PDF:', error);
      alert('❌ Failed to generate combined PDF. Please try again.');
      
      const combinedLoadingDivCleanup = document.getElementById('pdf-loading-combined');
      if (combinedLoadingDivCleanup && document.body.contains(combinedLoadingDivCleanup)) {
        document.body.removeChild(combinedLoadingDivCleanup);
      }
    }
  };

  if (loading) {
    return (
      <div className="teacher-reports-container">
        <nav>
          <div className='nav-container d-flex justify-content-space-between align-items-center'>
            <Link to={'/'}><img src="/logo.png" alt="Logo" /></Link>
            <div className='nav-right-side d-flex align-items-center'>
              <Link to={'/dashboard/teacher'} className="back-btn" onClick={() => soundEffects.playClick()}>
                <i className="fa fa-arrow-left" aria-hidden="true"></i> Back to Dashboard
              </Link>
            </div>
          </div>
        </nav>
        <div className="reports-content">
          <div className="loading-state" style={{ textAlign: 'center', padding: '100px 0' }}>
            <i className="fa fa-spinner fa-spin" style={{ fontSize: '48px', color: '#4f46e5', marginBottom: '20px' }}></i>
            <h2 style={{color: '#1e1b4b'}}>Loading reports hub...</h2>
            <p style={{color: '#64748b'}}>Please wait while we gather assignment details</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state with clear instructions
  if (error) {
    return (
      <div className="teacher-reports-container">
        <nav>
          <div className='nav-container d-flex justify-content-space-between align-items-center'>
            <Link to={'/'}><img src="/logo.png" alt="Logo" /></Link>
            <div className='nav-right-side d-flex align-items-center'>
              <Link to={'/dashboard/teacher'} className="back-btn" onClick={() => soundEffects.playClick()}>
                <i className="fa fa-arrow-left" aria-hidden="true"></i> Back to Dashboard
              </Link>
            </div>
          </div>
        </nav>
        <div className="reports-content">
          <div className="error-state" style={{
            maxWidth: '600px',
            margin: '50px auto',
            padding: '30px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0,0,0,0.05)'
          }}>
            <i className="fa fa-exclamation-triangle" style={{
              fontSize: '48px',
              color: '#ff6b6b',
              marginBottom: '20px'
            }}></i>
            <h2 style={{ color: '#856404', marginBottom: '15px' }}>
              {error.type === 'auth' ? '🔒 Authentication Error' : '⚠️ Error Loading Reports'}
            </h2>
            <p style={{ fontSize: '16px', color: '#856404', marginBottom: '10px' }}>
              {error.message}
            </p>
            {error.details && (
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px', fontFamily: 'monospace' }}>
                Technical details: {error.details}
              </p>
            )}
            
            {error.type === 'auth' && (
              <div style={{ marginTop: '25px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  onClick={handleLogout}
                  className="button"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  <i className="fa fa-sign-out" aria-hidden="true"></i> Logout & Login Again
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="button"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  <i className="fa fa-refresh" aria-hidden="true"></i> Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const sortedStudents = getSortedStudents();
  
  // Calculate dynamic stats for overview
  const totalSubmissions = students.length;
  const classAverageScore = totalSubmissions > 0 
    ? Math.round(students.reduce((sum, s) => sum + s.score, 0) / totalSubmissions)
    : 0;
  const classAveragePercentage = totalSubmissions > 0 
    ? Math.round(students.reduce((sum, s) => sum + s.percentage, 0) / totalSubmissions)
    : 0;
  const classHighestScore = totalSubmissions > 0 
    ? Math.max(...students.map(s => s.score))
    : 0;
  const classLowestScore = totalSubmissions > 0 
    ? Math.min(...students.map(s => s.score))
    : 0;

  return (
    <div className="teacher-reports-container">
      <nav>
        <div className='nav-container d-flex justify-content-space-between align-items-center'>
          <Link to={'/'}><img src="/logo.png" alt="Logo" /></Link>
          <div className='nav-right-side d-flex align-items-center'>
            <Link to={'/dashboard/teacher'} className="back-btn" onClick={() => soundEffects.playClick()}>
              <i className="fa fa-arrow-left" aria-hidden="true"></i> Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="reports-content">
        <div className="reports-header">
          <h1>📊 Homework Reports Hub</h1>
          <p>{assignment?.title || 'Loading Homework...'}</p>
        </div>

        {/* ============================================================
           SECTION 1: COMBINED CLASS HOMEWORK (Class-wide Overview & PDF)
           ============================================================ */}
        <div className="combined-reports-section">
          <div className="section-title-wrapper">
            <i className="fa fa-users" aria-hidden="true"></i>
            <h2>Combined Class Homework</h2>
          </div>
          
          {totalSubmissions > 0 ? (
            <>
              <div className="class-stats-grid">
                <div className="class-stat-card stat-avg">
                  <div className="class-stat-icon">
                    <i className="fa fa-calculator" aria-hidden="true"></i>
                  </div>
                  <div className="class-stat-label">Class Average</div>
                  <div className="class-stat-value">{classAverageScore} / {assignment?.totalPoints} ({classAveragePercentage}%)</div>
                </div>
                
                <div className="class-stat-card stat-high">
                  <div className="class-stat-icon">
                    <i className="fa fa-trophy" aria-hidden="true"></i>
                  </div>
                  <div className="class-stat-label">Highest Score</div>
                  <div className="class-stat-value">{classHighestScore} / {assignment?.totalPoints}</div>
                </div>
                
                <div className="class-stat-card stat-low">
                  <div className="class-stat-icon">
                    <i className="fa fa-chevron-down" aria-hidden="true"></i>
                  </div>
                  <div className="class-stat-label">Lowest Score</div>
                  <div className="class-stat-value">{classLowestScore} / {assignment?.totalPoints}</div>
                </div>
                
                <div className="class-stat-card stat-submissions">
                  <div className="class-stat-icon">
                    <i className="fa fa-check-square-o" aria-hidden="true"></i>
                  </div>
                  <div className="class-stat-label">Submissions</div>
                  <div className="class-stat-value">{totalSubmissions} Student(s)</div>
                </div>
              </div>

              <div className="bulk-actions-wrapper">
                <div className="bulk-selectors">
                  <button onClick={() => { soundEffects.playClick(); selectAllStudents(); }} className="btn-select-all">
                    <i className="fa fa-check-square-o" aria-hidden="true"></i> Select All
                  </button>
                  <button onClick={() => { soundEffects.playClick(); deselectAllStudents(); }} className="btn-deselect-all">
                    <i className="fa fa-square-o" aria-hidden="true"></i> Deselect All
                  </button>
                </div>
                
                <button 
                  onClick={() => { soundEffects.playClick(); generateCombinedPDF(); }} 
                  className="btn-download-combined"
                  disabled={selectedStudents.length === 0}
                >
                  <i className="fa fa-file-pdf-o" aria-hidden="true"></i> 
                  Download Combined Class PDF ({selectedStudents.length} Selected)
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px 0', color: '#64748b' }}>
              No class statistics available until students complete the homework.
            </div>
          )}
        </div>

        {/* ============================================================
           SECTION 2: ROSTER, DETAILED HW, & HISTORICAL REPORTS
           ============================================================ */}
        <div className="detailed-reports-section">
          <div className="section-title-wrapper">
            <i className="fa fa-file-text-o" aria-hidden="true"></i>
            <h2>Detailed Student Homework & History</h2>
          </div>

          {students.length > 0 ? (
            <>
              {/* Sorting Tabs Toolbar */}
              <div className="sorting-toolbar">
                <span className="sort-label">Arrange Students:</span>
                <div className="sort-buttons-group">
                  <button 
                    onClick={() => { soundEffects.playClick(); setSortBy('score-desc'); }}
                    className={`sort-btn ${sortBy === 'score-desc' ? 'active' : ''}`}
                  >
                    🏆 Score: High to Low
                  </button>
                  <button 
                    onClick={() => { soundEffects.playClick(); setSortBy('score-asc'); }}
                    className={`sort-btn ${sortBy === 'score-asc' ? 'active' : ''}`}
                  >
                    📈 Score: Low to High
                  </button>
                  <button 
                    onClick={() => { soundEffects.playClick(); setSortBy('name-asc'); }}
                    className={`sort-btn ${sortBy === 'name-asc' ? 'active' : ''}`}
                  >
                    🔤 Alphabetical (A-Z)
                  </button>
                  <button 
                    onClick={() => { soundEffects.playClick(); setSortBy('time-asc'); }}
                    className={`sort-btn ${sortBy === 'time-asc' ? 'active' : ''}`}
                  >
                    ⚡ Speed: Fastest First
                  </button>
                  <button 
                    onClick={() => { soundEffects.playClick(); setSortBy('date-desc'); }}
                    className={`sort-btn ${sortBy === 'date-desc' ? 'active' : ''}`}
                  >
                    📅 Completion: Latest First
                  </button>
                </div>
              </div>

              {/* Roster Cards Grid */}
              <div className="students-list-grid">
                {sortedStudents.map(student => {
                  const studentName = student.userName || 'Unknown Student';
                  const gradeClass = getGradeClass(student.percentage);
                  const timeSpentFormatted = formatTimeSpent(student.timeSpent);
                  
                  return (
                    <div key={student._id} className={`student-report-card ${gradeClass}`}>
                      <div className="student-card-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student._id)}
                          onChange={() => toggleStudentSelection(student._id)}
                        />
                      </div>
                      
                      <div className="student-card-content">
                        <div className="student-profile-summary">
                          <div className="student-name-wrapper">
                            <h3>{studentName}</h3>
                            {getGradeBadge(student.percentage)}
                          </div>
                          
                          <div className="student-meta-stats">
                            <span className="meta-stat-item">
                              <i className="fa fa-clock-o" aria-hidden="true"></i>
                              <strong>Time Taken:</strong> {timeSpentFormatted}
                            </span>
                            <span className="meta-stat-item">
                              <i className="fa fa-check-circle-o" aria-hidden="true"></i>
                              <strong>Answered:</strong> {student.answeredQuestions} / {student.totalQuestions} Qs
                            </span>
                          </div>
                          
                          <div className="completion-date-text">
                            <i className="fa fa-calendar-check-o" aria-hidden="true"></i>
                            Completed: {formatDateTime(student.completedAt)}
                          </div>
                        </div>

                        {/* High Contrast Score Circle/Box */}
                        <div className="student-score-box">
                          <div className="score-ratio">{student.score} / {student.totalPossible}</div>
                          <div className="score-percentage">{student.percentage}% Score</div>
                        </div>

                        {/* Unified Action Buttons Hub */}
                        <div className="student-action-buttons">
                          {/* 1. DETAILED HW REPORT */}
                          <Link 
                            to={`/teacher/assignmentReport/${student.studentId}/${assignmentID}`} 
                            className="btn-action-view"
                            onClick={() => soundEffects.playClick()}
                            title="Inspect student's question-by-question detailed answers"
                          >
                            <i className="fa fa-eye" aria-hidden="true"></i> Detailed HW
                          </Link>

                          {/* 2. HISTORICAL HOMEWORK REPORT */}
                          <Link 
                            to={`/teacher/student/${student.studentId}/history`} 
                            className="btn-action-history"
                            onClick={() => soundEffects.playClick()}
                            title="Inspect student's historical homework grades and pacing"
                          >
                            <i className="fa fa-history" aria-hidden="true"></i> HW History
                          </Link>

                          {/* 3. INDIVIDUAL PDF DOWNLOAD */}
                          <button 
                            onClick={() => { soundEffects.playClick(); generateStudentPDF(student); }} 
                            className="btn-action-download"
                            title="Download printable PDF Report Card"
                          >
                            <i className="fa fa-file-pdf-o" aria-hidden="true"></i> PDF Report
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="no-results-panel">
              <i className="fa fa-inbox" aria-hidden="true"></i>
              <h3>No Submissions Found</h3>
              <p>When students complete this homework, their detailed scores, PDFs, and historical homework records will gather here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeacherAssignmentReports;
