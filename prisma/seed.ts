import { PrismaClient, TaskStatus, TaskPriority, ProjectRole, ActivityAction } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Find or create the primary user
  const hashedPassword = await bcrypt.hash('password123', 10);

  let user = await prisma.user.findFirst();

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Alex Johnson',
        email: 'alex@example.com',
        passwordHash: hashedPassword,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        title: 'Lead Product Engineer',
        username: 'alexj',
        isGuest: false,
        theme: 'SYSTEM',
        accentColor: '#7C3AED',
      },
    });
    console.log(`✅ Created primary user: ${user.email} (${user.id})`);
  } else {
    console.log(`ℹ️ Found existing user: ${user.email} (${user.id})`);
  }

  // Optional: Create a secondary collaborator
  const collaborator = await prisma.user.upsert({
    where: { email: 'sarah@example.com' },
    update: {},
    create: {
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      passwordHash: hashedPassword,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      title: 'Senior UI/UX Designer',
      username: 'sarahc',
      isGuest: false,
      accentColor: '#EC4899',
    },
  });

  // 2. Create Project: "Pyramid Platform"
  const projectKey = `PYR-${Date.now().toString().slice(-4)}`;
  const project = await prisma.project.create({
    data: {
      name: 'Pyramid Core Platform',
      key: projectKey,
      description: 'Main product engineering board for the Pyramid Task Management application.',
      color: '#7C3AED',
      priority: TaskPriority.HIGH,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      ownerId: user.id,
      members: {
        create: [
          {
            userId: user.id,
            role: ProjectRole.OWNER,
          },
          {
            userId: collaborator.id,
            role: ProjectRole.ADMIN,
          },
        ],
      },
    },
  });
  console.log(`✅ Created project: "${project.name}" (Key: ${project.key})`);

  // 3. Create Project Labels
  const labelFrontend = await prisma.label.create({
    data: { name: 'Frontend', color: '#3B82F6', projectId: project.id },
  });
  const labelBackend = await prisma.label.create({
    data: { name: 'Backend', color: '#10B981', projectId: project.id },
  });
  const labelDesign = await prisma.label.create({
    data: { name: 'Design', color: '#EC4899', projectId: project.id },
  });
  const labelFeature = await prisma.label.create({
    data: { name: 'Feature', color: '#8B5CF6', projectId: project.id },
  });
  const labelDocs = await prisma.label.create({
    data: { name: 'Documentation', color: '#F59E0B', projectId: project.id },
  });

  // 4. Tasks definition across all 4 statuses
  const tasksData = [
    // ==========================================
    // 1. TODO ("To Do")
    // ==========================================
    {
      title: 'Design System & Typography Tokens',
      description: 'Implement shared CSS custom properties and responsive font scalings according to the updated assessment specifications.',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      orderIndex: 0,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      labels: [labelDesign.id, labelFrontend.id],
      subtasks: [
        { title: 'Audit color variables in globals.css', isCompleted: false },
        { title: 'Test responsive clamp typography', isCompleted: false },
      ],
      comment: 'Remember to verify contrast ratios in dark mode.',
    },
    {
      title: 'Setup Realtime Socket.IO Notifications',
      description: 'Integrate WebSockets on the frontend to display live notifications when tasks are moved or assigned.',
      status: TaskStatus.TODO,
      priority: TaskPriority.URGENT,
      orderIndex: 1,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      labels: [labelBackend.id, labelFrontend.id],
      subtasks: [
        { title: 'Configure socket listener in app provider', isCompleted: false },
        { title: 'Add notification toast popup component', isCompleted: false },
      ],
      comment: 'Backend gateway is already implemented and listening on the root namespace.',
    },
    {
      title: 'OAuth Refresh Token Rotation',
      description: 'Enhance security by issuing short-lived access tokens with automatic rotation upon expiration.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      orderIndex: 2,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      labels: [labelBackend.id],
      subtasks: [
        { title: 'Add refresh token entity in database', isCompleted: false },
        { title: 'Handle HTTP-only cookie storage', isCompleted: false },
      ],
    },

    // ==========================================
    // 2. IN_PROGRESS ("Doing")
    // ==========================================
    {
      title: 'Kanban Drag & Drop Reordering',
      description: 'Smooth pointer sensor drag-and-drop mechanics with optimistic UI updates during board column transitions.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      orderIndex: 0,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      labels: [labelFrontend.id, labelFeature.id],
      subtasks: [
        { title: 'Setup dnd-kit pointer sensor constraints', isCompleted: true },
        { title: 'Optimistic state sync in KanbanBoard', isCompleted: true },
        { title: 'Drag overlay animation polish', isCompleted: false },
      ],
      comment: 'Drag sensitivity is tuned with an 8px activation distance.',
    },
    {
      title: 'Subtasks Table & Realtime Status Toggle',
      description: 'Editable subtask rows with fixed-position 3-dot dropdowns and inline check controls.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.URGENT,
      orderIndex: 1,
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      labels: [labelFrontend.id],
      subtasks: [
        { title: 'Subtask CRUD mutation hooks', isCompleted: true },
        { title: 'Overflow container clipping fix', isCompleted: true },
        { title: 'Keyboard shortcut support', isCompleted: false },
      ],
      comment: 'Fixed coordinate calculation implemented to escape table overflow bounds.',
    },
    {
      title: 'Responsive Navigation Drawer for Mobile',
      description: 'Mobile collapsible sidebar with touch backdrop and auto-close on navigation.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      orderIndex: 2,
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      labels: [labelFrontend.id, labelDesign.id],
      subtasks: [
        { title: 'Add mobile backdrop overlay', isCompleted: true },
        { title: 'Auto-dismiss on route link click', isCompleted: true },
      ],
    },

    // ==========================================
    // 3. DONE ("Completed")
    // ==========================================
    {
      title: 'Next.js 15 App Router Architecture',
      description: 'Initialized project with TypeScript, Tailwind CSS, and feature-driven directory structure.',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      orderIndex: 0,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      labels: [labelFrontend.id, labelDocs.id],
      subtasks: [
        { title: 'Setup Next.js 15 with Turbopack', isCompleted: true },
        { title: 'Configure Redux Toolkit & RTK Query baseApi', isCompleted: true },
        { title: 'Create dashboard routing layout', isCompleted: true },
      ],
      comment: 'Completed and verified across staging build.',
    },
    {
      title: 'PostgreSQL & Prisma ORM Schema',
      description: 'Designed database models for Users, Projects, Tasks, Subtasks, Comments, and Activities.',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      orderIndex: 1,
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      labels: [labelBackend.id],
      subtasks: [
        { title: 'Define schema.prisma models and enums', isCompleted: true },
        { title: 'Run migrations and seed baseline data', isCompleted: true },
      ],
    },
    {
      title: 'JWT Authentication & Guest Login',
      description: 'Full auth flow with Firebase Google authentication, email login, and 1-click guest sandbox sessions.',
      status: TaskStatus.DONE,
      priority: TaskPriority.URGENT,
      orderIndex: 2,
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      labels: [labelBackend.id, labelFrontend.id],
      subtasks: [
        { title: 'Backend JWT strategy and middleware', isCompleted: true },
        { title: 'Frontend auth slice and token persistence', isCompleted: true },
      ],
    },

    // ==========================================
    // 4. BACKLOG ("On Hold")
    // ==========================================
    {
      title: 'Native Mobile App (React Native / Expo)',
      description: 'Explore building a companion iOS & Android application sharing the same RTK Query API endpoints.',
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.LOW,
      orderIndex: 0,
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      labels: [labelFeature.id],
      subtasks: [
        { title: 'Evaluate shared schema packages', isCompleted: false },
        { title: 'Prototype push notifications with Expo', isCompleted: false },
      ],
    },
    {
      title: 'Export Kanban Board to PDF / CSV',
      description: 'Generate report exports of project tasks with progress metrics and milestone summaries.',
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.LOW,
      orderIndex: 1,
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      labels: [labelFeature.id, labelDocs.id],
      subtasks: [
        { title: 'Create CSV formatter utility', isCompleted: false },
        { title: 'Client-side PDF rendering generator', isCompleted: false },
      ],
    },
    {
      title: 'Custom Analytics Dashboard Widgets',
      description: 'Configurable chart widgets for velocity tracking, burndown metrics, and assignee workload distribution.',
      status: TaskStatus.BACKLOG,
      priority: TaskPriority.MEDIUM,
      orderIndex: 2,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      labels: [labelDesign.id, labelFeature.id],
      subtasks: [
        { title: 'Recharts integration components', isCompleted: false },
        { title: 'Drag & drop widget grid layout', isCompleted: false },
      ],
    },
  ];

  for (const t of tasksData) {
    const createdTask = await prisma.task.create({
      data: {
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        orderIndex: t.orderIndex,
        dueDate: t.dueDate,
        projectId: project.id,
        creatorId: user.id,
        assigneeId: user.id,
        reporterId: collaborator.id,
        labels: {
          create: (t.labels || []).map((labelId) => ({
            labelId,
          })),
        },
        subtasks: {
          create: (t.subtasks || []).map((sub, idx) => ({
            title: sub.title,
            isCompleted: sub.isCompleted,
            orderIndex: idx,
          })),
        },
        activities: {
          create: [
            {
              action: ActivityAction.TASK_CREATED,
              message: `Created task "${t.title}"`,
              userId: user.id,
            },
          ],
        },
      },
    });

    if (t.comment) {
      await prisma.comment.create({
        data: {
          content: t.comment,
          taskId: createdTask.id,
          userId: collaborator.id,
        },
      });
    }

    console.log(`  ➕ [${t.status}] "${t.title}" (Priority: ${t.priority})`);
  }

  // Also create a second project for list testing
  const secondProject = await prisma.project.create({
    data: {
      name: 'Mobile App Redesign',
      key: `MOB-${Date.now().toString().slice(-4)}`,
      description: 'Redesigning the mobile user experience with fluid gestures and glassmorphism styling.',
      color: '#EC4899',
      priority: TaskPriority.MEDIUM,
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      ownerId: user.id,
      members: {
        create: [
          {
            userId: user.id,
            role: ProjectRole.OWNER,
          },
        ],
      },
    },
  });
  console.log(`✅ Created secondary project: "${secondProject.name}" (Key: ${secondProject.key})`);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
