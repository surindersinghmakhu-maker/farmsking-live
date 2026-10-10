import { sendLoginOtpApi, verifyLoginOtpApi } from '../auth.api';
import { apiClient } from '../client';

describe('Auth API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sendLoginOtpApi should send mobile number to backend', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      data: { success: true, message: 'OTP sent' },
    });

    const response = await sendLoginOtpApi('9876543210');

    expect(apiClient.post).toHaveBeenCalledWith('/auth/send-login-otp', {
      mobile: '9876543210',
    });
    expect(response.success).toBe(true);
  });

  it('verifyLoginOtpApi should send OTP to backend and return token and user', async () => {
    const mockData = {
      accessToken: 'fake-jwt-token',
      user: {
        id: '1',
        mobile: '9876543210',
        role: 'FARMER',
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      data: mockData,
    });

    const response = await verifyLoginOtpApi({ mobile: '9876543210', otp: '123456' });

    expect(apiClient.post).toHaveBeenCalledWith('/auth/verify-login-otp', {
      mobile: '9876543210',
      otp: '123456',
    });
    expect(response.accessToken).toBe('fake-jwt-token');
    expect(response.user.id).toBe('1');
  });
});
