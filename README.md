# LeaveTrack — Leave & Employee Attendance Management System

A role-based internal HR web application for managing employee attendance, leave
requests, approvals, leave balances and reports — built as a mentor-assigned
training project.

## Features

- Email/password authentication with role-based redirect and protected routes
- Four dashboards (Admin, HR, Manager, Employee) with live stats
- Employee management: add / edit / delete / view / search / filter / sort
- Department management with head assignment
- Daily attendance tracking with automatic working-hours calculation, corrections,
  and date/employee/department/status filters
- Leave application workflow: apply -> pending -> manager/HR review -> approve/reject
  (rejection reason mandatory) -> automatic leave balance updates
- Leave type configuration (Casual, Sick, Annual, Earned, Emergency, WFH, Unpaid)
- Leave balance tracking (allocated / used / remaining) per employee
- Attendance & Leave reports with filters
- Activity history / audit timeline of key actions
- Toast notifications, modals, confirmation dialogs, loading/empty/error states
- Fully responsive (desktop, laptop, tablet, mobile)

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router, Axios, react-hot-toast, lucide-react
**Backend:** JSON Server (no external APIs)

## User Roles

| Role | Access |
|---|---|
| **Admin** | Full access - employees, departments, attendance, leave requests & types, reports, activity history |
| **HR** | Employees (no delete), attendance, leave requests & types, reports |
| **Manager** | Team roster, team attendance (view), team leave approvals |
| **Employee** | Own dashboard, attendance, leave requests, profile |

## Project Structure

```
src/
├── components/   common/ layout/ forms/ tables/
├── pages/        auth/ admin/ hr/ manager/ employee/ shared/
├── routes/       ProtectedRoute, route titles
├── services/     API calls per resource (employees, departments, attendance, leave, activity)
├── hooks/        useAuth, useAsync, useLookups
├── types/        shared TypeScript interfaces
├── utils/        date & working-hours helpers
└── context/      AuthContext
```

## Installation & Setup

**Requirements:** Node.js 18+ and npm.

1. Unzip the project and open the folder in VS Code.
2. Install dependencies:
   ```bash
   npm install
   ```
3. (Optional) Regenerate the seed data at any time:
   ```bash
   npm run seed
   ```
4. Run the backend (JSON Server) **and** frontend (Vite) together:
   ```bash
   npm run dev:all
   ```
   This starts:
   - JSON Server at **http://localhost:4000**
   - The app at **http://localhost:5173**

   Or run them in two separate terminals if you prefer:
   ```bash
   npm run server   # terminal 1 - JSON Server on :4000
   npm run dev      # terminal 2 - Vite on :5173
   ```
5. Open **http://localhost:5173** in your browser.

## Demo Logins

| Role | Email | Password |
|---|---|---|
| Admin | admin@company.com | admin123 |
| HR | hr@company.com | hr123 |
| Manager | manager@company.com | manager123 |
| Employee | employee@company.com | employee123 |

(Also shown on the login screen - click any demo card to auto-fill it.)

## JSON Server

Backend data lives in `db.json` at the project root, with resources:
`users`, `employees`, `departments`, `attendance`, `leaveTypes`, `leaveRequests`, `activities`.
All CRUD calls go through Axios (`src/services/api.ts`) to `http://localhost:4000`
(configurable via `VITE_API_URL` in `.env`).

## Available Routes

```
/login
/admin/dashboard   /admin/employees   /admin/departments
/admin/attendance  /admin/leaves      /admin/leave-types
/admin/reports     /admin/activity

/hr/dashboard  /hr/employees  /hr/attendance
/hr/leaves     /hr/leave-types /hr/reports

/manager/dashboard  /manager/team
/manager/attendance /manager/leaves

/employee/dashboard  /employee/attendance
/employee/leaves     /employee/profile
```

## Building for Production

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

Deploy the `dist/` folder to **Netlify** or **Vercel**. Since the backend is JSON
Server (a local dev tool), for a real deployment you'd point `VITE_API_URL` at a
hosted JSON Server instance (e.g. on Render/Railway) or swap in a real backend -
for this training project, running everything locally via `npm run dev:all` is
sufficient to demo all features end-to-end.

## Notes

- Leave balance validation, overlap detection, and mandatory rejection reasons are
  enforced in `src/services/leaveService.ts`.
- Working hours are computed automatically from check-in/check-out times in
  `src/utils/dateUtils.ts` and `src/services/attendanceService.ts`.
- Approved leave dates are reflected as "On Leave" in attendance rather than the
  employee being marked absent (seeded historical data already reflects this).
