# 3–5 Minute Evaluation Video Script & Shot List

> Assessment: Algions AI Labs — Hospital Appointment Android Application  
> Domain: Hospital Management

---

## Shot List & Demonstration Timeline (Target: 3:30 - 4:00)

| Timestamp | Screen / Scenario | Spoken Points & Actions |
|---|---|---|
| **0:00 - 0:30** | Clean Install & Login | - Show installation from standalone APK on clean Android emulator/device.<br>- Launch app and show initial login screen.<br>- Mention Render API warm-up and sign in with `patient1@example.test`. |
| **0:30 - 1:15** | Main Journey (Discovery to Booking) | - Browse medical departments (Cardiology, Orthopedics, etc.).<br>- Select doctor (e.g. Dr. Sarah Mitchell).<br>- Select appointment date and choose an available time slot.<br>- Tap "Confirm Booking".<br>- **Highlight:** Confirmation screen appears ONLY after HTTP 201 response with unique server reference (`HA-YYYYMMDD-XXXX`) and `CONFIRMED` status (Test A3 & A5). |
| **1:15 - 1:55** | Concurrency Conflict (Test A1) | - Attempt to book the same slot using secondary patient account or parallel session.<br>- Show actionable error dialog: *"This slot has just been reserved by another patient."*<br>- Observe availability auto-refreshing with the slot marked unavailable. |
| **1:55 - 2:40** | Offline Resiliency & Cache (Test A4) | - Switch device to Airplane Mode.<br>- Observe offline banner appearing immediately.<br>- Browse cached doctor lists and appointment history.<br>- Show that booking and reschedule buttons are disabled to prevent false confirmations.<br>- Turn off Airplane Mode and demonstrate seamless reconnection without crashes. |
| **2:40 - 3:20** | Appointment Management & Reports | - Navigate to "My Appointments" (Upcoming / Past tabs).<br>- Demonstrate rescheduling an upcoming appointment to a new slot.<br>- Demonstrate cancellation (with confirmation prompt); verify status updates to `CANCELLED`.<br>- View past visit reports; **highlight strictly non-diagnostic metadata** (title, report type, file size). |
| **3:20 - 3:45** | Preferences & Wrap-Up | - Show notification reminder preferences screen.<br>- Briefly show test evidence in repository and conclude. |
