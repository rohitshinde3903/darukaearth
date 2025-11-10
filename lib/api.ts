export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://daruka.pythonanywhere.com';

// Helper to get user email from localStorage
const getUserEmail = () => {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.email;
      } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
      }
    }
  }
  return null;
};

export const apiClient = {
  async get(endpoint: string, addUserEmail: boolean = true) {
    const userEmail = getUserEmail();
    let url = `${API_URL}${endpoint}`;
    
    console.log('API GET - User Email:', userEmail);
    console.log('API GET - Original URL:', url);
    
    // Add user_email as query parameter for filtering
    if (userEmail && addUserEmail) {
      const urlObj = new URL(url);
      if (!urlObj.searchParams.has('user_email')) {
        urlObj.searchParams.append('user_email', userEmail);
      }
      url = urlObj.toString();
    }
    
    console.log('API GET - Final URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  },

  async post(endpoint: string, data: any) {
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
    return response;
  },

  async delete(endpoint: string) {
    const url = `${API_URL}${endpoint}`;
    console.log('API DELETE - URL:', url);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response;
  },
};
