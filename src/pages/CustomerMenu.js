import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Coffee, ShoppingCart, Trash2, Plus, Minus, Star, Search, X, ChevronRight, Loader2 } from 'lucide-react';
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
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  
  const navigate = useNavigate();
  const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

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

  const handleCheckout = async (method) => {
    const totals = calculateTotal();
    if (method === 'cash' && !isMobile()) {
        alert("🔒 Please use a mobile device for UPI.");
        return;
    }
    try {
        const orderData = {
            userId: userData._id,
            paymentMethod: method,
            cart: cart.map(item => ({ productId: item._id, quantity: item.quantity })),
            totalAmount: method === 'cash' ? totals.cash : totals.credits
        };
        
        const res = await axios.post(`${API_URL}/api/orders/place-order`, orderData);
        setCurrentOrderId(res.data.order._id);
        
        if (method === 'cash') {
            setIsVerifying(true);
        } else {
            navigate('/success', { state: { orderId: res.data.order._id, remainingCredits: res.data.remainingCredits } });
        }
        setCart([]);
        setIsCartOpen(false);
    } catch (err) { alert("System busy. Try again."); }
  };

  // --- INTERNAL COMPONENT TO FIX THE "DULL COLOR" ERROR ---
  const VerificationOverlay = () => {
    const totals = calculateTotal();
    const shortId = currentOrderId?.slice(-4);
    // Use your verified UPI ID here
    const upiId = "atharvashetage@oksbi";
    const upiPayload = `upi://pay?pa=${upiId}&pn=Healthiffy%20Cafe&am=${totals.cash}&tn=Order_${shortId}&cu=INR`;

    return (
      <div style={verifyOverlay}>
        <div style={verifyCard}>
          <h2 style={verifyTitle}>Scan or Tap to Pay</h2>
          <p style={verifySubtitle}>Total: <b>₹{totals.cash}</b></p>
          
          <div 
            onClick={() => window.location.href = upiPayload} 
            style={{...qrContainer, cursor: 'pointer'}}
          >
            <QRCodeSVG value={upiPayload} size={200} level="H" />
            <p style={{fontSize: '0.7rem', color: '#27ae60', marginTop: '10px', fontWeight: 'bold'}}>
               📱 TAP TO OPEN GPAY / PHONEPE
            </p>
          </div>

          <div style={upiDetailsBox}>
            <p style={{margin: '0', fontSize: '0.85rem', color: '#555'}}>
              <b>Order: #{shortId}</b><br/>
              Pay manually if the app doesn't open.
            </p>
          </div>

          <button onClick={() => setIsVerifying(false)} style={backBtn}>Cancel</button>
        </div>
      </div>
    );
  };

  return (
    <div style={container}>
      {isVerifying && <VerificationOverlay />}
      
      <header style={headerStyle}>
        <h1 style={logo}><Coffee size={28} /> Healthiffy</h1>
        <button onClick={() => setIsCartOpen(true)} style={cartBtn}>
          <ShoppingCart size={20} />
          {cart.length > 0 && <span style={cartBadge}>{cart.length}</span>}
        </button>
      </header>

      {/* Category Tabs */}
      <div style={categoryRow}>
        {["All","COFFEE", "SALAD BOWLS", "SANDWICH"].map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={activeCategory === cat ? activeTab : tabBtn}>{cat}</button>
        ))}
      </div>

      {/* Grid */}
      <div style={grid}>
        {products.map(item => (
          <div key={item._id} style={card}>
            <img src={item.image} alt={item.name} style={imgStyle} />
            <div style={cardContent}>
              <h3 style={productTitle}>{item.name}</h3>
              <div style={priceContainer}>
                <span>₹{item.price}</span>
                <button onClick={() => addToCart(item)} style={addBtn}>Add</button>
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
            <div style={sidebarHeader}><h2>Basket</h2><X onClick={() => setIsCartOpen(false)} /></div>
            <div style={cartList}>
                {cart.map(item => <div key={item._id}>{item.name} x {item.quantity}</div>)}
            </div>
            <div style={sidebarFooter}>
                <button onClick={() => handleCheckout('cash')} style={payNowBtn}>Pay via UPI</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// --- STYLES ---
const container = { padding: '15px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const logo = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.5rem' };
const cartBtn = { position: 'relative', background: '#1a1a1a', color: 'white', border: 'none', padding: '10px', borderRadius: '12px' };
const cartBadge = { position: 'absolute', top: '-5px', right: '-5px', background: '#f39c12', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem' };
const categoryRow = { display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px' };
const tabBtn = { padding: '8px 16px', borderRadius: '10px', border: '1px solid #eee', background: 'white' };
const activeTab = { ...tabBtn, background: '#1a1a1a', color: 'white' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' };
const card = { background: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0', overflow: 'hidden' };
const imgStyle = { width: '100%', height: '140px', objectFit: 'cover' };
const cardContent = { padding: '12px' };
const productTitle = { margin: '0 0 8px 0', fontSize: '1rem' };
const priceContainer = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const addBtn = { background: '#f5f5f5', border: 'none', padding: '5px 10px', borderRadius: '8px' };
const overlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 1000 };
const sidebar = { position: 'fixed', right: 0, top: 0, width: '300px', height: '100%', background: 'white', zIndex: 1001, display: 'flex', flexDirection: 'column' };
const sidebarHeader = { padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' };
const cartList = { flexGrow: 1, padding: '20px' };
const sidebarFooter = { padding: '20px', borderTop: '1px solid #eee' };
const payNowBtn = { width: '100%', background: '#1a1a1a', color: 'white', padding: '14px', borderRadius: '12px', fontWeight: 'bold' };
const verifyOverlay = { position: 'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(255,255,255,0.98)', zIndex: 2000, display:'flex', justifyContent:'center', alignItems:'center', textAlign:'center' };
const verifyCard = { padding: '40px', maxWidth: '350px' };
const verifyTitle = { fontSize: '1.5rem', fontWeight: '800', marginBottom: '10px' };
const verifySubtitle = { fontSize: '0.9rem', color: '#666', marginBottom: '20px' };
const qrContainer = { background: 'white', padding: '15px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', marginBottom: '20px' };
const upiDetailsBox = { background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' };
const backBtn = { background: 'none', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: '10px', fontWeight: '600', color: '#64748b' };

export default CustomerMenu;