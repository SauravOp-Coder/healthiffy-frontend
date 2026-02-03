import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import for logout navigation
import { User, MapPin, Mail, History, Star, Save, Calendar, Package, LogOut } from 'lucide-react';

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
    }
  }, []);

  const fetchUserData = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${id}`);
      setUser(res.data);
      setFormData({ name: res.data.name, email: res.data.email, address: res.data.address });
    } catch (err) {
      console.error("Error fetching user", err);
    }
  };

  const fetchUserOrders = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/orders/user/${id}`);
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders", err);
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await axios.patch(`http://localhost:5000/api/users/${user._id}`, formData);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setEditMode(false);
      alert("Profile updated!");
    } catch (err) {
      alert("Update failed.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login'); // Redirect to login page
  };

  if (!user) return <div style={{textAlign: 'center', marginTop: '50px'}}>Loading Profile...</div>;

  return (
    <div style={container}>
      {/* Profile Header */}
      <section style={card}>
        <div style={profileHeader}>
          <div style={avatar}>{user.name ? user.name[0] : 'U'}</div>
          <div style={{ flex: 1 }}>
            <h2 style={{margin: 0}}>{user.name}</h2>
            <p style={{ color: '#f39c12', fontWeight: 'bold', margin: '5px 0' }}>
                <Star size={16} fill="#f39c12" /> {user.creditBalance} Credits
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setEditMode(!editMode)} style={editBtn}>
              {editMode ? 'Cancel' : 'Edit Profile'}
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
            <textarea style={{...input, gridColumn: 'span 2', minHeight: '80px'}} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Delivery Address" />
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
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <History size={22} /> Your Order History
        </h3>
        
        {orders.length === 0 ? (
          <div style={emptyHistory}>
            <Package size={40} color="#ccc" />
            <p>No orders found.</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order._id} style={orderContainer}>
              <div style={orderTopBar}>
                <span><b>Order ID:</b> #{order._id.slice(-6).toUpperCase()}</span>
                <span style={statusTag(order.status)}>{order.status}</span>
              </div>

              <div style={itemsList}>
                {order.items && order.items.map((item, idx) => (
                  <div key={idx} style={itemDetailRow}>
                    <div style={{ flex: 1 }}>
                      <div style={itemPrimaryText}>
                        {item.product?.name || "Deleted Item"} 
                        <span style={qtyBadge}>x{item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={orderFooter}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#888', fontSize: '0.85rem' }}>
                    <Calendar size={14} /> {new Date(order.createdAt).toLocaleDateString()}
                </div>
                <div style={totalText}>
                  Total Paid: <span>
                    {order.paymentMethod === 'credits' ? `${order.totalCredits} ⭐️` : `₹${order.totalAmount}`}
                  </span>
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
const container = { padding: '40px 20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' };
const card = { background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' };
const profileHeader = { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px' };
const avatar = { width: '70px', height: '70px', borderRadius: '50%', background: '#2c3e50', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 'bold' };

const editBtn = { background: '#fff', border: '1px solid #ddd', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' };
const logoutBtn = { background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' };

const formGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
const input = { padding: '12px', borderRadius: '8px', border: '1px solid #eee', background: '#f9f9f9', fontSize: '0.95rem' };
const saveBtn = { gridColumn: 'span 2', background: '#27ae60', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '8px' };
const infoDisplay = { borderTop: '1px solid #f0f0f0', paddingTop: '20px' };
const infoRow = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#444' };

const orderContainer = { background: 'white', borderRadius: '15px', border: '1px solid #eee', marginBottom: '20px', overflow: 'hidden' };
const orderTopBar = { padding: '12px 20px', background: '#fcfcfc', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' };
const itemsList = { padding: '15px 20px' };
const itemDetailRow = { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' };
const itemPrimaryText = { fontWeight: '600', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px' };
const qtyBadge = { background: '#f0f0f0', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', color: '#555' };
const orderFooter = { padding: '12px 20px', background: '#fcfcfc', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const totalText = { fontWeight: 'bold', fontSize: '1rem' };
const statusTag = (s) => ({ fontSize: '0.7rem', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '20px', background: s === 'completed' ? '#27ae60' : '#f39c12', color: 'white', fontWeight: 'bold' });
const emptyHistory = { textAlign: 'center', padding: '50px', background: '#f9f9f9', borderRadius: '20px', color: '#999' };

export default Profile;