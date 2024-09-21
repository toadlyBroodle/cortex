import React, { useState } from 'react';
import axios from 'axios';
import ApiSelector from './components/ApiSelector';
import InputForm from './components/InputForm';
import ResultDisplay from './components/ResultDisplay';
import Auth from './components/Auth';
import './App.css';

function App() {
  const [selectedApi, setSelectedApi] = useState('huggingface');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleApiChange = (api) => {
    setSelectedApi(api);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (text) => {
    try {
      setError(null);
      const response = await axios.post('/api/process', {
        api: selectedApi,
        text: text,
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
      if (err.response?.status === 401) {
        setIsLoggedIn(false);
      }
    }
  };

  return (
    <div className="App">
      <h1>API Integration App</h1>
      {isLoggedIn ? (
        <>
          <ApiSelector selectedApi={selectedApi} onApiChange={handleApiChange} />
          <InputForm onSubmit={handleSubmit} />
          {error && <p className="error">{error}</p>}
          <ResultDisplay result={result} />
        </>
      ) : (
        <Auth setIsLoggedIn={setIsLoggedIn} />
      )}
    </div>
  );
}

export default App;
