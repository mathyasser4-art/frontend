import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api.config';
import Navbar from '../../components/navbar/Navbar';
import MobileNav from '../../components/mobileNav/MobileNav';
import { Users, User, UserCheck, Settings } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import '../../reusable.css';
import './DashboardSchool.css';

const LiveAdminDashboard = () => {
    const [stats, setStats] = useState({ totalVisitors: 0, users: [] });
    const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
    const [historyStats, setHistoryStats] = useState({ users: [] });
    const navigate = useNavigate();
    const role = localStorage.getItem('auth_role');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/live-stats`);
                const data = await res.json();
                if (data.success) {
                    setStats({ totalVisitors: data.totalVisitors, users: data.users });
                }
            } catch (err) {
                console.error("Failed to fetch live stats", err);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    // Fetch historical data when date changes
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/historical-stats?date=${historyDate}`);
                const data = await res.json();
                if (data.success) {
                    setHistoryStats({ users: data.users });
                }
            } catch (err) {
                console.error("Failed to fetch historical stats", err);
            }
        };
        fetchHistory();
    }, [historyDate]);

    // Group users by role
    const groupedUsers = stats.users.reduce((acc, user) => {
        if (!acc[user.role]) acc[user.role] = [];
        acc[user.role].push(user);
        return acc;
    }, {});

    const groupedHistoryUsers = historyStats.users.reduce((acc, user) => {
        if (!acc[user.role]) acc[user.role] = [];
        acc[user.role].push(user);
        return acc;
    }, {});

    const getRoleIcon = (userRole) => {
        if (userRole === 'Student') return <User style={{ color: '#3b82f6' }} />;
        if (userRole === 'Teacher') return <UserCheck style={{ color: '#10b981' }} />;
        if (userRole === 'School' || userRole === 'IT') return <Settings style={{ color: '#8b5cf6' }} />;
        return <Users style={{ color: '#64748b' }} />;
    };

    const exportPDF = () => {
        const element = document.getElementById('historical-visits-container');
        const opt = {
            margin:       0.5,
            filename:     `visitors-${historyDate}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    return (
        <>
            <MobileNav role={role} />
            <Navbar />
            <div className="dashboard-school" style={{ minHeight: '100vh', paddingBottom: '50px' }}>
                <div className="dashboard-school-header" style={{ position: 'relative' }}>
                    <button 
                        onClick={() => navigate('/dashboard-school')} 
                        style={{ position: 'absolute', top: '10px', left: '10px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}
                    >←</button>
                    <p className='text-purple'>Real-Time</p>
                    <p>Live Admin Dashboard</p>
                </div>
                
                <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
                    {/* Stats Overview */}
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '40px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', padding: '20px 40px', borderRadius: '15px', textAlign: 'center', minWidth: '200px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                            <h2 style={{ fontSize: '3rem', margin: '0' }}>{stats.totalVisitors}</h2>
                            <p style={{ margin: '10px 0 0 0', fontWeight: 'bold' }}>Active Connections</p>
                        </div>
                        <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '20px 40px', borderRadius: '15px', textAlign: 'center', minWidth: '200px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                            <h2 style={{ fontSize: '3rem', margin: '0' }}>{stats.users.filter(u => u.role !== 'Visitor').length}</h2>
                            <p style={{ margin: '10px 0 0 0', fontWeight: 'bold' }}>Logged-in Users</p>
                        </div>
                    </div>

                    {/* Users List */}
                    <div style={{ background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                        <h2 style={{ color: '#1e293b', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>Active Users Details</h2>
                        
                        {Object.keys(groupedUsers).map(roleKey => (
                            <div key={roleKey} style={{ marginBottom: '30px' }}>
                                <h3 style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {roleKey}s <span style={{ background: '#f1f5f9', padding: '2px 10px', borderRadius: '10px', fontSize: '14px' }}>{groupedUsers[roleKey].length}</span>
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                                    {groupedUsers[roleKey].map((user, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
                                            <div style={{ background: '#e0e7ff', padding: '10px', borderRadius: '50%' }}>
                                                {getRoleIcon(user.role)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{user.userName}</div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                    {user.role === 'Visitor' ? 'Anonymous Browser' : 'Authenticated'}
                                                </div>
                                            </div>
                                            <div style={{ marginLeft: 'auto', width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 5px #10b981' }}></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {stats.users.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                No active users at the moment.
                            </div>
                        )}
                    </div>

                    {/* Historical Daily Visits */}
                    <div id="historical-visits-container" style={{ background: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginTop: '40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                            <h2 style={{ color: '#1e293b', margin: 0 }}>Historical Daily Visits</h2>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input 
                                    type="date" 
                                    value={historyDate} 
                                    onChange={(e) => setHistoryDate(e.target.value)} 
                                    style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc' }}
                                />
                                <button 
                                    onClick={exportPDF}
                                    style={{ padding: '8px 15px', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Export PDF
                                </button>
                            </div>
                        </div>
                        
                        {Object.keys(groupedHistoryUsers).map(roleKey => (
                            <div key={roleKey} style={{ marginBottom: '30px' }}>
                                <h3 style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {roleKey}s <span style={{ background: '#f1f5f9', padding: '2px 10px', borderRadius: '10px', fontSize: '14px' }}>{groupedHistoryUsers[roleKey].length}</span>
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                                    {groupedHistoryUsers[roleKey].map((user, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
                                            <div style={{ background: '#e0e7ff', padding: '10px', borderRadius: '50%' }}>
                                                {getRoleIcon(user.role)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{user.userName}</div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                    Online: {user.firstSeen ? new Date(user.firstSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(user.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(user.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {historyStats.users.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                No logged visits found for this date.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default LiveAdminDashboard;
