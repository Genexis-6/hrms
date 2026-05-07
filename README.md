# UNIDEL HRMS - API Documentation

**AI-Embedded Human Resource Management System**  
University of Delta, Agbor  
Base URL: `http://localhost:5000/api`

---

## Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login and receive JWT token |

---

## Staff Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/staff/dashboard` | Protected | Dashboard stats |
| GET | `/api/staff/stats` | Protected | Staff statistics breakdown |
| GET | `/api/staff` | Protected | Get all staff |
| GET | `/api/staff/search` | Protected | Search/filter staff |
| GET | `/api/staff/:id` | Protected | Get staff by ID |
| POST | `/api/staff` | Admin | Create staff |
| POST | `/api/staff/bulk` | Admin | Bulk create staff |
| PUT | `/api/staff/:id` | Admin | Update staff |
| DELETE | `/api/staff/:id` | Admin | Delete staff + cascade |

---

## Attendance

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/attendance/checkin` | Protected | Clock in |
| POST | `/api/attendance/checkout` | Protected | Clock out |
| GET | `/api/attendance/today` | Protected | Today's attendance |
| GET | `/api/attendance/history/:staffId` | Protected | Staff attendance history |

---

## Leave

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/leave` | Protected | All leave applications |
| POST | `/api/leave` | Protected | Apply for leave |
| PUT | `/api/leave/:id/approve` | Admin | Approve/reject leave |

---

## Promotion (AI Vetting)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/promotion` | Protected | All promotion records |
| POST | `/api/promotion/vet` | Admin | Vet promotion eligibility (AI) |

---

## Other

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | Public | Server health check |

---

## Quick Test

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@unidel.edu.ng","password":"admin123"}'

# Use token from response
TOKEN="eyJhbG..."

# Dashboard
curl http://localhost:5000/api/staff/dashboard \
  -H "Authorization: Bearer $TOKEN"

# All staff
curl http://localhost:5000/api/staff \
  -H "Authorization: Bearer $TOKEN"

# Today's attendance
curl http://localhost:5000/api/attendance/today \
  -H "Authorization: Bearer $TOKEN"
