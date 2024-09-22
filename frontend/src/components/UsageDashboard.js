import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './UsageDashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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

  const chartData = {
    labels: usageData.map(item => item.api_name),
    datasets: [
      {
        label: 'API Usage Count',
        data: usageData.map(item => item.usage_count),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'API Usage Chart',
      },
    },
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
        <>
          <div className="chart-container">
            <Bar data={chartData} options={chartOptions} />
          </div>
          {usageData.length === 0 ? (
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
          )}
        </>
      )}
    </div>
  );
};

export default UsageDashboard;
