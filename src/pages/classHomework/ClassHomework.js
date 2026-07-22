import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import DashboardLoading from '../../components/dashboardLoading/DashboardLoading';
import getAssignmentByClass from '../../api/assignment/getAssignmentByClass.api';
import { ArrowLeft, Clock, Calendar, CheckCircle2, HelpCircle } from 'lucide-react';
import './ClassHomework.css';

function ClassHomework() {
    const { classID } = useParams();
    const [allAssignment, setAllAssignment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const role = localStorage.getItem('auth_role');

    useEffect(() => {
        getAssignmentByClass(setLoading, setAllAssignment, setError, classID);
    }, [classID]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <>
            <MobileNav role={role} />
            <Navbar />
            
            <div className="class-homework-container">
                <div className="homework-header">
                    <Link to="/dashboard-school/teacher" className="back-button">
                        <ArrowLeft size={20} /> Back to Teachers
                    </Link>
                    <h2>Class Homework Dashboard</h2>
                </div>

                {loading ? (
                    <DashboardLoading />
                ) : error ? (
                    <div className="error">{error}</div>
                ) : allAssignment.length === 0 ? (
                    <div className="empty-state">
                        <h3>No Assignments Found</h3>
                        <p>There are currently no assignments assigned to this class.</p>
                    </div>
                ) : (
                    <div className="assignments-grid">
                        {allAssignment.map((assignment) => (
                            <div key={assignment._id} className="assignment-card">
                                <h3>{assignment.title}</h3>
                                
                                <div className="assignment-details">
                                    <div className="detail-row">
                                        <CheckCircle2 className="detail-icon" />
                                        <span>Total Points: {assignment.totalPoints}</span>
                                    </div>
                                    <div className="detail-row">
                                        <HelpCircle className="detail-icon" />
                                        <span>Questions: {assignment.questions?.length || 0}</span>
                                    </div>
                                    <div className="detail-row">
                                        <Clock className="detail-icon" />
                                        <span>Time Limit: {assignment.timer ? `${assignment.timer} mins` : 'None'}</span>
                                    </div>

                                </div>

                                <Link 
                                    to={`/assignment/${assignment._id}/reports`} 
                                    className="view-reports-btn"
                                >
                                    View Student Reports
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default ClassHomework;
