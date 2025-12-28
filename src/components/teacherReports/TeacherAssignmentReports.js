import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import API_BASE_URL from '../../config/api.config';
import '../../reusable.css';
import './TeacherReports.css';

function TeacherAssignmentReports() {
  const [students, setStudents] = useState([]);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const { assignmentID } = useParams();

  // ✅ Fetch all student results for this assignment
  useEffect(() => {
    const fetchStudentResults = async () => {
      try {
        console.log('Fetching student results for assignment:', assignmentID);

        const response = await fetch(`${API_BASE_URL}/assignment/${assignmentID}/student-results`, {
          headers: {
            authrization: 'pracYas09' + localStorage.getItem('O_authDB'),
          }
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Full API response:', data);

        if (data.message === 'success') {
          console.log('Real API data loaded:', data.students?.length, 'students');
          setStudents(data.students);
          setAssignment(data.assignment);
        } else {
          console.log('API returned non-success message:', data.message);
        }

      } catch (error) {
        console.error('Error fetching student results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentResults();
  }, [assignmentID]);

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

  // Generate individual student PDF
  const generateStudentPDF = async (student) => {
    const tempDiv = document.createElement('div');
    tempDiv.className = 'student-report-pdf';
    tempDiv.style.padding = '20px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #28a745; margin-bottom: 5px;">Exam Results Report</h2>
        <p style="color: #666; margin: 0;">Assignment: ${assignment?.title || 'N/A'}</p>
      </div>
      <div style="margin-bottom: 20px;">
        <h3>Student Information</h3>
        <p><strong>Name:</strong> ${student.name}</p>
        <p><strong>Completed:</strong> ${new Date(student.completedAt).toLocaleDateString()}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Metric</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #ddd; padding: 12px;">Answered Questions</td>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${student.answeredQuestions}</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="border: 1px solid #ddd; padding: 12px;">Score</td>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${student.score}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 12px;">Total Possible</td>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${student.totalPossible}</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="border: 1px solid #ddd; padding: 12px;">Time Spent</td>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${student.timeSpent}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 12px;">Percentage</td>
            <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${student.percentage}%</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
        Generated on ${new Date().toLocaleString()}
      </div>
    `;

    document.body.appendChild(tempDiv);

    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    document.body.removeChild(tempDiv);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save(`student-result-${student.name}-${assignmentID}.pdf`);
  };

  // Generate combined PDF for selected students
  const generateCombinedPDF = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    const combinedPDF = new jsPDF('p', 'mm', 'a4');
    const selectedStudentsData = students.filter(student =>
      selectedStudents.includes(student._id)
    );

    // Add cover page
    combinedPDF.setFontSize(20);
    combinedPDF.setTextColor(40, 167, 69);
    combinedPDF.text('Class Results Report', 105, 50, { align: 'center' });

    combinedPDF.setFontSize(14);
    combinedPDF.setTextColor(0, 0, 0);
    combinedPDF.text(`Assignment: ${assignment?.title || 'N/A'}`, 105, 70, { align: 'center' });
    combinedPDF.text(`Total Students: ${selectedStudentsData.length}`, 105, 80, { align: 'center' });
    combinedPDF.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 90, { align: 'center' });

    let currentPage = 1;

    for (let i = 0; i < selectedStudentsData.length; i++) {
      const student = selectedStudentsData[i];

      if (i > 0) {
        combinedPDF.addPage();
        currentPage++;
      }

      combinedPDF.setFontSize(16);
      combinedPDF.setTextColor(0, 0, 0);
      combinedPDF.text(`Student: ${student.name}`, 20, 30);
      combinedPDF.setFontSize(12);
      combinedPDF.text(`Completed: ${new Date(student.completedAt).toLocaleDateString()}`, 20, 40);

      const startY = 60;
      combinedPDF.setFontSize(10);

      combinedPDF.setFillColor(248, 249, 250);
      combinedPDF.rect(20, startY, 170, 8, 'F');
      combinedPDF.text('Metric', 25, startY + 6);
      combinedPDF.text('Value', 165, startY + 6, { align: 'right' });

      const results = [
        ['Answered Questions', student.answeredQuestions],
        ['Score', student.score],
        ['Total Possible', student.totalPossible],
        ['Time Spent', student.timeSpent],
        ['Percentage', `${student.percentage}%`]
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
      combinedPDF.setTextColor(128, 128, 128);
      combinedPDF.text(`Page ${currentPage}`, 105, 280, { align: 'center' });
    }

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    combinedPDF.save(`class-results-${assignmentID}-${timestamp}.pdf`);
  };

  if (loading) {
    return <div className="loading">Loading student results...</div>;
  }

  return (
    <div className="teacher-reports-container">
      <nav>
        <div className='nav-container d-flex justify-content-space-between align-items-center'>
          <Link to={'/'}><img src="/logo.png" alt="Logo" /></Link>
          <div className='nav-right-side d-flex align-items-center'>
            <Link to={'/dashboard/teacher'} className="back-btn">
              <i className="fa fa-arrow-left" aria-hidden="true"></i> Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="reports-content">
        <div className="reports-header">
          <h1>Student Results: {assignment?.title}</h1>
          <p>Select students to generate a combined PDF report</p>
        </div>

        <div className="bulk-actions">
          <button onClick={selectAllStudents} className="btn-select-all">Select All</button>
          <button onClick={deselectAllStudents} className="btn-deselect-all">Deselect All</button>
          <button onClick={generateCombinedPDF} className="btn-download-combined">
            <i className="fa fa-download" aria-hidden="true"></i> 
            Download Combined PDF ({selectedStudents.length} students)
          </button>
        </div>

        <div className="students-list">
          {students.map(student => (
            <div key={student._id} className="student-card">
              <div className="student-checkbox">
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(student._id)}
                  onChange={() => toggleStudentSelection(student._id)}
                />
              </div>
              <div className="student-info">
                <h3>{student.name}</h3>
                <div className="student-stats">
                  <span>Score: <strong>{student.score}/{student.totalPossible}</strong></span>
                  <span>Time: <strong>{student.timeSpent}</strong></span>
                  <span>Percentage: <strong>{student.percentage}%</strong></span>
                </div>
                <div className="completion-date">
                  Completed: {new Date(student.completedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="student-actions">
                <button onClick={() => generateStudentPDF(student)} className="btn-download-single">
                  <i className="fa fa-download" aria-hidden="true"></i> Individual PDF
                </button>
              </div>
            </div>
          ))}
        </div>

        {students.length === 0 && (
          <div className="no-results">
            <p>No students have completed this assignment yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherAssignmentReports;
