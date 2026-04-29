import { motion } from 'framer-motion'
import {
  Bell,
  BookOpen,
  CalendarClock,
  ChartColumn,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Megaphone,
  Upload,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from 'recharts'
import { AppShell } from '../components/AppShell'
import { SectionCard } from '../components/SectionCard'
import { StatCard } from '../components/StatCard'
import { useAuth } from '../contexts/AuthContext'
import { saveSubmission, subscribeCollection } from '../services/firestore'
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
import {
  formatDate,
  formatDateTime,
  formatGrade,
  formatPercent,
  toMillis,
  truncateText,
} from '../utils/format'

const studentNav = [
  { label: 'Overview', href: '#overview', icon: ChartColumn },
  { label: 'Subjects', href: '#subjects', icon: BookOpen },
  { label: 'Assignments', href: '#assignments', icon: FileText },
  { label: 'Grades', href: '#grades', icon: GraduationCap },
  { label: 'Announcements', href: '#announcements', icon: Bell },
]

export function StudentDashboard() {
  const { profile } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<string | null>(null)
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null)
  const [textDrafts, setTextDrafts] = useState<Record<string, string>>({})
  const [fileDrafts, setFileDrafts] = useState<Record<string, File | null>>({})

  useEffect(() => {
    const unsubscribeUsers = subscribeCollection<AppUser>('users', setUsers)
    const unsubscribeSubjects = subscribeCollection<Subject>('subjects', setSubjects)
    const unsubscribeAssignments = subscribeCollection<Assignment>('assignments', setAssignments)
    const unsubscribeSubmissions = subscribeCollection<Submission>('submissions', setSubmissions)
    const unsubscribeAttendance = subscribeCollection<Attendance>('attendance', setAttendance)
    const unsubscribeAnnouncements =
      subscribeCollection<Announcement>('announcements', setAnnouncements)
    const unsubscribeMaterials = subscribeCollection<StudyMaterial>('materials', setMaterials)
    const unsubscribeEnrollments = subscribeCollection<Enrollment>('enrollments', setEnrollments)

    return () => {
      unsubscribeUsers()
      unsubscribeSubjects()
      unsubscribeAssignments()
      unsubscribeSubmissions()
      unsubscribeAttendance()
      unsubscribeAnnouncements()
      unsubscribeMaterials()
      unsubscribeEnrollments()
    }
  }, [])

  if (!profile) {
    return null
  }

  const currentStudent = profile

  const studentEnrollmentIds = enrollments
    .filter((entry) => entry.studentId === currentStudent.id)
    .map((entry) => entry.subjectId)
  const studentSubjects = subjects.filter((subject) => studentEnrollmentIds.includes(subject.id))
  const studentAssignments = assignments
    .filter((assignment) => studentEnrollmentIds.includes(assignment.subjectId))
    .sort((left, right) => toMillis(left.deadline) - toMillis(right.deadline))
  const studentSubmissions = submissions.filter((submission) => submission.studentId === currentStudent.id)
  const subjectLookup = Object.fromEntries(subjects.map((subject) => [subject.id, subject]))
  const userLookup = Object.fromEntries(users.map((user) => [user.id, user]))
  const studentMaterials = materials
    .filter((material) => studentEnrollmentIds.includes(material.subjectId))
    .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt))
  const announcementFeed = [...announcements].sort(
    (left, right) => toMillis(right.createdAt) - toMillis(left.createdAt),
  )

  let attendancePresent = 0
  let attendanceTotal = 0

  for (const entry of attendance) {
    if (!studentEnrollmentIds.includes(entry.subjectId)) {
      continue
    }

    const record = entry.records.find((item) => item.studentId === currentStudent.id)

    if (record) {
      attendanceTotal += 1
      if (record.present) {
        attendancePresent += 1
      }
    }
  }

  const attendancePercentage = attendanceTotal === 0 ? 0 : (attendancePresent / attendanceTotal) * 100
  const completionPercentage =
    studentAssignments.length === 0
      ? 0
      : (studentSubmissions.length / studentAssignments.length) * 100

  const attendanceChartData = attendance
    .filter((entry) => studentEnrollmentIds.includes(entry.subjectId))
    .sort((left, right) => toMillis(left.date) - toMillis(right.date))
    .slice(-8)
    .map((entry) => {
      const record = entry.records.find((item) => item.studentId === currentStudent.id)

      return {
        name: `${subjectLookup[entry.subjectId]?.name ?? 'Subject'} ${entry.date.slice(5)}`,
        attendance: record?.present ? 100 : 0,
      }
    })

  const performanceChartData = studentSubmissions
    .filter((entry) => entry.grade !== null && entry.grade !== undefined)
    .sort((left, right) => toMillis(left.submittedAt) - toMillis(right.submittedAt))
    .map((entry) => ({
      name: truncateText(
        assignments.find((assignment) => assignment.id === entry.assignmentId)?.title ?? 'Assignment',
        14,
      ),
      grade: entry.grade ?? 0,
    }))

  async function handleSubmitAssignment(assignmentId: string) {
    const textSubmission = textDrafts[assignmentId]?.trim() ?? ''
    const file = fileDrafts[assignmentId]

    if (!textSubmission && !file) {
      setSubmissionMessage('Add a text response or upload a file before submitting.')
      return
    }

    setSubmittingAssignmentId(assignmentId)
    setSubmissionMessage(null)

    try {
      let fileUrl = studentSubmissions.find(
        (submission) => submission.id === `${assignmentId}_${currentStudent.id}`,
      )?.fileUrl

      if (file) {
        fileUrl = await uploadPortalFile(`submissions/${currentStudent.id}/${assignmentId}`, file)
      }

      await saveSubmission({
        assignmentId,
        studentId: currentStudent.id,
        fileUrl,
        textSubmission: textSubmission || undefined,
        grade:
          studentSubmissions.find(
            (submission) => submission.id === `${assignmentId}_${currentStudent.id}`,
          )?.grade ??
          null,
        feedback:
          studentSubmissions.find(
            (submission) => submission.id === `${assignmentId}_${currentStudent.id}`,
          )?.feedback ??
          '',
      })

      setSubmissionMessage('Assignment submitted successfully.')
      setTextDrafts((current) => ({ ...current, [assignmentId]: '' }))
      setFileDrafts((current) => ({ ...current, [assignmentId]: null }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit the assignment.'
      setSubmissionMessage(message)
    } finally {
      setSubmittingAssignmentId(null)
    }
  }

  return (
    <AppShell
      role="student"
      title="Student dashboard"
      subtitle="Follow your coursework, attendance, materials, and feedback with live Firebase updates."
      navItems={studentNav}
    >
      <div id="overview" className="grid gap-4 lg:grid-cols-4">
        <StatCard
          label="Upcoming tasks"
          value={`${studentAssignments.filter((entry) => toMillis(entry.deadline) >= Date.now()).length}`}
          note="Assignments still open across your enrolled subjects."
          icon={CalendarClock}
        />
        <StatCard
          label="Attendance"
          value={formatPercent(attendancePercentage)}
          note="Calculated from all marked sessions in your enrolled classes."
          icon={ClipboardCheck}
        />
        <StatCard
          label="Completion"
          value={formatPercent(completionPercentage)}
          note="Submitted assignments against all published coursework."
          icon={CheckCircle2}
        />
        <StatCard
          label="Announcements"
          value={`${announcementFeed.length}`}
          note="Real-time campus updates from teachers and admins."
          icon={Megaphone}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Attendance trend"
          description="A quick view of how each marked session has been recorded for you."
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceChartData}>
                <defs>
                  <linearGradient id="attendanceFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#f6d456" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#f6d456" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(246,212,86,0.12)" vertical={false} />
                <XAxis dataKey="name" stroke="#d5c8a2" fontSize={12} />
                <YAxis stroke="#d5c8a2" domain={[0, 100]} fontSize={12} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="attendance"
                  stroke="#f6d456"
                  strokeWidth={2}
                  fill="url(#attendanceFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Performance trend"
          description="Grades from teacher-reviewed submissions, plotted as they arrive."
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceChartData}>
                <CartesianGrid stroke="rgba(246,212,86,0.12)" vertical={false} />
                <XAxis dataKey="name" stroke="#d5c8a2" fontSize={12} />
                <YAxis stroke="#d5c8a2" domain={[0, 100]} fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="grade"
                  stroke="#f6d456"
                  strokeWidth={3}
                  dot={{ fill: '#fff2b9', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        id="subjects"
        title="Subjects and study materials"
        description="Everything you are enrolled in, along with the latest resources uploaded by your teachers."
      >
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="grid gap-4">
            {studentSubjects.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#f6d456]/16 bg-white/[0.03] p-6 text-sm text-white/66">
                No subjects yet. Ask an admin to create enrollments for your account.
              </div>
            ) : (
              studentSubjects.map((subject) => (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-[#f6d456]/14 bg-[#0d0f13] p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-heading text-xl text-white">{subject.name}</p>
                      <p className="mt-1 text-sm text-white/54">
                        Teacher: {userLookup[subject.teacherId]?.name ?? 'Not assigned'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#f6d456]/18 bg-[#f6d456]/8 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#f8edc5]">
                      Enrolled
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="grid gap-4">
            {studentMaterials.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#f6d456]/16 bg-white/[0.03] p-6 text-sm text-white/66">
                No study materials uploaded yet.
              </div>
            ) : (
              studentMaterials.map((material) => (
                <div key={material.id} className="rounded-3xl border border-[#f6d456]/14 bg-[#0d0f13] p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-heading text-xl text-white">{material.title}</p>
                      <p className="mt-2 text-sm text-white/54">
                        {subjectLookup[material.subjectId]?.name ?? 'Subject'} by{' '}
                        {userLookup[material.teacherId]?.name ?? 'Teacher'}
                      </p>
                    </div>
                    <a
                      href={material.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-2xl border border-[#f6d456]/18 bg-[#f6d456] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#efc331]"
                    >
                      Open file
                    </a>
                  </div>
                  {material.description ? (
                    <p className="mt-3 text-sm leading-6 text-white/68">{material.description}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        id="assignments"
        title="Assignments"
        description="Review the latest coursework and submit either a file, a text response, or both."
      >
        {submissionMessage ? (
          <div className="mb-5 rounded-3xl border border-[#f6d456]/18 bg-[#f6d456]/10 px-4 py-3 text-sm text-[#fff2b9]">
            {submissionMessage}
          </div>
        ) : null}

        <div className="grid gap-5">
          {studentAssignments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#f6d456]/16 bg-white/[0.03] p-6 text-sm text-white/66">
              No assignments have been published for your subjects yet.
            </div>
          ) : (
            studentAssignments.map((assignment) => {
              const submission = studentSubmissions.find(
                (entry) =>
                  entry.assignmentId === assignment.id && entry.studentId === currentStudent.id,
              )

              return (
                <div key={assignment.id} className="rounded-[2rem] border border-[#f6d456]/14 bg-[#0d0f13] p-5">
                  <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-heading text-2xl text-white">{assignment.title}</p>
                        <span className="rounded-full border border-[#f6d456]/18 bg-[#f6d456]/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f8edc5]">
                          Due {formatDate(assignment.deadline)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-white/68">{assignment.description}</p>
                      <div className="mt-4 grid gap-2 text-sm text-white/54">
                        <p>Subject: {subjectLookup[assignment.subjectId]?.name ?? 'Unknown subject'}</p>
                        <p>Teacher: {userLookup[assignment.teacherId]?.name ?? 'Unknown teacher'}</p>
                        <p>
                          Status:{' '}
                          <span className="text-white">
                            {submission ? `Submitted ${formatDateTime(submission.submittedAt)}` : 'Not submitted'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 rounded-[1.75rem] border border-[#f6d456]/12 bg-[#121419] p-4">
                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-[#f8edc5]">Text submission</span>
                        <textarea
                          value={textDrafts[assignment.id] ?? submission?.textSubmission ?? ''}
                          onChange={(event) =>
                            setTextDrafts((current) => ({
                              ...current,
                              [assignment.id]: event.target.value,
                            }))
                          }
                          rows={4}
                          className="rounded-2xl border border-[#f6d456]/12 bg-[#0b0d11] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#f6d456]/35"
                          placeholder="Write your response here if you prefer text."
                        />
                      </label>

                      <label className="grid gap-2">
                        <span className="text-sm font-medium text-[#f8edc5]">File upload</span>
                        <input
                          type="file"
                          onChange={(event) =>
                            setFileDrafts((current) => ({
                              ...current,
                              [assignment.id]: event.target.files?.[0] ?? null,
                            }))
                          }
                          className="rounded-2xl border border-dashed border-[#f6d456]/16 bg-[#0b0d11] px-4 py-3 text-sm text-white/64 file:mr-3 file:rounded-full file:border-0 file:bg-[#f6d456] file:px-4 file:py-2 file:text-black"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => void handleSubmitAssignment(assignment.id)}
                        disabled={submittingAssignmentId === assignment.id}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#f6d456] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#efc331] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Upload className="h-4 w-4" />
                        {submittingAssignmentId === assignment.id ? 'Submitting...' : 'Submit assignment'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </SectionCard>

      <SectionCard
        id="grades"
        title="Grades and feedback"
        description="Teacher evaluations land here in real time as soon as they are saved."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {studentSubmissions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#f6d456]/16 bg-white/[0.03] p-6 text-sm text-white/66">
              Your submissions will appear here once you send work to your teachers.
            </div>
          ) : (
            studentSubmissions.map((submission) => (
              <div key={submission.id} className="rounded-3xl border border-[#f6d456]/14 bg-[#0d0f13] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-xl text-white">
                      {assignments.find((assignment) => assignment.id === submission.assignmentId)?.title ??
                        'Assignment'}
                    </p>
                    <p className="mt-1 text-sm text-white/54">
                      Submitted {formatDateTime(submission.submittedAt)}
                    </p>
                  </div>
                  <span className="rounded-full border border-[#f6d456]/18 bg-[#f6d456]/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f8edc5]">
                    {formatGrade(submission.grade)}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-white/68">
                  {submission.feedback?.trim() ? submission.feedback : 'Feedback pending from your teacher.'}
                </p>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard
        id="announcements"
        title="Announcements"
        description="Live updates from faculty and administrators, streamed directly from Firestore listeners."
      >
        <div className="grid gap-4">
          {announcementFeed.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#f6d456]/16 bg-white/[0.03] p-6 text-sm text-white/66">
              No announcements yet.
            </div>
          ) : (
            announcementFeed.map((announcement) => (
              <div key={announcement.id} className="rounded-3xl border border-[#f6d456]/14 bg-[#0d0f13] p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-heading text-xl text-white">{announcement.title}</p>
                    <p className="mt-2 text-sm text-white/54">
                      Posted by {userLookup[announcement.createdBy]?.name ?? 'Campus staff'} on{' '}
                      {formatDateTime(announcement.createdAt)}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-white/68">{announcement.message}</p>
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </AppShell>
  )
}
