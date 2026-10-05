import { loginWithMobile, verifyLoginOtp } from '../auth.api';
import { apiClient } from '../client';

describe('Auth API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loginWithMobile should send mobile number to backend', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      data: { success: true, message: 'OTP sent' },
    });

    const response = await loginWithMobile('9876543210', 'FARMER');

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      mobile: '9876543210',
      role: 'FARMER',
    });
    expect(response.success).toBe(true);
  });

  it('verifyLoginOtp should send OTP to backend and return token and user', async () => {
    const mockData = {
      token: 'fake-jwt-token',
      user: {
        id: '1',
        mobile: '9876543210',
        role: 'FARMER',
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      data: mockData,
    });

    const response = await verifyLoginOtp('9876543210', '123456', 'FARMER');

    expect(apiClient.post).toHaveBeenCalledWith('/auth/verify-login', {
      mobile: '9876543210',
      otp: '123456',
      role: 'FARMER',
    });
    expect(response.token).toBe('fake-jwt-token');
    expect(response.user.id).toBe('1');
  });
});
