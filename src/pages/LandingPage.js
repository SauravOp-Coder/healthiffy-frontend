import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Instagram, MapPin, Phone, Menu, X, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  
  // --- RESPONSIVE STATE ---
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth <= 1024;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    const handleScroll = () => setIsScrolled(window.scrollY > 50);

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // --- RESPONSIVE STYLE ADAPTATIONS ---
  const dynamicPadding = isMobile ? '60px 20px' : '100px 8%';
  const dynamicHeroFontSize = isMobile ? '2.8rem' : isTablet ? '4rem' : '5rem';

  return (
    <div style={{ ...container, overflowX: 'hidden' }}>
      
      {/* --- 🧭 NAVIGATION --- */}
      <nav style={{
        ...navStyle,
        backgroundColor: isScrolled || isMobileMenuOpen ? 'rgba(255,255,255,0.98)' : 'transparent',
        padding: isMobile ? '15px 20px' : '20px 40px',
        borderBottom: isScrolled ? '1px solid #eee' : 'none'
      }}>
        <div style={navContent}>
          <div style={logo}>HEALTHIFFY<span style={{ color: '#27ae60' }}>.</span></div>
          
          {isMobile ? (
            <div onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ cursor: 'pointer' }}>
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </div>
          ) : (
            <div style={navLinks}>
              <a href="#home" style={navItem}>Home</a>
              <a href="#menu" style={navItem}>Menu</a>
              <a href="#about" style={navItem}>About</a>
              <a href="#blog" style={navItem}>Journal</a>
              <a href="#contact" style={navItem}>Contact</a>
              <button onClick={() => navigate('/login')} style={portalBtn}>Client Portal</button>
            </div>
          )}
        </div>

        {/* Mobile Slide-down Menu */}
        {isMobile && isMobileMenuOpen && (
          <div style={mobileDropdown}>
            <a href="#home" onClick={() => setIsMobileMenuOpen(false)} style={mobileNavItem}>Home</a>
            <a href="#menu" onClick={() => setIsMobileMenuOpen(false)} style={mobileNavItem}>Menu</a>
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)} style={mobileNavItem}>About</a>
            <a href="#blog" onClick={() => setIsMobileMenuOpen(false)} style={mobileNavItem}>Journal</a>
            <button onClick={() => navigate('/login')} style={{ ...portalBtn, width: '100%', marginTop: '10px' }}>Client Portal</button>
          </div>
        )}
      </nav>

      {/* --- 🏠 HERO SECTION --- */}
      <section id="home" style={{ 
        ...heroSection, 
        padding: isMobile ? '0 20px' : '0 8%',
        backgroundAttachment: isMobile ? 'scroll' : 'fixed' // Parallax is buggy on mobile browsers
      }}>
        <div style={{ ...heroContent, width: '100%' }}>
          <span style={kicker}>ESTABLISHED 2024</span>
          <h1 style={{ ...heroDisplay, fontSize: dynamicHeroFontSize }}>
            Fuel Your <br /> <span style={italicText}>Fitness.</span>
          </h1>
          <p style={{ ...heroPara, margin: isMobile ? '0 auto 30px' : '0 0 40px', width: '100%' }}>
            A sanctuary for honest ingredients, mindful preparation, and the art of eating well.
          </p>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row', 
            gap: '15px', 
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <button style={{ ...ctaMain, width: isMobile ? '100%' : 'auto' }} onClick={() => document.getElementById('menu').scrollIntoView()}>
              Explore Menu
            </button>
            <button style={{ ...ctaSecondary, width: isMobile ? '100%' : 'auto' }} onClick={() => navigate('/register')}>
              Join Community
            </button>
          </div>
          <div style={{ marginTop: '40px' }}>
            <span style={kicker1}>3K+ Happy Customers</span>
          </div>
        </div>
      </section>

      {/* --- 🥗 MENU SECTION --- */}
      <section id="menu" style={{ ...sectionWrapper, padding: dynamicPadding }}>
        <div style={centeredHeader}>
          <p style={tagline}>THE OFFERING</p>
          <h2 style={{ ...displayTitle, fontSize: isMobile ? '2.2rem' : '3rem' }}>Curated Nutrition</h2>
        </div>
        
        <div style={{ 
          ...menuGrid, 
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
          gap: isMobile ? '40px' : '80px' 
        }}>
          <MenuCategory title="Oat & Fruit Bowls" items={[
            { name: "Midnight Cacao Oats", desc: "Overnight protein oats, chia, dark chocolate", price: "320" },
            { name: "Bali Morning Acai", desc: "Pure organic acai, dragonfruit, hemp seeds", price: "450" }
          ]} />
          <MenuCategory title="Signature Salads" items={[
            { name: "The Glow Tonic", desc: "Celery, green apple, kale, lemon, ginger", price: "280" },
            { name: "Liquid Gold", desc: "Turmeric, orange, black pepper, carrot", price: "280" }
          ]} />
        </div>
      </section>

      {/* --- 🧠 ABOUT US --- */}
      <section id="about" style={{ ...sectionWrapper, backgroundColor: '#fcfaf7', padding: dynamicPadding }}>
        <div style={{ 
          ...splitLayout, 
          flexDirection: isMobile ? 'column' : 'row', 
          textAlign: isMobile ? 'center' : 'left' 
        }}>
          <div style={splitText}>
            <p style={tagline}>OUR STORY</p>
            <h2 style={{ ...displayTitle, fontSize: isMobile ? '2rem' : '3rem' }}>Mindful. Honest.</h2>
            <p style={bodyText}>
              Healthiffy was born out of a simple frustration—why does healthy food have to be boring and uninspiring? In a world where taste often comes at the cost of nutrition, we set out to create something different. We believe that healthy eating should be exciting, flavorful, and something you genuinely look forward to, not just a routine you follow out of obligation.

At Healthiffy, our kitchen follows a clean and conscious approach: zero refined sugars, zero seed oils, and 100% love in every dish. We focus on using natural, wholesome ingredients to craft meals that nourish your body while satisfying your cravings. For us, it’s not just about food—it’s about building a lifestyle where health and taste go hand in hand.
            </p>
          </div>
          <div style={{ ...imagePlaceholder, width: isMobile ? '100%' : '50%', height: isMobile ? '350px' : '500px' }}>
            <img src='/salad-bowl-CFKZYdO_.jpg' alt="About" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
          </div>
        </div>
      </section>

      {/* --- 📝 JOURNAL --- */}
      <section id="blog" style={{ ...sectionWrapper, padding: dynamicPadding }}>
        <div style={centeredHeader}>
          <p style={tagline}>THE JOURNAL</p>
          <h2 style={{ ...displayTitle, fontSize: isMobile ? '2.2rem' : '3rem' }}>Healthiffy Living</h2>
        </div>
        <div style={{ 
          ...blogGrid, 
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(3, 1fr)' 
        }}>
          <BlogCard title="Why Oats are perfect" date="Jan 12, 2026" img="/oats-bowl-ClHlNj-z.jpg" />
          <BlogCard title="The 80/20 Rule" date="Jan 08, 2026" img="/fruit-bowl-b-MNDGaO.jpg" />
          <BlogCard title="Smoothies vs Juices" date="Jan 05, 2026" img="/fresh-juice-Dz9n83v1.jpg" />
        </div>
      </section>

      {/* --- 📞 CONTACT & FOOTER --- */}
      <footer id="contact" style={{ ...footerContainer, padding: isMobile ? '60px 20px' : '100px 8%' }}>
        <div style={{ ...footerGrid, flexDirection: isMobile ? 'column' : 'row', gap: '40px' }}>
          <div style={{ flex: 2 }}>
            <h2 style={{ fontSize: isMobile ? '1.8rem' : '2.2rem', marginBottom: '20px' }}>Join the Journey</h2>
            <div style={contactDetail}><MapPin size={18} /> Shop Number 6,Healthiffy,Mantri House,FC Road,Inside First Gate,Opposite MacDonald's, Shivajinagar ,Pune, Maharashtra 41104</div>
            <div style={contactDetail}><Phone size={18} /> +91 82630 45675</div>
          </div>
          <div style={{ display: 'flex', gap: '50px' }}>
            <div>
              <p style={footerHeading}>Connect</p>
              <p style={footerLink}>Instagram</p>
              <p style={footerLink}>Twitter</p>
            </div>
            <div>
              <p style={footerHeading}>Legal</p>
              <p style={footerLink}>Privacy</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- SUB-COMPONENTS (With responsive price/desc) ---
const MenuCategory = ({ title, items }) => (
  <div style={{ marginBottom: '40px' }}>
    <h3 style={menuTitle}>{title}</h3>
    {items.map((item, i) => (
      <div key={i} style={menuItemRow}>
        <div style={{ flex: 1, paddingRight: '10px' }}>
          <div style={itemName}>{item.name}</div>
          <div style={itemDesc}>{item.desc}</div>
        </div>
        <div style={itemPrice}>₹{item.price}</div>
      </div>
    ))}
  </div>
);

const BlogCard = ({ title, date, img }) => (
  <div style={{ marginBottom: '30px' }}>
    <div style={{ ...blogThumb, backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
    <p style={itemDesc}>{date}</p>
    <h4 style={{ fontSize: '1.2rem', margin: '10px 0', fontWeight: '700' }}>{title}</h4>
    <p style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}>Read Article —</p>
  </div>
);

// --- STYLES OBJECTS ---
const container = { fontFamily: "'Inter', sans-serif", color: '#1a1a1a', backgroundColor: '#fff' };


const heroSection = { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1)), url("/hero-food-Cw5-AaSQ.jpg")', backgroundSize: 'cover', backgroundPosition: 'center' };
const heroContent = { 
  maxWidth: '850px',
  textAlign: 'center',
  display: 'flex',          // make it a flex container
  flexDirection: 'column',  // stack children vertically
  alignItems: 'center',     // horizontally center all children
  justifyContent: 'center',
  padding: '20px',
};

const heroDisplay = { fontWeight: '800', lineHeight: '1.1', marginBottom: '20px' };
const italicText = { fontStyle: 'italic', color: '#27ae60' };
const heroPara = { 
  fontSize: '1.1rem', 
  color: '#444', 
  marginBottom: '30px', 
  maxWidth: '600px', 
  textAlign: 'center',   // <-- centers the text
  marginLeft: 'auto',    // <-- centers the block horizontally
  marginRight: 'auto'    // <-- centers the block horizontally
};

const kicker = { fontSize: '0.75rem', fontWeight: '800', letterSpacing: '3px', color: '#27ae60', marginBottom: '10px', display: 'block' };
const kicker1 = { fontSize: '0.8rem', fontWeight: '700', color: '#333' };

const ctaMain = { background: '#27ae60', color: '#fff', border: 'none', padding: '16px 35px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' };
const ctaSecondary = { background: 'transparent', color: '#1a1a1a', border: '2px solid #1a1a1a', padding: '15px 35px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' };

const sectionWrapper = { width: '100%', boxSizing: 'border-box' };
const centeredHeader = { textAlign: 'center', marginBottom: '60px' };
const tagline = { fontSize: '0.7rem', fontWeight: '900', letterSpacing: '3px', color: '#27ae60', marginBottom: '10px' };
const displayTitle = { fontWeight: '800' };

const menuGrid = { display: 'grid' };
const menuTitle = { fontSize: '1.3rem', borderBottom: '2px solid #1a1a1a', paddingBottom: '10px', marginBottom: '25px', fontWeight: '800' };
const menuItemRow = { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'flex-start' };
const itemName = { fontSize: '1.05rem', fontWeight: '700' };
const itemDesc = { fontSize: '0.85rem', color: '#777', marginTop: '3px' };
const itemPrice = { fontWeight: '800', fontSize: '1.05rem' };

const splitLayout = { display: 'flex', alignItems: 'center' };
const splitText = { flex: 1 };
const bodyText = { fontSize: '1.1rem', color: '#555', lineHeight: '1.7', marginTop: '20px' };
const imagePlaceholder = { overflow: 'hidden' };

const blogGrid = { display: 'grid', gap: '30px' };
const blogThumb = { height: '280px', backgroundColor: '#f5f5f5', marginBottom: '15px', borderRadius: '12px' };

const footerContainer = { backgroundColor: '#f9f9f9', borderTop: '1px solid #eee' };
const footerGrid = { display: 'flex' };
const footerHeading = { fontWeight: '900', fontSize: '0.75rem', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' };
const footerLink = { color: '#666', marginBottom: '8px', fontSize: '0.9rem', cursor: 'pointer' };
const contactDetail = { display: 'flex', alignItems: 'center', gap: '10px', color: '#555', margin: '12px 0', fontSize: '0.95rem' };

/* ================= NAVBAR STYLES ================= */
const navStyle = {
  position: 'fixed',
  top: 0,
  width: '100%',
  zIndex: 1000,
  transition: '0.3s ease',
  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
};

const navContent = {
  maxWidth: '1300px',
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const logo = {
  fontWeight: 900,
  fontSize: '1.4rem',
  letterSpacing: '2px',
};

const navLinks = {
  display: 'flex',
  gap: '30px',
  alignItems: 'center',
};

const navItem = {
  textDecoration: 'none',
  color: '#1a1a1a',
  fontSize: '0.85rem',
  fontWeight: 500,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  transition: 'color 0.2s ease',
};

const portalBtn = {
  backgroundColor: '#1a1a1a',
  color: '#fff',
  border: 'none',
  padding: '10px 22px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.8rem',
  transition: 'background 0.2s ease',
};
const mobileDropdown = {
  position: 'fixed',
  top: '65px',            // below navbar
  left: '10px',           // small space from left screen edge
  right: '10px',          // small space from right screen edge
  backgroundColor: '#fff',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  borderRadius: '8px',
  border: '1px solid #eee',
  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
  zIndex: 9999,
};


const mobileNavItem = {
  textDecoration: 'none',
  color: '#1a1a1a',
  fontSize: '1rem',
  fontWeight: 600,
  padding: '10px 0',
  borderBottom: '1px solid #f0f0f0',
  transition: 'color 0.2s ease',
};







export default LandingPage;