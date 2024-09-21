import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';
import ApiSelector from './components/ApiSelector';
import InputForm from './components/InputForm';
import ResultDisplay from './components/ResultDisplay';
import Auth from './components/Auth';
import Navigation from './components/Navigation';
import UserProfile from './components/UserProfile';
import UsageDashboard from './components/UsageDashboard';
import './App.css';

const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('authToken') !== null;
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

function App() {
  const [selectedApi, setSelectedApi] = useState('huggingface');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('authToken') !== null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsLoggedIn(true);
      // You might want to fetch the username here if it's not stored in localStorage
    }
  }, []);

  const handleApiChange = (api) => {
    setSelectedApi(api);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (text) => {
    try {
      setError(null);
      const token = localStorage.getItem('authToken');
      const response = await axios.post('/api/process', {
        api: selectedApi,
        text: text,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
      if (err.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const handleLogin = (loggedInUsername, token) => {
    setIsLoggedIn(true);
    setUsername(loggedInUsername);
    localStorage.setItem('authToken', token);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    localStorage.removeItem('authToken');
  };

  return (
    <Router>
      <div className="App">
        <h1>API Integration App</h1>
        {isLoggedIn ? (
          <>
            <Navigation onLogout={handleLogout} username={username} />
            <Routes>
              <Route path="/" element={
                <PrivateRoute>
                  <ApiSelector selectedApi={selectedApi} onApiChange={handleApiChange} />
                  <InputForm onSubmit={handleSubmit} />
                  {error && <p className="error">{error}</p>}
                  <ResultDisplay result={result} />
                </PrivateRoute>
              } />
              <Route path="/api-selection" element={<PrivateRoute><ApiSelector selectedApi={selectedApi} onApiChange={handleApiChange} /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
              <Route path="/usage-dashboard" element={<PrivateRoute><UsageDashboard /></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </>
        ) : (
          <Auth setIsLoggedIn={handleLogin} />
        )}
      </div>
    </Router>
  );
}

export default App;
