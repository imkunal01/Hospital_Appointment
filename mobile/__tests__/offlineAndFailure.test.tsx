import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { AppointmentDetailScreen } from '../src/screens/AppointmentDetailScreen';
import { DepartmentsScreen } from '../src/screens/DepartmentsScreen';
import * as networkHook from '../src/hooks/useNetwork';
import * as endpoints from '../src/api/endpoints';
import { Appointment } from '../src/api/types';

jest.mock('../src/hooks/useNetwork.js');
jest.mock('../src/api/endpoints.js');

const mockAppointment: Appointment = {
  id: 'b1111111-1111-1111-1111-111111111111',
  reference: 'HA-20261108-ABCD',
  patientId: 'a1111111-1111-1111-1111-111111111111',
  slotId: 'e1111111-1111-1111-1111-111111111111',
  status: 'CONFIRMED',
  startsAt: new Date(Date.now() + 86400000).toISOString(),
  endsAt: new Date(Date.now() + 86400000 + 2700000).toISOString(),
  doctorId: 'c1111111-1111-1111-1111-111111111111',
  doctorName: 'Dr. Sarah Mitchell',
  specialty: 'Interventional Cardiology',
  departmentId: 'd1111111-1111-1111-1111-111111111111',
  departmentName: 'Cardiology',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Offline Resiliency & Network Failure Recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (endpoints.getDoctorSlotsApi as jest.Mock).mockResolvedValue([]);
  });

  it('renders OfflineBanner when device is offline', () => {
    (networkHook.useNetwork as jest.Mock).mockReturnValue({
      isOffline: true,
      isOnline: false
    });

    const { getByLabelText, getByText } = render(<OfflineBanner />);

    expect(getByLabelText(/You are currently offline/i)).toBeTruthy();
    expect(getByText(/You are currently Offline/i)).toBeTruthy();
  });

  it('hides OfflineBanner when device is online', () => {
    (networkHook.useNetwork as jest.Mock).mockReturnValue({
      isOffline: false,
      isOnline: true
    });

    const { queryByText } = render(<OfflineBanner />);
    expect(queryByText(/You are currently Offline/i)).toBeNull();
  });

  it('disables Reschedule and Cancel buttons when offline', async () => {
    (networkHook.useNetwork as jest.Mock).mockReturnValue({
      isOffline: true,
      isOnline: false
    });

    (endpoints.getAppointmentByIdApi as jest.Mock).mockResolvedValue(mockAppointment);
    (endpoints.getAppointmentReportsApi as jest.Mock).mockResolvedValue([]);

    const { findByText, findByRole } = renderWithClient(
      <AppointmentDetailScreen
        route={{ params: { appointmentId: mockAppointment.id } }}
        navigation={{ navigate: jest.fn() }}
      />
    );

    // Verify offline banner text appears on screen
    expect(await findByText(mockAppointment.reference)).toBeTruthy();
    expect(await findByText(/You are currently offline. Rescheduling and cancellation are disabled/i)).toBeTruthy();

    const rescheduleBtn = await findByRole('button', { name: /Reschedule this appointment/i });
    const cancelBtn = await findByRole('button', { name: /Cancel this appointment/i });

    expect(rescheduleBtn.props.accessibilityState.disabled).toBe(true);
    expect(cancelBtn.props.accessibilityState.disabled).toBe(true);
  });

  it('handles simulated Network Failure gracefully without crashing (Assessment Brief Requirement)', async () => {
    (networkHook.useNetwork as jest.Mock).mockReturnValue({
      isOffline: false,
      isOnline: true
    });

    // Mock network failure error
    const networkError = new Error('Network Error');
    (networkError as any).code = 'ERR_NETWORK';
    (endpoints.getDepartmentsApi as jest.Mock).mockRejectedValue(networkError);

    const { findByRole, findByText } = renderWithClient(
      <DepartmentsScreen navigation={{ navigate: jest.fn() }} />
    );

    // Verify error state appears with friendly message and retry action
    expect(await findByText(/Unable to reach the server/i)).toBeTruthy();
    expect(await findByRole('button', { name: /Retry loading data/i })).toBeTruthy();
  });

  it('handles malformed API response without application crash', async () => {
    (networkHook.useNetwork as jest.Mock).mockReturnValue({
      isOffline: false,
      isOnline: true
    });

    // Mock malformed / rejected response
    (endpoints.getDepartmentsApi as jest.Mock).mockRejectedValue(
      new Error('Malformed payload')
    );

    const { findByText, findByRole } = renderWithClient(
      <DepartmentsScreen navigation={{ navigate: jest.fn() }} />
    );

    expect(await findByText(/Unable to Load Data/i)).toBeTruthy();
    expect(await findByRole('button', { name: /Retry loading data/i })).toBeTruthy();
  });
});
