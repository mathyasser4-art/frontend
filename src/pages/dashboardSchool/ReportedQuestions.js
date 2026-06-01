import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Trash2, AlertTriangle, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import API_BASE_URL from '../../config/api.config';
import './ReportedQuestions.css';

const parseGridRows = (questionText) => {
    if (!questionText) return null;
    const trimmed = String(questionText).trim();
    if (!trimmed.startsWith('[')) return null;
    try {
        const rows = JSON.parse(trimmed);
        if (!Array.isArray(rows) || rows.length === 0) return null;
        const first = rows[0];
        if (
            first.op !== undefined || first.OP !== undefined ||
            first.val !== undefined || first.VAL !== undefined
        ) return rows;
    } catch (e) {}
    return null;
};

const getRowOp  = (row) => (row.op  !== undefined ? row.op  : (row.OP  !== undefined ? row.OP  : ''));
const getRowVal = (row) => (row.val !== undefined ? row.val : (row.VAL !== undefined ? row.VAL : ''));

const renderQuestionText = (questionText) => {
    const gridRows = parseGridRows(questionText);
    if (gridRows) {
        return (
            <div className="abacus-grid-view-mini">
                <table className="abacus-display-table-mini">
                    <tbody>
                        {gridRows.map((row, i) => (
                            <tr key={i}>
                                <td className="op-cell-mini">{getRowOp(row)}</td>
                                <td className="val-cell-mini">{getRowVal(row)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
    return <pre className="raw-text-mini">{questionText}</pre>;
};

const ReportedQuestions = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/question/reports`, {
        headers: {
          'authrization': `pracYas09${localStorage.getItem('O_authWEB')}`
        }
      });
      const data = await response.json();
      if (data.message === 'success') {
        setReports(data.reports || []);
      } else {
        setError(data.message || 'Failed to load reports');
      }
    } catch (err) {
      setError('Network error loading reported questions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (reportId, action) => {
    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch(`${API_BASE_URL}/question/report-resolve/${reportId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authrization': `pracYas09${localStorage.getItem('O_authWEB')}`
        },
        body: JSON.stringify({ action })
      });
      const data = await response.json();
      if (data.message === 'success') {
        setSuccessMsg(action === 'correct' ? 'Question mathematically corrected in MongoDB successfully!' : 'Flag dismissed.');
        setReports(prev => prev.filter(r => r._id !== reportId));
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (err) {
      setError('Connection failure updating question report');
      console.error(err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="reported-questions-page">
        <div className="page-header d-flex align-items-center">
          <button className="back-btn" onClick={() => navigate('/dashboard-school')}>
            <ArrowLeft size={18} /> Back
          </button>
          <h2>⚠️ Flagged Questions Review</h2>
        </div>

        {error && <div className="alert-box error">{error}</div>}
        {successMsg && <div className="alert-box success">{successMsg}</div>}

        <div className="reports-container">
          {loading ? (
            <div className="loading-reports">
              <div className="spinner"></div>
              <p>Loading reported questions...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="no-reports">
              <CheckCircle size={48} color="#10b981" />
              <p>All questions are clear! No reported errors.</p>
            </div>
          ) : (
            <div className="reports-table-wrapper">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Question ID / Expression</th>
                    <th>Reported By</th>
                    <th>Issue Category</th>
                    <th>Teacher Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report._id}>
                      <td className="question-cell">
                        <span className="q-id-badge">ID: {report.question?._id || 'Deleted'}</span>
                        <div className="q-preview-box">
                          {report.question ? renderQuestionText(report.question.question) : 'Question deleted'}
                        </div>
                        {report.question && (
                          <div style={{ marginTop: '8px', fontSize: '11px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                              Lvl {report.question.level}
                            </span>
                            {report.question.chapter?.chapterName && (
                              <span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }} title="Chapter">
                                📖 {report.question.chapter.chapterName}
                              </span>
                            )}
                            {report.question.chapter?.unit?.unitName && (
                              <span style={{ background: '#ecfdf5', color: '#065f46', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }} title="Unit">
                                🧩 {report.question.chapter.unit.unitName}
                              </span>
                            )}
                            {report.question.chapter?.unit?.subject?.subjectName && (
                              <span style={{ background: '#fff7ed', color: '#9a3412', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }} title="Subject">
                                📚 {report.question.chapter.unit.subject.subjectName}
                              </span>
                            )}
                          </div>
                        )}
                        {report.question?.questionPic && (
                          <div className="img-preview-row">
                            <img src={report.question.questionPic} alt="Question helper" className="mini-pic" />
                          </div>
                        )}
                      </td>
                      <td className="teacher-cell">
                        <div className="t-name">{report.reportedBy?.userName || 'Unknown'}</div>
                        <div className="t-email">{report.reportedBy?.email || 'N/A'}</div>
                      </td>
                      <td className="issue-cell">
                        <span className={`issue-badge ${report.issueType}`}>
                          {report.issueType === 'answer' ? '🔴 Wrong Answer' : '🟠 Wrong Skill'}
                        </span>
                      </td>
                      <td className="remarks-cell">
                        <p>{report.teacherComment || 'None'}</p>
                        <span className="timestamp-text">{new Date(report.createdAt).toLocaleString()}</span>
                      </td>
                      <td className="actions-cell">
                        {report.issueType === 'answer' && report.question && (
                          <button 
                            className="action-btn correct"
                            onClick={() => handleResolve(report._id, 'correct')}
                            title="Auto-Correct mathematically using backend evaluator"
                          >
                            <Cpu size={16} /> Auto-Correct
                          </button>
                        )}
                        <button 
                          className="action-btn dismiss"
                          onClick={() => handleResolve(report._id, 'dismiss')}
                          title="Dismiss report flag"
                        >
                          <Trash2 size={16} /> Dismiss
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ReportedQuestions;
