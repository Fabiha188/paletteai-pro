import React, { useEffect } from 'react'

const tools = [
  { icon: 'fa-palette',          title: 'Palette Generator', desc: 'One-click color combos.' },
  { icon: 'fa-fill-drip',        title: 'Gradient Editor',   desc: 'Multi-stop gradients made easy.' },
  { icon: 'fa-universal-access', title: 'Contrast Checker',  desc: 'WCAG compliant designs.' },
  { icon: 'fa-code',             title: 'CSS Exporter',      desc: 'Copy CSS & Tailwind config.' },
]

export default function Tools() {
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
    document.querySelectorAll('.tool-item').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="tools">
      <div className="section-header">
        <h2>Powerful <span className="gradient-text">Tools</span> at Your Fingertips</h2>
        <p className="section-subtitle">Everything you need to build the perfect palette.</p>
      </div>
      <div className="tools-grid">
        {tools.map((t, i) => (
          <div className="tool-item" key={i}>
            <div className="tool-icon"><i className={`fas ${t.icon}`}></i></div>
            <h4>{t.title}</h4>
            <p>{t.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
