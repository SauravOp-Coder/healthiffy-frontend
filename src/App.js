import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'; // Added Navigate
import { Coffee, User, CreditCard, LayoutDashboard, Utensils } from 'lucide-react';

// Page Imports
import LandingPage from './pages/LandingPage';
import CustomerMenu from './pages/CustomerMenu';
import AdminDashboard from './pages/AdminDashboard';
import StaffOrders from './pages/StaffOrders';
import Login from './pages/Login';
import OrderSuccess from './pages/OrderSuccess';
import Plans from './pages/Plans';
import Profile from './pages/Profile';
import Register from './pages/Register';

// --- FIXED PROTECTED ROUTE ---
const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) {
    // FIX: Using <Navigate /> instead of <Link /> ensures the user is actually redirected
    return <Navigate to="/login" replace />; 
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div style={{textAlign: 'center', marginTop: '50px'}}>
        <h1>Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return children;
};

function Layout({ children }) {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user')); 
  const role = user?.role;

  const hideNavbar = ['/', '/login', '/register'].includes(location.pathname);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fdfdfd' }}>
      {!hideNavbar && (
        <nav style={navStyle}>
          <div style={navContent}>
            <Link to="/order-now" style={logoStyle}>
              <Coffee size={24} /> <span>Healthiffy Cafe</span>
            </Link>
            
            <div style={linkGroup}>
              <Link style={linkStyle} to="/order-now"><Utensils size={18}/> Menu</Link>
              <Link style={linkStyle} to="/profile"><User size={18}/> Profile</Link>

              {role === 'customer' && (
                <Link style={linkStyle} to="/plans"><CreditCard size={18}/> Plans</Link>
              )}

              {(role === 'staff' || role === 'admin') && (
                <>
                  <div style={{ width: '1px', height: '20px', background: '#555', margin: '0 10px' }}></div>
                  <Link style={adminLinkStyle} to="/staff">Staff</Link>
                </>
              )}

              {role === 'admin' && (
                <Link style={adminLinkStyle} to="/admin"><LayoutDashboard size={18}/> Admin</Link>
              )}
              
              {/* Added a bit of styling to the Logout button to match the theme */}
              <button 
                style={logoutBtnStyle} 
                onClick={() => { localStorage.clear(); window.location.href='/login'; }}
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
      )}
      <div style={{ paddingTop: hideNavbar ? '0px' : '20px' }}>
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/order-now" element={<CustomerMenu />} />
          
          <Route path="/plans" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <Plans />
            </ProtectedRoute>
          } />
          
          <Route path="/staff" element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <StaffOrders />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/success" element={<OrderSuccess />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Layout>
    </Router>
  );
}

// --- RESPONSIVE NAVIGATION STYLES ---

const navStyle = { 
  background: '#1a1a1a', 
  color: 'white', 
  padding: '10px 15px', // Changed from 0 20px to give vertical breathing room
  position: 'sticky', 
  top: 0, 
  zIndex: 1000, 
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  width: '100%',
  boxSizing: 'border-box'
};

const navContent = { 
  maxWidth: '1200px', 
  margin: '0 auto', 
  // Removed fixed height: '70px' so it can grow if links wrap
  display: 'flex', 
  flexDirection: 'column', // Stack Logo and Links on very small screens
  alignItems: 'center',
  gap: '12px'
};

// On slightly larger mobile screens/Tablets, keep them side-by-side
// (You can achieve this by adding a media query or keeping it as a flex-wrap)
const logoStyle = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '8px', 
  color: '#f39c12', 
  textDecoration: 'none', 
  fontSize: '1.2rem', // Slightly smaller for mobile
  fontWeight: 'bold' 
};

const linkGroup = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '12px', // Tighter gap for mobile
  overflowX: 'auto', // Allows swiping links if they are too wide
  width: '100%',
  justifyContent: 'center',
  paddingBottom: '5px',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none' // Cleaner look
};

const linkStyle = { 
  color: '#ddd', 
  textDecoration: 'none', 
  fontSize: '0.85rem', // Smaller text for more links
  display: 'flex', 
  flexDirection: 'column', // Stack Icon over Text for a "Tab Bar" feel
  alignItems: 'center', 
  gap: '4px', 
  transition: '0.3s',
  minWidth: '60px', // Consistent touch area
  textAlign: 'center'
};

const adminLinkStyle = { 
  ...linkStyle, 
  color: '#f39c12', // Make it stand out slightly
  fontSize: '0.8rem',
  opacity: 0.8
};
const logoutBtnStyle = { 
  background: '#e74c3c', 
  color: 'white', 
  border: 'none', 
  padding: '8px 12px', 
  borderRadius: '8px', 
  cursor: 'pointer', 
  fontSize: '0.8rem',
  fontWeight: 'bold',
  marginLeft: 'auto', // Pushes it to the far right
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '80px', // Ensures it's easy to tap
  whiteSpace: 'nowrap' // Prevents the word "Logout" from splitting into two lines
};
export default App;