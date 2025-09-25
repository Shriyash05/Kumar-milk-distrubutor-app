import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo.png";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: ""
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    const { name, email, password, confirmPassword, phone, address } = formData;

    // Check if any field is empty
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim() ||
      !phone.trim() ||
      !address.trim()
    ) {
      setMessage("All fields are required");
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/; // Indian phone number validation

    if (!emailRegex.test(email)) {
      setMessage("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    if (!phoneRegex.test(phone)) {
      setMessage("Please enter a valid 10-digit phone number");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const cleanedData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        address: address.trim(),
      };

      const res = await axios.post(
        "/api/auth/register",
        cleanedData
      );

      setMessage("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12" style={{ backgroundColor: 'var(--neutral-gray-50)' }}>
      <div className="w-full max-w-lg">
        <div className="card">
          <div className="card-body">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <img src={logo} alt="Kumar Milk Distributors" className="h-12 w-auto" />
              </div>
              <h1 className="heading-2 mb-2">Create Account</h1>
              <p className="text-muted">Join Kumar Milk Distributors today</p>
            </div>

            {/* Message */}
            {message && (
              <div 
                className={`mb-6 p-4 rounded-lg text-sm ${
                  message.includes('successful') 
                    ? 'badge-success' 
                    : 'badge-danger'
                }`}
                style={{ display: 'block' }}
              >
                {message}
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your full name"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="10-digit phone number"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your email address"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your complete address"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Create a password"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Confirm your password"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="btn btn-primary w-full py-3 text-base"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="loading-spinner"></div>
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </form>

            {/* Login Link */}
            <div className="text-center mt-6 pt-6" style={{ borderTop: '1px solid var(--neutral-gray-200)' }}>
              <p className="text-muted">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="font-medium"
                  style={{ color: 'var(--accent-blue)' }}
                >
                  Sign in instead
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/")}
            className="text-muted hover:text-gray-700 text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
