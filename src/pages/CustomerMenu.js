import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Coffee, ShoppingCart, Trash2, Plus, Minus, CreditCard, Star, Search, X, ChevronRight, Loader2, Smartphone, Monitor } from 'lucide-react';
import { io } from 'socket.io-client';
import { QRCodeCanvas } from 'qrcode.react'; // Import for PC QR Code

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const socket = io(API_URL);

const CustomerMenu = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [userData, setUserData] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false); // New state for PC QR
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [upiLink, setUpiLink] = useState('');
  
  const navigate = useNavigate();

  // Helper to detect Mobile
  const isMobileDevice = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    if (!savedUser) navigate('/login');
    else {
      setUserData(savedUser);
      loadProducts();
    }
  }, [navigate, searchTerm, activeCategory]);

  // Listen for Staff Approval via Socket
  useEffect(() => {
    if (currentOrderId) {
      socket.on(`payment-verified-${currentOrderId}`, (data) => {
        setIsVerifying(false);
        setShowQRCode(false);
        navigate('/success', { 
          state: { orderId: currentOrderId, method: 'upi' } 
        });
      });
    }
    return () => {
      if(currentOrderId) socket.off(`payment-verified-${currentOrderId}`);
    };
  }, [currentOrderId, navigate]);

  const loadProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/products`, {
        params: { search: searchTerm, category: activeCategory }
      });
      setProducts(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const categories = ["All","COFFEE", "SALAD BOWLS", "SANDWICH", "SMOOTHIES", "FRESH FRUITS & JUICE"];

  const addToCart = (product) => {
    const existing = cart.find(item => item._id === product._id);
    if (existing) {
      setCart(cart.map(item => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setIsCartOpen(true);
  };

  const calculateTotal = () => {
    return cart.reduce((acc, item) => ({
      cash: acc.cash + (item.price * item.quantity),
      credits: acc.credits + (item.creditCost * item.quantity)
    }), { cash: 0, credits: 0 });
  };

  const handleCheckout = async (method) => {
    const totals = calculateTotal();
    
    if (method === 'credits' && userData.creditBalance < totals.credits) {
      alert("Insufficient Credits!");
      return;
    }

    try {
      const orderData = {
        userId: userData._id,
        paymentMethod: method,
        cart: cart.map(item => ({ productId: item._id, quantity: item.quantity })),
        totalAmount: totals.cash
      };

      // 1. Place Order in Backend first (Status: Pending)
      const res = await axios.post(`${API_URL}/api/orders/place-order`, orderData);
      const newOrderId = res.data.order._id;
      setCurrentOrderId(newOrderId);

      if (method === 'cash') {
        // 2. Generate UPI URL
        const upiId = "7219787050@axl"; // REPLACE WITH YOUR ACTUAL UPI ID
        const name = "Healthiffy Cafe";
        const amount = totals.cash;
        const note = `Order-${newOrderId.slice(-4)}`;
        const generatedUpiURL = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&tn=${encodeURIComponent(note)}&cu=INR`;
        
        setUpiLink(generatedUpiURL);

        if (isMobileDevice()) {
          // Mobile: Redirect to App
          window.location.href = generatedUpiURL;
          setIsVerifying(true);
        } else {
          // PC: Show QR Code
          setShowQRCode(true);
          setIsVerifying(true);
        }
      } else {
        // Credit Payment (Automatic Success if backend allows)
        navigate('/success', { 
          state: { orderId: newOrderId, method: method } 
        });
      }

      setCart([]);
      setIsCartOpen(false);
    } catch (err) {
      alert("Order failed. Please try again.");
    }
  };

  return (
    <div style={container}>
      {/* 1. PC QR CODE MODAL */}
      {showQRCode && (
        <div style={verifyOverlay}>
          <div style={verifyCard}>
            <Monitor size={40} color="#1a1a1a" />
            <h2 style={{margin: '15px 0'}}>Scan to Pay</h2>
            <div style={{background: 'white', padding: '20px', borderRadius: '15px', display: 'inline-block', border: '1px solid #eee'}}>
              <QRCodeCanvas value={upiLink} size={200} />
            </div>
            <p style={{marginTop: '15px', fontWeight: 'bold', fontSize: '1.1rem'}}>Total: ₹{calculateTotal().cash}</p>
            <p style={{color: '#666', fontSize: '0.85rem'}}>Scan using GPay, PhonePe, or Paytm</p>
            <div style={orderRefTag}>Order ID: #{currentOrderId?.slice(-4)}</div>
            <button onClick={() => setShowQRCode(false)} style={cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      {/* 2. MOBILE VERIFYING OVERLAY */}
      {isVerifying && !showQRCode && (
        <div style={verifyOverlay}>
          <div style={verifyCard}>
            <div className="spinner" style={spinnerStyle}></div>
            <h2 style={{margin: '20px 0 10px 0'}}>Verifying Payment...</h2>
            <p style={{color: '#666', fontSize: '0.9rem'}}>
              Waiting for the staff to confirm your transaction. Please do not close this screen.
            </p>
            <div style={orderRefTag}>Order ID: #{currentOrderId?.slice(-4)}</div>
            <button onClick={() => setIsVerifying(false)} style={cancelBtn}>Back to Menu</button>
          </div>
        </div>
      )}

      {/* --- Rest of your UI --- */}
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

      {/* Menu Filter Section */}
      <div style={filterSection}>
        <div style={searchBar}>
          <Search size={18} color="#999" />
          <input type="text" placeholder="Search menu..." style={searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div style={categoryRow}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={activeCategory === cat ? activeTab : tabBtn}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div style={grid}>
        {products.map(item => (
          <div key={item._id} style={card}>
            <div style={imgContainer}><img src={item.image} alt={item.name} style={imgStyle} /></div>
            <div style={cardContent}>
              <h3 style={productTitle}>{item.name}</h3>
              <div style={priceContainer}>
                <span style={cashPrice}>₹{item.price}</span>
                <span style={creditPrice}>{item.creditCost} ⭐️</span>
              </div>
              <button onClick={() => addToCart(item)} style={addBtn}><Plus size={16} /> Add</button>
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
              <h2 style={{margin:0}}>Your Basket</h2>
              <button onClick={() => setIsCartOpen(false)} style={closeSidebar}><X size={24} /></button>
            </div>
            <div style={cartList}>
              {cart.map(item => (
                <div key={item._id} style={cartItem}>
                  <div style={{flex:1}}>
                    <div style={cartItemName}>{item.name}</div>
                    <div style={cartItemSub}>₹{item.price}</div>
                  </div>
                  <div style={itemTotalText}>₹{item.price * item.quantity}</div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div style={sidebarFooter}>
                <button onClick={() => handleCheckout('cash')} style={payNowBtn}>
                  {isMobileDevice() ? <Smartphone size={18} /> : <Monitor size={18} />} 
                  Pay via UPI (₹{calculateTotal().cash})
                </button>
                <button onClick={() => handleCheckout('credits')} style={payCreditBtn}>
                  Pay with Credits ({calculateTotal().credits} ⭐️)
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// --- ADDITIONAL STYLES ---
const container = { padding: '15px', maxWidth: '1200px', margin: '0 auto', fontFamily: '"Inter", sans-serif' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const logo = { display: 'flex', alignItems: 'center', gap: '8px', margin: 0 };
const welcomeText = { margin: 0, fontSize: '0.8rem', color: '#666' };
const cartBtn = { position: 'relative', background: '#1a1a1a', color: 'white', border: 'none', padding: '10px', borderRadius: '12px' };
const cartBadge = { position: 'absolute', top: '-5px', right: '-5px', background: '#f39c12', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem' };
const filterSection = { marginBottom: '20px' };
const searchBar = { display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', padding: '10px', borderRadius: '10px', border: '1px solid #eee' };
const searchInput = { border: 'none', outline: 'none', width: '100%' };
const categoryRow = { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px' };
const tabBtn = { padding: '8px 15px', borderRadius: '20px', border: '1px solid #eee', background: 'white', whiteSpace: 'nowrap' };
const activeTab = { ...tabBtn, background: '#1a1a1a', color: 'white' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' };
const card = { background: '#fff', borderRadius: '15px', border: '1px solid #eee', overflow: 'hidden' };
const imgContainer = { height: '120px', background: '#f9f9f9' };
const imgStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const cardContent = { padding: '10px' };
const productTitle = { fontSize: '0.9rem', margin: '0 0 5px 0' };
const priceContainer = { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' };
const cashPrice = { fontWeight: 'bold' };
const creditPrice = { color: '#f39c12', fontSize: '0.8rem' };
const addBtn = { width: '100%', padding: '8px', borderRadius: '8px', border: 'none', background: '#f0f0f0', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' };
const overlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 100 };
const sidebar = { position: 'fixed', right: 0, top: 0, width: '320px', height: '100%', background: 'white', zIndex: 101, display: 'flex', flexDirection: 'column' };
const sidebarHeader = { padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' };
const closeSidebar = { border: 'none', background: 'none' };
const cartList = { flex: 1, padding: '20px', overflowY: 'auto' };
const cartItem = { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' };
const cartItemName = { fontSize: '0.9rem', fontWeight: 'bold' };
const cartItemSub = { fontSize: '0.8rem', color: '#888' };
const itemTotalText = { fontWeight: 'bold' };
const sidebarFooter = { padding: '20px', borderTop: '1px solid #eee' };
const payNowBtn = { width: '100%', background: '#1a1a1a', color: 'white', padding: '15px', borderRadius: '10px', border: 'none', fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };
const payCreditBtn = { width: '100%', background: '#f39c12', color: 'white', padding: '15px', borderRadius: '10px', border: 'none', fontWeight: 'bold' };
const verifyOverlay = { position: 'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'white', zIndex: 1000, display:'flex', justifyContent:'center', alignItems:'center', textAlign:'center' };
const verifyCard = { padding: '20px', maxWidth: '400px' };
const orderRefTag = { marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '8px', fontWeight: 'bold' };
const cancelBtn = { marginTop: '20px', background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontWeight: 'bold' };
const spinnerStyle = { width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #f39c12', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' };

export default CustomerMenu;