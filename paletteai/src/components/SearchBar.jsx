import React from 'react'

export default function SearchBar({ value = '', onChange = () => {}, placeholder = 'Search...' }) {
  return (
    <div className="explore-search">
      <i className="fas fa-search"></i>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button className="clear-search" onClick={() => onChange('')}>
          <i className="fas fa-times"></i>
        </button>
      )}
      <button className="search-btn" type="button" aria-label="Search">
        <i className="fas fa-arrow-right"></i>
      </button>
    </div>
  )
}
