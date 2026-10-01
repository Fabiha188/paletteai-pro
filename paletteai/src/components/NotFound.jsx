import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="page not-found">
      <i className="fas fa-compass"></i>
      <h1>404</h1>
      <p>This page doesn't exist — looks like you followed a broken link or mistyped the URL.</p>
      <Link to="/" className="cta-primary">
        <i className="fas fa-house"></i> Back to Home
      </Link>
    </div>
  )
}
