import React, { useState } from "react";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you can add logic to send the form data to an API or email
    console.log("Form Submitted:", formData);
    alert("Message sent successfully!");
    setFormData({ name: "", email: "", message: "" }); // Clear form after submission
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-6">
      {/* Contact Information Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#6c4836] mb-4">Contact Us</h1>
        <p className="text-lg text-gray-600 mb-4">
          We would love to hear from you!
        </p>
        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-[#6c4836]">Phone</h3>
            <p className="text-lg text-gray-700">9967311830</p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-[#6c4836]">Email</h3>
            <p className="text-lg text-gray-700">arunmadhekar10@gmail.com</p>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="w-full max-w-lg bg-white p-8 shadow-lg rounded-lg">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="name"
              className="block text-lg font-semibold text-[#6c4836] mb-2"
            >
              Your Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6c4836]"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="email"
              className="block text-lg font-semibold text-[#6c4836] mb-2"
            >
              Your Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6c4836]"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="message"
              className="block text-lg font-semibold text-[#6c4836] mb-2"
            >
              Your Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required
              rows="4"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6c4836]"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#6c4836] text-white text-lg font-semibold rounded-lg hover:bg-[#5a3c2d]"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactUs;
