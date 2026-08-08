# 🚀 Task Management System – Backend

A production-ready Task Management System backend built with **NestJS**, **Prisma ORM**, and **PostgreSQL**. This project is developed as part of a Full Stack Developer technical assessment and follows clean architecture, scalable module design, and RESTful API best practices.

---

## ✨ Features

- 🔐 JWT Authentication
- 👤 Guest Login
- 👥 Project & Member Management
- 📋 Task Management
- 📝 Subtasks
- 🏷️ Labels
- 💬 Comments
- 📊 Activity Timeline
- 🌙 Theme Preference Support
- 🎨 Accent Color Preference
- 📑 Swagger API Documentation
- ✅ DTO Validation using `class-validator`
- 🛡️ Secure Password Hashing
- 🗄️ PostgreSQL + Prisma ORM

---

# 🛠 Tech Stack

| Technology | Description |
|------------|-------------|
| NestJS | Backend Framework |
| Prisma ORM | Database ORM |
| PostgreSQL | Database |
| JWT | Authentication |
| TypeScript | Programming Language |
| Swagger | API Documentation |
| class-validator | Request Validation |
| bcrypt | Password Hashing |

---

# 📁 Project Structure

```text
src/
│
├── auth/
├── users/
├── projects/
├── tasks/
├── subtasks/
├── labels/
├── comments/
├── activity/
│
├── prisma/
│
├── common/
│   ├── decorators/
│   ├── guards/
│   ├── filters/
│   ├── interceptors/
│   └── utils/
│
├── config/
│
├── app.module.ts
└── main.ts

prisma/
│
├── schema.prisma
├── migrations/
└── seed.ts
```

---

# 🗄️ Database Schema

The database consists of the following entities:

- User
- Project
- ProjectMember
- Task
- Subtask
- Label
- TaskLabel
- Comment
- Activity

### Enums

- Theme
- TaskStatus
- TaskPriority
- ProjectRole
- ActivityAction

---

# 🔗 Entity Relationship

```text
User
 │
 ├──────────────┐
 │              │
 ▼              ▼
Project     ProjectMember
 │
 ▼
Task
 ├── Subtask
 ├── Comment
 ├── Activity
 └── Label (Many-to-Many)
```

---

# ⚙️ Installation

Clone the repository

```bash
git clone https://github.com/<your-username>/task-management-backend.git

cd task-management-backend
```

Install dependencies

```bash
npm install
```

---

# 🛢 Configure Environment

Create a `.env` file.

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/task_management"

JWT_SECRET="your-secret"

JWT_EXPIRES_IN="7d"

PORT=3001
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

# ▶️ Run the Application

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

# 📚 API Documentation

Swagger Documentation

```
http://localhost:3001/api/docs
```

---

# 🔐 Authentication

The application supports:

- Register
- Login
- Guest Login
- JWT Authentication

---

# 📌 Planned API Modules

## Authentication

- Register
- Login
- Guest Login

## Users

- Profile
- Update Profile
- Theme Preference
- Accent Color

## Projects

- Create Project
- Update Project
- Delete Project
- Invite Members

## Tasks

- CRUD
- Assign Users
- Change Status
- Change Priority
- Reorder Kanban

## Subtasks

- CRUD

## Labels

- CRUD

## Comments

- CRUD

## Activity

- Activity Timeline

---

# 📈 Current Progress

- [x] NestJS Project Setup
- [x] PostgreSQL Configuration
- [x] Prisma Configuration
- [x] Database Schema Design
- [x] Initial Migration
- [ ] Authentication Module
- [ ] User Module
- [ ] Project Module
- [ ] Task Module
- [ ] Subtask Module
- [ ] Label Module
- [ ] Comment Module
- [ ] Activity Module
- [ ] Swagger Documentation
- [ ] Database Seeder
- [ ] Unit Tests

---

# 🧑‍💻 Author

**Parjan Hussain**

GitHub: https://github.com/Parjann

---

# 📄 License

This project is created solely for a technical assessment.