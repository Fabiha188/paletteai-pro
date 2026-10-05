import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const plans = [
  {
    name: 'Free',
    price: '$0',
    features: ['5 palettes / day', 'Basic color tools', 'Community support'],
  },
  {
    name: 'Pro',
    price: '$12',
    popular: true,
    features: ['Unlimited palettes', 'AI Color Suggestions', 'Export to Figma / CSS', 'Priority support'],
  },
  {
    name: 'Enterprise',
    price: '$49',
    features: ['Everything in Pro', 'Team collaboration', 'Brand kit management', 'Dedicated account manager'],
  },
]

export default function Pricing() {
  const navigate = useNavigate()
  const { user, openAuthModal } = useAuth()
  const handleFree = () => (user ? navigate('/studio') : openAuthModal('signup'))
  return (
    <div className="pricing-content" style={{ paddingTop: '60px' }}>
      <div className="section-header">
        <h2>💎 Choose Your <span className="gradient-text">Plan</span></h2>
        <p className="section-subtitle">Start free, upgrade as you grow.</p>
      </div>
      <div className="pricing-grid">
        {plans.map((plan, i) => (
          <div className={`pricing-card ${plan.popular ? 'popular' : ''}`} key={i}>
            {plan.popular && (
              <div style={{
                position: 'absolute', top: '-12px', left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--primary)', color: 'white',
                padding: '4px 20px', borderRadius: '30px',
                fontSize: '0.8rem', fontWeight: '600',
              }}>
                Popular
              </div>
            )}
            <h3>{plan.name}</h3>
            <div className="price">{plan.price} <span>/month</span></div>
            <ul>
              {plan.features.map((f, j) => (
                <li key={j}><i className="fas fa-check"></i> {f}</li>
              ))}
            </ul>
            <button
              className="cta-primary"
              style={{ border: 'none', cursor: 'pointer' }}
              onClick={plan.name === 'Free' ? handleFree : undefined}
            >
              {plan.name === 'Free' ? 'Get Started' : plan.name === 'Pro' ? 'Start Pro Trial' : 'Contact Sales'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
