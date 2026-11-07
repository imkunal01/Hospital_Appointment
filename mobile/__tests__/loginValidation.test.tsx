import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../src/screens/LoginScreen.js';
import * as endpoints from '../src/api/endpoints.js';

jest.mock('../src/api/endpoints.js');

describe('Login Screen Validation & Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates empty email and password inputs', async () => {
    const { getByRole, findByText } = render(<LoginScreen />);

    const signInBtn = getByRole('button', { name: /Sign In/i });
    fireEvent.press(signInBtn);

    expect(await findByText('Email address is required')).toBeTruthy();
    expect(await findByText('Password is required')).toBeTruthy();
    expect(endpoints.loginApi).not.toHaveBeenCalled();
  });

  it('validates invalid email format', async () => {
    const { getByRole, getByPlaceholderText, findByText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText('patient1@example.test');
    const passwordInput = getByPlaceholderText('••••••••');
    const signInBtn = getByRole('button', { name: /Sign In/i });

    fireEvent.changeText(emailInput, 'invalid-email-format');
    fireEvent.changeText(passwordInput, 'ValidPassword123!');
    fireEvent.press(signInBtn);

    expect(await findByText('Please enter a valid email address')).toBeTruthy();
    expect(endpoints.loginApi).not.toHaveBeenCalled();
  });

  it('validates password length minimum (6 characters)', async () => {
    const { getByRole, getByPlaceholderText, findByText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText('patient1@example.test');
    const passwordInput = getByPlaceholderText('••••••••');
    const signInBtn = getByRole('button', { name: /Sign In/i });

    fireEvent.changeText(emailInput, 'patient1@example.test');
    fireEvent.changeText(passwordInput, '123'); // only 3 characters
    fireEvent.press(signInBtn);

    expect(await findByText('Password must be at least 6 characters')).toBeTruthy();
    expect(endpoints.loginApi).not.toHaveBeenCalled();
  });

  it('quick demo fill chip populates valid credentials', async () => {
    const { getByRole, getByDisplayValue } = render(<LoginScreen />);

    const demoChip = getByRole('button', { name: /Fill Patient 1 credentials/i });
    fireEvent.press(demoChip);

    expect(getByDisplayValue('patient1@example.test')).toBeTruthy();
    expect(getByDisplayValue('Password123!')).toBeTruthy();
  });
});
