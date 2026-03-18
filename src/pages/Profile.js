import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Mail, History, Star, Save, Calendar, Package, LogOut } from 'lucide-react';

// --- FIXED: Use Environment Variable ---
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', address: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    if (savedUser) {
      fetchUserData(savedUser._id);
      fetchUserOrders(savedUser._id);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchUserData = async (id) => {
    try {
      // FIXED: Swapped localhost for dynamic API_URL
      const res = await axios.get(`${API_URL}/api/users/${id}`);
      setUser(res.data);
      setFormData({ name: res.data.name, email: res.data.email, address: res.data.address });
    } catch (err) {
      console.error("Error fetching user", err);
    }
  };

  const fetchUserOrders = async (id) => {
    try {
      // FIXED: Swapped localhost for dynamic API_URL
      const res = await axios.get(`${API_URL}/api/orders/user/${id}`);
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders", err);
    }
  };

  const handleUpdate = async () => {
    try {
      // FIXED: Swapped localhost for dynamic API_URL
      const res = await axios.patch(`${API_URL}/api/users/${user._id}`, formData);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setEditMode(false);
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Update failed. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) return <div style={loadingStyle}>Gathering your data...</div>;

  return (
    <div style={container}>
      {/* Profile Header */}
      <section style={card}>
        <div style={profileHeader}>
          <div style={avatar}>{user.name ? user.name[0] : 'U'}</div>
          <div style={{ flex: 1 }}>
            <h2 style={{margin: 0}}>{user.name}</h2>
            <p style={{ color: '#f39c12', fontWeight: 'bold', margin: '5px 0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Star size={16} fill="#f39c12" /> {user.creditBalance} Credits Available
            </p>
          </div>
          <div style={buttonGroup}>
            <button onClick={() => setEditMode(!editMode)} style={editBtn}>
              {editMode ? 'Cancel' : 'Edit'}
            </button>
            <button onClick={handleLogout} style={logoutBtn}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {editMode ? (
          <div style={formGrid}>
            <input style={input} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Name" />
            <input style={input} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email" />
            <textarea style={{...input, gridColumn: 'span 2', minHeight: '80px'}} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Full Delivery Address" />
            <button onClick={handleUpdate} style={saveBtn}><Save size={18}/> Save Changes</button>
          </div>
        ) : (
          <div style={infoDisplay}>
            <p style={infoRow}><Mail size={16} color="#666"/> {user.email || 'No email added'}</p>
            <p style={infoRow}><MapPin size={16} color="#666"/> {user.address || 'No address added'}</p>
          </div>
        )}
      </section>

      {/* Order History */}
      <section style={{ marginTop: '40px' }}>
        <h3 style={sectionTitle}>
          <History size={22} /> Recent Orders
        </h3>
        
        {orders.length === 0 ? (
          <div style={emptyHistory}>
            <Package size={40} color="#ccc" />
            <p>You haven't placed any orders yet.</p>
          </div>
        ) : (
          orders.slice().reverse().map(order => (
            <div key={order._id} style={orderContainer}>
              <div style={orderTopBar}>
                <span><b>Ref:</b> #{order._id.slice(-6).toUpperCase()}</span>
                <span style={statusTag(order.status)}>{order.status}</span>
              </div>

              <div style={itemsList}>
                {order.items && order.items.map((item, idx) => (
                  <div key={idx} style={itemDetailRow}>
                    <div style={itemPrimaryText}>
                      {item.productId?.name || "Product"} 
                      <span style={qtyBadge}>x{item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={orderFooter}>
                <div style={dateStyle}>
                    <Calendar size={14} /> {new Date(order.createdAt).toLocaleDateString()}
                </div>
                <div style={totalText}>
                  {order.paymentMethod === 'credits' ? `${order.totalCredits} ⭐️` : `₹${order.totalAmount}`}
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

// --- STYLES ---
const container = { padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: '"Inter", sans-serif' };
const card = { background: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' };
const profileHeader = { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' };
const avatar = { width: '60px', height: '60px', borderRadius: '50%', background: '#1a1a1a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' };
const buttonGroup = { display: 'flex', gap: '8px' };
const editBtn = { background: '#f5f5f5', border: '1px solid #eee', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' };
const logoutBtn = { background: '#fee2e2', border: 'none', color: '#dc2626', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' };
const sectionTitle = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', fontSize: '1.2rem' };
const loadingStyle = { textAlign: 'center', marginTop: '100px', color: '#666' };
const dateStyle = { display: 'flex', alignItems: 'center', gap: '5px', color: '#888', fontSize: '0.85rem' };

// Status Colors Logic
const statusTag = (s) => {
  let bg = '#f39c12'; // Default: Pending/Preparing
  if (s === 'delivered' || s === 'ready') bg = '#27ae60';
  if (s === 'cancelled') bg = '#e74c3c';
  
  return { 
    fontSize: '0.7rem', 
    textTransform: 'uppercase', 
    padding: '4px 10px', 
    borderRadius: '20px', 
    background: bg, 
    color: 'white', 
    fontWeight: 'bold' 
  };
};
// --- RESPONSIVE PROFILE STYLES ---

const container = { 
  padding: '20px 15px', // Reduced from 40px for mobile
  maxWidth: '800px', 
  margin: '0 auto', 
  fontFamily: 'sans-serif',
  boxSizing: 'border-box'
};

const card = { 
  background: 'white', 
  padding: '20px', // Reduced from 30px
  borderRadius: '20px', 
  boxShadow: '0 10px 25px rgba(0,0,0,0.05)', 
  border: '1px solid #f0f0f0',
  boxSizing: 'border-box' 
};

const profileHeader = { 
  display: 'flex', 
  flexDirection: 'column', // Stack avatar and buttons on mobile
  alignItems: 'center', 
  gap: '15px', 
  marginBottom: '25px',
  textAlign: 'center'
};

const avatar = { 
  width: '80px', 
  height: '80px', 
  borderRadius: '50%', 
  background: '#2c3e50', 
  color: 'white', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  fontSize: '2rem', 
  fontWeight: 'bold',
  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
};

// Button Group for mobile (Horizontal scroll or stack)
const btnGroup = {
  display: 'flex',
  gap: '10px',
  width: '100%',
  justifyContent: 'center'
};

// Form Grid: Stacks to 1 column on mobile
const formGrid = { 
  display: 'grid', 
  gridTemplateColumns: '1fr', // Changed from 1fr 1fr to single column
  gap: '12px' 
};

const input = { 
  padding: '14px', // Taller for easier touch
  borderRadius: '10px', 
  border: '1px solid #eee', 
  background: '#f9f9f9', 
  fontSize: '1rem', // Prevents iOS zoom-in
  width: '100%',
  boxSizing: 'border-box'
};

const saveBtn = { 
  gridColumn: '1', // Reset from span 2
  background: '#27ae60', 
  color: 'white', 
  border: 'none', 
  padding: '14px', 
  borderRadius: '10px', 
  cursor: 'pointer', 
  fontWeight: 'bold', 
  display: 'flex', 
  justifyContent: 'center', 
  gap: '8px',
  fontSize: '1rem'
};

// Order History Improvements
const orderTopBar = { 
  padding: '12px 15px', 
  background: '#fcfcfc', 
  borderBottom: '1px solid #eee', 
  display: 'flex', 
  flexDirection: 'column', // Stack ID and Date on mobile
  alignItems: 'flex-start', 
  gap: '5px',
  fontSize: '0.85rem' 
};

const orderFooter = { 
  padding: '12px 15px', 
  background: '#fcfcfc', 
  borderTop: '1px solid #eee', 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center',
  flexWrap: 'wrap', // Allow status and total to wrap if needed
  gap: '10px'
};

const itemDetailRow = { 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  padding: '8px 0',
  borderBottom: '1px solid #f9f9f9'
};

const statusTag = (s) => ({ 
  fontSize: '0.7rem', 
  textTransform: 'uppercase', 
  padding: '5px 12px', 
  borderRadius: '20px', 
  background: s === 'completed' ? '#27ae60' : '#f39c12', 
  color: 'white', 
  fontWeight: 'bold',
  textAlign: 'center'
});
export default Profile;