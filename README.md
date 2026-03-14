# MedLens

Medication adherence platform: scan pills with your phone camera, log intake, and view adherence analytics in a web dashboard.

## What it does

- **Mobile app** — Scan medication with the camera; on-device pill recognition (TensorFlow Lite) and OCR identify the medication and log it with confidence scores.
- **Backend** — REST + GraphQL API for auth, users, medication logs, prescriptions, and analytics; PostgreSQL and S3 for storage.
- **Dashboard** — Web UI for overview stats, patient list, adherence charts, and scan trends.

## Project structure

| Folder       | Description                      |
|--------------|----------------------------------|
| `mobile/`    | React Native app (iOS/Android)   |
| `android/`   | Native Android (TFLite, OCR)     |
| `backend/`   | FastAPI API + Alembic migrations |
| `dashboard/` | React + Vite dashboard           |

## Tech stack

- **Mobile:** React Native, Vision Camera, Zustand
- **Android native:** Kotlin, TensorFlow Lite, OCR
- **Backend:** FastAPI, Strawberry GraphQL, SQLAlchemy (async), Alembic, Boto3 (S3)
- **Dashboard:** React, Vite, TanStack Query, Recharts

## Getting started

### Backend

```bash
cd backend
cp .env.example .env   # edit with your DB and AWS settings
docker compose up -d   # PostgreSQL
alembic upgrade head
uv run uvicorn app.main:app --reload
```

API docs: `http://localhost:8000/docs`

### Dashboard

```bash
cd dashboard
npm install
npm run dev
```

### Mobile

```bash
cd mobile
npm install
npx react-native run-android   # or run-ios
```

Requires Android Studio / Xcode, and for pill classification a `pill_classifier.tflite` model (and `pill_labels.txt`) in the Android app assets.
