import React from 'react'
import ColorSwatch from './ColorSwatch'

export default function HistorySidebar({ history, restoreFromHistory, clearHistory, showToast }) {
  return (
    <aside className="history-sidebar">
      <div className="history-header">
        <h4><i className="fas fa-clock-rotate-left"></i> Recent History</h4>
        <button className="history-clear-btn" onClick={clearHistory}>Clear</button>
      </div>

      <div className="history-list">
        {history.length === 0 ? (
          <p className="history-empty">Generate a palette to start your history.</p>
        ) : (
          history.map((entry) => (
            <div
              className="history-item"
              key={entry.id}
              onClick={() => restoreFromHistory(entry)}
            >
              <div className="history-color-row">
                {entry.colors.map((c, i) => (
                  <ColorSwatch key={i} hex={c} showToast={showToast} size="" className="history-swatch" />
                ))}
              </div>
              <time>{entry.time}</time>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
