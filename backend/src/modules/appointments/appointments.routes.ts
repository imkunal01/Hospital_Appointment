import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  bookAppointmentSchema,
  rescheduleAppointmentSchema,
  appointmentIdParamSchema,
  listAppointmentsQuerySchema
} from './appointments.schema.js';
import {
  bookAppointment,
  listAppointments,
  getAppointmentById,
  rescheduleAppointment,
  cancelAppointment,
  getAppointmentReports
} from './appointments.service.js';

export const appointmentsRouter = Router();

// POST /appointments - Book appointment with optional Idempotency-Key
appointmentsRouter.post(
  '/',
  requireAuth,
  validate({ body: bookAppointmentSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.user!.userId;
      const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
      const { appointment, isExisting } = await bookAppointment(
        patientId,
        req.body.slotId,
        idempotencyKey
      );

      // 200 OK if returned via idempotency match, 201 Created if freshly booked
      res.status(isExisting ? 200 : 201).json(appointment);
    } catch (err) {
      next(err);
    }
  }
);

// GET /appointments?scope=upcoming|past - List patient's appointments
appointmentsRouter.get(
  '/',
  requireAuth,
  validate({ query: listAppointmentsQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.user!.userId;
      const scope = (req.query.scope as 'upcoming' | 'past') || 'upcoming';
      const appointments = await listAppointments(patientId, scope);
      res.status(200).json(appointments);
    } catch (err) {
      next(err);
    }
  }
);

// GET /appointments/:id - Get appointment details
appointmentsRouter.get(
  '/:id',
  requireAuth,
  validate({ params: appointmentIdParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.user!.userId;
      const appointmentId = String(req.params.id);
      const appointment = await getAppointmentById(patientId, appointmentId);
      res.status(200).json(appointment);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /appointments/:id/reschedule - Reschedule appointment to a new slot
appointmentsRouter.patch(
  '/:id/reschedule',
  requireAuth,
  validate({
    params: appointmentIdParamSchema,
    body: rescheduleAppointmentSchema
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.user!.userId;
      const appointmentId = String(req.params.id);
      const updated = await rescheduleAppointment(
        patientId,
        appointmentId,
        req.body.newSlotId
      );
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// POST /appointments/:id/cancel - Cancel appointment and free the slot
appointmentsRouter.post(
  '/:id/cancel',
  requireAuth,
  validate({ params: appointmentIdParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.user!.userId;
      const appointmentId = String(req.params.id);
      const result = await cancelAppointment(patientId, appointmentId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

// GET /appointments/:id/reports - Visit report metadata (strictly non-diagnostic)
appointmentsRouter.get(
  '/:id/reports',
  requireAuth,
  validate({ params: appointmentIdParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.user!.userId;
      const appointmentId = String(req.params.id);
      const reports = await getAppointmentReports(patientId, appointmentId);
      res.status(200).json(reports);
    } catch (err) {
      next(err);
    }
  }
);

