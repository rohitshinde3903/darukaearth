export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://daruka.pythonanywhere.com';

// Helper to get user email from localStorage
const getUserEmail = () => {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.email;
    }
  }
  return null;
};

export const apiClient = {
  async get(endpoint: string, addUserEmail: boolean = true) {
    const userEmail = getUserEmail();
    let url = `${API_URL}${endpoint}`;
    
    // Add user_email as query parameter for filtering
    if (userEmail && addUserEmail && !endpoint.includes('user_email=')) {
      const separator = endpoint.includes('?') ? '&' : '?';
      url = `${url}${separator}user_email=${encodeURIComponent(userEmail)}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  },

  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response;
  },

  async delete(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  },
};
