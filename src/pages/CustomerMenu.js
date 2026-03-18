import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Coffee, ShoppingCart, Trash2, Plus, Minus, CreditCard, Star, Search, X, ChevronRight, Loader2 } from 'lucide-react';
import { io } from 'socket.io-client';

import { QRCodeSVG } from 'qrcode.react';
// --- FIXED: Use Environment Variable consistently ---
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const socket = io(API_URL, {
  transports: ['websocket', 'polling'], // Added for better mobile compatibility
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
    if (!savedUser) {
      navigate('/login');
    } else {
      setUserData(savedUser);
      loadProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, searchTerm, activeCategory]); // Fixed missing loadProducts dependency warning

  // Listen for Staff Approval via Socket
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
      // FIXED: Swapped localhost for dynamic API_URL
      const res = await axios.get(`${API_URL}/api/products`, {
        params: { search: searchTerm, category: activeCategory }
      });
      setProducts(res.data);
    } catch (err) {
      console.error("Fetch products error:", err);
    }
  };

  const categories = ["All","COFFEE", "SALAD BOWLS", "OTHER BOWLS", "FRUIT BOWLS", "SANDWICH","CHIA PUDDING","ROASTED MAKHANA","OATS BOWL","SMOOTHIES","COFFEE & TEA","HEALTHY GREEN TEAS","FRESH FRUITS & JUICE","HOT BEVERAGE SHOTS"];

  const addToCart = (product) => {
    const existing = cart.find(item => item._id === product._id);
    if (existing) {
      setCart(cart.map(item => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setIsCartOpen(true);
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item._id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item._id !== id));

  const calculateTotal = () => {
    return cart.reduce((acc, item) => ({
      cash: acc.cash + (item.price * item.quantity),
      credits: acc.credits + (item.creditCost * item.quantity)
    }), { cash: 0, credits: 0 });
  };

const handleCheckout = async (method) => {
    const totals = calculateTotal(); // 1. Moved this to the top of the function

    // Validation
    if (method === 'cash' && !isMobile()) {
        alert("🔒 For security, UPI payments must be completed on a mobile device.");
        return;
    }

    if (method === 'credits' && userData.creditBalance < totals.credits) {
        alert("Insufficient Credits!");
        return;
    }

    try {
        // 2. Define orderData clearly before using it in the axios call
        const orderData = {
            userId: userData._id,
            paymentMethod: method,
            cart: cart.map(item => ({ productId: item._id, quantity: item.quantity })),
            totalAmount: method === 'cash' ? totals.cash : totals.credits
        };
        
        const res = await axios.post(`${API_URL}/api/orders/place-order`, orderData);
        const newOrderId = res.data.order._id;
        const shortId = newOrderId.slice(-4);

        if (method === 'cash') {
            const upiId = "atharvashetage@oksbi"; 
            const businessName = "Healthiffy Cafe";
            // Uses totals.cash which is now defined at the top
            const upiURL = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${totals.cash}&tn=Order_${shortId}&cu=INR`;
            
            setCurrentOrderId(newOrderId);
            setIsVerifying(true);

            setTimeout(() => {
                window.location.href = upiURL;
            }, 1500);

        } else {
            navigate('/success', { 
                state: { orderId: newOrderId, remainingCredits: res.data.remainingCredits, method: method } 
            });
        }

        setCart([]);
        setIsCartOpen(false);
    } catch (err) {
        console.error("Order Error:", err);
        alert("System busy. Please try again.");
    }
};

const VerificationOverlay = () => {
    const totals = calculateTotal();
    const shortId = currentOrderId?.slice(-4);
    
    // The "Clean" UPI String
    const upiPayload = `upi://pay?pa=atharvashetage@oksbi&pn=Healthiffy%20Cafe&am=${totals.cash}&tn=Order_${shortId}&cu=INR`;

    const handleQrTap = () => {
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            window.location.href = upiPayload;
        }
    };

    return (
        <div style={verifyOverlay}>
            <div style={verifyCard}>
                <h2 style={verifyTitle}>Payment Request</h2>
                <p style={verifySubtitle}>Total: <b>₹{totals.cash}</b></p>
                
                {/* CLICKABLE QR CODE FOR AUTO-SCAN FEEL */}
                <div 
                    onClick={handleQrTap} 
                    style={{...qrContainer, cursor: 'pointer'}}
                    title="Tap to open UPI App"
                >
                    <QRCodeSVG value={upiPayload} size={220} level="H" />
                    <p style={{fontSize: '0.7rem', color: '#27ae60', marginTop: '10px', fontWeight: 'bold'}}>
                        📱 TAP QR TO OPEN PHONEPE / GPAY
                    </p>
                </div>

                <div style={upiDetailsBox}>
                    <p style={{margin: '0', fontSize: '0.85rem', color: '#555'}}>
                        Order <b>#{shortId}</b> is waiting. <br/>
                        Once paid, stay here for the success screen.
                    </p>
                </div>

                <button onClick={() => setIsVerifying(false)} style={backBtn}>
                    Cancel Order
                </button>
            </div>
        </div>
    );
};

  // ... (Keep the rest of your return JSX and styles exactly as they are) ...
  return (
    <div style={container}>
      {/* Verification Overlay */}
      {isVerifying && (
        <div style={verifyOverlay}>
          <div style={verifyCard}>
            <div className="spinner" style={spinnerStyle}></div>
            <h2 style={{margin: '20px 0 10px 0'}}>Verifying Payment...</h2>
            <p style={{color: '#666', fontSize: '0.9rem', lineHeight: '1.5'}}>
              Please stay on this screen. We are waiting for the kitchen to confirm your UPI transaction.
            </p>
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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link to="/plans" style={navLink}>Plans</Link>
            <button onClick={() => setIsCartOpen(true)} style={cartBtn}>
              <ShoppingCart size={20} />
              {cart.length > 0 && <span style={cartBadge}>{cart.length}</span>}
            </button>
        </div>
      </header>

      {/* Search & Category */}
      <div style={filterSection}>
        <div style={searchBar}>
          <Search size={18} color="#999" />
          <input 
            type="text" 
            placeholder="Search our menu..." 
            style={searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && <X size={18} onClick={() => setSearchTerm('')} style={{cursor:'pointer'}} />}
        </div>
        <div style={categoryRow}>
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              style={activeCategory === cat ? activeTab : tabBtn}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div style={grid}>
        {products.map(item => (
          <div key={item._id} style={card}>
            <div style={imgContainer}>
              <img src={item.image} alt={item.name} style={imgStyle} />
              <span style={categoryTag}>{item.category}</span>
            </div>
            <div style={cardContent}>
                <h3 style={productTitle}>{item.name}</h3>
                <div style={priceContainer}>
                    <span style={cashPrice}>₹{item.price}</span>
                    <span style={creditPrice}>{item.creditCost} ⭐️</span>
                </div>
                <button onClick={() => addToCart(item)} style={addBtn}>
                    <Plus size={16} /> Add
                </button>
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
              <h2 style={{margin:0, fontSize: '1.4rem'}}>Your Basket</h2>
              <button onClick={() => setIsCartOpen(false)} style={closeSidebar}><X size={24} /></button>
            </div>
            <div style={cartList}>
              {cart.length === 0 ? (
                <div style={emptyCart}>
                    <ShoppingCart size={48} color="#eee" />
                    <p>Your basket is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item._id} style={cartItem}>
                    <div style={{ flex: 1 }}>
                      <div style={cartItemName}>{item.name}</div>
                      <div style={cartItemSub}>₹{item.price} / {item.creditCost}⭐️</div>
                      <div style={qtyControls}>
                        <button onClick={() => updateQuantity(item._id, -1)} style={qtyBtn}><Minus size={12}/></button>
                        <span style={qtyText}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item._id, 1)} style={qtyBtn}><Plus size={12}/></button>
                      </div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <button onClick={() => removeFromCart(item._id)} style={delBtn}><Trash2 size={18}/></button>
                      <div style={itemTotalText}>₹{item.price * item.quantity}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div style={sidebarFooter}>
                <div style={summaryBox}>
                    <div style={summaryLine}><span>Subtotal (Cash)</span> <span>₹{calculateTotal().cash}</span></div>
                    <div style={summaryLine}><span>Subtotal (Credits)</span> <span>{calculateTotal().credits} ⭐️</span></div>
                </div>
                <button onClick={() => handleCheckout('cash')} style={payNowBtn}>
                    Pay via UPI <ChevronRight size={18} />
                </button>
                <button onClick={() => handleCheckout('credits')} style={payCreditBtn}>
                    Pay {calculateTotal().credits} Credits <Star size={16} fill="white" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
      
      <style>{`
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    .spin-icon {
        animation: spin 2s linear infinite;
    }
`}</style>
    </div>

    
  );
};

// ... (Your existing styles objects)
const container = { padding: '15px', maxWidth: '1200px', margin: '0 auto', fontFamily: '"Inter", sans-serif', backgroundColor: '#fcfcfc' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const logo = { display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: '#1a1a1a', fontSize: '1.5rem' };
const welcomeText = { margin: '4px 0 0 0', fontSize: '0.85rem', color: '#666' };
const navLink = { textDecoration: 'none', color: '#1a1a1a', fontWeight: '600', fontSize: '0.9rem', padding: '8px 12px' };
const cartBtn = { position: 'relative', background: '#1a1a1a', color: 'white', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer' };
const cartBadge = { position: 'absolute', top: '-5px', right: '-5px', background: '#f39c12', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' };
const filterSection = { marginBottom: '25px' };
const searchBar = { display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', padding: '12px 16px', borderRadius: '14px', marginBottom: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #eee' };
const searchInput = { border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '0.95rem' };
const categoryRow = { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' };
const tabBtn = { padding: '8px 16px', borderRadius: '10px', border: '1px solid #eee', background: 'white', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.85rem', color: '#555' };
const activeTab = { ...tabBtn, background: '#1a1a1a', color: 'white', border: '1px solid #1a1a1a' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' };
const card = { background: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
const imgContainer = { position: 'relative', height: '140px' };
const imgStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const categoryTag = { position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(255,255,255,0.9)', color: '#1a1a1a', padding: '3px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold' };
const cardContent = { padding: '12px' };
const productTitle = { margin: '0 0 8px 0', fontSize: '1rem', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const priceContainer = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' };
const cashPrice = { fontWeight: '700', fontSize: '0.95rem' };
const creditPrice = { color: '#f39c12', fontWeight: '600', fontSize: '0.85rem' };
const addBtn = { width: '100%', background: '#f5f5f5', color: '#1a1a1a', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' };
const overlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 1000, backdropFilter: 'blur(2px)' };
const sidebar = { position: 'fixed', right: 0, top: 0, width: 'min(400px, 90%)', height: '100%', background: 'white', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', zIndex: 1001, display: 'flex', flexDirection: 'column' };
const sidebarHeader = { padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const closeSidebar = { border: 'none', background: 'none', cursor: 'pointer', color: '#999' };
const cartList = { flexGrow: 1, overflowY: 'auto', padding: '20px' };
const emptyCart = { textAlign: 'center', padding: '40px 0', color: '#999' };
const cartItem = { display: 'flex', padding: '15px 0', borderBottom: '1px solid #f9f9f9' };
const cartItemName = { fontWeight: '600', fontSize: '0.95rem' };
const cartItemSub = { fontSize: '0.75rem', color: '#999', margin: '4px 0' };
const qtyControls = { display: 'flex', alignItems: 'center', gap: '12px' };
const qtyBtn = { width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #eee', cursor: 'pointer' };
const qtyText = { fontSize: '0.9rem', fontWeight: '600' };
const delBtn = { color: '#ff4d4d', border: 'none', background: 'none', cursor: 'pointer' };
const itemTotalText = { fontWeight: '700', fontSize: '0.95rem' };
const sidebarFooter = { padding: '20px', borderTop: '1px solid #eee', background: '#fcfcfc' };
const summaryBox = { marginBottom: '15px' };
const summaryLine = { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' };
const payNowBtn = { width: '100%', background: '#1a1a1a', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', marginBottom: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' };
const payCreditBtn = { width: '100%', background: '#f39c12', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' };
const verifyOverlay = { position: 'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(255,255,255,0.98)', zIndex: 2000, display:'flex', justifyContent:'center', alignItems:'center', textAlign:'center' };
const verifyCard = { padding: '40px', maxWidth: '350px' };
const orderRefTag = { marginTop: '20px', padding: '8px 15px', background: '#f0f0f0', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold' };
const spinnerStyle = { width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #f39c12', borderRadius: '50%', margin: '0 auto' };

// --- ADD THESE TO THE BOTTOM OF CustomerMenu.js STYLES ---

const loaderWrapper = { 
  display: 'flex', 
  flexDirection: 'column', 
  alignItems: 'center', 
  gap: '15px' 
};

const verifyTitle = { 
  fontSize: '1.5rem', 
  fontWeight: '800', 
  color: '#1a1a1a', 
  margin: '0 0 10px 0' 
};

const verifySubtitle = { 
  fontSize: '0.9rem', 
  color: '#666', 
  marginBottom: '20px' 
};

const upiDetailsBox = { 
  background: '#f8fafc', 
  padding: '15px', 
  borderRadius: '12px', 
  border: '1px solid #e2e8f0', 
  textAlign: 'left',
  marginBottom: '20px'
};

const label = { 
  fontSize: '0.75rem', 
  color: '#94a3b8', 
  textTransform: 'uppercase', 
  fontWeight: '700', 
  display: 'block', 
  marginBottom: '2px' 
};

const value = { 
  fontSize: '1rem', 
  color: '#1e293b', 
  fontWeight: '600', 
  wordBreak: 'break-all' 
};

const backBtn = { 
  background: 'none', 
  border: '1px solid #e2e8f0', 
  padding: '10px 20px', 
  borderRadius: '10px', 
  cursor: 'pointer', 
  fontWeight: '600', 
  color: '#64748b',
  fontSize: '0.9rem'
};
const qrContainer = {
    background: 'white',
    padding: '15px',
    borderRadius: '15px',
    display: 'inline-block',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    marginBottom: '20px',
    marginTop: '10px'
};


export default CustomerMenu;