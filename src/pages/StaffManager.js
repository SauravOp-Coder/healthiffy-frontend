import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Trash2, ShieldCheck, Mail, Phone } from 'lucide-react';

const StaffManager = () => {
  const [staff, setStaff] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });

  // 1. Load Staff List
  const fetchStaff = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users/staff-list');
      setStaff(res.data);
    } catch (err) {
      console.error("Error fetching staff");
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  // 2. Add New Staff
  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/users/add-staff', formData);
      alert("Staff Added!");
      setFormData({ name: '', email: '', phone: '', password: '' });
      fetchStaff(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || "Error adding staff");
    }
  };

  // 3. Delete Staff
  const handleDelete = async (id) => {
    if (window.confirm("Remove this staff member?")) {
      try {
        await axios.delete(`http://localhost:5000/api/users/staff/${id}`);
        fetchStaff();
      } catch (err) {
        alert("Delete failed");
      }
    }
  };

  return (
    <div style={container}>
      <h2 style={title}><ShieldCheck size={28} color="#27ae60" /> Staff Management</h2>
      
      {/* ADD STAFF FORM */}
      <div style={formCard}>
        <h3>Add New Staff Member</h3>
        <form onSubmit={handleAddStaff} style={formStyle}>
          <input style={input} type="text" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          <input style={input} type="email" placeholder="Email (Login ID)" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
          <input style={input} type="text" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
          <input style={input} type="password" placeholder="Set Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
          <button type="submit" style={addBtn}><UserPlus size={18} /> Create Account</button>
        </form>
      </div>

      {/* STAFF LIST TABLE */}
      <div style={tableCard}>
        <h3>Current Staff Team</h3>
        <table style={table}>
          <thead>
            <tr style={thRow}>
              <th style={th}>Name</th>
              <th style={th}>Email</th>
              <th style={th}>Phone</th>
              <th style={th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(member => (
              <tr key={member._id} style={tr}>
                <td style={td}><b>{member.name}</b></td>
                <td style={td}>{member.email}</td>
                <td style={td}>{member.phone}</td>
                <td style={td}>
                  <button onClick={() => handleDelete(member._id)} style={delBtn}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- STYLES ---
const container = { padding: '40px', backgroundColor: '#f9f9f9', minHeight: '100vh', fontFamily: 'Inter, sans-serif' };
const title = { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.8rem', marginBottom: '30px' };
const formCard = { background: '#fff', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px' };
const formStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '15px', alignItems: 'center' };
const input = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem' };
const addBtn = { background: '#1a1a1a', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' };

const tableCard = { background: '#fff', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' };
const table = { width: '100%', borderCollapse: 'collapse', marginTop: '15px' };
const thRow = { textAlign: 'left', borderBottom: '2px solid #eee' };
const th = { padding: '15px', color: '#666', fontWeight: '600' };
const td = { padding: '15px', borderBottom: '1px solid #f0f0f0' };
const tr = { transition: '0.2s' };
const delBtn = { background: '#fff0f0', color: '#e74c3c', border: '1px solid #ffcccc', padding: '8px', borderRadius: '6px', cursor: 'pointer' };

export default StaffManager;