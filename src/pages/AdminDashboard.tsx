import {
  Bell,
  BookOpen,
  Building2,
  ChartColumn,
  Layers3,
  Link2,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { AppShell } from '../components/AppShell'
import { SectionCard } from '../components/SectionCard'
import { StatCard } from '../components/StatCard'
import { useAuth } from '../contexts/AuthContext'
import { createUserByAdmin } from '../services/auth'
import {
  createAnnouncement,
  createSubject,
  deleteDocument,
  saveEnrollment,
  setUserActive,
  subscribeCollection,
  updateSubject,
} from '../services/firestore'
import type {
  Announcement,
  AppUser,
  Assignment,
  Attendance,
  Enrollment,
  Role,
  StudyMaterial,
  Subject,
  Submission,
} from '../types/models'
import { formatDateTime, toMillis } from '../utils/format'

const adminNav = [
  { label: 'Overview', href: '#overview', icon: ChartColumn },
  { label: 'Users', href: '#users', icon: Users },
  { label: 'Subjects', href: '#subjects', icon: BookOpen },
  { label: 'Enrollments', href: '#enrollments', icon: Link2 },
  { label: 'Announcements', href: '#announcements', icon: Bell },
  { label: 'Data Center', href: '#data-center', icon: Layers3 },
]

export function AdminDashboard() {
  const { profile } = useAuth()
  const [users, setUsers] = useState<AppUser[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [userMessage, setUserMessage] = useState<string | null>(null)
  const [subjectMessage, setSubjectMessage] = useState<string | null>(null)
  const [announcementMessage, setAnnouncementMessage] = useState<string | null>(null)
  const [enrollmentMessage, setEnrollmentMessage] = useState<string | null>(null)
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student' as Role,
  })
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    teacherId: '',
    subjectId: '',
  })
  const [enrollmentForm, setEnrollmentForm] = useState({
    studentId: '',
    subjectId: '',
  })
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
  })

  useEffect(() => {
    const unsubscribeUsers = subscribeCollection<AppUser>('users', setUsers)
    const unsubscribeSubjects = subscribeCollection<Subject>('subjects', setSubjects)
    const unsubscribeEnrollments = subscribeCollection<Enrollment>('enrollments', setEnrollments)
    const unsubscribeAssignments = subscribeCollection<Assignment>('assignments', setAssignments)
    const unsubscribeSubmissions = subscribeCollection<Submission>('submissions', setSubmissions)
    const unsubscribeAnnouncements =
      subscribeCollection<Announcement>('announcements', setAnnouncements)
    const unsubscribeAttendance = subscribeCollection<Attendance>('attendance', setAttendance)
    const unsubscribeMaterials = subscribeCollection<StudyMaterial>('materials', setMaterials)

    return () => {
      unsubscribeUsers()
      unsubscribeSubjects()
      unsubscribeEnrollments()
      unsubscribeAssignments()
      unsubscribeSubmissions()
      unsubscribeAnnouncements()
      unsubscribeAttendance()
      unsubscribeMaterials()
    }
  }, [])

  if (!profile) {
    return null
  }

  const currentAdmin = profile

  const teacherUsers = users.filter((user) => user.role === 'teacher' && user.active)
  const studentUsers = users.filter((user) => user.role === 'student' && user.active)
  const userLookup = Object.fromEntries(users.map((user) => [user.id, user]))
  const sortedAnnouncements = [...announcements].sort(
    (left, right) => toMillis(right.createdAt) - toMillis(left.createdAt),
  )

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusyAction('create-user')
    setUserMessage(null)

    try {
      await createUserByAdmin(userForm)
      setUserForm({ name: '', email: '', password: '', role: 'student' })
      setUserMessage('User account created successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create user.'
      setUserMessage(message)
    } finally {
      setBusyAction(null)
    }
  }

  async function handleSaveSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusyAction('save-subject')
    setSubjectMessage(null)

    try {
      if (subjectForm.subjectId) {
        await updateSubject(subjectForm.subjectId, {
          name: subjectForm.name,
          teacherId: subjectForm.teacherId,
        })
      } else {
        await createSubject({
          name: subjectForm.name,
          teacherId: subjectForm.teacherId,
        })
      }

      setSubjectForm({ name: '', teacherId: '', subjectId: '' })
      setSubjectMessage('Subject saved successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save subject.'
      setSubjectMessage(message)
    } finally {
      setBusyAction(null)
    }
  }

  async function handleSaveEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusyAction('save-enrollment')
    setEnrollmentMessage(null)

    try {
      await saveEnrollment(enrollmentForm)
      setEnrollmentForm({ studentId: '', subjectId: '' })
      setEnrollmentMessage('Enrollment saved successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save enrollment.'
      setEnrollmentMessage(message)
    } finally {
      setBusyAction(null)
    }
  }

  async function handleSendAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusyAction('admin-announcement')
    setAnnouncementMessage(null)

    try {
      await createAnnouncement({
        title: announcementForm.title,
        message: announcementForm.message,
        createdBy: currentAdmin.id,
      })
      setAnnouncementForm({ title: '', message: '' })
      setAnnouncementMessage('Announcement posted successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to post announcement.'
      setAnnouncementMessage(message)
    } finally {
      setBusyAction(null)
    }
  }

  async function handleToggleUser(userId: string, active: boolean) {
    setBusyAction(userId)

    try {
      await setUserActive(userId, active)
    } finally {
      setBusyAction(null)
    }
  }

  async function handleDelete(collectionName: Parameters<typeof deleteDocument>[0], id: string) {
    setBusyAction(`${collectionName}-${id}`)

    try {
      await deleteDocument(collectionName, id)
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <AppShell
      role="admin"
      title="Admin"
      subtitle="Control users, announcements, subjects, enrollments, and the core portal records from one command surface."
      navItems={adminNav}
      variant="adminMono"
    >
      <div id="overview" className="grid gap-4 lg:grid-cols-4">
        <StatCard
          label="Total users"
          value={`${users.length}`}
          note="Combined student, teacher, and admin profiles."
          icon={Users}
          variant="adminMono"
        />
        <StatCard
          label="Total students"
          value={`${users.filter((user) => user.role === 'student').length}`}
          note="Student accounts currently available in the portal."
          icon={UserPlus}
          variant="adminMono"
        />
        <StatCard
          label="Total teachers"
          value={`${users.filter((user) => user.role === 'teacher').length}`}
          note="Teacher accounts currently available in the portal."
          icon={Building2}
          variant="adminMono"
        />
        <StatCard
          label="Announcements"
          value={`${announcements.length}`}
          note="Live updates posted by staff and administrators."
          icon={Bell}
          variant="adminMono"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          id="users"
          title="User management"
          description="Create accounts with roles. New profiles are stored in both Firebase Auth and Firestore."
          variant="adminMono"
        >
          {userMessage ? (
            <div className="mb-5 rounded-3xl border border-[#f6d456]/22 bg-[#f6d456]/10 px-4 py-3 text-sm text-[#fff4c2]">
              {userMessage}
            </div>
          ) : null}

          <form onSubmit={handleCreateUser} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Name</span>
                <input
                  value={userForm.name}
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className="h-12 rounded-2xl border border-[#f6d456]/14 bg-black/35 px-4 text-white outline-none focus:border-[#f6d456]/50"
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Role</span>
                <select
                  value={userForm.role}
                  onChange={(event) =>
                    setUserForm((current) => ({
                      ...current,
                      role: event.target.value as Role,
                    }))
                  }
                  className="h-12 rounded-2xl border border-[#f6d456]/14 bg-black/35 px-4 text-white outline-none focus:border-[#f6d456]/50"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">Email</span>
              <input
                type="email"
                value={userForm.email}
                onChange={(event) =>
                  setUserForm((current) => ({ ...current, email: event.target.value }))
                }
                className="h-12 rounded-2xl border border-[#f6d456]/14 bg-black/35 px-4 text-white outline-none focus:border-[#f6d456]/50"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">Temporary password</span>
              <input
                type="password"
                value={userForm.password}
                onChange={(event) =>
                  setUserForm((current) => ({ ...current, password: event.target.value }))
                }
                className="h-12 rounded-2xl border border-[#f6d456]/14 bg-black/35 px-4 text-white outline-none focus:border-[#f6d456]/50"
                required
              />
            </label>

            <button
              type="submit"
              disabled={busyAction === 'create-user'}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#f6d456] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#efc331] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              {busyAction === 'create-user' ? 'Creating...' : 'Create user'}
            </button>
          </form>

          <div className="mt-6 grid gap-4">
            {users.map((user) => (
              <div key={user.id} className="rounded-3xl border border-[#f6d456]/12 bg-black/28 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-heading text-xl text-white">{user.name}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {user.email} / {user.role}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleToggleUser(user.id, !user.active)}
                    disabled={busyAction === user.id || user.id === currentAdmin.id}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                      user.active
                        ? 'border border-rose-300/20 bg-rose-300/10 text-rose-100'
                        : 'border border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
                    }`}
                  >
                    {user.active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          id="subjects"
          title="Subject and teacher mapping"
          description="Create new subjects or reassign existing ones to different teachers."
          variant="adminMono"
        >
          {subjectMessage ? (
            <div className="mb-5 rounded-3xl border border-[#f6d456]/22 bg-[#f6d456]/10 px-4 py-3 text-sm text-[#fff4c2]">
              {subjectMessage}
            </div>
          ) : null}

          <form onSubmit={handleSaveSubject} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Existing subject</span>
                <select
                  value={subjectForm.subjectId}
                  onChange={(event) => {
                    const selected = subjects.find((subject) => subject.id === event.target.value)
                    setSubjectForm({
                      subjectId: event.target.value,
                      name: selected?.name ?? '',
                      teacherId: selected?.teacherId ?? '',
                    })
                  }}
                  className="h-12 rounded-2xl border border-[#f6d456]/14 bg-black/35 px-4 text-white outline-none focus:border-[#f6d456]/50"
                >
                  <option value="">Create new subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-200">Teacher</span>
                <select
                  value={subjectForm.teacherId}
                  onChange={(event) =>
                    setSubjectForm((current) => ({ ...current, teacherId: event.target.value }))
                  }
                  className="h-12 rounded-2xl border border-[#f6d456]/14 bg-black/35 px-4 text-white outline-none focus:border-[#f6d456]/50"
                  required
                >
                  <option value="">Select a teacher</option>
                  {teacherUsers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">Subject name</span>
              <input
                value={subjectForm.name}
                onChange={(event) =>
                  setSubjectForm((current) => ({ ...current, name: event.target.value }))
                }
                className="h-12 rounded-2xl border border-[#f6d456]/14 bg-black/35 px-4 text-white outline-none focus:border-[#f6d456]/50"
                required
              />
            </label>

            <button
              type="submit"
              disabled={busyAction === 'save-subject'}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#f6d456] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#efc331] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Building2 className="h-4 w-4" />
              {busyAction === 'save-subject' ? 'Saving...' : 'Save subject'}
            </button>
          </form>

          <div className="mt-6 grid gap-4">
            {subjects.map((subject) => (
              <div key={subject.id} className="rounded-3xl border border-[#f6d456]/12 bg-black/28 p-4">
                <p className="font-heading text-xl text-white">{subject.name}</p>
                <p className="mt-1 text-sm text-slate-400">
                  Teacher: {userLookup[subject.teacherId]?.name ?? 'Not assigned'}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          id="enrollments"
          title="Enrollment mapping"
          description="Connect students to their subjects so dashboards, assignments, and attendance stay scoped correctly."
          variant="adminMono"
        >
          {enrollmentMessage ? (
            <div className="mb-5 rounded-3xl border border-[#f6d456]/22 bg-[#f6d456]/10 px-4 py-3 text-sm text-[#fff4c2]">
              {enrollmentMessage}
            </div>
          ) : null}

          <form onSubmit={handleSaveEnrollment} className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">Student</span>
              <select
                value={enrollmentForm.studentId}
                onChange={(event) =>
                  setEnrollmentForm((current) => ({ ...current, studentId: event.target.value }))
                }
                className="h-12 rounded-2xl border border-[#f6d456]/14 bg-black/35 px-4 text-white outline-none focus:border-[#f6d456]/50"
                required
              >
                <option value="">Select a student</option>
                {studentUsers.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-200">Subject</span>
              <select
                value={enrollmentForm.subjectId}
                onChange={(event) =>
                  setEnrollmentForm((current) => ({ ...current, subjectId: event.target.value }))
                }
                className="h-12 rounded-2xl border border-[#f6d456]/14 bg-black/35 px-4 text-white outline-none focus:border-[#f6d456]/50"
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

            <button
              type="submit"
              disabled={busyAction === 'save-enrollment'}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#f6d456] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#efc331] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Link2 className="h-4 w-4" />
              {busyAction === 'save-enrollment' ? 'Saving...' : 'Save enrollment'}
            </button>
          </form>

          <div className="mt-6 grid gap-4">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="rounded-3xl border border-[#f6d456]/12 bg-black/28 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-heading text-xl text-white">
                      {userLookup[enrollment.studentId]?.name ?? 'Student'}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {subjects.find((subject) => subject.id === enrollment.subjectId)?.name ?? 'Subject'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          id="announcements"
          title="Administrative announcements"
          description="Post institution-wide messages that show up instantly across student and teacher dashboards."
          variant="adminMono"
        >
          {announcementMessage ? (
            <div className="mb-5 rounded-3xl border border-[#f6d456]/22 bg-[#f6d456]/10 px-4 py-3 text-sm text-[#fff4c2]">
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
                className="h-12 rounded-2xl border border-[#f6d456]/14 bg-black/35 px-4 text-white outline-none focus:border-[#f6d456]/50"
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
                className="rounded-2xl border border-[#f6d456]/14 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-[#f6d456]/50"
                required
              />
            </label>
            <button
              type="submit"
              disabled={busyAction === 'admin-announcement'}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#f6d456] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#efc331] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShieldCheck className="h-4 w-4" />
              {busyAction === 'admin-announcement' ? 'Posting...' : 'Post announcement'}
            </button>
          </form>

          <div className="mt-6 grid gap-4">
            {sortedAnnouncements.slice(0, 4).map((announcement) => (
              <div key={announcement.id} className="rounded-3xl border border-[#f6d456]/12 bg-black/28 p-4">
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

      <SectionCard
        id="data-center"
        title="Data center"
        description="Monitor all core collections and remove records when you need to clean up portal data."
        variant="adminMono"
      >
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="grid gap-4">
            <h3 className="font-heading text-xl text-white">Assignments</h3>
            {assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-3xl border border-[#f6d456]/12 bg-black/28 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{assignment.title}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {subjects.find((subject) => subject.id === assignment.subjectId)?.name ?? 'Subject'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDelete('assignments', assignment.id)}
                    disabled={busyAction === `assignments-${assignment.id}`}
                    className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-2 text-rose-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4">
            <h3 className="font-heading text-xl text-white">Materials</h3>
            {materials.map((material) => (
              <div key={material.id} className="rounded-3xl border border-[#f6d456]/12 bg-black/28 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{material.title}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {subjects.find((subject) => subject.id === material.subjectId)?.name ?? 'Subject'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDelete('materials', material.id)}
                    disabled={busyAction === `materials-${material.id}`}
                    className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-2 text-rose-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4">
            <h3 className="font-heading text-xl text-white">Announcements</h3>
            {announcements.map((announcement) => (
              <div key={announcement.id} className="rounded-3xl border border-[#f6d456]/12 bg-black/28 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{announcement.title}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {formatDateTime(announcement.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDelete('announcements', announcement.id)}
                    disabled={busyAction === `announcements-${announcement.id}`}
                    className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-2 text-rose-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-[#f6d456]/12 bg-black/28 p-5">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Attendance entries</p>
            <p className="mt-3 font-heading text-3xl text-white">{attendance.length}</p>
          </div>
          <div className="rounded-3xl border border-[#f6d456]/12 bg-black/28 p-5">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Submissions</p>
            <p className="mt-3 font-heading text-3xl text-white">{submissions.length}</p>
          </div>
          <div className="rounded-3xl border border-[#f6d456]/12 bg-black/28 p-5">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Portal health</p>
            <p className="mt-3 font-heading text-3xl text-white">Live</p>
          </div>
        </div>
      </SectionCard>
    </AppShell>
  )
}
