import React, { useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, MapPin } from 'lucide-react';
import { io } from 'socket.io-client';

// --- FIXED: Consistent API URL & Socket transports ---
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const socket = io(API_URL, {
  transports: ['websocket', 'polling'],
  withCredentials: true
});

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, remainingCredits } = location.state || {};
  
  useEffect(() => {
    // 1. URL Security Check
    if (!orderId) {
      navigate('/');
      return;
    }

    // 2. PC Security Check (Optional: You can comment this out during testing)
    if (!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      console.warn("PC detected. Tracking might be less accurate than mobile.");
    }

    // 3. Real-time tracking logic
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // FIXED: Use current socket connection
          socket.emit('update-location', {
            orderId: orderId,
            lat: latitude,
            lng: longitude,
            customerName: "Customer"
          });
          console.log("📍 Live Location Sync Active:", latitude, longitude);
        },
        (error) => console.error("GPS Error:", error),
        { 
          enableHighAccuracy: true, 
          timeout: 5000, 
          maximumAge: 0 
        }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [orderId, navigate]);

  const cafeWhatsAppNumber = "919503766769"; 
  const message = `Hi! I just placed Order #${orderId?.slice(-4)}. I am currently tracking my location for the delivery staff.`;
  const waLink = `https://wa.me/${cafeWhatsAppNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <CheckCircle size={60} color="#27ae60" />
        <h1 style={{ color: '#27ae60', margin: '15px 0' }}>Payment Verified!</h1>
        <p style={{ color: '#666', lineHeight: '1.4' }}>
          Your order is now being prepared. Our staff can see your live location for seamless delivery.
        </p>
        
        <div style={infoBox}>
          <p style={infoText}>Order Reference: <b>#{orderId?.slice(-4)}</b></p>
          <p style={infoText}>Remaining Credits: <b>⭐️ {remainingCredits ?? 'N/A'}</b></p>
          <div style={liveBadge}>
            <span style={pulseDot}></span> Live Tracking Active
          </div>
        </div>
        
        <a href={waLink} target="_blank" rel="noreferrer" style={waBtnStyle}>
          <MapPin size={18} /> Chat with Kitchen
        </a>

        <Link to="/" style={backLink}>Return to Home</Link>
      </div>

      {/* FIXED: Added Pulse Animation */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 1; }
          70% { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(0.95); opacity: 0; }
        }
        .pulse-active {
          position: relative;
        }
        .pulse-active::after {
          content: '';
          position: absolute;
          width: 8px;
          height: 8px;
          background: #27ae60;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
};

// --- STYLES ---
const containerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#fcfcfc', padding: '20px' };
const cardStyle = { background: 'white', padding: '40px', borderRadius: '24px', textAlign: 'center', width: '100%', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', border: '1px solid #eee' };
const infoBox = { backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '16px', margin: '25px 0', border: '1px solid #eee' };
const infoText = { margin: '8px 0', fontSize: '0.95rem' };
const liveBadge = { marginTop: '15px', color: '#27ae60', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };
const pulseDot = { width: '8px', height: '8px', background: '#27ae60', borderRadius: '50%', display: 'inline-block', position: 'relative', zIndex: 2 };
const waBtnStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#25D366', color: 'white', padding: '16px', borderRadius: '14px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.95rem' };
const backLink = { marginTop: '20px', display: 'block', color: '#999', textDecoration: 'none', fontSize: '0.9rem' };

export default OrderSuccess;