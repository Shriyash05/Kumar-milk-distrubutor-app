import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/kumar-logo.svg";
import milk from "../assets/milk.png";
import AboutUs from "./About";
import OrderInstructions from "./OrderInstruction";
import MilkPrices from "./Products";
import ContactUs from "./contactus";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--neutral-gray-50)' }}>
      {/* Navigation Header */}
      <nav className="w-full py-4 px-6" style={{ backgroundColor: 'var(--neutral-white)' }}>
        <div className="container flex-between">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="Kumar Milk Distributors" className="h-12 w-auto" />
            <span className="heading-4 mb-0" style={{ color: 'var(--neutral-gray-900)' }}>
              Kumar Milk Distributors
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/login")}
            >
              Sign In
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/register")}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="heading-1" style={{ color: 'var(--neutral-gray-900)' }}>
                  Fresh Dairy,
                  <br />
                  <span style={{ color: 'var(--accent-blue)' }}>Delivered Daily</span>
                </h1>
                <p className="text-lg text-muted leading-relaxed">
                  Professional milk distribution management system. 
                  Streamline your daily operations, manage orders efficiently, 
                  and ensure fresh dairy reaches every customer on time.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  className="btn btn-primary text-base px-8 py-4"
                  onClick={() => navigate("/register")}
                >
                  Start Your Business
                </button>
                <button
                  className="btn btn-secondary text-base px-8 py-4"
                  onClick={() => navigate("/prices")}
                >
                  View Products
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--accent-blue)' }}>100%</div>
                  <div className="text-small text-muted">Fresh & Pure</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--accent-green)' }}>24/7</div>
                  <div className="text-small text-muted">Order Management</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--accent-orange)' }}>500+</div>
                  <div className="text-small text-muted">Happy Customers</div>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative max-w-md w-full">
                <div 
                  className="absolute inset-0 rounded-3xl transform rotate-3"
                  style={{ backgroundColor: 'var(--accent-blue)', opacity: '0.1' }}
                ></div>
                <img
                  src={milk}
                  alt="Fresh Dairy Products"
                  className="relative z-10 w-full h-auto object-contain rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16" style={{ backgroundColor: 'var(--neutral-white)' }}>
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="heading-3 mb-4">Trusted by Businesses Across the Region</h2>
            <p className="text-muted max-w-2xl mx-auto">
              Join hundreds of dairy businesses that rely on our platform for their daily operations
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { metric: "1000+", label: "Daily Orders" },
              { metric: "50+", label: "Partner Farms" },
              { metric: "99.9%", label: "Uptime" },
              { metric: "24h", label: "Support" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div 
                  className="text-3xl font-bold mb-2" 
                  style={{ color: 'var(--accent-blue)' }}
                >
                  {item.metric}
                </div>
                <div className="text-small text-muted">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="heading-3 mb-4">What Our Clients Say</h2>
            <p className="text-muted max-w-2xl mx-auto">Distributors rely on our platform to streamline their daily operations and delight customers.</p>
          </div>
          <div className="grid-auto-fit">
            {[{
              quote: "This system reduced our morning chaos by half. Orders are accurate and on time.",
              name: "R. Patil",
              role: "Retailer, Pune",
            }, {
              quote: "Inventory planning is so much easier now. The warnings help us avoid shortages.",
              name: "M. Desai",
              role: "Distributor, Mumbai",
            }, {
              quote: "Simple, fast, and reliable. Our customers are happier with timely deliveries.",
              name: "S. Kulkarni",
              role: "Retailer, Nashik",
            }].map((t, i) => (
              <div key={i} className="card">
                <div className="card-body">
                  <p className="text-lg mb-4" style={{ color: 'var(--neutral-gray-800)' }}>
                    “{t.quote}”
                  </p>
                  <div className="text-small text-muted">{t.name} • {t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div>
        <AboutUs />
        <OrderInstructions />
        <MilkPrices />
        <ContactUs />
      </div>

      {/* Footer */}
      <footer className="py-12" style={{ backgroundColor: 'var(--neutral-gray-800)' }}>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-[color:var(--neutral-gray-400)]">
            <div>
              <div className="heading-4 mb-3" style={{ color: 'var(--neutral-white)' }}>Kumar Milk Distributors</div>
              <p className="text-small">Fresh dairy delivered daily. Manage orders, inventory, and deliveries with ease.</p>
            </div>
            <div>
              <div className="font-semibold mb-3" style={{ color: 'var(--neutral-white)' }}>Product</div>
              <ul className="space-y-2 text-small">
                <li>Order Management</li>
                <li>Inventory Planning</li>
                <li>Delivery Tracking</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-3" style={{ color: 'var(--neutral-white)' }}>Company</div>
              <ul className="space-y-2 text-small">
                <li>About</li>
                <li>Contact</li>
                <li>Support</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-3" style={{ color: 'var(--neutral-white)' }}>Get Started</div>
              <button className="btn btn-primary w-full" onClick={() => navigate('/register')}>Create Account</button>
            </div>
          </div>
          <div className="text-center mt-8 text-small" style={{ color: 'var(--neutral-gray-400)' }}>
            © 2025 Kumar Milk Distributors. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
