import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, ChefHat, Timer, ShoppingBag, MapPin, X, CheckCircle, AlertCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const socket = io(API_URL, {
  transports: ['websocket', 'polling'],
  withCredentials: true
});

const StaffOrders = () => {
  const [orders, setOrders] = useState([]); // Real orders from DB
  const [pendingClaims, setPendingClaims] = useState([]); // Temporary Socket claims
  const [currentTime, setCurrentTime] = useState(new Date());
  const [customerLocations, setCustomerLocations] = useState({}); 
  const [activeTracking, setActiveTracking] = useState(null); 

  const loadOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders`);
      setOrders(res.data);
      
      const savedLocations = {};
      res.data.forEach(order => {
        if (order.location?.lat) {
          savedLocations[order._id] = { 
            lat: order.location.lat, 
            lng: order.location.lng,
            savedAt: order.location.updatedAt 
          };
        }
      });
      setCustomerLocations(prev => ({ ...savedLocations, ...prev }));
    } catch (err) { console.error("Load Orders Error:", err); }
  };

  useEffect(() => {
    loadOrders();
    
    // LISTEN FOR NEW PAYMENT CLAIMS (CASH/UPI)
    socket.on('new-payment-request', (data) => {
      setPendingClaims(prev => {
        // Prevent duplicate claims for the same user
        if (prev.find(c => c.userId === data.userId)) return prev;
        return [...prev, data];
      });
    });

    socket.on('location-received', (data) => {
      setCustomerLocations(prev => ({
        ...prev,
        [data.orderId]: { lat: data.lat, lng: data.lng, isLive: true }
      }));
    });

    const interval = setInterval(loadOrders, 10000); 
    const timeClock = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { 
      clearInterval(interval); 
      clearInterval(timeClock);
      socket.off('new-payment-request');
      socket.off('location-received');
    };
  }, []);

  // NEW: VERIFY AND CREATE THE ORDER
  const handleApproveClaim = (claim) => {
    // This sends the data to the backend to finally .save() the order
    socket.emit('staff-approve-order', {
      userId: claim.userId,
      cart: claim.cart,
      total: claim.total
    });

    // Remove from local "Pending Claims" list
    setPendingClaims(prev => prev.filter(c => c.userId !== claim.userId));
    
    // Wait a second for DB to save, then refresh
    setTimeout(loadOrders, 1000);
    alert(`Order for ${claim.userName} verified and placed!`);
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(`${API_URL}/api/orders/${orderId}/status`, { status: newStatus });
      loadOrders();
    } catch (err) { alert("Failed to update status"); }
  };

  function RecenterMap({ coords }) {
    const map = useMap();
    useEffect(() => { if(coords) map.setView([coords.lat, coords.lng]); }, [coords, map]);
    return null;
  }

  return (
    <div style={kdsContainer}>
      <header style={kdsHeader}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
            <div style={logoIcon}><ChefHat size={24} color="#fff" /></div>
            <div>
                <h1 style={brandName}>Healthiffy <span style={{fontWeight:300}}>Kitchen</span></h1>
                <p style={liveStatus}><span style={pulseDot}></span> Live Feed</p>
            </div>
        </div>
        <div style={timeDisplay}><Clock size={20} /> <b>{currentTime.toLocaleTimeString()}</b></div>
      </header>

      <div style={kdsGrid}>
        {/* SECTION 1: PENDING PAYMENT CLAIMS (NOT YET IN DB) */}
        {pendingClaims.map((claim, index) => (
          <div key={`claim-${index}`} style={{...orderCard, border: '2px solid #F39C12', backgroundColor: '#FFF9F0'}}>
             <div style={cardHeader}>
                <div>
                    <span style={{...orderNumber, color: '#F39C12'}}>PAYMENT CLAIM</span>
                    <div style={methodTag}>WAITING FOR VERIFICATION</div>
                </div>
                <div style={claimUserTag}>{claim.userName}</div>
             </div>
             <div style={itemContent}>
                {claim.cart.map((item, idx) => (
                  <div key={idx} style={itemRow}>
                    <div style={qtyBox}>{item.quantity}</div>
                    <span style={itemName}>{item.name}</span>
                  </div>
                ))}
             </div>
             <div style={cardAction}>
                <button onClick={() => handleApproveClaim(claim)} style={verifyBtn}>
                    <CheckCircle size={18} /> Verify & Place Order (₹{claim.total})
                </button>
             </div>
          </div>
        ))}

        {/* SECTION 2: ACTIVE ORDERS (ALREADY IN DB) */}
        {orders.filter(o => o.status !== 'delivered').map(order => {
          const locationData = customerLocations[order._id];
          return (
            <div key={order._id} style={orderCard}>
              <div style={cardHeader}>
                <div>
                    <span style={orderNumber}>#{order._id.slice(-4)}</span>
                    <div style={methodTag}>{order.paymentMethod?.toUpperCase()}</div>
                </div>
                {locationData && (
                  <button 
                    onClick={() => setActiveTracking(order._id)} 
                    style={{...trackBtn, backgroundColor: locationData.isLive ? '#E7F9ED' : '#EBF5FF'}}
                  >
                    <MapPin size={14} color={locationData.isLive ? '#27ae60' : '#007AFF'} /> 
                    {locationData.isLive ? 'Live Now' : 'Last Seen'}
                  </button>
                )}
              </div>
              
              <div style={itemContent}>
                {order.items.map((item, idx) => (
                  <div key={idx} style={itemRow}>
                    <div style={qtyBox}>{item.quantity}</div>
                    <span style={itemName}>{item.product?.name || "Product"}</span>
                  </div>
                ))}
              </div>

              <div style={cardAction}>
                {order.status === 'Paid' || order.status === 'pending' ? (
                   <button onClick={() => updateStatus(order._id, 'preparing')} style={prepBtn}>Start Preparing</button>
                ) : null}
                {order.status === 'preparing' && (
                   <button onClick={() => updateStatus(order._id, 'ready')} style={readyBtn}>Set as Ready</button>
                )}
                {order.status === 'ready' && (
                   <button onClick={() => updateStatus(order._id, 'delivered')} style={deliveredBtn}><ShoppingBag size={18} /> Complete</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MAP MODAL */}
      {activeTracking && customerLocations[activeTracking] && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={modalHeader}>
              <div>
                <h3 style={{margin:0}}>Tracking Order #{activeTracking.slice(-4)}</h3>
                <small style={{color: '#666'}}>
                  {customerLocations[activeTracking].isLive ? "🟢 Signal Live" : "⚪ Last Known Position"}
                </small>
              </div>
              <X cursor="pointer" onClick={() => setActiveTracking(null)} />
            </div>
            <div style={{ height: '400px', width: '100%', borderRadius: '15px', overflow: 'hidden', border: '1px solid #eee' }}>
              <MapContainer 
                center={[customerLocations[activeTracking].lat, customerLocations[activeTracking].lng]} 
                zoom={16} 
                style={{height: '100%', width: '100%'}}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{y}.png" />
                <Marker position={[customerLocations[activeTracking].lat, customerLocations[activeTracking].lng]}>
                  <Popup>Customer Location</Popup>
                </Marker>
                <RecenterMap coords={customerLocations[activeTracking]} />
              </MapContainer>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(39, 174, 96, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(39, 174, 96, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(39, 174, 96, 0); }
        }
      `}</style>
    </div>
  );
};

// Styles
const claimUserTag = { background: '#F39C12', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' };
const methodTag = { fontSize: '0.7rem', fontWeight: 'bold', color: '#666', marginTop: '4px' };
const verifyBtn = { width: '100%', padding: '16px', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', backgroundColor: '#F39C12', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' };
const trackBtn = { display: 'flex', alignItems: 'center', gap: '5px', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem', transition: '0.2s' };
const modalOverlay = { position: 'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex: 1000, backdropFilter: 'blur(4px)' };
const modalContent = { backgroundColor:'#fff', padding:'24px', borderRadius:'24px', width:'90%', maxWidth:'650px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' };
const modalHeader = { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' };
const kdsContainer = { padding: '30px', backgroundColor: '#F8F9FA', minHeight: '100vh', fontFamily: '"Inter", sans-serif' };
const kdsHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' };
const logoIcon = { background: '#27ae60', padding: '10px', borderRadius: '12px', display: 'flex' };
const brandName = { margin: 0, fontSize: '1.8rem', color: '#1A1A1A', letterSpacing: '-0.5px' };
const liveStatus = { margin: 0, fontSize: '0.85rem', color: '#666', display: 'flex', alignItems: 'center', gap: '5px' };
const pulseDot = { width: '8px', height: '8px', background: '#27ae60', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' };
const timeDisplay = { display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', padding: '10px 20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const kdsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' };
const orderCard = { backgroundColor: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid #E9ECEF', display: 'flex', flexDirection: 'column' };
const cardHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' };
const orderNumber = { fontSize: '1.5rem', fontWeight: '800', color: '#1A1A1A' };
const itemContent = { flex: 1, marginBottom: '25px' };
const itemRow = { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px' };
const qtyBox = { width: '32px', height: '32px', backgroundColor: '#F8F9FA', border: '1px solid #DEE2E6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' };
const itemName = { fontSize: '1.05rem', fontWeight: '500', color: '#495057' };
const cardAction = { marginTop: 'auto' };
const baseBtn = { width: '100%', padding: '16px', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer' };
const prepBtn = { ...baseBtn, backgroundColor: '#1A1A1A', color: '#fff' };
const readyBtn = { ...baseBtn, backgroundColor: '#F39C12', color: '#fff' };
const deliveredBtn = { ...baseBtn, backgroundColor: '#27ae60', color: '#fff' };

export default StaffOrders;