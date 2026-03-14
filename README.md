# MedLens

Medication adherence platform: scan pills with your phone camera, log intake, and view adherence analytics in a web dashboard with full role-based access control.

## What it does

- **Mobile app** — Scan medication with the camera; on-device pill recognition (TensorFlow Lite) and OCR identify the medication and log it with confidence scores.
- **Backend** — REST + GraphQL API for auth, users, medication logs, prescriptions, and analytics; PostgreSQL and S3 for storage. Fully tested with 125 tests.
- **Dashboard** — Web UI for KPI overview, paginated patient and admin management, adherence charts, and scan trends. Admin-only sections are protected at both the route and API level.

## Project structure

| Folder       | Description                      |
|--------------|----------------------------------|
| `mobile/`    | React Native app (iOS/Android)   |
| `android/`   | Native Android (TFLite, OCR)     |
| `backend/`   | FastAPI API + Alembic migrations |
| `dashboard/` | React + Vite dashboard           |

## Tech stack

- **Mobile:** React Native 0.73, Vision Camera v4, Zustand
- **Android native:** Kotlin, TensorFlow Lite 2.14, ML Kit OCR, OpenCV, CameraX
- **Backend:** FastAPI, Strawberry GraphQL, SQLAlchemy 2 (async/asyncpg), Alembic, boto3 (S3)
- **Dashboard:** React 18, Vite, React Router v6, TanStack Query v5, Recharts

---

## Dashboard

### Features

| Page | Access | Description |
|------|--------|-------------|
| `/login` | Public | Email + password sign-in |
| `/register` | Public | Create account (patient or admin role) |
| `/overview` | All authenticated | KPI stat cards + adherence ring + weekly scan bar chart |
| `/patients` | Admin only | Paginated patient list with create, edit, delete |
| `/patients/:id` | Admin only | Patient detail with scan history and adherence charts |
| `/admins` | Admin only | Paginated admin list with create, edit, delete |

### Role-based access control

Roles are set at registration (`patient` or `admin`). After login the dashboard fetches `GET /users/me` to resolve the current user's role and stores it in `localStorage`.

- The **Sidebar** hides admin-only links (`Patients`, `Admins`) for non-admin users.
- The **`AdminRoute`** guard redirects any non-admin who navigates directly to a protected URL back to `/overview`.
- The **backend** enforces `require_admin` on every admin-only endpoint independently of the frontend.

### Mock mode

Run the dashboard without a backend:

```bash
VITE_USE_MOCK=true npm run dev
```

Mock data is persisted in `localStorage` so create/edit/delete operations survive page refreshes. Mock login always grants admin role.

---

## Backend API

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create account; returns 201 |
| `POST` | `/auth/login` | Returns JWT access token |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/users/me` | Any | Current user profile |
| `GET` | `/users?role=patient&page=1&page_size=20` | Admin | Paginated user list filtered by role |
| `GET` | `/users/{id}` | Admin | Single user |
| `POST` | `/users` | Admin | Create user |
| `PUT` | `/users/{id}` | Admin | Update email / password / role |
| `DELETE` | `/users/{id}` | Admin | Delete user (self-delete blocked) |

### Medication logs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/logs` | Any | Record a scan |
| `POST` | `/logs/{id}/image` | Any | Upload scan image to S3 |
| `GET` | `/logs` | Admin | All logs |
| `GET` | `/logs/{user_id}` | Admin | Logs for a specific patient |

### Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/analytics/overview` | Admin | Global KPIs |
| `GET` | `/analytics/adherence` | Admin | Overall adherence rate |
| `GET` | `/analytics/weekly` | Admin | 7-day scan trend |
| `GET` | `/analytics/patient/{id}` | Admin | Per-patient summary |
| `GET` | `/analytics/patient/{id}/weekly` | Admin | Per-patient weekly trend |

### GraphQL

Mounted at `/graphql` (Strawberry). Mirrors the overview, patients, adherence, and weekly REST endpoints.

---

## Test suite

125 tests across unit and integration layers using **pytest-asyncio**, **httpx AsyncClient**, and an **in-memory SQLite** database.

| File | Tests | Covers |
|------|------:|--------|
| `tests/unit/test_security.py` | 11 | bcrypt hashing, JWT round-trip, tampered tokens |
| `tests/unit/test_analytics_helpers.py` | 9 | Week-start calculation, adherence rate, weekly point builder |
| `tests/integration/test_auth.py` | 9 | Register / login happy paths and edge cases |
| `tests/integration/test_users.py` | 44 | Full patient CRUD + pagination + access control |
| `tests/integration/test_admins.py` | 33 | Full admin CRUD + role isolation + access control |
| `tests/integration/test_logs.py` | 8 | Log creation, S3 upload stub, access control |
| `tests/integration/test_analytics.py` | 11 | All analytics endpoints |

```bash
cd backend
uv run pytest -v
```

---

## Getting started

### Prerequisites

- Python 3.11+, [uv](https://github.com/astral-sh/uv)
- Node 20+
- Docker (for PostgreSQL)
- Android Studio / Xcode (for mobile)

### Backend

```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL, SECRET_KEY, AWS_* vars
docker compose up -d        # start PostgreSQL
alembic upgrade head       # run migrations
python scripts/seed.py     # optional: seed admin@medlens.io / admin123, patient@medlens.io / patient123
uv run uvicorn app.main:app --reload
```

Interactive API docs: `http://localhost:8000/docs`
GraphQL playground: `http://localhost:8000/graphql`

### Dashboard

```bash
cd dashboard
npm install
npm run dev                 # real backend at http://localhost:8000
# or
VITE_USE_MOCK=true npm run dev  # mock mode, no backend needed
```

### Mobile

```bash
cd mobile
npm install
npx react-native run-android   # or run-ios
```

Requires a `pill_classifier.tflite` model and `pill_labels.txt` placed in `android/app/src/main/assets/`.
Frame processing is throttled to 1 frame per 500 ms. Classifier confidence ≥ 0.85 marks a scan as verified; < 0.6 falls back to OCR.

---

## Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL async DSN | — |
| `SECRET_KEY` | JWT signing key | — |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `60` |
| `AWS_REGION` | S3 region | — |
| `AWS_ACCESS_KEY_ID` | AWS key | — |
| `AWS_SECRET_ACCESS_KEY` | AWS secret | — |
| `S3_BUCKET` | Image storage bucket | — |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173` |
| `VITE_USE_MOCK` | Dashboard mock mode | `false` |
