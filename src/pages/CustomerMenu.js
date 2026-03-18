import React, { useState, useEffect } from 'react';
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
  const [showQR, setShowQR] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
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
        if (method === 'cash') {
            setCurrentOrderId(res.data.order._id);
            setShowQR(false);
            setIsVerifying(true);
        } else {
            navigate('/success', { state: { orderId: res.data.order._id, remainingCredits: res.data.remainingCredits } });
        }
        setCart([]);
    } catch (err) { alert("Failed to place order."); }
  };

  const categories = ["All","COFFEE", "SALAD BOWLS", "OTHER BOWLS", "FRUIT BOWLS", "SANDWICH","CHIA PUDDING","ROASTED MAKHANA","OATS BOWL","SMOOTHIES","COFFEE & TEA","HEALTHY GREEN TEAS","FRESH FRUITS & JUICE","HOT BEVERAGE SHOTS"];

  const QRPrePayOverlay = () => {
    const totals = calculateTotal();
    const upiId = "atharvashetage@oksbi";
    const upiPayload = `upi://pay?pa=${upiId}&pn=Healthiffy%20Cafe&am=${totals.cash}&cu=INR`;

    return (
        <div style={verifyOverlay}>
            <div style={verifyCard}>
                <h2 style={verifyTitle}>Scan to Pay</h2>
                <p style={verifySubtitle}>Total: <b>₹{totals.cash}</b></p>
                <div style={qrContainer}><QRCodeSVG value={upiPayload} size={200} level="H" /></div>
                <div style={instructionBox}>
                    <p style={instructionHeader}>📱 Paying on Mobile?</p>
                    <ul style={instructionList}>
                        <li>Screenshot this QR.</li>
                        <li>Open UPI App (GPay/PhonePe).</li>
                        <li>Scan > 'Upload from Gallery'.</li>
                    </ul>
                </div>
                <button onClick={() => confirmAndPlaceOrder('cash')} style={confirmPaidBtn}>
                    <CheckCircle size={18} /> I Have Paid
                </button>
                <button onClick={() => setShowQR(false)} style={backBtnStyle}>Cancel</button>
            </div>
        </div>
    );
  };

  return (
    <div style={container}>
      {showQR && <QRPrePayOverlay />}
      {isVerifying && (
        <div style={verifyOverlay}>
          <div style={verifyCard}>
            <Loader2 size={50} className="spin-icon" color="#f39c12" />
            <h2 style={{marginTop: '20px'}}>Verifying...</h2>
            <p>Waiting for kitchen to confirm payment.</p>
            <div style={orderRefTag}>Ref: #{currentOrderId?.slice(-4)}</div>
          </div>
        </div>
      )}

      <header style={headerStyle}>
        <h1 style={logo}><Coffee size={24} /> Healthiffy</h1>
        <button onClick={() => setIsCartOpen(true)} style={cartBtn}>
            <ShoppingCart size={20} />
            {cart.length > 0 && <span style={cartBadge}>{cart.length}</span>}
        </button>
      </header>

      <div style={categoryRow}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={activeCategory === cat ? activeTab : tabBtn}>{cat}</button>
        ))}
      </div>

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

      {isCartOpen && (
        <>
          <div style={overlay} onClick={() => setIsCartOpen(false)} />
          <div style={sidebar}>
            <div style={sidebarHeader}><h2>Basket</h2><X onClick={() => setIsCartOpen(false)} style={{cursor:'pointer'}}/></div>
            <div style={cartList}>
                {cart.map(item => (
                    <div key={item._id} style={cartItem}><span>{item.name} x{item.quantity}</span><span>₹{item.price * item.quantity}</span></div>
                ))}
            </div>
            <div style={sidebarFooter}>
                <button onClick={() => {setShowQR(true); setIsCartOpen(false);}} style={payNowBtn}>Pay via UPI (Scan)</button>
            </div>
          </div>
        </>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin-icon { animation: spin 2s linear infinite; }`}</style>
    </div>
  );
};

// --- Styles ---
const container = { padding: '15px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const logo = { display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.2rem' };
const cartBtn = { position: 'relative', background: '#1a1a1a', color: 'white', border: 'none', padding: '10px', borderRadius: '12px' };
const cartBadge = { position: 'absolute', top: '-5px', right: '-5px', background: '#f39c12', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px' };
const categoryRow = { display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '5px' };
const tabBtn = { padding: '8px 16px', borderRadius: '10px', border: '1px solid #eee', background: 'white', whiteSpace: 'nowrap' };
const activeTab = { ...tabBtn, background: '#1a1a1a', color: 'white' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' };
const card = { background: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0', overflow: 'hidden' };
const imgContainer = { height: '120px' };
const imgStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const cardContent = { padding: '10px' };
const productTitle = { margin: '0 0 5px 0', fontSize: '0.85rem', fontWeight: 'bold' };
const priceContainer = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const cashPrice = { fontWeight: 'bold', fontSize: '0.9rem' };
const addBtn = { background: '#f5f5f5', border: 'none', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer' };
const overlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', zIndex: 1000 };
const sidebar = { position: 'fixed', right: 0, top: 0, width: '300px', height: '100%', background: 'white', zIndex: 1001, display: 'flex', flexDirection: 'column' };
const sidebarHeader = { padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' };
const cartList = { flexGrow: 1, padding: '20px', overflowY: 'auto' };
const cartItem = { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.85rem' };
const sidebarFooter = { padding: '20px', borderTop: '1px solid #eee' };
const payNowBtn = { width: '100%', background: '#1a1a1a', color: 'white', padding: '14px', borderRadius: '12px', fontWeight: 'bold', border: 'none' };
const verifyOverlay = { position: 'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(255,255,255,0.98)', zIndex: 2000, display:'flex', justifyContent:'center', alignItems:'center', textAlign:'center' };
const verifyCard = { padding: '20px', width: '90%', maxWidth: '350px' };
const verifyTitle = { fontSize: '1.4rem', fontWeight: 'bold', margin: '0 0 5px 0' };
const verifySubtitle = { color: '#666', fontSize: '0.9rem', marginBottom: '15px' };
const qrContainer = { background: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '15px', display: 'inline-block' };
const instructionBox = { background: '#fff9eb', padding: '12px', borderRadius: '10px', textAlign: 'left', marginBottom: '15px', border: '1px solid #ffeeba' };
const instructionHeader = { fontSize: '0.8rem', fontWeight: '700', color: '#856404', marginBottom: '5px' };
const instructionList = { margin: 0, paddingLeft: '15px', fontSize: '0.75rem', color: '#856404' };
const confirmPaidBtn = { width: '100%', background: '#27ae60', color: 'white', padding: '14px', borderRadius: '10px', fontWeight: 'bold', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' };
const backBtnStyle = { width: '100%', marginTop: '10px', background: 'none', border: '1px solid #ddd', padding: '10px', borderRadius: '10px', color: '#666' };
const orderRefTag = { marginTop: '15px', padding: '8px', background: '#eee', borderRadius: '8px', fontSize: '0.8rem' };

export default CustomerMenu;