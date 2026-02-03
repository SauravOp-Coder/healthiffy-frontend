import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, CheckCircle, Clock, Users, Coffee, Plus, Trash2, History, Ticket } from 'lucide-react';

const AdminDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]); // NEW: State for plans
  const [activeTab, setActiveTab] = useState('users'); 
  
  // Form States
  const [newProduct, setNewProduct] = useState({ name: '', price: '', creditCost: '', category: 'Coffee', image: '' });
  const [newPlan, setNewPlan] = useState({ name: '', price: '', credits: '', description: '' }); // NEW: Form state for plans

  const categoriesList = ["Coffee", "SALAD BOWLS", "OTHER BOWLS", "FRUIT BOWLS", "SANDWICH","CHIA PUDDING","ROASTED MAKHANA","OATS BOWL","SMOOTHIES","COFFEE & TEA","HEALTHY GREEN TEAS","FRESH FRUITS & JUICE","HOT BEVERAGE SHOTS"];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'receipts') {
        const res = await axios.get('http://localhost:5000/api/subscriptions/admin/pending');
        setRequests(res.data);
      } else if (activeTab === 'users') {
        const res = await axios.get('http://localhost:5000/api/users');
        setUsers(res.data);
      } else if (activeTab === 'menu') {
        const res = await axios.get('http://localhost:5000/api/products');
        setProducts(res.data);
      } else if (activeTab === 'plans') { // NEW: Fetch plans
        const res = await axios.get('http://localhost:5000/api/plans');
        setPlans(res.data);
      }
    } catch (err) {
      console.error("Error fetching admin data", err);
    }
  };

  // --- Plan Logic ---
  const handleAddPlan = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/plans', newPlan);
      setNewPlan({ name: '', price: '', credits: '', description: '' });
      fetchData();
    } catch (err) {
      alert("Error adding plan");
    }
  };

  const deletePlan = async (id) => {
    if (!window.confirm("Delete this plan?")) return;
    await axios.delete(`http://localhost:5000/api/plans/${id}`);
    fetchData();
  };

  // --- Product Logic ---
  const handleAddProduct = async (e) => {
    e.preventDefault();
    await axios.post('http://localhost:5000/api/products', newProduct);
    setNewProduct({ name: '', price: '', creditCost: '', category: 'Coffee', image: '' });
    fetchData();
  };

  const deleteProduct = async (id) => {
    await axios.delete(`http://localhost:5000/api/products/${id}`);
    fetchData();
  };

  // --- Subscription Logic ---
  const approveRequest = async (requestId) => {
    if (!window.confirm("Approve this payment?")) return;
    await axios.patch(`http://localhost:5000/api/subscriptions/admin/approve/${requestId}`);
    fetchData();
  };

  const downloadReceipt = (imageUrl, userName) => {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = `Receipt_${userName || 'User'}_${Date.now()}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Admin Dashboard</h1>
      
      {/* Tab Navigation */}
      <div style={tabContainer}>
        <button onClick={() => setActiveTab('users')} style={activeTab === 'users' ? activeBtn : tabBtn}><Users size={18}/> Users</button>
        <button onClick={() => setActiveTab('menu')} style={activeTab === 'menu' ? activeBtn : tabBtn}><Coffee size={18}/> Menu</button>
        <button onClick={() => setActiveTab('plans')} style={activeTab === 'plans' ? activeBtn : tabBtn}><Ticket size={18}/> Plans</button>
        <button onClick={() => setActiveTab('receipts')} style={activeTab === 'receipts' ? activeBtn : tabBtn}>
          Receipts {requests.length > 0 && <span style={badge}>{requests.length}</span>}
        </button>
      </div>

      {/* SECTION: PLAN MANAGEMENT */}
      {activeTab === 'plans' && (
        <section>
          <form onSubmit={handleAddPlan} style={productForm}>
            <input style={innerInput} placeholder="Plan Name (e.g. Gold)" value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})} required />
            <input style={innerInput} placeholder="Price (₹)" type="number" value={newPlan.price} onChange={e => setNewPlan({...newPlan, price: e.target.value})} required />
            <input style={innerInput} placeholder="Credits to Grant" type="number" value={newPlan.credits} onChange={e => setNewPlan({...newPlan, credits: e.target.value})} required />
            <button type="submit" style={addBtn}><Plus size={18}/> Add Plan</button>
          </form>

          <div style={grid}>
            {plans.map(p => (
              <div key={p._id} style={userCard}>
                <h3>{p.name}</h3>
                <p>₹{p.price} for {p.credits} Credits</p>
                <button onClick={() => deletePlan(p._id)} style={delBtn}><Trash2 size={16}/> Delete Plan</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <section>
          <h2>All Subscribed Users</h2>
          <div style={grid}>
            {users.map(u => (
              <div key={u._id} style={userCard}>
                <h3>{u.name}</h3>
                <p>📞 {u.phone}</p>
                <div style={creditBadge}>{u.creditBalance} ⭐️ Credits</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION: MENU MANAGEMENT */}
      {activeTab === 'menu' && (
        <section>
          <form onSubmit={handleAddProduct} style={productForm}>
            <input style={innerInput} placeholder="Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
            <select style={innerInput} value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} required>
              {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input style={innerInput} placeholder="Price" type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} required />
            <input style={innerInput} placeholder="Credits" type="number" value={newProduct.creditCost} onChange={e => setNewProduct({...newProduct, creditCost: e.target.value})} required />
            <input style={innerInput} placeholder="Image URL" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} />
            <button type="submit" style={addBtn}><Plus size={18}/> Add to Menu</button>
          </form>

          <div style={grid}>
            {products.map(p => (
              <div key={p._id} style={productCard}>
                <img src={p.image} alt={p.name} style={{width: '100%', height: '100px', objectFit: 'cover'}} />
                <h4>{p.name}</h4>
                <p>₹{p.price} | {p.creditCost}⭐️</p>
                <button onClick={() => deleteProduct(p._id)} style={delBtn}><Trash2 size={16}/> Remove</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION: RECEIPTS */}
    {/* SECTION: RECEIPTS */}
{activeTab === 'receipts' && (
  <section>
    <h2>Pending Approvals</h2>
    <div style={grid}>
      {requests.map(req => (
        <div key={req._id} style={userCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4>{req.user?.name}</h4>
            {/* ADDED DOWNLOAD BUTTON HERE */}
            <button 
              onClick={() => downloadReceipt(req.receiptImage, req.user?.name)} 
              style={downloadBtnStyle}
              title="Download Receipt"
            >
              <Download size={16} />
            </button>
          </div>
          
          <p>Plan: {req.planName} (₹{req.amountPaid})</p>
          <img 
            src={req.receiptImage} 
            alt="receipt" 
            style={{width: '100%', borderRadius: '8px', cursor: 'pointer', marginBottom: '10px'}} 
            onClick={() => window.open(req.receiptImage)}
          />
          
          <button onClick={() => approveRequest(req._id)} style={approveBtn}>
            <CheckCircle size={16} style={{marginRight: '5px'}}/> Grant {req.creditsToGrant} Credits
          </button>
        </div>
      ))}
    </div>
  </section>
)}
    </div>
  );
};

// --- STYLES ---
const tabContainer = { display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '2px solid #eee' };
const tabBtn = { padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#888' };
const activeBtn = { ...tabBtn, color: '#2c3e50', borderBottom: '3px solid #2c3e50' };
const badge = { background: '#e74c3c', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' };
const userCard = { background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee' };
const creditBadge = { background: '#f39c12', color: 'white', padding: '5px 10px', borderRadius: '20px', display: 'inline-block', fontWeight: 'bold' };
const productForm = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '30px', background: '#f9f9f9', padding: '20px', borderRadius: '10px', alignItems: 'center' };
const addBtn = { background: '#27ae60', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer', height: '40px' };
const productCard = { background: 'white', padding: '10px', border: '1px solid #eee', borderRadius: '8px', textAlign: 'center' };
const delBtn = { color: '#e74c3c', border: 'none', background: 'none', cursor: 'pointer', marginTop: '10px' };
const approveBtn = { width: '100%', background: '#27ae60', color: 'white', padding: '10px', borderRadius: '5px', border: 'none', marginTop: '10px', cursor: 'pointer' };
const innerInput = { padding: '10px', borderRadius: '6px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box', fontSize: '0.9rem' };

const downloadBtnStyle = {
  background: '#3498db',
  color: 'white',
  border: 'none',
  padding: '8px',
  borderRadius: '5px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};
export default AdminDashboard;