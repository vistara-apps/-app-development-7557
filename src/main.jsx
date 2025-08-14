import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import Web3Wrapper from './components/Web3Wrapper'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Web3Wrapper>
      <App />
    </Web3Wrapper>
  </React.StrictMode>,
)
