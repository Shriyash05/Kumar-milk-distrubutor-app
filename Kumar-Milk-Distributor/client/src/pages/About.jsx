import React from "react";
import image from "../assets/image.png";

const AboutUs = () => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6">
      {/* Background Image with opacity using pseudo-element */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-5"
        style={{ backgroundImage: `url(${image})` }}
      ></div>

      {/* About Section */}
      <div className="w-full bg-[#ededed] shadow-lg rounded-2xl p-12 text-center relative">
        <h1 className="text-4xl font-bold text-[#6c4836] mb-6 animate-fade-in">
          About Us
        </h1>
        <p className="text-gray-700 text-lg leading-relaxed animate-slide-up">
          Welcome to{" "}
          <span className="font-semibold">Kumar Milk Distributors</span>, your
          trusted source for pure, farm-fresh milk and dairy products. We
          believe in delivering <strong>Quality and Freshness</strong> straight
          to your doorstep.
        </p>
      </div>

      {/* Feature Boxes Section */}
      <div className="w-full flex flex-wrap justify-center gap-6 mt-8 px-6">
        {[
          {
            title: "100% Pure & Organic",
            description: "We provide completely natural and organic milk.",
          },
          {
            title: "Farm-to-Home Freshness",
            description:
              "Directly sourced from farms, ensuring freshness and hygiene.",
          },
          {
            title: "Ethical & Sustainable",
            description:
              "We support local farmers and follow ethical farming practices.",
          },
          {
            title: "Doorstep Delivery",
            description: "Get fresh milk delivered right to your doorstep.",
          },
        ].map((feature, index) => (
          <div
            key={index}
            className="bg-white shadow-lg rounded-xl p-6 w-full sm:w-1/2 lg:w-1/4 text-center border-l-4 border-[#6c4836] transform transition-all duration-300 hover:scale-110 hover:shadow-xl"
          >
            <h2 className="text-2xl font-semibold text-[#6c4836] mb-2">
              {feature.title}
            </h2>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AboutUs;
