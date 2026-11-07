import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppointmentDetailScreen } from '../src/screens/AppointmentDetailScreen';
import * as endpoints from '../src/api/endpoints';
import * as networkHook from '../src/hooks/useNetwork';
import { Appointment } from '../src/api/types';

jest.mock('../src/api/endpoints.js');
jest.mock('../src/hooks/useNetwork.js');

const mockAppointment: Appointment = {
  id: 'b1111111-1111-1111-1111-111111111111',
  reference: 'HA-20261108-XYZ9',
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

describe('Appointment Management & Lifecycle Safe Behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (networkHook.useNetwork as jest.Mock).mockReturnValue({
      isOffline: false,
      isOnline: true
    });
    (endpoints.getAppointmentByIdApi as jest.Mock).mockResolvedValue(mockAppointment);
    (endpoints.getAppointmentReportsApi as jest.Mock).mockResolvedValue([]);
    (endpoints.getDoctorSlotsApi as jest.Mock).mockResolvedValue([]);
  });

  it('cancel action requires confirmation dialog before sending request', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');

    const { findByRole } = renderWithClient(
      <AppointmentDetailScreen
        route={{ params: { appointmentId: mockAppointment.id } }}
        navigation={{ navigate: jest.fn() }}
      />
    );

    const cancelBtn = await findByRole('button', { name: /Cancel this appointment/i });
    fireEvent.press(cancelBtn);

    // Verify confirmation alert was triggered
    expect(alertSpy).toHaveBeenCalledWith(
      'Cancel Appointment',
      expect.stringContaining('Are you sure you want to cancel'),
      expect.any(Array)
    );
    // Verify API was NOT called directly without user confirming the alert
    expect(endpoints.cancelAppointmentApi).not.toHaveBeenCalled();
  });

  it('double-tap cancel sends only one mutation request (Repeated-tap protection)', async () => {
    let resolveCancelPromise: (val: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveCancelPromise = resolve;
    });

    (endpoints.cancelAppointmentApi as jest.Mock).mockReturnValue(pendingPromise);

    // Auto-confirm the dialog
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const confirmAction = buttons?.find((b: any) => b.text === 'Cancel Appointment');
      if (confirmAction && confirmAction.onPress) {
        confirmAction.onPress();
      }
    });

    const { findByRole } = renderWithClient(
      <AppointmentDetailScreen
        route={{ params: { appointmentId: mockAppointment.id } }}
        navigation={{ navigate: jest.fn() }}
      />
    );

    const cancelBtn = await findByRole('button', { name: /Cancel this appointment/i });

    // Rapid double-press
    fireEvent.press(cancelBtn);
    fireEvent.press(cancelBtn);

    // Verify mutation is called and only 1 API call was sent
    await waitFor(() => {
      expect(endpoints.cancelAppointmentApi).toHaveBeenCalledTimes(1);
    });

    // Resolve cancel promise
    resolveCancelPromise!({
      appointment: { ...mockAppointment, status: 'CANCELLED' },
      message: 'Appointment successfully cancelled'
    });
  });
});
