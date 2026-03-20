import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, ChefHat, Timer, ShoppingBag, MapPin, X, CheckCircle, Bell } from 'lucide-react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Leaflet setup
const markerIcon = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const markerShadow = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";
let DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const socket = io(API_URL);

const StaffOrders = () => {
  const [orders, setOrders] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [customerLocations, setCustomerLocations] = useState({}); 
  const [activeTracking, setActiveTracking] = useState(null); 

  const loadOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders`);
      setOrders(res.data);
      
      const savedLocations = {};
      res.data.forEach(order => {
        if (order.location && order.location.lat) {
          savedLocations[order._id] = { 
            lat: order.location.lat, 
            lng: order.location.lng,
            savedAt: order.location.updatedAt 
          };
        }
      });
      setCustomerLocations(prev => ({ ...savedLocations, ...prev }));
    } catch (err) { console.error("Error loading orders:", err); }
  };

  useEffect(() => {
    loadOrders();
    
    // 1. Listen for LIVE order placement
    socket.on('new-order-received', (newOrder) => {
      setOrders(prev => [newOrder, ...prev]);
      // Optional: Play a notification sound here
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log("Audio play blocked"));
    });

    // 2. Listen for Location updates
    socket.on('location-received', (data) => {
      setCustomerLocations(prev => ({
        ...prev,
        [data.orderId]: { lat: data.lat, lng: data.lng, isLive: true }
      }));
    });

    const timeClock = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { 
      socket.off('new-order-received');
      socket.off('location-received');
      clearInterval(timeClock);
    };
  }, []);

  // --- Payment Verification Logic ---
  const verifyPayment = async (orderId) => {
    try {
      // We update status to 'preparing'. 
      // Our backend route (router.patch('/:id/status')) handles the Socket emit to the customer.
      await axios.patch(`${API_URL}/api/orders/${orderId}/status`, { status: 'preparing' });
      
      alert("Payment Verified! Customer is being redirected now.");
      loadOrders(); // Refresh list
    } catch (err) {
      alert("Failed to verify payment");
    }
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
                <p style={liveStatus}><span style={pulseDot}></span> System Live</p>
            </div>
        </div>
        <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
            <div style={timeDisplay}><Clock size={20} /> <b>{currentTime.toLocaleTimeString()}</b></div>
        </div>
      </header>

      <div style={kdsGrid}>
        {orders.filter(o => o.status !== 'delivered').map(order => {
          const locationData = customerLocations[order._id];
          const isUPI = order.paymentMethod === 'cash';

          return (
            <div key={order._id} style={{
                ...orderCard, 
                borderLeft: order.status === 'pending' && isUPI ? '8px solid #F39C12' : '1px solid #E9ECEF'
            }}>
              <div style={cardHeader}>
                <div>
                    <span style={orderNumber}>#{order._id.slice(-4)}</span>
                    <div style={{...methodTag, color: isUPI ? '#F39C12' : '#666'}}>
                        {isUPI ? '⚠️ UNPAID UPI' : '✅ CREDITS PAID'}
                    </div>
                </div>
                {locationData && (
                  <button 
                    onClick={() => setActiveTracking(order._id)} 
                    style={{...trackBtn, backgroundColor: locationData.isLive ? '#E7F9ED' : '#EBF5FF'}}
                  >
                    <MapPin size={14} color={locationData.isLive ? '#27ae60' : '#007AFF'} /> 
                    {locationData.isLive ? 'Live' : 'Last Location'}
                  </button>
                )}
              </div>
              
              <div style={itemContent}>
                {order.items.map((item, idx) => (
                  <div key={idx} style={itemRow}>
                    <div style={qtyBox}>{item.quantity}</div>
                    <span style={itemName}>{item.product?.name || "Product Removed"}</span>
                  </div>
                ))}
              </div>

              <div style={cardAction}>
                {order.status === 'pending' && isUPI ? (
                    <button onClick={() => verifyPayment(order._id)} style={verifyBtn}>
                        <CheckCircle size={18} /> Confirm Payment Received
                    </button>
                ) : (
                    <>
                        {order.status === 'pending' && <button onClick={() => updateStatus(order._id, 'preparing')} style={prepBtn}>Start Cooking</button>}
                        {order.status === 'preparing' && <button onClick={() => updateStatus(order._id, 'ready')} style={readyBtn}>Mark as Ready</button>}
                        {order.status === 'ready' && <button onClick={() => updateStatus(order._id, 'delivered')} style={deliveredBtn}><ShoppingBag size={18} /> Hand Over</button>}
                    </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TRACKING MODAL */}
      {activeTracking && customerLocations[activeTracking] && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={modalHeader}>
              <div>
                <h3 style={{margin:0}}>Location Tracking: #{activeTracking.slice(-4)}</h3>
                <p style={{margin:0, fontSize: '0.8rem', color: customerLocations[activeTracking].isLive ? '#27ae60' : '#666'}}>
                  {customerLocations[activeTracking].isLive ? "Receiving real-time coordinates..." : "Offline - showing last known position"}
                </p>
              </div>
              <X size={24} cursor="pointer" onClick={() => setActiveTracking(null)} />
            </div>
            <div style={{ height: '400px', width: '100%', borderRadius: '15px', overflow: 'hidden' }}>
              <MapContainer 
                center={[customerLocations[activeTracking].lat, customerLocations[activeTracking].lng]} 
                zoom={17} 
                style={{height: '100%', width: '100%'}}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[customerLocations[activeTracking].lat, customerLocations[activeTracking].lng]}>
                  <Popup>Customer is here</Popup>
                </Marker>
                <RecenterMap coords={customerLocations[activeTracking]} />
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- STYLES ---
const kdsContainer = { padding: '25px', backgroundColor: '#F4F7F6', minHeight: '100vh', fontFamily: '"Inter", sans-serif' };
const kdsHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const logoIcon = { background: '#1A1A1A', padding: '10px', borderRadius: '12px' };
const brandName = { margin: 0, fontSize: '1.6rem', color: '#1A1A1A' };
const liveStatus = { margin: 0, fontSize: '0.8rem', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' };
const pulseDot = { width: '8px', height: '8px', background: '#27ae60', borderRadius: '50%', animation: 'pulse 1.5s infinite' };
const timeDisplay = { display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '8px 16px', borderRadius: '10px', border: '1px solid #eee' };
const kdsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' };
const orderCard = { backgroundColor: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', transition: '0.3s' };
const cardHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' };
const orderNumber = { fontSize: '1.4rem', fontWeight: '900' };
const methodTag = { fontSize: '0.75rem', fontWeight: 'bold', marginTop: '4px' };
const itemContent = { flex: 1, marginBottom: '20px' };
const itemRow = { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' };
const qtyBox = { width: '28px', height: '28px', backgroundColor: '#f0f0f0', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem' };
const itemName = { fontSize: '1rem', color: '#333', fontWeight: '500' };
const cardAction = { marginTop: 'auto' };
const baseBtn = { width: '100%', padding: '14px', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' };
const verifyBtn = { ...baseBtn, backgroundColor: '#F39C12', color: '#fff' };
const prepBtn = { ...baseBtn, backgroundColor: '#1A1A1A', color: '#fff' };
const readyBtn = { ...baseBtn, backgroundColor: '#6C5CE7', color: '#fff' };
const deliveredBtn = { ...baseBtn, backgroundColor: '#27ae60', color: '#fff' };
const trackBtn = { display: 'flex', alignItems: 'center', gap: '4px', border: 'none', padding: '5px 10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.7rem' };
const modalOverlay = { position: 'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.7)', display:'flex', justifyContent:'center', alignItems:'center', zIndex: 2000 };
const modalContent = { backgroundColor:'#fff', padding:'20px', borderRadius:'20px', width:'90%', maxWidth:'600px' };
const modalHeader = { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px' };

export default StaffOrders;