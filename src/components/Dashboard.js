import React from 'react';
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
  CalendarDays,     // for CalendarDays
  Loader2,          // for loading state
  AlertCircle       // for error state
} from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import './Dashboard.css';

const Dashboard = () => {
  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}/${currentYear + 1}`; // adjust if you pull this from school-settings instead

  const {
    isLoading,
    isError,
    stats,
    recentActivities,
    upcomingEvents
  } = useDashboardData(academicYear);

  const statCards = [
    {
      title: 'Total Students',
      value: (stats.totalStudents || 0).toLocaleString(),
      icon: <GraduationCap />,
      color: '#3b82f6',
      link: '/students'
    },
    {
      title: 'New Admissions',
      value: stats.newAdmissions || 0,
      icon: <UserPlus />,
      color: '#10b981',
      link: '/admission'
    },
    {
      title: 'Fee Collection',
      value: `₦${((stats.feeCollection || 0) / 1000000).toFixed(1)}M`,
      icon: <Banknote />,
      color: '#f59e0b',
      link: '/fees'
    },
    {
      title: 'Active CBT Exams',
      value: stats.activeExams || 0,
      icon: <Laptop />,
      color: '#8b5cf6',
      link: '/cbt'
    },
    {
      title: 'Pending Results',
      value: stats.pendingResults || 0,
      icon: <LineChart />,
      color: '#ef4444',
      link: '/results'
    },
    {
      title: 'Total Staff',
      value: stats.totalStaff || 0,
      icon: <Users />,
      color: '#06b6d4',
      link: '/staff'
    },
    {
      title: 'Attendance Today',
      value: `${stats.attendanceToday || 0}%`,
      icon: <ClipboardCheck />,
      color: '#84cc16',
      link: '/attendance'
    },
    {
      title: 'Pending Reports',
      value: stats.pendingReports || 0,
      icon: <FileText />,
      color: '#f97316',
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
      case 'student':
        return <GraduationCap className="activity-icon student" />;
      case 'attendance':
        return <ClipboardCheck className="activity-icon attendance" />;
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

  // Relative time for activity feed ("10 minutes ago") from an ISO timestamp
  const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  // Countdown label for events ("Today", "Tomorrow", "In 5 days") from an event's date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7 && diffDays > 0) return `In ${diffDays} days`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="dashboard-status">
        <Loader2 className="spin" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="dashboard-status">
        <AlertCircle />
        <p>Failed to load dashboard data. Please try refreshing the page.</p>
      </div>
    );
  }

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
                        {activity.amount && <span className="detail-amount">₦{Number(activity.amount).toLocaleString()}</span>}
                        {activity.class && <span className="detail-text">{activity.class}</span>}
                        {activity.exam && <span className="detail-text">{activity.exam}</span>}
                        {activity.staff && <span className="detail-text">{activity.staff}</span>}
                      </div>
                    </div>
                    <span className="activity-time">{formatRelativeTime(activity.time)}</span>
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
                      <span className="event-day">{new Date(event.eventDate).getDate()}</span>
                      <span className="event-month">
                        {new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </div>
                    <div className="event-content">
                      <h4 className="event-title">{event.title}</h4>
                      <p className="event-classes">{event.classes}</p>
                      <span className="event-countdown">{formatDate(event.eventDate)}</span>
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
};

export default Dashboard;