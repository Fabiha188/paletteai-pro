import React, { useState } from 'react'

export default function Contact() {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [message, setMessage] = useState('')
  const [feedback, setFeedback] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!name || !email || !message) {
      setFeedback('⚠️ Please fill in all fields.')
      return
    }
    if (!email.includes('@') || !email.includes('.')) {
      setFeedback('⚠️ Please enter a valid email address.')
      return
    }

    setFeedback('✅ Message Sent Successfully!')
    setName('')
    setEmail('')
    setMessage('')
    setTimeout(() => setFeedback(''), 5000)
  }

  return (
    <section className="contact" id="contact">
      <div className="section-header">
        <h2>Get in <span className="gradient-text">Touch</span></h2>
        <p className="section-subtitle">Have questions? We'd love to hear from you.</p>
      </div>
      <div className="contact-wrapper">
        <form className="contact-form" onSubmit={handleSubmit}>
          <h4>Send us a message</h4>
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <textarea
            rows="3"
            placeholder="Your Message..."
            maxLength="500"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="char-counter-wrapper">
            <span>{message.length} / 500</span>
          </div>
          <button type="submit" className="cta-primary contact-btn">
            <i className="fas fa-paper-plane"></i> Send Message
          </button>
          <div className="form-feedback">{feedback}</div>
        </form>

        <div className="contact-info compact">
          <p><i className="fas fa-envelope"></i> hello@paletteai.com</p>
          <p><i className="fas fa-map-marker-alt"></i> Silicon Valley, CA</p>
          <div className="contact-social">
            <a href="#"><i className="fab fa-twitter"></i></a>
            <a href="#"><i className="fab fa-linkedin-in"></i></a>
            <a href="#"><i className="fab fa-github"></i></a>
          </div>
        </div>
      </div>
    </section>
  )
}
