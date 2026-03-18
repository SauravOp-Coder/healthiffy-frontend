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

// --- UPDATED RESPONSIVE STYLES ---
const container = { 
  padding: '15px', 
  maxWidth: '800px', 
  margin: '0 auto', 
  fontFamily: '"Inter", sans-serif',
  boxSizing: 'border-box' // Added to prevent horizontal overflow
};

const card = { 
  background: 'white', 
  padding: '20px', 
  borderRadius: '20px', 
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
  border: '1px solid #f0f0f0' 
};

const profileHeader = { 
  display: 'flex', 
  alignItems: 'center', 
  gap: '15px', 
  marginBottom: '25px', 
  flexWrap: 'wrap', // Allows buttons to wrap below the name on small phones
  justifyContent: 'center' // Centers everything on mobile
};

const avatar = { 
  width: '70px', 
  height: '70px', 
  borderRadius: '50%', 
  background: '#1a1a1a', 
  color: 'white', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  fontSize: '1.8rem', 
  fontWeight: 'bold' 
};

const buttonGroup = { 
  display: 'flex', 
  gap: '10px', 
  width: '100%', 
  justifyContent: 'center' 
};

const editBtn = { 
  background: '#f5f5f5', 
  border: '1px solid #eee', 
  padding: '10px 20px', 
  borderRadius: '12px', 
  cursor: 'pointer', 
  fontWeight: '600',
  flex: 1 // Makes buttons equal width on mobile
};

const logoutBtn = { 
  background: '#fee2e2', 
  border: 'none', 
  color: '#dc2626', 
  padding: '10px 20px', 
  borderRadius: '12px', 
  cursor: 'pointer', 
  fontWeight: '600', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  gap: '5px',
  flex: 1 // Makes buttons equal width on mobile
};

// Form: Stacks to 1 column for easier mobile typing
const formGrid = { 
  display: 'flex', 
  flexDirection: 'column', 
  gap: '12px' 
};

const input = { 
  padding: '14px', 
  borderRadius: '10px', 
  border: '1px solid #eee', 
  background: '#f9f9f9', 
  fontSize: '1rem', // 16px font prevents auto-zoom on iPhones
  width: '100%',
  boxSizing: 'border-box'
};

const saveBtn = { 
  background: '#1a1a1a', 
  color: 'white', 
  border: 'none', 
  padding: '16px', 
  borderRadius: '12px', 
  cursor: 'pointer', 
  fontWeight: 'bold', 
  display: 'flex', 
  justifyContent: 'center', 
  gap: '8px',
  fontSize: '1rem'
};

const infoDisplay = { borderTop: '1px solid #f0f0f0', paddingTop: '20px' };
const infoRow = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', color: '#444', fontSize: '0.95rem' };

const orderContainer = { background: 'white', borderRadius: '15px', border: '1px solid #eee', marginBottom: '15px', overflow: 'hidden' };
const orderTopBar = { padding: '12px 15px', background: '#fcfcfc', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' };
const itemsList = { padding: '15px' };
const itemDetailRow = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' };
const itemPrimaryText = { fontWeight: '600', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' };
const qtyBadge = { background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', color: '#555' };
const orderFooter = { padding: '12px 15px', background: '#fcfcfc', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const totalText = { fontWeight: 'bold', fontSize: '1rem' };
const sectionTitle = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', fontSize: '1.2rem', fontWeight: '800' };
const loadingStyle = { textAlign: 'center', marginTop: '100px', color: '#666', fontFamily: 'sans-serif' };
const dateStyle = { display: 'flex', alignItems: 'center', gap: '5px', color: '#888', fontSize: '0.8rem' };
const emptyHistory = { textAlign: 'center', padding: '50px', background: '#f9f9f9', borderRadius: '20px', color: '#999' };

const statusTag = (s) => {
  let bg = '#f39c12';
  if (s === 'delivered' || s === 'ready') bg = '#27ae60';
  if (s === 'cancelled') bg = '#e74c3c';
  return { fontSize: '0.65rem', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '20px', background: bg, color: 'white', fontWeight: 'bold' };
};
export default Profile;