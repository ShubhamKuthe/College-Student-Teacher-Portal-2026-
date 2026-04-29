import type { Timestamp } from 'firebase/firestore'

export type Role = 'student' | 'teacher' | 'admin'
export type FirestoreDate = Timestamp | Date | string | null | undefined

export interface AppUser {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
  createdAt?: FirestoreDate
}

export interface Subject {
  id: string
  name: string
  teacherId: string
}

export interface Enrollment {
  id: string
  studentId: string
  subjectId: string
}

export interface Assignment {
  id: string
  title: string
  description: string
  subjectId: string
  teacherId: string
  deadline: string
  createdAt?: FirestoreDate
}

export interface Submission {
  id: string
  assignmentId: string
  studentId: string
  fileUrl?: string
  textSubmission?: string
  grade?: number | null
  feedback?: string
  submittedAt?: FirestoreDate
}

export interface AttendanceRecord {
  studentId: string
  present: boolean
}

export interface Attendance {
  id: string
  subjectId: string
  date: string
  records: AttendanceRecord[]
}

export interface Announcement {
  id: string
  title: string
  message: string
  createdBy: string
  createdAt?: FirestoreDate
}

export interface StudyMaterial {
  id: string
  title: string
  description?: string
  subjectId: string
  teacherId: string
  fileUrl: string
  createdAt?: FirestoreDate
}

export function getDashboardPath(role: Role) {
  switch (role) {
    case 'student':
      return '/student-dashboard'
    case 'teacher':
      return '/teacher-dashboard'
    case 'admin':
      return '/admin-dashboard'
    default:
      return '/login'
  }
}
