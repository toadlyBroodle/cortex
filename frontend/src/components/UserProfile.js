import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [apiKeys, setApiKeys] = useState({
    huggingface_api_key: '',
    google_nlp_api_key: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleInputChange = (e) => {
    setApiKeys({ ...apiKeys, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put('/api/update_profile', apiKeys);
      setMessage(response.data.message);
      fetchProfile();
    } catch (error) {
      setMessage(error.response?.data?.error || 'An error occurred');
    }
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>User Profile</h2>
      <p>Username: {profile.username}</p>
      <p>Email: {profile.email}</p>
      <p>Total API Calls: {profile.api_calls}</p>
      <h3>API Keys</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Hugging Face API Key:
            <input
              type="password"
              name="huggingface_api_key"
              value={apiKeys.huggingface_api_key}
              onChange={handleInputChange}
              placeholder={profile.has_huggingface_api_key ? '********' : 'Enter API Key'}
            />
          </label>
        </div>
        <div>
          <label>
            Google NLP API Key:
            <input
              type="password"
              name="google_nlp_api_key"
              value={apiKeys.google_nlp_api_key}
              onChange={handleInputChange}
              placeholder={profile.has_google_nlp_api_key ? '********' : 'Enter API Key'}
            />
          </label>
        </div>
        <button type="submit">Update API Keys</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default UserProfile;
