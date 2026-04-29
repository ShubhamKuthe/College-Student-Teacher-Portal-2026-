# College Student & Teacher Portal

A Firebase-powered college portal built with React, TypeScript, Tailwind CSS, and Recharts. The app includes role-based dashboards for students, teachers, and admins, with real-time Firestore listeners, assignment submissions, attendance tracking, announcements, and file uploads through Firebase Storage.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Firebase Authentication
- Firebase Firestore
- Firebase Storage
- Recharts
- Framer Motion

## Features

- Email/password authentication through Firebase Auth
- Role-based redirects from Firestore user profiles
- Student dashboard with assignments, attendance analytics, announcements, materials, and grades
- Teacher dashboard with assignment creation, grading, attendance marking, materials upload, and announcements
- Admin dashboard with user provisioning, subject mapping, enrollment mapping, system overview, and data cleanup
- Real-time updates through `onSnapshot`
- File uploads for assignment submissions and study materials
- Responsive dark UI with animated cards and dashboard sections

## Collections

The app uses the requested core collections plus two practical additions:

- `users`
- `subjects`
- `assignments`
- `submissions`
- `attendance`
- `announcements`
- `enrollments`
  Required so students can be mapped to subjects for dashboards, attendance, and assignments.
- `materials`
  Required for teacher-uploaded study resources.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your Firebase web app values.

3. Start the dev server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Firebase setup

### 1. Create a Firebase project

- Create a project in the Firebase console.
- Add a Web App.
- Copy the config into `.env`.

### 2. Enable Authentication

- Go to Authentication -> Sign-in method.
- Enable `Email/Password`.
- Create an initial admin user in the Auth console.

### 3. Create the initial admin profile in Firestore

Create a document in `users/{uid}` that matches the Firebase Auth user:

```json
{
  "id": "AUTH_UID_HERE",
  "name": "Initial Admin",
  "email": "admin@college.edu",
  "role": "admin",
  "active": true
}
```

### 4. Enable Firestore and Storage

- Create a Firestore database in production mode.
- Create a default Storage bucket.
- Publish the included `firestore.rules` and `storage.rules`.

### 5. Optional Firebase Hosting deployment

The repo includes `firebase.json` for SPA hosting rewrites.

Build and deploy with:

```bash
npm run build
firebase deploy
```

## Role flow

- `student` -> `/student-dashboard`
- `teacher` -> `/teacher-dashboard`
- `admin` -> `/admin-dashboard`

The route decision is based on the authenticated user's Firestore profile, not just Firebase Auth.

## Notes

- Admin account creation is handled from the client by creating Auth users through a secondary Firebase app instance, then writing the matching Firestore profile.
- User removal in the dashboard is implemented as deactivate/reactivate. Permanent Auth deletion should be done from the Firebase Console or a privileged Cloud Function if you want hard deletes.
- The app uses simple queries to avoid unnecessary composite index requirements.
