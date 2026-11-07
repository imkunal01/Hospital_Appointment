import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  getDoctorsQuerySchema,
  getDoctorSlotsParamsSchema,
  getDoctorSlotsQuerySchema
} from './catalog.schema.js';
import {
  listDepartments,
  listDoctors,
  listDoctorSlots
} from './catalog.service.js';

export const departmentsRouter = Router();
export const doctorsRouter = Router();

// GET /departments - Retrieve all hospital departments
departmentsRouter.get(
  '/',
  requireAuth,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const departments = await listDepartments();
      res.status(200).json(departments);
    } catch (err) {
      next(err);
    }
  }
);

// GET /doctors - Retrieve doctors (optional ?departmentId= filter)
doctorsRouter.get(
  '/',
  requireAuth,
  validate({ query: getDoctorsQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const departmentId = req.query.departmentId as string | undefined;
      const doctors = await listDoctors(departmentId);
      res.status(200).json(doctors);
    } catch (err) {
      next(err);
    }
  }
);

// GET /doctors/:id/slots?date=YYYY-MM-DD - Retrieve available slots for a doctor on a specific date
doctorsRouter.get(
  '/:id/slots',
  requireAuth,
  validate({
    params: getDoctorSlotsParamsSchema,
    query: getDoctorSlotsQuerySchema
  }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doctorId = String(req.params.id);
      const date = String(req.query.date);
      const slots = await listDoctorSlots(doctorId, date);
      res.status(200).json(slots);
    } catch (err) {
      next(err);
    }
  }
);
