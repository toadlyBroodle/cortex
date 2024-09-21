import React, { useState } from 'react';

const InputForm = ({ onSubmit }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(text);
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter your text here..."
        rows="4"
        cols="50"
      />
      <br />
      <button type="submit">Process</button>
    </form>
  );
};

export default InputForm;
