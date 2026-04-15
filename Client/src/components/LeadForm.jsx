import React, { useState } from "react";
import { validateForm } from "../utils/validation";

const InputField = ({ label,name, id, type = "text", value, onChange, error, placeholder }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
      {label} <span className="text-red-400">*</span>
    </label>
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white placeholder-gray-500 
        focus:outline-none focus:ring-2 transition-all
        ${error
          ? "border-red-500 focus:ring-red-500/40"
          : "border-white/20 focus:ring-yellow-400/40 focus:border-yellow-400/60"
        }`}
    />
    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
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
      <div className="text-center mb-8">
        <div className="inline-block bg-yellow-400/20 border border-yellow-400/40 rounded-full px-4 py-1.5 text-yellow-300 text-sm font-medium mb-4">
          🎁 Exclusive Offer Inside
        </div>
        <h2 className="font-display text-3xl font-bold text-white mb-2">
          Spin to Win
        </h2>
        <p className="text-gray-400 text-sm">
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
          label="Email Address" id="email" type="email"
          value={fields.email} onChange={(e) => setFields(p => ({ ...p, email: e.target.value }))}
          error={errors.email} placeholder="john@example.com"
        />
        <InputField
          label="Phone Number" id="phone" type="tel"
          value={fields.phone} onChange={(e) => setFields(p => ({ ...p, phone: e.target.value }))}
          error={errors.phone} placeholder="+91 98765 43210"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 mt-2 rounded-xl font-semibold text-lg bg-gradient-to-r from-yellow-400 to-orange-500 
            text-gray-900 hover:from-yellow-300 hover:to-orange-400 transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30
            hover:shadow-orange-500/50 hover:-translate-y-0.5 active:translate-y-0"
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
            "🎡 Spin the Wheel!"
          )}
        </button>
        <p className="text-center text-xs text-gray-500 mt-4">
          Your information is safe with us. We do not share your data.
        </p>
      </form>
    </div>
  );
};

export default LeadForm;