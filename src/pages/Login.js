import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // 1. Call the new login API
    // Replace 'your-backend' with your actual Render service name
const res = await axios.post('https://healthiffy-backend.onrender.com/api/users/login', { email, password });
      
      const userData = res.data; // This should now include { role, name, email, etc. }
      
      // 2. Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', userData.role);

      // 3. SMART REDIRECTION based on Role
      if (userData.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (userData.role === 'staff') {
        navigate('/staff/kitchen');
      } else {
        navigate('/order-now'); // Standard customer portal
      }

    } catch (err) {
      alert("Login failed. Please check your credentials.");
    }
  };

  return (
    <div style={loginContainer}>
      <div style={loginBox}>
        <div style={iconCircle}><Lock size={24} color="#27ae60" /></div>
        <h2 style={title}>Welcome Back</h2>
        <p style={subtitle}>Sign in to your Healthiffy account</p>
        
        <form onSubmit={handleLogin} style={formStyle}>
          <div style={inputGroup}>
            <label style={label}>Email Address</label>
            <input 
              style={inputStyle}
              type="email" 
              placeholder="name@company.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div style={inputGroup}>
            <label style={label}>Password</label>
            <input 
              style={inputStyle}
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" style={btnStyle}>Sign In</button>
        </form>
        
        <p style={footerText}>
          Don't have an account? <span style={linkText} onClick={() => navigate('/register')}>Sign Up</span>
        </p>
      </div>
    </div>
  );
};

// --- STYLES ---
const loginContainer = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F8F9FA' };
const loginBox = { backgroundColor: '#fff', padding: '50px 40px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', textAlign: 'center', width: '400px', border: '1px solid #E9ECEF' };
const iconCircle = { background: '#E7F9ED', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' };
const title = { fontSize: '1.8rem', fontWeight: '800', margin: '0 0 10px', color: '#1A1A1A' };
const subtitle = { color: '#666', fontSize: '0.9rem', marginBottom: '30px' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '20px' };
const inputGroup = { textAlign: 'left' };
const label = { fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', display: 'block', color: '#444' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #DEE2E6', fontSize: '1rem', boxSizing: 'border-box', outline: 'none' };
const btnStyle = { background: '#1A1A1A', color: 'white', border: 'none', padding: '16px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', marginTop: '10px' };
const footerText = { marginTop: '25px', fontSize: '0.9rem', color: '#666' };
const linkText = { color: '#27ae60', fontWeight: 'bold', cursor: 'pointer' };

export default Login;