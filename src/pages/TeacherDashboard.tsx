import { motion } from 'framer-motion'
import {
  Bell,
  BookOpen,
  CalendarCheck2,
  ChartColumn,
  ClipboardList,
  FilePenLine,
  Files,
  GraduationCap,
  Layers3,
  Send,
  Upload,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { AppShell } from '../components/AppShell'
import { SectionCard } from '../components/SectionCard'
import { StatCard } from '../components/StatCard'
import { useAuth } from '../contexts/AuthContext'
import {
  createAnnouncement,
  createAssignment,
  createStudyMaterial,
  gradeSubmission,
  saveAttendance,
  subscribeCollection,
  whereEquals,
} from '../services/firestore'
import { uploadPortalFile } from '../services/storage'
import type {
  Announcement,
  AppUser,
  Assignment,
  Attendance,
  Enrollment,
  StudyMaterial,
  Subject,
  Submission,
} from '../types/models'
import { formatDate, formatDateTime, formatGrade, toMillis } from '../utils/format'

const teacherNav = [
  { label: 'Overview', href: '#overview', icon: ChartColumn },
  { label: 'Assignments', href: '#assignments', icon: FilePenLine },
  { label: 'Materials', href: '#materials', icon: Files },
  { label: 'Submissions', href: '#submissions', icon: GraduationCap },
  { label: 'Attendance', href: '#attendance', icon: CalendarCheck2 },
  { label: 'Announcements', href: '#announcements', icon: Bell },
]

export function TeacherDashboard() {
  const { profile } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [assignmentMessage, setAssignmentMessage] = useState<string | null>(null)
  const [materialMessage, setMaterialMessage] = useState<string | null>(null)
  const [announcementMessage, setAnnouncementMessage] = useState<string | null>(null)
  const [attendanceMessage, setAttendanceMessage] = useState<string | null>(null)
  const [gradingMessage, setGradingMessage] = useState<string | null>(null)
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    subjectId: '',
    deadline: '',
  })
  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    subjectId: '',
    file: null as File | null,
  })
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
  })
  const [attendanceSubjectId, setAttendanceSubjectId] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10))
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({})
  const [gradingDrafts, setGradingDrafts] = useState<Record<string, { grade: string; feedback: string }>>({})
  const [busyAction, setBusyAction] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) {
      return
    }

    const unsubscribeSubjects = subscribeCollection<Subject>(
      'subjects',
      setSubjects,
      whereEquals('teacherId', profile.id),
    )
    const unsubscribeAssignments = subscribeCollection<Assignment>(
      'assignments',
      setAssignments,
      whereEquals('teacherId', profile.id),
    )
    const unsubscribeMaterials = subscribeCollection<StudyMaterial>(
      'materials',
      setMaterials,
      whereEquals('teacherId', profile.id),
    )
    const unsubscribeSubmissions = subscribeCollection<Submission>('submissions', setSubmissions)
    const unsubscribeAttendance = subscribeCollection<Attendance>('attendance', setAttendance)
    const unsubscribeAnnouncements =
      subscribeCollection<Announcement>('announcements', setAnnouncements)
    const unsubscribeUsers = subscribeCollection<AppUser>('users', setUsers)
    const unsubscribeEnrollments = subscribeCollection<Enrollment>('enrollments', setEnrollments)

    return () => {
      unsubscribeSubjects()
      unsubscribeAssignments()
      unsubscribeMaterials()
      unsubscribeSubmissions()
      unsubscribeAttendance()
      unsubscribeAnnouncements()
      unsubscribeUsers()
      unsubscribeEnrollments()
    }
  }, [profile])

  useEffect(() => {
    if (!attendanceSubjectId) {
      setAttendanceMap({})
      return
    }

    const enrolledStudents = enrollments.filter((entry) => entry.subjectId === attendanceSubjectId)
    const existingAttendance = attendance.find(
      (entry) => entry.subjectId === attendanceSubjectId && entry.date === attendanceDate,
    )
    const nextMap: Record<string, boolean> = {}

    for (const student of enrolledStudents) {
      nextMap[student.studentId] =
        existingAttendance?.records.find((record) => record.studentId === student.studentId)?.present ?? true
    }

    setAttendanceMap(nextMap)
  }, [attendance, attendanceDate, attendanceSubjectId, enrollments])

  if (!profile) {
    return null
  }

  const currentTeacher = profile

  const subjectLookup = Object.fromEntries(subjects.map((subject) => [subject.id, subject]))
  const userLookup = Object.fromEntries(users.map((user) => [user.id, user]))
  const teacherAssignments = [...assignments].sort((left, right) => toMillis(left.deadline) - toMillis(right.deadline))
  const teacherSubjectIds = subjects.map((subject) => subject.id)
  const teacherSubmissions = submissions
    .filter((entry) => teacherAssignments.some((assignment) => assignment.id === entry.assignmentId))
    .sort((left, right) => toMillis(right.submittedAt) - toMillis(left.submittedAt))
  const pendingSubmissions = teacherSubmissions.filter(
    (entry) => entry.grade === null || entry.grade === undefined,
  )
  const classStudentIds = Array.from(
    new Set(enrollments.filter((entry) => teacherSubjectIds.includes(entry.subjectId)).map((entry) => entry.studentId)),
  )
  const materialFeed = [...materials].sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt))
  const teacherAnnouncementFeed = [...announcements].sort(
    (left, right) => toMillis(right.createdAt) - toMillis(left.createdAt),
  )

  async function handleCreateAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusyAction('assignment')
    setAssignmentMessage(null)

    try {
      await createAssignment({
        title: assignmentForm.title,
        description: assignmentForm.description,
        subjectId: assignmentForm.subjectId,
        teacherId: currentTeacher.id,
        deadline: assignmentForm.deadline,
      })

      setAssignmentForm({ title: '', description: '', subjectId: '', deadline: '' })
      setAssignmentMessage('Assignment published successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to publish assignment.'
      setAssignmentMessage(message)
    } finally {
      setBusyAction(null)
    }
  }

  async function handleUploadMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!materialForm.file) {
      setMaterialMessage('Choose a file before uploading a study material.')
      return
    }

    setBusyAction('material')
    setMaterialMessage(null)

    try {
      const fileUrl = await uploadPortalFile(
        `materials/${currentTeacher.id}/${materialForm.subjectId}`,
        materialForm.file,
      )

      await createStudyMaterial({
        title: materialForm.title,
        description: materialForm.description,
        subjectId: materialForm.subjectId,
        teacherId: currentTeacher.id,
        fileUrl,
      })

      setMaterialForm({ title: '', description: '', subjectId: '', file: null })
      setMaterialMessage('Study material uploaded successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to upload study material.'
      setMaterialMessage(message)
    } finally {
      setBusyAction(null)
    }
  }

  async function handleSendAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusyAction('announcement')
    setAnnouncementMessage(null)

    try {
      await createAnnouncement({
        title: announcementForm.title,
        message: announcementForm.message,
        createdBy: currentTeacher.id,
      })

      setAnnouncementForm({ title: '', message: '' })
      setAnnouncementMessage('Announcement sent to the campus feed.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send announcement.'
      setAnnouncementMessage(message)
    } finally {
      setBusyAction(null)
    }
  }

  async function handleSaveAttendance() {
    if (!attendanceSubjectId || !attendanceDate) {
      setAttendanceMessage('Choose a subject and date before saving attendance.')
      return
    }

    setBusyAction('attendance')
    setAttendanceMessage(null)

    try {
      await saveAttendance({
        subjectId: attendanceSubjectId,
        date: attendanceDate,
        records: Object.entries(attendanceMap).map(([studentId, present]) => ({ studentId, present })),
      })

      setAttendanceMessage('Attendance saved successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save attendance.'
      setAttendanceMessage(message)
    } finally {
      setBusyAction(null)
    }
  }

  async function handleGradeSubmission(submissionId: string) {
    const draft = gradingDrafts[submissionId]

    if (!draft) {
      setGradingMessage('Add a grade or feedback before saving.')
      return
    }

    setBusyAction(submissionId)
    setGradingMessage(null)

    try {
      await gradeSubmission(submissionId, {
        grade: draft.grade.trim() ? Number(draft.grade) : null,
        feedback: draft.feedback,
      })
      setGradingMessage('Submission graded successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save grade.'
      setGradingMessage(message)
    } finally {
      setBusyAction(null)
    }
  }

  const studentsForAttendance = enrollments
    .filter((entry) => entry.subjectId === attendanceSubjectId)
    .map((entry) => userLookup[entry.studentId])
    .filter(Boolean)

  return (
    <AppShell
      role="teacher"
      title="Teacher dashboard"
      subtitle="Create coursework, manage attendance, and respond to students with real-time Firebase data."
      navItems={teacherNav}
    >
      <div id="overview" className="grid gap-4 lg:grid-cols-4">
        <StatCard
          label="Classes"
          value={`${subjects.length}`}
          note="Subjects currently assigned to you."
          icon={BookOpen}
        />
        <StatCard
          label="Students"
          value={`${classStudentIds.length}`}
          note="Distinct students enrolled across your classes."
          icon={Layers3}
        />
        <StatCard
          label="Pending review"
          value={`${pendingSubmissions.length}`}
          note="Submissions still waiting for grades or feedback."
          icon={ClipboardList}
        />
        <StatCard
          label="Materials"
          value={`${materials.length}`}
          note="Uploaded study resources available to students."
          icon={Files}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          id="assignments"
          title="Create assignment"
          description="Publish coursework with deadlines so it appears instantly on student dashboards."
        >
          {assignmentMessage ? (
            <div className="mb-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50">
              {assignmentMessage}
            </div>
          ) : null}

          <form onSubmit={handleCreateAssignment} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Title</span>
                <input
                  value={assignmentForm.title}
                  onChange={(event) =>
                    setAssignmentForm((current) => ({ ...current, title: event.target.value }))
                  }
                  className="h-12 rounded-2xl border border-white/10 bg-slate-950/45 px-4 text-white outline-none focus:border-cyan-300/35"
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Subject</span>
                <select
                  value={assignmentForm.subjectId}
                  onChange={(event) =>
                    setAssignmentForm((current) => ({ ...current, subjectId: event.target.value }))
                  }
                  className="h-12 rounded-2xl border border-white/10 bg-slate-950/45 px-4 text-white outline-none focus:border-cyan-300/35"
                  required
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">Description</span>
              <textarea
                value={assignmentForm.description}
                onChange={(event) =>
                  setAssignmentForm((current) => ({ ...current, description: event.target.value }))
                }
                rows={4}
                className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/35"
                required
              />
            </label>

            <label className="grid gap-2 md:max-w-xs">
              <span className="text-sm font-medium text-slate-200">Deadline</span>
              <input
                type="date"
                value={assignmentForm.deadline}
                onChange={(event) =>
                  setAssignmentForm((current) => ({ ...current, deadline: event.target.value }))
                }
                className="h-12 rounded-2xl border border-white/10 bg-slate-950/45 px-4 text-white outline-none focus:border-cyan-300/35"
                required
              />
            </label>

            <button
              type="submit"
              disabled={busyAction === 'assignment'}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#38bdf8,#0f766e)] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FilePenLine className="h-4 w-4" />
              {busyAction === 'assignment' ? 'Publishing...' : 'Publish assignment'}
            </button>
          </form>
        </SectionCard>

        <SectionCard
          id="materials"
          title="Upload study materials"
          description="Share lecture slides, notes, handouts, or reference documents through Firebase Storage."
        >
          {materialMessage ? (
            <div className="mb-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50">
              {materialMessage}
            </div>
          ) : null}

          <form onSubmit={handleUploadMaterial} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Title</span>
                <input
                  value={materialForm.title}
                  onChange={(event) =>
                    setMaterialForm((current) => ({ ...current, title: event.target.value }))
                  }
                  className="h-12 rounded-2xl border border-white/10 bg-slate-950/45 px-4 text-white outline-none focus:border-cyan-300/35"
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Subject</span>
                <select
                  value={materialForm.subjectId}
                  onChange={(event) =>
                    setMaterialForm((current) => ({ ...current, subjectId: event.target.value }))
                  }
                  className="h-12 rounded-2xl border border-white/10 bg-slate-950/45 px-4 text-white outline-none focus:border-cyan-300/35"
                  required
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">Description</span>
              <textarea
                value={materialForm.description}
                onChange={(event) =>
                  setMaterialForm((current) => ({ ...current, description: event.target.value }))
                }
                rows={3}
                className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/35"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">File</span>
              <input
                type="file"
                onChange={(event) =>
                  setMaterialForm((current) => ({
                    ...current,
                    file: event.target.files?.[0] ?? null,
                  }))
                }
                className="rounded-2xl border border-dashed border-white/15 bg-slate-950/45 px-4 py-3 text-sm text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-cyan-300/20 file:px-4 file:py-2 file:text-cyan-50"
                required
              />
            </label>

            <button
              type="submit"
              disabled={busyAction === 'material'}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#f59e0b,#f97316)] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {busyAction === 'material' ? 'Uploading...' : 'Upload material'}
            </button>
          </form>

          <div className="mt-6 grid gap-4">
            {materialFeed.map((material) => (
              <div key={material.id} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-heading text-xl text-white">{material.title}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {subjectLookup[material.subjectId]?.name ?? 'Subject'} / {formatDateTime(material.createdAt)}
                    </p>
                  </div>
                  <a
                    href={material.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100"
                  >
                    Open file
                  </a>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        id="submissions"
        title="Submissions and grading"
        description="Review incoming work, open files, and save grades plus feedback in real time."
      >
        {gradingMessage ? (
          <div className="mb-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50">
            {gradingMessage}
          </div>
        ) : null}

        <div className="grid gap-5">
          {teacherSubmissions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
              Student submissions will show up here as soon as work is uploaded.
            </div>
          ) : (
            teacherSubmissions.map((submission) => {
              const assignment = assignments.find((entry) => entry.id === submission.assignmentId)
              const student = userLookup[submission.studentId]

              return (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-5"
                >
                  <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-heading text-2xl text-white">{assignment?.title ?? 'Assignment'}</p>
                        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
                          {formatGrade(submission.grade)}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-2 text-sm text-slate-400">
                        <p>Student: {student?.name ?? 'Student record missing'}</p>
                        <p>Subject: {subjectLookup[assignment?.subjectId ?? '']?.name ?? 'Unknown subject'}</p>
                        <p>Submitted: {formatDateTime(submission.submittedAt)}</p>
                        <p>Deadline: {formatDate(assignment?.deadline)}</p>
                      </div>

                      {submission.textSubmission ? (
                        <div className="mt-4 rounded-3xl border border-white/10 bg-slate-900/55 p-4 text-sm leading-7 text-slate-300">
                          {submission.textSubmission}
                        </div>
                      ) : null}

                      {submission.fileUrl ? (
                        <a
                          href={submission.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100"
                        >
                          Open uploaded file
                        </a>
                      ) : null}
                    </div>

                    <div className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-slate-900/55 p-4">
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-slate-200">Grade</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={gradingDrafts[submission.id]?.grade ?? `${submission.grade ?? ''}`}
                          onChange={(event) =>
                            setGradingDrafts((current) => ({
                              ...current,
                              [submission.id]: {
                                grade: event.target.value,
                                feedback: current[submission.id]?.feedback ?? submission.feedback ?? '',
                              },
                            }))
                          }
                          className="h-12 rounded-2xl border border-white/10 bg-slate-950/45 px-4 text-white outline-none focus:border-cyan-300/35"
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-slate-200">Feedback</span>
                        <textarea
                          value={gradingDrafts[submission.id]?.feedback ?? submission.feedback ?? ''}
                          onChange={(event) =>
                            setGradingDrafts((current) => ({
                              ...current,
                              [submission.id]: {
                                grade: current[submission.id]?.grade ?? `${submission.grade ?? ''}`,
                                feedback: event.target.value,
                              },
                            }))
                          }
                          rows={4}
                          className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/35"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => void handleGradeSubmission(submission.id)}
                        disabled={busyAction === submission.id}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#38bdf8,#0f766e)] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <GraduationCap className="h-4 w-4" />
                        {busyAction === submission.id ? 'Saving...' : 'Save grade'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          id="attendance"
          title="Attendance marking"
          description="Select a subject and date, then save a per-student attendance record."
        >
          {attendanceMessage ? (
            <div className="mb-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50">
              {attendanceMessage}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">Subject</span>
              <select
                value={attendanceSubjectId}
                onChange={(event) => setAttendanceSubjectId(event.target.value)}
                className="h-12 rounded-2xl border border-white/10 bg-slate-950/45 px-4 text-white outline-none focus:border-cyan-300/35"
              >
                <option value="">Select a subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">Date</span>
              <input
                type="date"
                value={attendanceDate}
                onChange={(event) => setAttendanceDate(event.target.value)}
                className="h-12 rounded-2xl border border-white/10 bg-slate-950/45 px-4 text-white outline-none focus:border-cyan-300/35"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-3">
            {studentsForAttendance.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
                Choose a subject with enrolled students to mark attendance.
              </div>
            ) : (
              studentsForAttendance.map((student) => (
                <label
                  key={student.id}
                  className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">{student.name}</p>
                    <p className="text-sm text-slate-400">{student.email}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={attendanceMap[student.id] ?? true}
                    onChange={(event) =>
                      setAttendanceMap((current) => ({
                        ...current,
                        [student.id]: event.target.checked,
                      }))
                    }
                    className="h-5 w-5 rounded border-white/15 bg-slate-950/45 text-cyan-400"
                  />
                </label>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => void handleSaveAttendance()}
            disabled={busyAction === 'attendance'}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#38bdf8,#0f766e)] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CalendarCheck2 className="h-4 w-4" />
            {busyAction === 'attendance' ? 'Saving attendance...' : 'Save attendance'}
          </button>
        </SectionCard>

        <SectionCard
          id="announcements"
          title="Announcements"
          description="Broadcast updates to students and staff. Posts appear instantly through Firestore listeners."
        >
          {announcementMessage ? (
            <div className="mb-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50">
              {announcementMessage}
            </div>
          ) : null}

          <form onSubmit={handleSendAnnouncement} className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">Title</span>
              <input
                value={announcementForm.title}
                onChange={(event) =>
                  setAnnouncementForm((current) => ({ ...current, title: event.target.value }))
                }
                className="h-12 rounded-2xl border border-white/10 bg-slate-950/45 px-4 text-white outline-none focus:border-cyan-300/35"
                required
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">Message</span>
              <textarea
                value={announcementForm.message}
                onChange={(event) =>
                  setAnnouncementForm((current) => ({ ...current, message: event.target.value }))
                }
                rows={5}
                className="rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/35"
                required
              />
            </label>
            <button
              type="submit"
              disabled={busyAction === 'announcement'}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#f59e0b,#f97316)] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {busyAction === 'announcement' ? 'Sending...' : 'Send announcement'}
            </button>
          </form>

          <div className="mt-6 grid gap-4">
            {teacherAnnouncementFeed.slice(0, 4).map((announcement) => (
              <div key={announcement.id} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                <p className="font-heading text-xl text-white">{announcement.title}</p>
                <p className="mt-2 text-sm text-slate-400">
                  {userLookup[announcement.createdBy]?.name ?? 'Campus staff'} /{' '}
                  {formatDateTime(announcement.createdAt)}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">{announcement.message}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  )
}
