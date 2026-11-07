import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DoctorDetailScreen } from '../src/screens/DoctorDetailScreen';
import * as endpoints from '../src/api/endpoints';
import { Doctor, Slot, Appointment } from '../src/api/types';

jest.mock('../src/api/endpoints.js');

const mockDoctor: Doctor = {
  id: 'c1111111-1111-1111-1111-111111111111',
  departmentId: 'd1111111-1111-1111-1111-111111111111',
  departmentName: 'Cardiology',
  name: 'Dr. Sarah Mitchell',
  specialty: 'Interventional Cardiology',
  bio: 'Specialist in preventive cardiac care'
};

const mockSlot: Slot = {
  id: 'e1111111-1111-1111-1111-111111111111',
  doctorId: mockDoctor.id,
  startsAt: new Date(Date.now() + 86400000).toISOString(),
  endsAt: new Date(Date.now() + 86400000 + 2700000).toISOString(),
  status: 'AVAILABLE'
};

const mockConfirmedAppointment: Appointment = {
  id: 'b1111111-1111-1111-1111-111111111111',
  reference: 'HA-20261108-XYZ1',
  patientId: 'a1111111-1111-1111-1111-111111111111',
  slotId: mockSlot.id,
  status: 'CONFIRMED',
  startsAt: mockSlot.startsAt,
  endsAt: mockSlot.endsAt,
  doctorId: mockDoctor.id,
  doctorName: mockDoctor.name,
  specialty: mockDoctor.specialty,
  departmentId: mockDoctor.departmentId,
  departmentName: mockDoctor.departmentName,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

function renderWithClient(ui: React.ReactElement) {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return {
    ...render(<QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>),
    queryClient: testQueryClient
  };
}

describe('Booking Flow, Concurrency & State Integrity', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    popToTop: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (endpoints.getDoctorSlotsApi as jest.Mock).mockResolvedValue([mockSlot]);

    // Automatically trigger the Confirm button in the confirmation Alert dialog
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const confirmBtn = buttons?.find((b: any) => b.text === 'Confirm');
      if (confirmBtn && confirmBtn.onPress) {
        confirmBtn.onPress();
      }
    });
  });

  it('book button is disabled initially until a slot is selected', async () => {
    const { getByRole } = renderWithClient(
      <DoctorDetailScreen
        route={{ params: { doctor: mockDoctor } }}
        navigation={mockNavigation}
      />
    );

    const bookButton = getByRole('button', { name: /Proceed to book selected appointment slot/i });
    expect(bookButton.props.accessibilityState.disabled).toBe(true);
  });

  it('enables book button when a slot is tapped', async () => {
    const { findByRole, getByRole } = renderWithClient(
      <DoctorDetailScreen
        route={{ params: { doctor: mockDoctor } }}
        navigation={mockNavigation}
      />
    );

    // Find available slot chip
    const slotChip = await findByRole('button', { name: /Slot from/i });
    fireEvent.press(slotChip);

    const bookButton = getByRole('button', { name: /Proceed to book selected appointment slot/i });
    expect(bookButton.props.accessibilityState.disabled).toBe(false);
  });

  it('RULE A5: Does NOT navigate to Confirmation before server confirmation (HTTP 200/201)', async () => {
    let resolveServerPromise: (value: Appointment) => void;
    const pendingServerPromise = new Promise<Appointment>((resolve) => {
      resolveServerPromise = resolve;
    });

    (endpoints.bookAppointmentApi as jest.Mock).mockReturnValue(pendingServerPromise);

    const { findByRole, getByRole } = renderWithClient(
      <DoctorDetailScreen
        route={{ params: { doctor: mockDoctor } }}
        navigation={mockNavigation}
      />
    );

    // Select slot
    const slotChip = await findByRole('button', { name: /Slot from/i });
    fireEvent.press(slotChip);

    // Tap Book button
    const bookButton = getByRole('button', { name: /Proceed to book selected appointment slot/i });
    fireEvent.press(bookButton);

    // Verify navigation has NOT been called while the request is still pending
    expect(mockNavigation.navigate).not.toHaveBeenCalled();

    // Now resolve the server response
    resolveServerPromise!(mockConfirmedAppointment);

    await waitFor(() => {
      // Confirmed only after server returned 201
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Confirmation', {
        appointment: mockConfirmedAppointment
      });
    });
  });

  it('RULE A1: On SLOT_TAKEN (409 conflict), shows actionable error and triggers slots refetch', async () => {
    const slotTakenError = {
      response: {
        status: 409,
        data: {
          error: {
            code: 'SLOT_TAKEN',
            message: 'Selected appointment slot is no longer available'
          }
        }
      }
    };

    (endpoints.bookAppointmentApi as jest.Mock).mockRejectedValue(slotTakenError);

    const { findByRole, getByRole, queryClient } = renderWithClient(
      <DoctorDetailScreen
        route={{ params: { doctor: mockDoctor } }}
        navigation={mockNavigation}
      />
    );

    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    // Select slot
    const slotChip = await findByRole('button', { name: /Slot from/i });
    fireEvent.press(slotChip);

    // Tap Book button
    const bookButton = getByRole('button', { name: /Proceed to book selected appointment slot/i });
    fireEvent.press(bookButton);

    await waitFor(() => {
      // Must not navigate to confirmation on conflict
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
      // Must trigger slots cache invalidation to refresh available slots
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: expect.arrayContaining(['slots']) })
      );
    });
  });
});
