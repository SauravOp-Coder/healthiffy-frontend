\import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Coffee, ShoppingCart, Trash2, Plus, Minus, Star, Search, X, ChevronRight, Loader2, CheckCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const socket = io(API_URL, {
  transports: ['websocket', 'polling'],
  withCredentials: true
});

const CustomerMenu = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Payment States
  const [showQR, setShowQR] = useState(false); // Step 1: Show QR
  const [isVerifying, setIsVerifying] = useState(false); // Step 2: Waiting for Staff
  const [currentOrderId, setCurrentOrderId] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    if (!savedUser) navigate('/login');
    else {
      setUserData(savedUser);
      loadProducts();
    }
  }, [searchTerm, activeCategory]);

  useEffect(() => {
    if (currentOrderId) {
      const eventName = `payment-verified-${currentOrderId}`;
      socket.on(eventName, (data) => {
        setIsVerifying(false);
        navigate('/success', { 
          state: { orderId: currentOrderId, remainingCredits: data.remainingCredits } 
        });
      });
      return () => socket.off(eventName);
    }
  }, [currentOrderId, navigate]);

  const loadProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/products`, {
        params: { search: searchTerm, category: activeCategory }
      });
      setProducts(res.data);
    } catch (err) { console.error(err); }
  };

  const calculateTotal = () => {
    return cart.reduce((acc, item) => ({
      cash: acc.cash + (item.price * item.quantity),
      credits: acc.credits + (item.creditCost * item.quantity)
    }), { cash: 0, credits: 0 });
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item._id === product._id);
    if (existing) {
      setCart(cart.map(item => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setIsCartOpen(true);
  };

  // --- TRIGGER FLOW ---
  const handleCheckout = async (method) => {
    if (method === 'cash') {
        setShowQR(true); // Just show the QR first
        setIsCartOpen(false);
    } else {
        // Direct processing for credits
        confirmAndPlaceOrder('credits');
    }
  };

  // --- ACTUAL ORDER PLACEMENT ---
  const confirmAndPlaceOrder = async (method) => {
    const totals = calculateTotal();
    try {
        const orderData = {
            userId: userData._id,
            paymentMethod: method,
            cart: cart.map(item => ({ productId: item._id, quantity: item.quantity })),
            totalAmount: method === 'cash' ? totals.cash : totals.credits
        };
        
        const res = await axios.post(`${API_URL}/api/orders/place-order`, orderData);
        const newId = res.data.order._id;
        
        if (method === 'cash') {
            setCurrentOrderId(newId);
            setShowQR(false);
            setIsVerifying(true); // Now show the "Waiting for Staff" screen
        } else {
            navigate('/success', { state: { orderId: newId, remainingCredits: res.data.remainingCredits } });
        }
        setCart([]);
    } catch (err) {
        alert("Failed to place order. Please try again.");
    }
  };

  // --- QR OVERLAY (Step 1) ---
 const QRPrePayOverlay = () => {
    const totals = calculateTotal();
    const upiId = "8530912184@axl";
    const upiPayload = `upi://pay?pa=${upiId}&pn=Healthiffy%20Cafe&am=${totals.cash}&cu=INR`;

    return (
        <div style={verifyOverlay}>
            <div style={verifyCard}>
                <h2 style={verifyTitle}>Scan to Pay</h2>
                <p style={verifySubtitle}>Total: <b style={{fontSize: '1.2rem'}}>₹{totals.cash}</b></p>
                
                <div style={qrContainer}>
                    <QRCodeSVG value={upiPayload} size={220} level="H" />
                </div>

                {/* --- MOBILE INSTRUCTIONS TOOLTIP --- */}
                <div style={instructionBox}>
                    <p style={instructionHeader}>📱 Paying on this Phone?</p>
                    <ul style={instructionList}>
                        <li>Take a <b>Screenshot</b> of this QR.</li>
                        <li>Open GPay / PhonePe / Paytm.</li>
                        <li>Choose <b>'Scan QR'</b> then select <b>'Upload from Gallery'</b>.</li>
                    </ul>
                    <p style={{...instructionHeader, marginTop: '10px'}}>💻 Paying from Laptop?</p>
                    <p style={{fontSize: '0.75rem', margin: '4px 0'}}>Just scan the QR directly with your phone's camera.</p>
                </div>

                <button onClick={() => confirmAndPlaceOrder('cash')} style={confirmPaidBtn}>
                    <CheckCircle size={18} /> I Have Paid
                </button>
                <button onClick={() => setShowQR(false)} style={{...backBtn, width: '100%', marginTop: '10px'}}>
                    Cancel
                </button>
            </div>
        </div>
    );
  };

  return (
    <div style={container}>
      {/* STEP 1: SHOW QR FIRST */}
      {showQR && <QRPrePayOverlay />}

      {/* STEP 2: WAITING FOR STAFF */}
      {isVerifying && (
        <div style={verifyOverlay}>
          <div style={verifyCard}>
            <Loader2 size={50} className="spin-icon" color="#f39c12" />
            <h2 style={{margin: '20px 0 10px 0'}}>Verifying...</h2>
            <p style={{color: '#666'}}>Order sent to kitchen. Please wait for staff to confirm your payment.</p>
            <div style={orderRefTag}>Order ID: #{currentOrderId?.slice(-4)}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={headerStyle}>
        <div>
          <h1 style={logo}><Coffee size={28} /> Healthiffy</h1>
          <p style={welcomeText}>Welcome, <b>{userData?.name}</b></p>
        </div>
        <button onClick={() => setIsCartOpen(true)} style={cartBtn}>
            <ShoppingCart size={20} />
            {cart.length > 0 && <span style={cartBadge}>{cart.length}</span>}
        </button>
      </header>

      {/* Category Row */}
      <div style={categoryRow}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={activeCategory === cat ? activeTab : tabBtn}>{cat}</button>
        ))}
      </div>

      {/* Grid */}
      <div style={grid}>
        {products.map(item => (
          <div key={item._id} style={card}>
            <div style={imgContainer}><img src={item.image} alt={item.name} style={imgStyle} /></div>
            <div style={cardContent}>
                <h3 style={productTitle}>{item.name}</h3>
                <div style={priceContainer}>
                    <span style={cashPrice}>₹{item.price}</span>
                    <button onClick={() => addToCart(item)} style={addBtn}><Plus size={14}/> Add</button>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Cart */}
      {isCartOpen && (
        <>
          <div style={overlay} onClick={() => setIsCartOpen(false)} />
          <div style={sidebar}>
            <div style={sidebarHeader}>
                <h2 style={{margin:0}}>Basket</h2>
                <X onClick={() => setIsCartOpen(false)} style={{cursor:'pointer'}}/>
            </div>
            <div style={cartList}>
                {cart.map(item => (
                    <div key={item._id} style={cartItem}>
                        <div style={{flex:1}}>{item.name} x {item.quantity}</div>
                        <div>₹{item.price * item.quantity}</div>
                    </div>
                ))}
            </div>
            <div style={sidebarFooter}>
                <button onClick={() => handleCheckout('cash')} style={payNowBtn}>Pay via UPI</button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin-icon { animation: spin 2s linear infinite; }
      `}</style>
    </div>
  );
};

// --- STYLES ---
const container = { padding: '15px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const logo = { display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.5rem' };
const welcomeText = { margin: 0, fontSize: '0.8rem', color: '#666' };
const cartBtn = { position: 'relative', background: '#1a1a1a', color: 'white', border: 'none', padding: '10px', borderRadius: '12px' };
const cartBadge = { position: 'absolute', top: '-5px', right: '-5px', background: '#f39c12', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px' };
const categoryRow = { display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '5px' };
const tabBtn = { padding: '8px 16px', borderRadius: '10px', border: '1px solid #eee', background: 'white', whiteSpace: 'nowrap' };
const activeTab = { ...tabBtn, background: '#1a1a1a', color: 'white' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' };
const card = { background: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0', overflow: 'hidden' };
const imgContainer = { height: '140px' };
const imgStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const cardContent = { padding: '12px' };
const productTitle = { margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 'bold' };
const priceContainer = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const cashPrice = { fontWeight: 'bold' };
const addBtn = { background: '#f5f5f5', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' };
const overlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 1000 };
const sidebar = { position: 'fixed', right: 0, top: 0, width: '300px', height: '100%', background: 'white', zIndex: 1001, display: 'flex', flexDirection: 'column' };
const sidebarHeader = { padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' };
const cartList = { flexGrow: 1, padding: '20px', overflowY: 'auto' };
const cartItem = { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' };
const sidebarFooter = { padding: '20px', borderTop: '1px solid #eee' };
const payNowBtn = { width: '100%', background: '#1a1a1a', color: 'white', padding: '14px', borderRadius: '12px', fontWeight: 'bold', border: 'none' };

const verifyOverlay = { position: 'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(255,255,255,0.98)', zIndex: 2000, display:'flex', justifyContent:'center', alignItems:'center', textAlign:'center' };
const verifyCard = { padding: '20px', maxWidth: '350px', width: '90%' };
const verifyTitle = { fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 10px 0' };
const verifySubtitle = { color: '#666', marginBottom: '20px' };
const qrContainer = { background: 'white', padding: '15px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', marginBottom: '20px', display: 'inline-block' };
const upiDetailsBox = { background: '#f8fafc', padding: '15px', borderRadius: '12px', textAlign: 'left', marginBottom: '20px', border: '1px solid #e2e8f0' };
const confirmPaidBtn = { width: '100%', background: '#27ae60', color: 'white', padding: '15px', borderRadius: '12px', fontWeight: 'bold', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' };
const backBtn = { background: 'none', border: '1px solid #ccc', padding: '10px', borderRadius: '10px', color: '#666' };
const orderRefTag = { marginTop: '20px', padding: '8px', background: '#eee', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' };
const instructionBox = {
    background: '#fff9eb', // Light warning/info yellow
    border: '1px solid #ffeeba',
    padding: '12px',
    borderRadius: '12px',
    textAlign: 'left',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
};

const instructionHeader = {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#856404',
    margin: '0 0 5px 0'
};

const instructionList = {
    margin: 0,
    paddingLeft: '18px',
    fontSize: '0.75rem',
    color: '#856404',
    lineHeight: '1.4'
};
export default CustomerMenu;