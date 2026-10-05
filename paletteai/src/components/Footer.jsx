import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer>
      <div className="footer-top">
        <div className="footer-brand">
          <div className="logo"><i className="fas fa-palette"></i> PaletteAI</div>
          <p>Empowering designers to create beautiful, accessible color systems.</p>
        </div>
        <div className="footer-links">
          <div>
            <h4>Product</h4>
            <Link to="/#features">Features</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/integrations">Integrations</Link>
          </div>
          <div>
            <h4>Company</h4>
            <Link to="/about">About</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/careers">Careers</Link>
          </div>
          <div>
            <h4>Support</h4>
            <Link to="/help">Help</Link>
            <Link to="/#contact">Contact</Link>
            <Link to="/privacy">Privacy</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 PaletteAI Pro. Made with <i className="fas fa-heart"></i> for DevSphere</p>
      </div>
    </footer>
  )
}
