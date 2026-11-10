import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PhoneVerificationScreen } from '../src/screens/PhoneVerificationScreen';
import { ProfileSetupScreen } from '../src/screens/ProfileSetupScreen';
import * as endpoints from '../src/api/endpoints';

jest.mock('../src/api/endpoints.js');

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate
  })
}));

describe('Onboarding Flow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PhoneVerificationScreen', () => {
    it('validates empty phone number on send OTP', async () => {
      const { getByRole, findByText } = render(<PhoneVerificationScreen />);

      const sendOtpBtn = getByRole('button', { name: /Send Verification Code/i });
      fireEvent.press(sendOtpBtn);

      expect(await findByText('Mobile phone number is required')).toBeTruthy();
      expect(endpoints.sendPhoneOtpApi).not.toHaveBeenCalled();
    });

    it('sends OTP and transitions to code verification step', async () => {
      (endpoints.sendPhoneOtpApi as jest.Mock).mockResolvedValueOnce({
        success: true,
        message: 'Verification code sent',
        mockOtp: '123456'
      });

      const { getByRole, getByPlaceholderText, findByText } = render(<PhoneVerificationScreen />);

      const phoneInput = getByPlaceholderText('+91 98765 43210');
      fireEvent.changeText(phoneInput, '+919123456789');

      const sendOtpBtn = getByRole('button', { name: /Send Verification Code/i });
      fireEvent.press(sendOtpBtn);

      expect(await findByText(/Enter 6-digit code/i)).toBeTruthy();
      expect(endpoints.sendPhoneOtpApi).toHaveBeenCalledWith('+919123456789');
    });

    it('displays error message when phone number is already registered in DB', async () => {
      (endpoints.sendPhoneOtpApi as jest.Mock).mockRejectedValueOnce({
        response: {
          data: {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'This phone number is already registered to another account'
            }
          }
        }
      });

      const { getByRole, getByPlaceholderText, findByText } = render(<PhoneVerificationScreen />);

      const phoneInput = getByPlaceholderText('+91 98765 43210');
      fireEvent.changeText(phoneInput, '+919876543210');

      const sendOtpBtn = getByRole('button', { name: /Send Verification Code/i });
      fireEvent.press(sendOtpBtn);

      expect(await findByText('This phone number is already registered to another account')).toBeTruthy();
    });
  });

  describe('ProfileSetupScreen', () => {
    it('calculates and renders age dynamically from date of birth input', async () => {
      const { getByPlaceholderText, findByText } = render(<ProfileSetupScreen />);

      const dobInput = getByPlaceholderText('YYYY-MM-DD (e.g. 1998-05-14)');
      fireEvent.changeText(dobInput, '1995-05-14');

      expect(await findByText(/Calculated Age:/i)).toBeTruthy();
      expect(await findByText(/Adult/i)).toBeTruthy();
    });

    it('validates required fields before submitting profile', async () => {
      const { getByRole, findByText } = render(<ProfileSetupScreen />);

      const saveBtn = getByRole('button', { name: /Save & Enter MediBook/i });
      fireEvent.press(saveBtn);

      expect(await findByText('Full name is required')).toBeTruthy();
      expect(endpoints.updateProfileApi).not.toHaveBeenCalled();
    });
  });
});

