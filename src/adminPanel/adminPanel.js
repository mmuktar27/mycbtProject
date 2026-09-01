import React, { useState } from 'react';
import { LayoutDashboard, Users,Key , FileText, Settings, Menu, X, LogOut, Bell, Search } from 'lucide-react';
import { 
  Container, Row, Col, Card, Button, Table, Form, InputGroup, Nav, Navbar, 
  Dropdown, Badge, ListGroup, Collapse, Alert 
} from 'react-bootstrap';
import { AdminActivationPanel } from '../activation/adminActivationPanel';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  // Sample data
  const stats = [
    { title: 'Total Users', value: '1,234', change: '+12%', variant: 'primary' },
    { title: 'Active Sessions', value: '856', change: '+8%', variant: 'success' },
    { title: 'Reports', value: '342', change: '-3%', variant: 'warning' },
    { title: 'Revenue', value: '$45.2K', change: '+18%', variant: 'purple' } // Note: 'purple' not standard—handled via bg class
  ];

  const recentUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active', joined: '2024-12-01' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Active', joined: '2024-12-02' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', status: 'Inactive', joined: '2024-12-03' },
    { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', status: 'Active', joined: '2024-12-04' }
  ];

  const menuItems = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, link: '/' },
    { id: 'users', name: 'Users', icon: Users },
     { id: 'activation', name: 'Activation', icon: Key  },
    { id: 'reports', name: 'Reports', icon: FileText },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];
const handleMenuClick = (item) => {
    if (item.link) {
      navigate(item.link);
    } else {
      setActiveTab(item.id);
    }
  };
  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return (
          <div className="mb-4">
            <Row className="g-4">
              {stats.map((stat, index) => (
                <Col key={index} md={6} lg={3}>
                  <Card className="shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <Card.Text className="text-muted mb-1">{stat.title}</Card.Text>
                          <h4 className="mb-1">{stat.value}</h4>
                          <small className={`text-${stat.change.startsWith('+') ? 'success' : 'danger'}`}>
                            {stat.change} from last month
                          </small>
                        </div>
                        <div 
                          className={`bg-${stat.variant === 'purple' ? 'purple' : stat.variant} opacity-25`}
                          style={{ width: '48px', height: '48px', borderRadius: '0.5rem' }}
                        ></div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            <Card className="shadow-sm mt-4">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Activity</h5>
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  {[1, 2, 3, 4].map((item) => (
                    <ListGroup.Item key={item} action className="d-flex align-items-center">
                      <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px' }}>
                        <span className="text-primary fw-bold">U</span>
                      </div>
                      <div>
                        <div className="fw-medium">New user registered</div>
                        <small className="text-muted">{item} hours ago</small>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </div>
        );

      case 'users':
        return (
          <Card className="shadow-sm">
            <Card.Header>
              <Card.Title className="mb-0">User Management</Card.Title>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((user) => (
                      <tr key={user.id} className="align-middle">
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-secondary bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '40px', height: '40px' }}>
                              <span className="fw-bold text-dark">{user.name[0]}</span>
                            </div>
                            {user.name}
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <Badge bg={user.status === 'Active' ? 'success' : 'secondary'}>{user.status}</Badge>
                        </td>
                        <td>{user.joined}</td>
                        <td className="text-end">
                          <Button variant="link" size="sm" className="text-primary p-0 me-2">Edit</Button>
                          <Button variant="link" size="sm" className="text-danger p-0">Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        );

      case 'reports':
        return (
          <Card className="shadow-sm">
            <Card.Header>
              <Card.Title className="mb-0">Reports</Card.Title>
            </Card.Header>
            <Card.Body>
              {['Monthly Report', 'User Analytics', 'Revenue Report', 'Performance Metrics'].map((report, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center p-3 border rounded mb-2">
                  <div className="d-flex align-items-center">
                    <FileText className="text-muted me-2" size={24} />
                    <div>
                      <div className="fw-medium">{report}</div>
                      <small className="text-muted">Generated on Dec {index + 1}, 2024</small>
                    </div>
                  </div>
                  <Button variant="primary" size="sm">Download</Button>
                </div>
              ))}
            </Card.Body>
          </Card>
        );
      case 'activation':
        return (
          <Card className="shadow-sm">
            <Card.Header>
              <Card.Title className="mb-0">Activations</Card.Title>
            </Card.Header>
            <Card.Body>
             <AdminActivationPanel />

            </Card.Body>
          </Card>
        );
      case 'settings':
        return (
          <Card className="shadow-sm">
            <Card.Header>
              <Card.Title className="mb-0">Settings</Card.Title>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Site Name</Form.Label>
                  <Form.Control type="text" defaultValue="Admin Panel" />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" defaultValue="admin@example.com" />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Timezone</Form.Label>
                  <Form.Select>
                    <option>UTC</option>
                    <option>EST</option>
                    <option>PST</option>
                    <option>GMT</option>
                  </Form.Select>
                </Form.Group>

                <div className="d-flex justify-content-between align-items-center py-2">
                  <div>
                    <Form.Label className="mb-0 fw-medium">Email Notifications</Form.Label>
                    <small className="text-muted d-block">Receive notifications via email</small>
                  </div>
                  <Form.Check type="switch" id="notification-switch" defaultChecked label="" />
                </div>

                <div className="d-grid mt-4">
                  <Button variant="primary">Save Changes</Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="d-flex vh-100 bg-light">
      {/* Sidebar */}
      <div 
        className={`bg-dark text-white ${sidebarOpen ? 'w-25' : 'w-20'} d-flex flex-column transition-all`}
        style={{ minWidth: sidebarOpen ? '260px' : '80px', transition: 'width 0.3s ease' }}
      >
        <div className="p-3 d-flex justify-content-between align-items-center border-bottom border-secondary">
          {sidebarOpen && <h5 className="mb-0 fw-bold">Admin Panel</h5>}
          <Button variant="link" className="text-white p-0" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        <Nav className="flex-column p-3 flex-grow-1">
          {menuItems.map((item) => (
            <Nav.Link
              key={item.id}
              onClick={() => handleMenuClick(item)}
              className={`d-flex align-items-center mb-2 rounded ${
                activeTab === item.id ? 'bg-primary' : 'text-white hover-bg-secondary'
              }`}
              style={{ textDecoration: 'none' }}
            >
              <item.icon size={20} className="me-2" />
              {sidebarOpen && <span>{item.name}</span>}
            </Nav.Link>
          ))}
        </Nav>

        <div className="p-3 border-top border-secondary">
          <Nav.Link 
            className="d-flex align-items-center text-white text-decoration-none"
            onClick={() => {/* handle logout */}}
          >
            <LogOut size={20} className="me-2" />
            {sidebarOpen && <span>Logout</span>}
          </Nav.Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
        {/* Header */}
        <Navbar bg="white" variant="light" className="shadow-sm">
          <Container fluid>
            <div className="d-flex align-items-center flex-grow-1" style={{ maxWidth: '500px' }}>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control type="text" placeholder="Search..." />
              </InputGroup>
            </div>

            <div className="d-flex align-items-center">
              <Button variant="link" className="position-relative text-dark p-2">
                <Bell size={20} />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.5em' }}>
                  •
                </span>
              </Button>

              <div className="d-flex align-items-center ms-3">
                <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '40px', height: '40px' }}>
                  <span className="text-white fw-bold">A</span>
                </div>
                <div>
                  <div className="fw-semibold">Admin User</div>
                  <small className="text-muted">Administrator</small>
                </div>
              </div>
            </div>
          </Container>
        </Navbar>

        {/* Page Content */}
        <main className="flex-grow-1 overflow-auto p-4">
          <Container fluid>
            {renderContent()}
          </Container>
        </main>
      </div>
    </div>
  );
}