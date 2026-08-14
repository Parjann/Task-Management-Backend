# 🚀 Task Management System – Backend

A production-ready **Task Management System Backend** built with **NestJS**, **Prisma ORM**, and **PostgreSQL** following modern backend architecture, clean code principles, scalable module design, and enterprise-level best practices.

The system provides real-time collaboration, project management, background job processing, email invitations, push notifications, file uploads, and production-ready deployment infrastructure.

---

# 🌐 Live Demo

| Service | URL |
|---------|-----|
| 🚀 API | https://task-management-backend-d5pm.onrender.com |
| 📚 Swagger API | https://task-management-backend-d5pm.onrender.com/api/docs |
| ❤️ Health Check | https://task-management-backend-d5pm.onrender.com/health |
| ⚡ Bull Board | https://task-management-backend-d5pm.onrender.com/admin/queues |

---

# ✨ Features

## 🔐 Authentication & Authorization

- JWT Authentication
- Refresh Token Authentication
- Guest Login
- Role-Based Access Control (RBAC)
- Route Guards
- Secure Password Hashing (bcrypt)
- Authentication Middleware

---

## 👥 User Management

- User Registration
- Login
- Profile Management
- Theme Preferences
- Accent Color Preferences
- Firebase Device Token Registration

---

## 📁 Project Management

- Project CRUD
- Project Members
- Member Invitations
- Email Invitations
- Owner/Admin/Member Roles
- Invitation Acceptance

---

## 📋 Task Management

- Task CRUD
- Assign Members
- Due Dates
- Priorities
- Status Management
- Task Labels
- File Attachments
- Kanban Support

---

## 💬 Collaboration

- Task Comments
- Activity Timeline
- Live Task Updates
- Real-Time Collaboration
- Socket.IO Events

---

## 🔔 Notifications

- In-App Notifications
- Firebase Push Notifications
- Real-Time Notifications
- Email Notifications

---

## 📂 File Uploads

- Cloudinary Integration
- Image Uploads
- Attachment Management
- Secure File Storage

---

## ⚡ Background Jobs

Powered by **BullMQ + Redis**

- Email Queue
- Push Notification Queue
- Activity Queue
- Scheduled Jobs
- Reminder Jobs
- Retry Mechanism
- Exponential Backoff

---

## 🔍 Search

- Global Search
- Search Projects
- Search Tasks
- Search Users

---

## 📈 Monitoring

- Health Checks
- Structured Logging (Pino)
- Bull Board Dashboard
- Swagger Documentation
- Rate Limiting

---

# 🏗 System Architecture

```text
                           Frontend (Vercel)
                                   │
                                   ▼
                        NestJS Backend (Render)
                                   │
          ┌────────────────────────┼────────────────────────┐
          ▼                        ▼                        ▼
   Neon PostgreSQL          Upstash Redis            Cloudinary
          │                        │                        │
          ▼                        ▼                        ▼
      Prisma ORM              BullMQ Queues         File Storage
                                   │
                      ┌────────────┴────────────┐
                      ▼                         ▼
               Firebase FCM             Nodemailer SMTP
                      │                         │
                      ▼                         ▼
           Push Notifications          Email Invitations
```

---

# 🛠 Tech Stack

| Category | Technology |
|------------|---------------------------|
| Framework | NestJS |
| Language | TypeScript |
| ORM | Prisma ORM |
| Database | PostgreSQL (Neon) |
| Authentication | JWT |
| Validation | class-validator |
| Password Hashing | bcrypt |
| Realtime | Socket.IO |
| Queue | BullMQ |
| Cache | Redis (Upstash) |
| Storage | Cloudinary |
| Push Notifications | Firebase Cloud Messaging |
| Email | Nodemailer |
| API Docs | Swagger |
| Logging | Pino |
| Containerization | Docker |
| CI/CD | GitHub Actions |
| Deployment | Render |

---

# 📁 Project Structure

```text
src/

├── auth/
├── users/
├── projects/
├── tasks/
├── comments/
├── labels/
├── activity/
├── notifications/
├── invitations/
├── attachments/
├── websocket/
├── search/
├── mail/
├── firebase/
├── cloudinary/

├── infrastructure/
│
├── redis/
├── queues/
│   ├── email/
│   ├── push/
│   ├── activity/
│   └── scheduled/
│
├── prisma/
├── config/
├── common/
│   ├── decorators/
│   ├── guards/
│   ├── filters/
│   ├── interceptors/
│   ├── middleware/
│   └── utils/
│
├── health/
├── app.module.ts
└── main.ts

prisma/

├── schema.prisma
├── migrations/
└── seed.ts
```

---

# 🗄 Database

Main Entities

- User
- Project
- ProjectMember
- Task
- Label
- TaskLabel
- Comment
- Notification
- Activity
- Invitation
- Attachment
- FcmToken

---

# ⚙️ Installation

Clone the repository

```bash
git clone https://github.com/Parjann/task-management-backend.git

cd task-management-backend
```

Install dependencies

```bash
npm install
```

---

# 🔧 Environment Variables

Create a `.env` file.

```env
# Application
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=

# JWT
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_URL=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Mail
MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASSWORD=
MAIL_FROM=

# Firebase
FIREBASE_SERVICE_ACCOUNT=

# Frontend
CLIENT_URL=http://localhost:5173
```

---

# 🚀 Database Setup

Generate Prisma Client

```bash
npx prisma generate
```

Run Migrations

```bash
npx prisma migrate dev
```

Seed Database

```bash
npx prisma db seed
```

---

# ▶️ Running the Application

Development

```bash
npm run start:dev
```

Production

```bash
npm run build
npm run start:prod
```

---

# 🐳 Docker

Build

```bash
docker compose build
```

Run

```bash
docker compose up
```

Stop

```bash
docker compose down
```

---

# 📚 API Documentation

Swagger UI

```
http://localhost:3001/api/docs
```

Production

```
https://task-management-backend-d5pm.onrender.com/api/docs
```

---

# ❤️ Health Check

Local

```
http://localhost:3001/health
```

Production

```
https://task-management-backend-d5pm.onrender.com/health
```

---

# ⚡ Queue Dashboard

Bull Board

Local

```
http://localhost:3001/admin/queues
```

Production

```
https://task-management-backend-d5pm.onrender.com/admin/queues
```

---

# ☁️ Deployment

| Service | Provider |
|---------|----------|
| Backend | Render |
| Database | Neon PostgreSQL |
| Redis | Upstash |
| File Storage | Cloudinary |
| Push Notifications | Firebase Cloud Messaging |
| CI/CD | GitHub Actions |

---

# 🔄 CI/CD

GitHub Actions automatically performs:

- Install Dependencies
- Generate Prisma Client
- Type Checking
- ESLint
- Build Verification

Every push to the **main** branch is automatically validated.

---

# 📈 Production Features

- ✅ JWT Authentication
- ✅ Refresh Tokens
- ✅ RBAC Authorization
- ✅ Project Management
- ✅ Task Management
- ✅ Labels
- ✅ Comments
- ✅ Activity Timeline
- ✅ Global Search
- ✅ Email Invitations
- ✅ Cloudinary Uploads
- ✅ Socket.IO
- ✅ Real-Time Collaboration
- ✅ Firebase Push Notifications
- ✅ BullMQ Background Jobs
- ✅ Redis Queues
- ✅ Scheduled Jobs
- ✅ Health Monitoring
- ✅ Structured Logging
- ✅ Swagger API
- ✅ Docker Support
- ✅ GitHub Actions CI/CD
- ✅ Render Deployment

---

# 🚀 Future Enhancements

- Multi-Tenant Workspaces
- Calendar Module
- Gantt Chart Support
- Time Tracking
- Analytics Dashboard
- Webhooks
- OpenAPI SDK Generation
- Kubernetes Deployment
- Terraform Infrastructure
- Distributed Microservices

---

# 👨‍💻 Author

**Parjan Hussain**

- GitHub: https://github.com/Parjann

---

# 📄 License

This project is licensed under the **MIT License**.