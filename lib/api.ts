export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://daruka.pythonanywhere.com';

// Helper to get user email from localStorage
const getUserEmail = () => {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user');
    console.log('getUserEmail - Raw localStorage data:', userData);
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('getUserEmail - Parsed user object:', user);
        console.log('getUserEmail - User email:', user.email);
        
        if (!user.email) {
          console.error('getUserEmail - No email property found in user object!');
          console.error('getUserEmail - User object keys:', Object.keys(user));
        }
        
        return user.email;
      } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
      }
    }
  }
  console.log('getUserEmail - No user found in localStorage');
  return null;
};

export const apiClient = {
  async get(endpoint: string, addUserEmail: boolean = true) {
    try {
      const userEmail = getUserEmail();
      let url = `${API_URL}${endpoint}`;
      
      console.log('API GET - User Email:', userEmail);
      console.log('API GET - Original endpoint:', endpoint);
      console.log('API GET - Add user email?:', addUserEmail);
      
      // Add user_email as query parameter for filtering
      if (userEmail && addUserEmail) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}user_email=${encodeURIComponent(userEmail)}`;
      }
      
      console.log('API GET - Final URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('API GET - Response status:', response.status);
      return response;
    } catch (error) {
      console.error('API GET - Error:', error);
      throw error;
    }
  },

  async post(endpoint: string, data: any) {
    try {
      const url = `${API_URL}${endpoint}`;
      console.log('API POST - URL:', url);
      console.log('API POST - Data:', data);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      console.log('API POST - Response status:', response.status);
      const responseData = await response.json();
      console.log('API POST - Response data:', responseData);
      
      // Return a new response with the data already parsed
      return {
        ...response,
        json: async () => responseData,
      } as Response;
    } catch (error) {
      console.error('API POST - Error:', error);
      throw error;
    }
  },

  async delete(endpoint: string) {
    try {
      const url = `${API_URL}${endpoint}`;
      console.log('API DELETE - URL:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('API DELETE - Response status:', response.status);
      return response;
    } catch (error) {
      console.error('API DELETE - Error:', error);
      throw error;
    }
  },
};
