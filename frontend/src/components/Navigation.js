import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = ({ onLogout }) => {
  return (
    <nav>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/api-selection">API Selection</Link></li>
        <li><Link to="/usage-dashboard">Usage Dashboard</Link></li>
        <li><button onClick={onLogout}>Logout</button></li>
      </ul>
    </nav>
  );
};

export default Navigation;
