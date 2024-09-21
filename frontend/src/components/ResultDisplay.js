import React from 'react';

const ResultDisplay = ({ result }) => {
  if (!result) return null;

  return (
    <div>
      <h3>Results:</h3>
      {result.api === 'huggingface' && (
        <div>
          <p>Label: {result.result.label}</p>
          <p>Score: {result.result.score.toFixed(4)}</p>
        </div>
      )}
      {result.api === 'google_nlp' && (
        <div>
          <h4>Sentiment:</h4>
          <p>Score: {result.result.sentiment.score.toFixed(4)}</p>
          <p>Magnitude: {result.result.sentiment.magnitude.toFixed(4)}</p>
          <h4>Top Entities:</h4>
          <ul>
            {result.result.entities.map((entity, index) => (
              <li key={index}>
                {entity.name} (Type: {entity.type}, Salience: {entity.salience.toFixed(4)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
