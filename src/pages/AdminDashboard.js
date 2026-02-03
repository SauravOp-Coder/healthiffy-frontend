import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, CheckCircle, Clock, Users, Coffee, Plus, Trash2, Ticket } from 'lucide-react';

// --- FIXED: Consistent API URL ---
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]); 
  const [activeTab, setActiveTab] = useState('users'); 
  
  const [newProduct, setNewProduct] = useState({ name: '', price: '', creditCost: '', category: 'Coffee', image: '' });
  const [newPlan, setNewPlan] = useState({ name: '', price: '', credits: '', description: '' });

  const categoriesList = ["Coffee", "SALAD BOWLS", "OTHER BOWLS", "FRUIT BOWLS", "SANDWICH","CHIA PUDDING","ROASTED MAKHANA","OATS BOWL","SMOOTHIES","COFFEE & TEA","HEALTHY GREEN TEAS","FRESH FRUITS & JUICE","HOT BEVERAGE SHOTS"];

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchData = async () => {
    try {
      // FIXED: Swapped localhost for dynamic API_URL in all calls
      if (activeTab === 'receipts') {
        const res = await axios.get(`${API_URL}/api/subscriptions/admin/pending`);
        setRequests(res.data);
      } else if (activeTab === 'users') {
        const res = await axios.get(`${API_URL}/api/users`);
        setUsers(res.data);
      } else if (activeTab === 'menu') {
        const res = await axios.get(`${API_URL}/api/products`);
        setProducts(res.data);
      } else if (activeTab === 'plans') {
        const res = await axios.get(`${API_URL}/api/plans`);
        setPlans(res.data);
      }
    } catch (err) {
      console.error("Error fetching admin data", err);
    }
  };

  const handleAddPlan = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/plans`, newPlan);
      setNewPlan({ name: '', price: '', credits: '', description: '' });
      fetchData();
    } catch (err) {
      alert("Error adding plan");
    }
  };

  const deletePlan = async (id) => {
    if (!window.confirm("Delete this plan?")) return;
    await axios.delete(`${API_URL}/api/plans/${id}`);
    fetchData();
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/api/products`, newProduct);
    setNewProduct({ name: '', price: '', creditCost: '', category: 'Coffee', image: '' });
    fetchData();
  };

  const deleteProduct = async (id) => {
    await axios.delete(`${API_URL}/api/products/${id}`);
    fetchData();
  };

  const approveRequest = async (requestId) => {
    if (!window.confirm("Approve this payment and grant credits?")) return;
    try {
      await axios.patch(`${API_URL}/api/subscriptions/admin/approve/${requestId}`);
      fetchData();
    } catch (err) {
      alert("Error approving request.");
    }
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
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Admin Dashboard</h1>
      
      <div style={tabContainer}>
        <button onClick={() => setActiveTab('users')} style={activeTab === 'users' ? activeBtn : tabBtn}><Users size={18}/> Users</button>
        <button onClick={() => setActiveTab('menu')} style={activeTab === 'menu' ? activeBtn : tabBtn}><Coffee size={18}/> Menu</button>
        <button onClick={() => setActiveTab('plans')} style={activeTab === 'plans' ? activeBtn : tabBtn}><Ticket size={18}/> Plans</button>
        <button onClick={() => setActiveTab('receipts')} style={activeTab === 'receipts' ? activeBtn : tabBtn}>
          Receipts {requests.length > 0 && <span style={badge}>{requests.length}</span>}
        </button>
      </div>

      {activeTab === 'plans' && (
        <section>
          <form onSubmit={handleAddPlan} style={productForm}>
            <input style={innerInput} placeholder="Plan Name" value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})} required />
            <input style={innerInput} placeholder="Price (₹)" type="number" value={newPlan.price} onChange={e => setNewPlan({...newPlan, price: e.target.value})} required />
            <input style={innerInput} placeholder="Credits" type="number" value={newPlan.credits} onChange={e => setNewPlan({...newPlan, credits: e.target.value})} required />
            <button type="submit" style={addBtn}><Plus size={18}/> Add Plan</button>
          </form>

          <div style={grid}>
            {plans.map(p => (
              <div key={p._id} style={userCard}>
                <h3 style={{marginTop: 0}}>{p.name}</h3>
                <p>₹{p.price} = {p.credits} Credits</p>
                <button onClick={() => deletePlan(p._id)} style={delBtn}><Trash2 size={16}/> Delete</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'users' && (
        <section>
          <div style={grid}>
            {users.map(u => (
              <div key={u._id} style={userCard}>
                <h3 style={{marginTop: 0}}>{u.name}</h3>
                <p style={{color: '#666'}}>📞 {u.phone}</p>
                <div style={creditBadge}>{u.creditBalance} ⭐️ Credits</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'menu' && (
        <section>
          <form onSubmit={handleAddProduct} style={productForm}>
            <input style={innerInput} placeholder="Item Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
            <select style={innerInput} value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} required>
              {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input style={innerInput} placeholder="Price" type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} required />
            <input style={innerInput} placeholder="Credits" type="number" value={newProduct.creditCost} onChange={e => setNewProduct({...newProduct, creditCost: e.target.value})} required />
            <input style={innerInput} placeholder="Image URL" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} />
            <button type="submit" style={addBtn}><Plus size={18}/> Add Item</button>
          </form>

          <div style={grid}>
            {products.map(p => (
              <div key={p._id} style={productCard}>
                <img src={p.image || 'https://via.placeholder.com/150'} alt={p.name} style={{width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px'}} />
                <h4 style={{margin: '10px 0'}}>{p.name}</h4>
                <p style={{fontSize: '0.9rem', color: '#666'}}>₹{p.price} | {p.creditCost}⭐️</p>
                <button onClick={() => deleteProduct(p._id)} style={delBtn}><Trash2 size={16}/> Remove</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'receipts' && (
        <section>
          <div style={grid}>
            {requests.map(req => (
              <div key={req._id} style={userCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{margin: 0}}>{req.user?.name || 'Unknown User'}</h4>
                  <button onClick={() => downloadReceipt(req.receiptImage, req.user?.name)} style={downloadBtnStyle}>
                    <Download size={16} />
                  </button>
                </div>
                <p style={{margin: '5px 0', fontSize: '0.9rem'}}><b>Plan:</b> {req.planName} (₹{req.amountPaid})</p>
                <img 
                  src={req.receiptImage} 
                  alt="receipt" 
                  style={{width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', marginBottom: '10px'}} 
                  onClick={() => window.open(req.receiptImage)}
                />
                <button onClick={() => approveRequest(req._id)} style={approveBtn}>
                  <CheckCircle size={16} style={{marginRight: '5px'}}/> Grant {req.creditsToGrant} Credits
                </button>
              </div>
            ))}
          </div>
          {requests.length === 0 && <p style={{textAlign: 'center', color: '#999', marginTop: '40px'}}>No pending approvals.</p>}
        </section>
      )}
    </div>
  );
};

// ... (Styles remain largely the same, I just cleaned up some alignment)
const tabContainer = { display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '2px solid #eee', overflowX: 'auto' };
const tabBtn = { padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#888', whiteSpace: 'nowrap' };
const activeBtn = { ...tabBtn, color: '#1a1a1a', borderBottom: '3px solid #1a1a1a' };
const badge = { background: '#e74c3c', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', marginLeft: '5px' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' };
const userCard = { background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #eee' };
const creditBadge = { background: '#f39c12', color: 'white', padding: '5px 12px', borderRadius: '20px', display: 'inline-block', fontWeight: 'bold', fontSize: '0.85rem' };
const productForm = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '30px', background: '#f9f9f9', padding: '20px', borderRadius: '12px', alignItems: 'center' };
const addBtn = { background: '#27ae60', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', height: '42px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' };
const productCard = { background: 'white', padding: '15px', border: '1px solid #eee', borderRadius: '12px', textAlign: 'center' };
const delBtn = { color: '#e74c3c', border: 'none', background: 'none', cursor: 'pointer', marginTop: '10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', width: '100%' };
const approveBtn = { width: '100%', background: '#27ae60', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', marginTop: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const innerInput = { padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '100%', boxSizing: 'border-box', fontSize: '0.9rem' };
const downloadBtnStyle = { background: '#3498db', color: 'white', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default AdminDashboard;