import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, Upload, X, CheckCircle, Star } from 'lucide-react';

// --- FIXED: Consistent API URL ---
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Plans = () => {
  const [creditPlans, setCreditPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // FIXED: Swapped localhost for dynamic API_URL
        const res = await axios.get(`${API_URL}/api/plans`);
        setCreditPlans(res.data);
      } catch (err) {
        console.error("Error fetching plans", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
    };
    if (file) reader.readAsDataURL(file);
  };

  const handleProceed = async () => {
    if (!image) return alert("Please upload a receipt first!");
    if (!user) return alert("Please log in to purchase plans.");
    
    setUploading(true);
    try {
      // FIXED: Swapped localhost for dynamic API_URL
      await axios.post(`${API_URL}/api/subscriptions/request`, {
        userId: user._id,
        planName: selectedPlan.name,
        creditsToGrant: selectedPlan.credits,
        amountPaid: selectedPlan.price,
        receiptImage: image
      });
      alert("Receipt submitted! Admin will verify and add credits soon.");
      setShowPopup(false);
      setImage(null);
    } catch (err) {
      alert("Submission failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading Plans...</div>;

  return (
    <div style={pageWrapper}>
      <div style={container}>
        <div style={headerSection}>
          <h1 style={mainTitle}>Choose Your Credit Plan</h1>
          <p style={subTitle}>Unlock exclusive benefits and save more with our credit packages.</p>
        </div>

        <div style={grid}>
          {creditPlans.map((plan, index) => (
            <div key={plan._id} style={planCard}>
              {index === 1 && <div style={popularBadge}>Most Popular</div>}
              <h3 style={planName}>{plan.name}</h3>
              <div style={priceContainer}>
                <span style={currency}>₹</span>
                <span style={priceAmount}>{plan.price}</span>
              </div>
              <div style={creditHighlight}>
                <Star size={20} fill="#f39c12" color="#f39c12" />
                <span>{plan.credits} Credits Included</span>
              </div>
              <p style={planDesc}>{plan.description || "Perfect for regular visitors"}</p>
              
              <ul style={featureList}>
                <li style={featureItem}><CheckCircle size={16} color="#27ae60" /> Manual verification</li>
                <li style={featureItem}><CheckCircle size={16} color="#27ae60" /> Use on any menu item</li>
              </ul>

              <button 
                onClick={() => { setSelectedPlan(plan); setShowPopup(true); }}
                style={buyBtn}
              >
                Select {plan.name}
              </button>
            </div>
          ))}
        </div>

        {showPopup && (
          <div style={overlay}>
            <div style={popup}>
              <button onClick={() => setShowPopup(false)} style={closeBtn}><X /></button>
              <div style={popupHeader}>
                <ShieldCheck size={32} color="#27ae60" />
                <h3 style={{ margin: 0 }}>Secure Payment</h3>
              </div>
              
              <div style={rulesBox}>
                <p>1. Pay <b>₹{selectedPlan.price}</b> to UPI: <b style={upiId}>cafe@upi</b></p>
                <p>2. Upload screenshot of success page.</p>
                <p>3. Credits added after manual verification.</p>
              </div>

              <div style={{ margin: '20px 0' }}>
                <label style={uploadArea}>
                  {image ? (
                    <img src={image} alt="Preview" style={previewImg} />
                  ) : (
                    <div style={uploadPlaceholder}>
                      <Upload size={24} />
                      <span>Click to upload receipt</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                </label>
              </div>

              <button 
                onClick={handleProceed} 
                disabled={uploading}
                style={{ ...proceedBtn, backgroundColor: uploading ? '#ccc' : '#27ae60' }}
              >
                {uploading ? "Uploading..." : "Submit Receipt"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ... (Styles remain the same as your provided code)
const pageWrapper = { background: '#f8f9fa', minHeight: '100vh', padding: '40px 20px' };
const container = { maxWidth: '1100px', margin: '0 auto' };
const headerSection = { textAlign: 'center', marginBottom: '50px' };
const mainTitle = { fontSize: '2.5rem', color: '#2c3e50', marginBottom: '10px' };
const subTitle = { color: '#7f8c8d', fontSize: '1.1rem' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' };
const planCard = { background: '#fff', padding: '40px 30px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', position: 'relative', border: '1px solid #eee', transition: 'transform 0.3s ease' };
const popularBadge = { position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: '#2c3e50', color: 'white', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' };
const planName = { fontSize: '1.4rem', color: '#34495e', marginBottom: '20px' };
const priceContainer = { marginBottom: '20px' };
const currency = { fontSize: '1.5rem', fontWeight: 'bold', verticalAlign: 'top', marginRight: '5px' };
const priceAmount = { fontSize: '3.5rem', fontWeight: '800', color: '#2c3e50' };
const creditHighlight = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#fff9f0', color: '#d35400', padding: '10px', borderRadius: '12px', fontWeight: 'bold', marginBottom: '20px' };
const planDesc = { color: '#95a5a6', fontSize: '0.9rem', marginBottom: '25px' };
const featureList = { listStyle: 'none', padding: 0, margin: '0 0 30px 0', textAlign: 'left' };
const featureItem = { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: '#546e7a', fontSize: '0.95rem' };
const buyBtn = { width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: '#2c3e50', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', transition: 'background 0.3s' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' };
const popup = { background: 'white', padding: '40px', borderRadius: '24px', width: '90%', maxWidth: '420px', position: 'relative' };
const popupHeader = { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' };
const rulesBox = { background: '#f1f8f5', padding: '20px', borderRadius: '16px', fontSize: '0.95rem', color: '#2e7d32', marginBottom: '20px' };
const upiId = { background: '#fff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #c8e6c9' };
const closeBtn = { position: 'absolute', top: '20px', right: '20px', border: 'none', background: 'none', cursor: 'pointer', color: '#999' };
const uploadArea = { display: 'block', border: '2px dashed #e0e0e0', borderRadius: '16px', height: '180px', cursor: 'pointer', overflow: 'hidden' };
const uploadPlaceholder = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', gap: '10px' };
const previewImg = { width: '100%', height: '100%', objectFit: 'contain' };
const proceedBtn = { width: '100%', padding: '16px', borderRadius: '12px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' };

export default Plans;