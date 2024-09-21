import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UsageDashboard = () => {
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('/api/usage', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUsageData(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch usage data');
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>API Usage Dashboard</h2>
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
    </div>
  );
};

export default UsageDashboard;
