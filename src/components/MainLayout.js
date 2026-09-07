import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu,             // for Menu
  X,                // for X
  GraduationCap,    // for GraduationCap
  UserPlus,         // for UserPlus
  Banknote,         // for Banknote
  LineChart,        // for LineChart
  FileText,         // for FileText
  Laptop,           // for Laptop
  Users,            // for Users
  ClipboardCheck,   // for ClipboardCheck
  BarChart3,        // for BarChart3
  Database,         // for Database
  Home,             // for Home
  ChevronDown,      // for ChevronDown
  ChevronRight      // for ChevronRight
} from 'lucide-react';
import './MainLayout.css';

const MainLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleSubmenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const menuItems = [
    {
      key: 'dashboard',
      title: 'Dashboard',
      icon: <Home size={20} />,
      path: '/maindashboard',
      badge: null
    },
    {
      key: 'students',
      title: 'Student Management',
      icon: <GraduationCap size={20} />,
      path: '/students',
      badge: null,
      submenu: [
        { title: 'All Students', path: '/students/all' },
        { title: 'Bulk Import', path: '/students/import' }
      ]
    },
    {
      key: 'admission',
      title: 'Admission Processing',
      icon: <UserPlus size={20} />,
      path: '/admission',
      badge: null,
      submenu: [
        { title: 'New Applications', path: '/admission/new' },
        { title: 'Pending Review', path: '/admission/pending' },
        { title: 'Approved', path: '/admission/approved' },
        { title: 'Rejected', path: '/admission/rejected' }
      ]
    },
    {
      key: 'fees',
      title: 'Fee Collection & Receipts',
      icon: <Banknote size={20}/>,
      path: '/fees',
      badge: null,
      submenu: [
        { title: 'Collect Fees', path: '/fees/collect' },
        { title: 'Fee Structure', path: '/fees/structure' },
        { title: 'Payment History', path: '/fees/history' },
        { title: 'Defaulters', path: '/fees/defaulters' }
      ]
    },
    {
      key: 'results',
      title: 'Result Management',
      icon: <LineChart size={20}/>,
      path: '/results',
      badge: null,
      submenu: [
        { title: 'Enter Results (CA)', path: '/results/ca' },
        { title: 'Enter Results (Exam)', path: '/results/exam' },
        { title: 'View Results', path: '/results/view' },
        { title: 'Approve Results', path: '/results/approve' }
      ]
    },
    {
      key: 'reportcards',
      title: 'Report Card Generation',
      icon: <FileText size={20}/>,
      path: '/reportcards',
      badge: null,
      submenu: [
        { title: 'Generate Report Cards', path: '/reportcards/generate' }
      ]
    },
    {
      key: 'cbt',
      title: 'CBT Exams',
      icon: <Laptop size={20}/>,
      path: '/cbt',
      badge: null,
      submenu: [
        { title: 'Create Exam', path: '/schoolcbt/create' },
        { title: 'Active Exams', path: '/schoolcbt/active' },
        { title: 'Exam Results', path: '/schoolcbt/results' },
        { title: 'Question Bank', path: '/schoolcbt/questions' }
      ]
    },
    {
      key: 'staff',
      title: 'Staff Management',
      icon: <Users size={20}/>,
      path: '/staff',
      badge: null,
      submenu: [
        { title: 'All Staff', path: '/staff/all' },
        { title: 'Add Staff', path: '/staff/add' },
        { title: 'Departments', path: '/staff/departments' }
      ]
    },
    {
      key: 'attendance',
      title: 'Attendance Tracking',
      icon: <ClipboardCheck size={20}/>,
      path: '/attendance',
      badge: null,
      submenu: [
        { title: 'Mark Attendance', path: '/attendance/mark' },
        { title: 'View Attendance', path: '/attendance/view' },
        { title: 'Attendance Reports', path: '/attendance/reports' }
      ]
    },
    {
      key: 'reports',
      title: 'Basic Reports',
      icon: <BarChart3 size={20}/>,
      path: '/reports',
      badge: null,
      submenu: [
        { title: 'Student Reports', path: '/reports/students' },
        { title: 'Financial Reports', path: '/reports/financial' },
        { title: 'Academic Reports', path: '/reports/academic' },
        { title: 'Staff Reports', path: '/reports/staff' },
        { title: 'Attendance Reports', path: '/reports/attendance' }
      ]
    },
    {
      key: 'backup',
      title: 'Data Backup/Restore',
      icon: <Database size={20}/>,
      path: '/backup',
      badge: null,
      submenu: [
        { title: 'Create Backup', path: '/backup/create' },
        { title: 'Restore Data', path: '/backup/restore' },
        { title: 'Backup History', path: '/backup/history' },
        { title: 'Settings', path: '/backup/settings' }
      ]
    },
    {
      key: 'schoolmanagement',
      title: 'School Management',
      icon: <Home size={20}/>,
      path: '/school-management',
      badge: null
    }
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="main-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          {!sidebarCollapsed && (
            <div className="logo-container">
              <img src="/resources/logo.png" alt="Logo" className="sidebar-logo" />
              <h3 className="app-title">School Manager</h3>
            </div>
          )}
          <button className="toggle-btn" onClick={toggleSidebar}>
           {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        {/* Sidebar Menu */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {menuItems.map((item) => (
              <li key={item.key} className="nav-item">
                {item.submenu ? (
                  // Items WITH submenu
                  <>
                    <div
                      className={`nav-link ${isActive(item.path) ? 'active' : ''} has-submenu`}
                      style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
                      onClick={() => toggleSubmenu(item.key)}
                    >
                        <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, flexShrink: 0 }}>
{item.icon}</span>
                       {!sidebarCollapsed && (
    <>
      <span className="nav-text" style={{ flex: 1, textAlign: 'left' }}>{item.title}</span>
      <span className="submenu-arrow" style={{ flexShrink: 0 }}>
        {expandedMenus[item.key] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </span>
    </>
  )}
                      {item.badge && !sidebarCollapsed && (
                        <span className="nav-badge">{item.badge}</span>
                      )}
                    </div>

                    {/* Submenu */}
                    {expandedMenus[item.key] && !sidebarCollapsed && (
                      <ul className="submenu">
                        {item.submenu.map((subitem, index) => (
                          <li key={index} className="submenu-item">
                            <Link
                              to={subitem.path}
                              className={`submenu-link ${isActive(subitem.path) ? 'active' : ''}`}
                            >
                              <span className="submenu-text">{subitem.title}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  // Items WITHOUT submenu
                  // no-submenu branch
<Link
  to={item.path}
  className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
  style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
>
  <span className="nav-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, flexShrink: 0 }}>
    {item.icon}
  </span>
  {!sidebarCollapsed && (
    <>
      <span className="nav-text" style={{ flex: 1, textAlign: 'left' }}>{item.title}</span>
      {item.badge && <span className="nav-badge">{item.badge}</span>}
    </>
  )}
</Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="sidebar-footer">
            <div className="user-info">
              <div className="user-avatar">
                <GraduationCap />
              </div>
              <div className="user-details">
                <p className="user-name">Admin User</p>
                <p className="user-role">Administrator</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <h2 className="page-title">School Management System</h2>
          </div>
          <div className="header-right">
            <div className="header-actions">
              <button className="header-btn">
                <i className="fas fa-bell"></i>
                <span className="notification-badge">3</span>
              </button>
              <button className="header-btn">
                <i className="fas fa-cog"></i>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;