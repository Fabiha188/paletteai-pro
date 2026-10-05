import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'

const features = [
  { icon: 'fa-robot',           bg: '#ede9fe', color: '#8B5CF6', title: 'AI Suggestions',    desc: 'Get complementary palettes based on your brand and mood.', to: '/studio' },
  { icon: 'fa-fill-drip',       bg: '#fce7f3', color: '#db2777', title: 'Gradient Maker',     desc: 'Create smooth, beautiful gradients with a simple click.', to: '/gradient' },
  { icon: 'fa-universal-access',bg: '#d1fae5', color: '#059669', title: 'Accessibility Check', desc: 'Ensure your colors meet WCAG contrast standards.', to: '/studio' },
  { icon: 'fa-file-export',     bg: '#fef3c7', color: '#d97706', title: 'Export Colors',       desc: 'Export as CSS variables, Tailwind config, or PNG.', to: '/dashboard' },
]

export default function Features() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.2 }
    )
    document.querySelectorAll('.feature-card').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section id="features" className="features">
      <div className="section-header">
        <h2>Everything You Need to <span className="gradient-text">Master Color</span></h2>
        <p className="section-subtitle">From inspiration to implementation — PaletteAI covers it all.</p>
      </div>
      <div className="features-container">
        {features.map((f, i) => (
          <div className="feature-card" key={i} data-delay={i * 150}>
            <div className="icon-wrapper" style={{ background: f.bg, color: f.color }}>
              <i className={`fas ${f.icon}`}></i>
            </div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            <Link to={f.to} className="card-link">Learn More →</Link>
          </div>
        ))}
      </div>
    </section>
  )
}
