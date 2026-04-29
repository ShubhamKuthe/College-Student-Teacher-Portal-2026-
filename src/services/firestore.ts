import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from '../firebase'
import type {
  Announcement,
  AppUser,
  Assignment,
  AttendanceRecord,
  Enrollment,
  StudyMaterial,
  Subject,
  Submission,
} from '../types/models'

export function subscribeCollection<T extends { id: string }>(
  collectionName: string,
  onData: (items: T[]) => void,
  ...constraints: QueryConstraint[]
) {
  const collectionRef = collection(db, collectionName)
  const collectionQuery = constraints.length ? query(collectionRef, ...constraints) : collectionRef

  return onSnapshot(collectionQuery, (snapshot) => {
    onData(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as T))
  })
}

export function whereEquals(field: string, value: string) {
  return where(field, '==', value)
}

export async function createSubject(input: Omit<Subject, 'id'>) {
  const subjectRef = doc(collection(db, 'subjects'))
  await setDoc(subjectRef, { id: subjectRef.id, ...input })
}

export async function updateSubject(subjectId: string, input: Partial<Omit<Subject, 'id'>>) {
  await updateDoc(doc(db, 'subjects', subjectId), input)
}

export async function saveEnrollment(input: Omit<Enrollment, 'id'>) {
  const enrollmentId = `${input.studentId}_${input.subjectId}`
  await setDoc(doc(db, 'enrollments', enrollmentId), { id: enrollmentId, ...input })
}

export async function removeEnrollment(enrollmentId: string) {
  await deleteDoc(doc(db, 'enrollments', enrollmentId))
}

export async function createAssignment(input: Omit<Assignment, 'id' | 'createdAt'>) {
  const assignmentRef = doc(collection(db, 'assignments'))
  await setDoc(assignmentRef, {
    id: assignmentRef.id,
    ...input,
    createdAt: serverTimestamp(),
  })
}

export async function saveSubmission(input: Omit<Submission, 'id' | 'submittedAt'>) {
  const submissionId = `${input.assignmentId}_${input.studentId}`
  await setDoc(
    doc(db, 'submissions', submissionId),
    {
      id: submissionId,
      ...input,
      submittedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function gradeSubmission(
  submissionId: string,
  input: { grade: number | null; feedback: string },
) {
  await updateDoc(doc(db, 'submissions', submissionId), input)
}

export async function saveAttendance(input: {
  subjectId: string
  date: string
  records: AttendanceRecord[]
}) {
  const attendanceId = `${input.subjectId}_${input.date}`
  await setDoc(doc(db, 'attendance', attendanceId), { id: attendanceId, ...input })
}

export async function createAnnouncement(input: Omit<Announcement, 'id' | 'createdAt'>) {
  const announcementRef = doc(collection(db, 'announcements'))
  await setDoc(announcementRef, {
    id: announcementRef.id,
    ...input,
    createdAt: serverTimestamp(),
  })
}

export async function createStudyMaterial(input: Omit<StudyMaterial, 'id' | 'createdAt'>) {
  const materialRef = doc(collection(db, 'materials'))
  await setDoc(materialRef, {
    id: materialRef.id,
    ...input,
    createdAt: serverTimestamp(),
  })
}

export async function setUserActive(userId: string, active: boolean) {
  await updateDoc(doc(db, 'users', userId), { active })
}

export async function deleteDocument(
  collectionName:
    | 'subjects'
    | 'assignments'
    | 'submissions'
    | 'attendance'
    | 'announcements'
    | 'materials'
    | 'enrollments',
  id: string,
) {
  await deleteDoc(doc(db, collectionName, id))
}

export async function createUserProfileDocument(profile: AppUser) {
  await setDoc(doc(db, 'users', profile.id), {
    ...profile,
    createdAt: serverTimestamp(),
  })
}
