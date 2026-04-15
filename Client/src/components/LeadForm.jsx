import React, { useState } from "react";
import { validateForm } from "../utils/validation";

const InputField = ({ label, name, id, type = "text", value, onChange, error, placeholder }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-600 mb-1">
      {label} <span className="text-pink-500">*</span>
    </label>
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-4 py-3 rounded-lg bg-white border text-gray-800 placeholder-gray-400
        focus:outline-none focus:ring-2 transition-all text-sm
        ${error
          ? "border-red-400 focus:ring-red-300"
          : "border-gray-200 focus:ring-pink-300 focus:border-pink-400"
        }`}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

const LeadForm = ({ onSubmit, isLoading }) => {
  const [fields, setFields] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit(fields);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="inline-block bg-pink-50 border border-pink-200 rounded-full px-4 py-1.5 text-pink-600 text-xs font-semibold mb-3 tracking-wide uppercase">
          🎁 Exclusive Offer Inside
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">
          Spin to Win
        </h2>
        <p className="text-gray-500 text-sm">
          Fill in your details and spin the wheel for a special health offer — just for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <InputField
          label="Full Name" id="name"
          value={fields.name} onChange={handleChange}
          error={errors.name} placeholder="John Doe"
          {...{ name: "name" }}
        />
        <InputField
          label="Phone Number" id="phone" type="tel"
          value={fields.phone} onChange={(e) => setFields(p => ({ ...p, phone: e.target.value }))}
          error={errors.phone} placeholder="+91 98765 43210"
          name="phone"
        />
        <InputField
          label="Email Address" id="email" type="email"
          value={fields.email} onChange={(e) => setFields(p => ({ ...p, email: e.target.value }))}
          error={errors.email} placeholder="john@example.com"
          name="email"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 mt-2 rounded-lg font-semibold text-base
            bg-pink-600 hover:bg-pink-700 text-white transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-pink-200
            hover:shadow-pink-300 hover:-translate-y-0.5 active:translate-y-0"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </span>
          ) : (
            "Book Free Consultation 🎡"
          )}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          Your information is safe and secure with us.
        </p>
      </form>
    </div>
  );
};

export default LeadForm;