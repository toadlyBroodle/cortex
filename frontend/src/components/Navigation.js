import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = ({ onLogout, username }) => {
  return (
    <nav>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/api-selection">API Selection</Link></li>
        <li><Link to="/profile">User Profile</Link></li>
        <li><Link to="/usage-dashboard">Usage Dashboard</Link></li>
        <li>Logged in as: {username}</li>
        <li><button onClick={onLogout}>Logout</button></li>
      </ul>
    </nav>
  );
};

export default Navigation;
