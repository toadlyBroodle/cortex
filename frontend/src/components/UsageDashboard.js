import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UsageDashboard.css';

const UsageDashboard = () => {
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axios.get('/api/usage', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUsageData(response.data);
    } catch (err) {
      console.error('Error fetching usage data:', err);
      setError('Failed to fetch usage data: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
  }, []);

  const handleRefresh = () => {
    fetchUsageData();
  };

  return (
    <div className="usage-dashboard">
      <h2>API Usage Dashboard</h2>
      <button onClick={handleRefresh} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh Data'}
      </button>
      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error">{error}</div>}
      {!loading && !error && (
        usageData.length === 0 ? (
          <p>No usage data available yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>API</th>
                <th>Usage Count</th>
                <th>Last Used</th>
              </tr>
            </thead>
            <tbody>
              {usageData.map((item, index) => (
                <tr key={index}>
                  <td>{item.api_name}</td>
                  <td>{item.usage_count}</td>
                  <td>{new Date(item.last_used).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
};

export default UsageDashboard;
