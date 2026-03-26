import React, { useState } from 'react'
import { X } from 'lucide-react'

const ContactFormPopup = ({ isOpen = false, onClose = () => {} }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Simulate form submission
    setTimeout(() => {
      setSubmitted(true)
      setLoading(false)
      // Auto-close after 3 seconds
      setTimeout(() => {
        handleReset()
        onClose()
      }, 3000)
    }, 1000)
  }

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      message: '',
    })
    setSubmitted(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden text-base">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="cursor-pointer absolute top-4 right-5 z-10 p-2 rounded-full hover:bg-orange-50 text-slate-600 hover:text-slate-800 transition"
          aria-label="Close form"
        >
          <X size={24} />
        </button>

        {!submitted ? (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#FE9800] to-[#ff9f1f] px-6 py-4">
              <h2 className="text-xl font-semibold text-white">Get in Touch</h2>
              <p className="mt-2 text-white/90 text-sm">
                Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-3">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-slate-800 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                  className="w-full px-2 py-1.5 text-sm rounded-xl border-2 border-orange-100 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FE9800] focus:ring-2 focus:ring-orange-200 transition"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-800 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="john@example.com"
                  className="w-full px-2 py-1.5 text-sm rounded-xl border-2 border-orange-100 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FE9800] focus:ring-2 focus:ring-orange-200 transition"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-slate-800 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="Tell us how we can help..."
                  rows="3"
                  className="w-full px-2 py-1.5 text-sm rounded-xl border-2 border-orange-100 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FE9800] focus:ring-2 focus:ring-orange-200 transition resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full bg-[#FE9800] hover:bg-[#e68900] text-white font-semibold py-2 px-3 text-sm rounded-xl shadow-[0px_5px_0px_#CB8927] hover:shadow-[0px_3px_0px_#CB8927] transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>

              <p className="text-center text-xs text-slate-500">
                We'll get back to you within 24 hours.
              </p>
            </form>
          </>
        ) : (
          // Success Message
          <div className="px-6 py-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-800">Thank You!</h3>
            <p className="mt-1 text-slate-600 text-sm leading-relaxed">
              Your message has been sent successfully. We'll review your inquiry and get back to you soon.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Closing in a moment...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContactFormPopup
