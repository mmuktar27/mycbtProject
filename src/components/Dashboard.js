import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap,    // for GraduationCap
  UserPlus,         // for UserPlus
  Banknote,         // for Banknote
  LineChart,        // for LineChart
  FileText,         // for FileText
  Laptop,           // for Laptop
  Users,            // for Users
  ClipboardCheck,   // for ClipboardCheck
  ArrowUp,          // for ArrowUp
  ArrowDown,        // for ArrowDown
  CalendarDays,     // for CalendarDays
  TriangleAlert     // for FaExclamationTriangle
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 1250,
    newAdmissions: 45,
    feeCollection: 3250000,
    pendingResults: 23,
    activeExams: 5,
    totalStaff: 85,
    attendanceToday: 92.5,
    pendingReports: 12
  });

  const [recentActivities, setRecentActivities] = useState([
    {
      id: 1,
      type: 'admission',
      message: 'New admission application received',
      student: 'John Doe',
      time: '10 minutes ago'
    },
    {
      id: 2,
      type: 'fee',
      message: 'Fee payment received',
      student: 'Jane Smith',
      amount: 45000,
      time: '25 minutes ago'
    },
    {
      id: 3,
      type: 'result',
      message: 'Results submitted for approval',
      class: 'SS3 Mathematics',
      time: '1 hour ago'
    },
    {
      id: 4,
      type: 'exam',
      message: 'CBT exam completed',
      exam: 'Mid-term Physics',
      time: '2 hours ago'
    },
    {
      id: 5,
      type: 'staff',
      message: 'New staff member added',
      staff: 'Mr. Williams',
      time: '3 hours ago'
    }
  ]);

  const [upcomingEvents, setUpcomingEvents] = useState([
    {
      id: 1,
      title: 'Mid-term Examinations',
      date: '2026-02-10',
      type: 'exam',
      classes: 'All Classes'
    },
    {
      id: 2,
      title: 'Fee Payment Deadline',
      date: '2026-02-15',
      type: 'fee',
      classes: 'All Students'
    },
    {
      id: 3,
      title: 'Report Card Distribution',
      date: '2026-02-20',
      type: 'report',
      classes: 'All Classes'
    },
    {
      id: 4,
      title: 'Parent-Teacher Meeting',
      date: '2026-02-25',
      type: 'meeting',
      classes: 'All Classes'
    }
  ]);

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents.toLocaleString(),
      icon: <GraduationCap />,
      color: '#3b82f6',
      change: '+5.2%',
      trend: 'up',
      link: '/students'
    },
    {
      title: 'New Admissions',
      value: stats.newAdmissions,
      icon: <UserPlus />,
      color: '#10b981',
      change: '+12',
      trend: 'up',
      link: '/admission'
    },
    {
      title: 'Fee Collection',
      value: `₦${(stats.feeCollection / 1000000).toFixed(1)}M`,
      icon: <Banknote />,
      color: '#f59e0b',
      change: '+8.5%',
      trend: 'up',
      link: '/fees'
    },
    {
      title: 'Active CBT Exams',
      value: stats.activeExams,
      icon: <Laptop />,
      color: '#8b5cf6',
      change: '2 ongoing',
      trend: 'neutral',
      link: '/cbt'
    },
    {
      title: 'Pending Results',
      value: stats.pendingResults,
      icon: <LineChart />,
      color: '#ef4444',
      change: 'Need approval',
      trend: 'warning',
      link: '/results'
    },
    {
      title: 'Total Staff',
      value: stats.totalStaff,
      icon: <Users />,
      color: '#06b6d4',
      change: '+3',
      trend: 'up',
      link: '/staff'
    },
    {
      title: 'Attendance Today',
      value: `${stats.attendanceToday}%`,
      icon: <ClipboardCheck />,
      color: '#84cc16',
      change: '+2.3%',
      trend: 'up',
      link: '/attendance'
    },
    {
      title: 'Pending Reports',
      value: stats.pendingReports,
      icon: <FileText />,
      color: '#f97316',
      change: 'To generate',
      trend: 'warning',
      link: '/reportcards'
    }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'admission':
        return <UserPlus className="activity-icon admission" />;
      case 'fee':
        return <Banknote className="activity-icon fee" />;
      case 'result':
        return <LineChart className="activity-icon result" />;
      case 'exam':
        return <Laptop className="activity-icon exam" />;
      case 'staff':
        return <Users className="activity-icon staff" />;
      default:
        return null;
    }
  };

  const getEventTypeClass = (type) => {
    const typeMap = {
      exam: 'event-exam',
      fee: 'event-fee',
      report: 'event-report',
      meeting: 'event-meeting'
    };
    return typeMap[type] || '';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h1>Welcome Back, Admin! 👋</h1>
          <p>Here's what's happening with your school today</p>
        </div>
        <div className="date-info">
          <CalendarDays />
          <span>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((card, index) => (
          <Link to={card.link} key={index} className="stat-card-link">
            <div className="stat-card" style={{ '--card-color': card.color }}>
              <div className="stat-header">
                <div className="stat-icon-wrapper">
                  {card.icon}
                </div>
                <div className="stat-trend">
                  {card.trend === 'up' && <ArrowUp className="trend-up" />}
                  {card.trend === 'down' && <ArrowDown className="trend-down" />}
                  {card.trend === 'warning' && <TriangleAlert className="trend-warning" />}
                  <span className={`trend-text ${card.trend}`}>{card.change}</span>
                </div>
              </div>
              <div className="stat-body">
                <h3 className="stat-value">{card.value}</h3>
                <p className="stat-title">{card.title}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="dashboard-grid">
        {/* Recent Activities */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Recent Activities</h2>
            <Link to="/reports" className="view-all-link">View All</Link>
          </div>
          <div className="card-body">
            {recentActivities.length === 0 ? (
              <div className="empty-state">
                <p>No recent activities</p>
              </div>
            ) : (
              <div className="activities-list">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    {getActivityIcon(activity.type)}
                    <div className="activity-content">
                      <p className="activity-message">{activity.message}</p>
                      <div className="activity-details">
                        {activity.student && <span className="detail-text">{activity.student}</span>}
                        {activity.amount && <span className="detail-amount">₦{activity.amount.toLocaleString()}</span>}
                        {activity.class && <span className="detail-text">{activity.class}</span>}
                        {activity.exam && <span className="detail-text">{activity.exam}</span>}
                        {activity.staff && <span className="detail-text">{activity.staff}</span>}
                      </div>
                    </div>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Upcoming Events</h2>
            <Link to="/reports" className="view-all-link">View All</Link>
          </div>
          <div className="card-body">
            {upcomingEvents.length === 0 ? (
              <div className="empty-state">
                <p>No upcoming events</p>
              </div>
            ) : (
              <div className="events-list">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className={`event-item ${getEventTypeClass(event.type)}`}>
                    <div className="event-date">
                      <span className="event-day">{new Date(event.date).getDate()}</span>
                      <span className="event-month">
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </div>
                    <div className="event-content">
                      <h4 className="event-title">{event.title}</h4>
                      <p className="event-classes">{event.classes}</p>
                      <span className="event-countdown">{formatDate(event.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/students/add" className="action-button">
            <UserPlus />
            <span>Add Student</span>
          </Link>
          <Link to="/fees/collect" className="action-button">
            <Banknote />
            <span>Collect Fee</span>
          </Link>
          <Link to="/results/enter" className="action-button">
            <LineChart />
            <span>Enter Results</span>
          </Link>
          <Link to="/cbt/create" className="action-button">
            <Laptop />
            <span>Create Exam</span>
          </Link>
          <Link to="/reportcards/generate" className="action-button">
            <FileText />
            <span>Generate Report</span>
          </Link>
          <Link to="/attendance/mark" className="action-button">
            <ClipboardCheck />
            <span>Mark Attendance</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
export default Dashboard;