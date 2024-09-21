import React from 'react';

const ApiSelector = ({ selectedApi, onApiChange }) => {
  return (
    <div>
      <h3>Select API:</h3>
      <select value={selectedApi} onChange={(e) => onApiChange(e.target.value)}>
        <option value="huggingface">Hugging Face Inference API</option>
        <option value="google_nlp">Google Cloud Natural Language API</option>
      </select>
    </div>
  );
};

export default ApiSelector;
