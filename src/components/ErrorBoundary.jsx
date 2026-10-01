import React from 'react'

// Class components are still the only way to implement an error boundary
// in React — there's no hook equivalent for getDerivedStateFromError.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('PaletteAI crashed:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <i className="fas fa-triangle-exclamation"></i>
          <h2>Something went wrong</h2>
          <p>An unexpected error occurred while rendering the app. Your saved palettes are safe in local storage.</p>
          <button className="cta-primary" onClick={this.handleReset}>
            <i className="fas fa-house"></i> Back to Home
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
