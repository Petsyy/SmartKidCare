# SmartKidCare Monitoring System

SmartKidCare is a web and mobile daycare management and child monitoring system designed to help Child Development Workers, parents, and center administrators manage child-related records and center activities.

The project is developed for **Sabangan Child Development Center in Dagupan City, Philippines**.

## Overview

SmartKidCare brings important daycare workflows into one system, helping authorized users manage and view enrollment details, attendance, feeding records, child health information, development progress, and center announcements.

### User Roles

- **Admin (Barangay Captain):** Uses the web portal to oversee center operations and manage center-related information.
- **Child Development Workers (CDWs):** Use the mobile app to manage assigned children's records and daily daycare activities.
- **Parents:** Use the mobile app to view their child's information, progress, records, and center announcements.

Access to information and actions is restricted according to the user's role and permissions.

## Key Features

- **Child enrollment and profiles** — organize child and family information.
- **Attendance tracking** — record and review children's attendance.
- **Feeding records** — maintain daily feeding activity records.
- **Health and growth monitoring** — record health-related information and track growth measurements, including BMI where applicable.
- **Child development tracking** — record competency evaluations and progress.
- **Announcements and notifications** — share center updates with relevant users.
- **Role-based access control** — limit access to information and actions based on user roles and permissions.
- **Parent AI assistant** — help parents ask questions about supported attendance and feeding records.
- **Mobile offline workflow support** — selected workflows can be prepared offline and synchronized when connectivity and authentication are available.

## Technology Stack

| Component | Technologies |
| --- | --- |
| Admin web portal | React, TypeScript, Vite, Tailwind CSS |
| Mobile application | React Native, Expo, Expo Router, TypeScript |
| Backend API | Node.js, Express.js, TypeScript |
| Database | MongoDB, Mongoose |
| API communication | RESTful APIs |
| Web data and server state | TanStack Query |
| Mobile navigation | Expo Router |

## Architecture

SmartKidCare uses a layered architecture. The web portal and mobile application communicate with the backend through APIs, and the backend handles application logic, access control, and database operations.

```text
Admin Web Portal (React + TypeScript)
                 |
                 v
          Backend REST API
       (Node.js + Express + TypeScript)
                 |
                 v
           MongoDB Database

Child Development Worker Mobile App
       (React Native + Expo)
                 |
                 +------> Backend REST API

Parent Mobile App
       (React Native + Expo)
                 |
                 +------> Backend REST API
```

## Repository Structure

```text
SmartKidCare/
├── backend/    # Express API, application logic, and database integration
├── web/        # Admin web portal
├── mobile/     # Child Development Worker and parent mobile application
└── README.md
```

## Getting Started

### Prerequisites

Install the following before running the project:

- Node.js and npm
- MongoDB database access
- Git
- Expo-compatible development environment for mobile development

### 1. Clone the repository

```bash
git clone https://github.com/Petsyy/SmartKidCare.git
cd SmartKidCare
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Configure the backend environment variables for your MongoDB connection and any required authentication, file storage, notification, or AI integrations. Use the configuration expected by the backend source code, and **never commit real credentials or secret keys**.

Start the backend development server:

```bash
npm run dev
```

The development script uses port **5001**.

### 3. Run the admin web portal

Open a separate terminal from the repository root:

```bash
cd web
npm install
npm run dev
```

Vite will print the local development URL in the terminal.

### 4. Run the mobile application

Open another terminal from the repository root:

```bash
cd mobile
npm install
npm start
```

Follow the Expo CLI instructions to open the app on a supported device, emulator, or development environment. Configure the mobile app to use the reachable backend API address for your environment; a device cannot usually reach a computer's `localhost` by using `localhost` itself.

## Development Commands

Run commands from the relevant project directory.

### Backend

| Command | Description |
| --- | --- |
| `npm run dev` | Start the backend development server |
| `npm run build` | Compile TypeScript |
| `npm run typecheck` | Check TypeScript types |
| `npm test` | Run backend tests |

### Web

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build the web app |
| `npm run lint` | Run ESLint |
| `npm test` | Run web tests |

### Mobile

| Command | Description |
| --- | --- |
| `npm start` | Start Expo |
| `npm run android` | Run the Android native development build |
| `npm run ios` | Run the iOS native development build |
| `npm run lint` | Run Expo lint |
| `npm test` | Run mobile tests |

## Security and Privacy

SmartKidCare handles information related to children and families. When developing, testing, or deploying the system:

- Use role-based authorization and verify access on the backend, not only in the UI.
- Keep database credentials, API keys, tokens, and other secrets out of source control.
- Use test or properly authorized data during development.
- Restrict access to child records to authorized users.
- Configure production services and environment variables securely.

## Project Scope

SmartKidCare is designed for the workflows of Sabangan Child Development Center. Features, permissions, and availability may depend on the configured environment and deployment.

## License

No open-source license has been specified in this repository. Contact the project owner before reusing or redistributing the code.
