import React from 'react'
import { useParams } from 'react-router-dom'
import { STATIC_PAGES } from '../content/staticPages'
import NotFound from './NotFound'

export default function InfoPage() {
  const { slug } = useParams()
  const page = STATIC_PAGES[slug]

  if (!page) return <NotFound />

  return (
    <div className="info-page">
      <div className="section-header">
        <i className={`fas ${page.icon} info-page-icon`}></i>
        <h2>{page.title}</h2>
        <p className="section-subtitle">{page.subtitle}</p>
      </div>

      <div className="info-page-body">
        {page.sections.map((s, i) => (
          <div className="info-page-section" key={i}>
            <h3>{s.heading}</h3>
            <p>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
