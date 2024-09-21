import React, { useState } from 'react';
import axios from 'axios';
import ApiSelector from './components/ApiSelector';
import InputForm from './components/InputForm';
import ResultDisplay from './components/ResultDisplay';
import './App.css';

function App() {
  const [selectedApi, setSelectedApi] = useState('huggingface');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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
    }
  };

  return (
    <div className="App">
      <h1>API Integration App</h1>
      <ApiSelector selectedApi={selectedApi} onApiChange={handleApiChange} />
      <InputForm onSubmit={handleSubmit} />
      {error && <p className="error">{error}</p>}
      <ResultDisplay result={result} />
    </div>
  );
}

export default App;
