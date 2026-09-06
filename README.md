# MindHaven

MindHaven is a full-stack mental-wellbeing platform that helps people record daily experiences, understand personal patterns, practise guided wellness activities, and seek anonymous support from verified professionals.

It combines mood journaling, sleep and body-signal tracking, medication routines, explainable insights, private reports, structured self-reflection, and a moderated community in one responsive application.

> [!IMPORTANT]
> MindHaven is a wellbeing and self-reflection tool. It does not diagnose, treat, or replace professional medical or mental-health care. It is not an emergency service.

## Features

### Personal wellbeing tracking

- One daily check-in that connects mood, context, sleep, and body signals
- Mood journal with 1–10, emoji, and color scales
- Guided journal templates, notes, context tags, search, filters, editing, and deletion
- Body-signal tracking for sensations, affected areas, intensity, emotions, and triggers
- Sleep logging with bedtime, wake time, duration, quality, and recent summaries
- Medication schedules with active/paused states and daily taken or skipped records

### Insights and reports

- Weekly, monthly, yearly, and custom-date mood trends
- Tracking coverage, context patterns, weekday rhythms, and medication consistency
- Explainable sleep–mood and anxiety–mood associations with sample-size cautions
- Downloadable PDF reports and complete JSON account exports
- Expiring and revocable report-sharing links with selectable sections

### Wellness and care

- Guided breathing sessions with visual pacing, timers, and optional spoken prompts
- Guided meditation sessions with timed written instructions
- Pause, resume, reset, reduced-motion, and automatic pause-on-hidden-tab behavior
- Private CBT-style thought records for examining and reframing difficult thoughts
- Evidence-linked self-help exercises and Bangladesh-focused support resources

### Professional community support

- Anonymous public or private support posts
- General members cannot provide professional answers
- One verified therapist is assigned to each answered post
- Bounded follow-up conversation between the anonymous author and assigned therapist
- Author-requested therapist reassignment while preserving conversation history
- Content reporting and role-based access controls
- Professional accounts remain pending until manually approved

### Account and administration

- Member and professional account registration with JWT authentication
- Therapist specialization selection and optional workplace information
- Goal-based onboarding, preferences, partial English/Bangla localization, and reduced-motion controls
- Profile-picture upload, profile editing, and password changes
- Password-confirmed account deletion
- Administrator dashboard for reviewing, approving, or declining pending therapist accounts

## Roles and permissions

| Role | Main capabilities |
| --- | --- |
| Member | Use personal trackers, create anonymous posts, reply to their assigned therapist, and manage their own data |
| Therapist | Use personal features and, after approval, answer eligible community posts and continue assigned conversations |
| Administrator | Review pending therapist accounts and approve or decline professional access |

Selecting a therapist account type does not grant professional-response access. Every therapist account starts with `pending` verification status, and verification cannot be granted through the public registration API.

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS, Lucide React |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens, bcrypt password hashing |
| Reports | Server-generated PDF documents |
| Testing | Node.js built-in test runner, MongoDB Memory Server |

## Architecture

MindHaven follows an MVC-oriented structure. React pages and components form the presentation layer; Express routes and controllers handle HTTP requests; Mongoose models own persistence; services contain reusable business logic.

```text
Mindhaven/
├── config/             Database configuration
├── controllers/        HTTP request handlers
├── docs/               Architecture and safety documentation
├── features/           Backend feature registry
├── frontend/
│   ├── public/         Static assets
│   ├── src/
│   │   ├── components/ Shared UI components
│   │   ├── features/   Feature-specific frontend modules
│   │   ├── hooks/      Reusable React behavior
│   │   ├── lib/        API clients and pure utilities
│   │   └── pages/      Application pages
│   └── test/           Frontend unit tests
├── middleware/         Authentication and authorization
├── models/             Mongoose schemas and models
├── routes/             Express route definitions
├── scripts/            Local startup and maintenance scripts
├── services/           Business, analytics, and reporting logic
├── test/               Backend and integration tests
├── utils/              Shared backend utilities
├── app.js              Express application composition
└── server.js           Database connection and server startup
```

The application is organized into cohesive feature areas rather than isolated files. See [the architecture guide](docs/ARCHITECTURE.md) for the detailed feature-to-file mapping and [the community safety guide](docs/COMMUNITY_SAFETY.md) for the access model.

## Getting started

### Prerequisites

- Node.js 20.19 or newer
- npm
- MongoDB Atlas for normal development/production, or the included local development database

### 1. Clone and install

```bash
git clone https://github.com/IshrakFaisal/MindHeaven.git
cd MindHeaven
npm install
npm install --prefix frontend
```

### 2. Configure the backend

Create a `.env` file in the project root:

```env
MONGO_URI=mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
PORT=5000
```

Do not commit `.env` or real credentials to Git.

If you use the local development database described below, `MONGO_URI` is not required for that startup command. `JWT_SECRET` is still required.

### 3. Start the backend

With MongoDB Atlas:

```bash
npm run dev
```

Or start the development-only disk-backed MongoDB Memory Server:

```bash
npm run start:local
```

Local database files are kept in the ignored `.cache/mongodb-data` directory so development records can survive normal API restarts.

### 4. Start the frontend

Open another terminal:

```bash
npm run frontend:dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` requests to [http://localhost:5000](http://localhost:5000) during development.

For a separately hosted frontend, set:

```env
VITE_API_URL=https://your-api.example.com/api
```

## Available scripts

Run these commands from the repository root.

| Command | Purpose |
| --- | --- |
| `npm start` | Start the production-style API process |
| `npm run dev` | Start the API with Nodemon |
| `npm run start:local` | Start the API with the development-only local database |
| `npm run frontend:dev` | Start the Vite frontend development server |
| `npm run frontend:build` | Create a production frontend build |
| `npm test` | Run the complete backend and frontend test suite |
| `npm run therapist:verify -- email@example.com` | Manually verify a therapist from the command line |

## API overview

Most endpoints require `Authorization: Bearer <token>`.

| Area | Base endpoint | Access |
| --- | --- | --- |
| Accounts | `/api/users` | Registration/login public; profile and data operations authenticated |
| Administration | `/api/admin` | Administrator only |
| Daily check-in | `/api/check-ins` | Authenticated |
| Mood journal | `/api/mood` | Authenticated |
| Context tags | `/api/tags` | Authenticated |
| Body signals | `/api/symptoms` | Authenticated |
| Sleep | `/api/sleep` | Authenticated |
| Medication | `/api/medications` | Authenticated |
| Insights and PDF reports | `/api/reports` | Authenticated |
| Report sharing | `/api/report-shares` | Management authenticated; active token views public |
| Thought records | `/api/thought-records` | Authenticated |
| Community | `/api/community` | Authenticated with role-aware permissions |

Notable public endpoints:

```text
POST /api/users/register
POST /api/users/login
GET  /api/report-shares/public/:token
GET  /api/report-shares/public/:token/pdf
```

Custom report ranges are inclusive and limited to 366 days. Supported presets are `week`, `month`, and `year`.

## Testing and verification

Run all automated tests:

```bash
npm test
```

Run the frontend tests directly:

```bash
npm test --prefix frontend
```

Run a single test file, for example the Wellness tests:

```bash
node --test frontend/test/wellness.test.js
```

Verify the production frontend build:

```bash
npm run frontend:build
```

The test suite covers account validation, authorization, daily-record consistency, tracker controllers, medication doses, analytics, correlations, PDFs, report sharing, community permissions, care resources, body-signal patterns, and Wellness session timing.

## Privacy and safety boundaries

- Passwords are hashed before storage.
- Personal APIs are protected by JWT authentication and ownership checks.
- Community aliases hide member identity from readers, but posts remain linked to accounts in the database for ownership and safety controls. This is pseudonymity, not database anonymity.
- Shared-report URLs work as bearer links: anyone who receives an active link can open the selected report sections until the link expires or is revoked.
- Wellness exercises run in the browser and do not save session progress.
- Correlation insights describe associations and do not claim causation.
- Crisis and care resources are informational and do not make MindHaven an emergency service.

### Before public deployment

- Use a strong production `JWT_SECRET` and a protected MongoDB deployment.
- Restrict CORS to the deployed frontend origin.
- Replace or disable the current development administrator bootstrap; never deploy hard-coded administrator credentials.
- Serve the application over HTTPS.
- Add production monitoring, backups, rate limiting, and a content-moderation workflow.
- Review professional-verification and health-data handling requirements with qualified legal and clinical advisers.

## Contributing

1. Create a feature branch from the latest `main`.
2. Keep each commit focused on one feature area.
3. Add or update tests for behavioral changes.
4. Run `npm test` and `npm run frontend:build` before opening a pull request.
5. Do not commit `.env`, `.cache`, `node_modules`, or `frontend/dist`.

Example:

```bash
git checkout -b feature/improve-journal
git add path/to/relevant/files
git commit -m "feat(journal): describe the change"
git push -u origin feature/improve-journal
```

## License

The project currently declares the ISC license in `package.json`.
