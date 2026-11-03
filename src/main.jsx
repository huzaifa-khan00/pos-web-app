import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error)
      return (
        <div className="p-8">
          <h1 className="text-xl font-bold text-red-600">Something went wrong</h1>
          <pre className="mt-3 whitespace-pre-wrap text-sm">{String(this.state.error)}</pre>
          <button className="mt-4 rounded bg-amber-500 px-4 py-2 font-semibold" onClick={() => location.reload()}>Reload</button>
        </div>
      );
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary><App /></ErrorBoundary>
);
