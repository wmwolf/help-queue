import React from 'react'
import HelpQueue from './components/help-queue'
// Import our firebase configuration
import './lib/firebase'  // This will ensure Firebase is initialized when the app starts

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <HelpQueue />
    </div>
  )
}

export default App