import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
     // Replace 'your-backend' with your actual Render service name
await axios.post('https://healthiffy-backend.onrender.com/api/users/register', formData);
      alert("Registration Successful! Please Login.");
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div style={containerStyle}>
      <div style={registerBox}>
        <UserPlus size={40} color="#27ae60" style={{ marginBottom: '10px' }} />
        <h2 style={{ margin: '0 0 10px 0' }}>Create Account</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>Join the Healthiffy Community</p>
        
        <form onSubmit={handleRegister} style={formStyle}>
          <input 
            style={inputStyle} 
            type="text" 
            placeholder="Full Name" 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            required 
          />
          <input 
            style={inputStyle} 
            type="email" 
            placeholder="Email Address" 
            onChange={e => setFormData({...formData, email: e.target.value})} 
            required 
          />
          <input 
            style={inputStyle} 
            type="text" 
            placeholder="Phone Number" 
            onChange={e => setFormData({...formData, phone: e.target.value})} 
            required 
          />
          <input 
            style={inputStyle} 
            type="password" 
            placeholder="Create Password" 
            onChange={e => setFormData({...formData, password: e.target.value})} 
            required 
          />
          <button type="submit" style={btnStyle}>Sign Up</button>
        </form>
        
        <p style={{ marginTop: '20px', fontSize: '0.9rem' }}>
          Already have an account? <span 
            style={{ color: '#27ae60', cursor: 'pointer', fontWeight: 'bold' }} 
            onClick={() => navigate('/login')}
          >Login</span>
        </p>
      </div>
    </div>
  );
};

// --- STYLES (This fixes your undefined errors) ---
const containerStyle = { 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  height: '100vh', 
  backgroundColor: '#f8f9fa' 
};

const registerBox = { 
  backgroundColor: '#fff', 
  padding: '40px', 
  borderRadius: '20px', 
  boxShadow: '0 15px 35px rgba(0,0,0,0.1)', 
  textAlign: 'center', 
  width: '380px' 
};

const formStyle = { 
  display: 'flex', 
  flexDirection: 'column', 
  gap: '15px' 
};

const inputStyle = { 
  padding: '12px', 
  borderRadius: '10px', 
  border: '1px solid #ddd', 
  fontSize: '1rem',
  outline: 'none'
};

const btnStyle = { 
  background: '#1a1a1a', 
  color: 'white', 
  border: 'none', 
  padding: '14px', 
  borderRadius: '10px', 
  cursor: 'pointer', 
  fontWeight: 'bold',
  fontSize: '1rem',
  marginTop: '10px'
};

// --- EXPORT (This fixes your 'Register not found' error) ---
export default Register;