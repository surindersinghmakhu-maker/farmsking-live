import { login, registerFarmer } from '../auth.api';
import { apiClient } from '../client';

describe('Admin Auth API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('login should send credentials to backend', async () => {
    const mockAuthResponse = {
      token: 'fake-admin-jwt',
      user: {
        id: 'admin-1',
        mobile: '9872066901',
        role: 'ADMIN',
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      data: mockAuthResponse,
    });

    const response = await login({ mobile: '9872066901', password: 'securePassword123' });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      mobile: '9872066901',
      password: 'securePassword123',
      portal: 'ADMIN',
    });
    expect(response.token).toBe('fake-admin-jwt');
    expect(response.user.role).toBe('ADMIN');
  });

  it('registerFarmer should post registration payload to backend', async () => {
    const mockResponse = {
      token: 'fake-farmer-jwt',
      user: {
        id: 'user-new-1',
        name: 'Sardar Baldev Singh',
        mobile: '9876543210',
        role: 'FARMER',
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      data: mockResponse,
    });

    const payload = {
      mobile: '9876543210',
      password: 'FarmerPassword123',
      name: 'Sardar Baldev Singh',
      pincode: '144601',
    };

    const response = await registerFarmer(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/auth/register', payload);
    expect(response.token).toBe('fake-farmer-jwt');
    expect(response.user.id).toBe('user-new-1');
  });
});
