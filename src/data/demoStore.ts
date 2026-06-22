// Interaktiver Demo-Store (ohne Backend). Persistiert in localStorage, damit
// angelegte Projekte/Aufgaben einen Reload überleben. Spiegelt das
// Supabase-Datenmodell und implementiert dieselbe Daten-API wie supabaseApi.
import type {
  Activity,
  ChecklistItem,
  Comment,
  PhaseKey,
  Project,
  Task,
  TaskStatus,
} from '@/types/db'
import { PHASES, getPhase, phaseOrder } from '@/lib/iperka'
import { buildSchedule } from '@/lib/schedule'
import { generateJoinCode } from '@/lib/utils'
import type {
  ActivityView,
  CommentView,
  CreateProjectInput,
  DashboardData,
  FileView,
  MemberView,
  PhaseView,
  ProfileView,
  ProjectFull,
  ProjectListItem,
  TaskView,
} from './types'

const STORAGE_KEY = 'projectguide-demo-v1'
export const DEMO_USER = { id: 'demo-user', name: 'Du' }

interface MemberRow {
  id: string
  project_id: string
  user_id: string
  role: 'leader' | 'member'
}

interface FileRow {
  id: string
  project_id: string
  name: string
  size: number
  uploaded_by: string
  created_at: string
  data_url: string | null
}

interface DB {
  profiles: Record<string, string> // user_id -> display_name
  projects: Project[]
  members: MemberRow[]
  phases: Array<{
    id: string
    project_id: string
    key: PhaseKey
    status: 'open' | 'in_progress' | 'done'
    order_index: number
    start_date: string | null
    end_date: string | null
  }>
  tasks: Task[]
  checklist: ChecklistItem[]
  comments: Comment[]
  activities: Activity[]
  files: FileRow[]
}

function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function inDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

// ---- Seed ------------------------------------------------------------------
function seed(): DB {
  const db: DB = {
    profiles: { 'demo-user': 'Du', 'm-lena': 'Lena', 'm-tim': 'Tim' },
    projects: [],
    members: [],
    phases: [],
    tasks: [],
    checklist: [],
    comments: [],
    activities: [],
    files: [],
  }

  const defs: Array<{
    title: string
    subject: string
    deadline: string
    current: PhaseKey
    type: 'single' | 'team'
    completedThrough: number // wie viele Phasen-Checklisten voll erledigt
  }> = [
    { title: 'Webshop für den Schulkiosk', subject: 'Informatik', deadline: inDays(4), current: 'realisieren', type: 'team', completedThrough: 3 },
    { title: 'Nachhaltige Verpackung', subject: 'Projektmanagement', deadline: inDays(18), current: 'planen', type: 'single', completedThrough: 1 },
    { title: 'Marketingkampagne Pausenkiosk', subject: 'Wirtschaft', deadline: inDays(-2), current: 'kontrollieren', type: 'team', completedThrough: 4 },
  ]

  for (const def of defs) {
    const pid = uid('proj')
    const project: Project = {
      id: pid,
      owner_id: 'demo-user',
      title: def.title,
      subject: def.subject,
      description: null,
      project_type: def.type,
      deadline: def.deadline,
      current_phase: def.current,
      join_code: generateJoinCode(),
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    }
    db.projects.push(project)
    db.members.push({ id: uid('mem'), project_id: pid, user_id: 'demo-user', role: 'leader' })
    if (def.type === 'team') {
      db.members.push({ id: uid('mem'), project_id: pid, user_id: 'm-lena', role: 'member' })
      db.members.push({ id: uid('mem'), project_id: pid, user_id: 'm-tim', role: 'member' })
    }

    const schedule = buildSchedule(def.deadline, new Date(Date.now() - 10 * 86400000))
    const currentOrder = phaseOrder(def.current)
    for (const p of PHASES) {
      const phaseId = uid('phase')
      const sched = schedule.find((s) => s.key === p.key)
      const status: 'open' | 'in_progress' | 'done' =
        p.order < currentOrder ? 'done' : p.order === currentOrder ? 'in_progress' : 'open'
      db.phases.push({
        id: phaseId,
        project_id: pid,
        key: p.key,
        status,
        order_index: p.order,
        start_date: sched?.start ?? null,
        end_date: sched?.end ?? null,
      })
      p.defaultChecklist.forEach((label, i) => {
        const doneFully = p.order <= def.completedThrough
        const partial = p.order === def.completedThrough + 1 && i === 0
        db.checklist.push({
          id: uid('chk'),
          phase_id: phaseId,
          label,
          is_done: doneFully || partial,
        })
      })
    }

    // Ein paar Aufgaben
    const realPhase = db.phases.find((ph) => ph.project_id === pid && ph.key === def.current)
    db.tasks.push(
      {
        id: uid('task'), project_id: pid, phase_id: realPhase?.id ?? null,
        title: 'Konkurrenzanalyse erstellen', description: null,
        assignee_id: def.type === 'team' ? 'm-lena' : 'demo-user',
        status: 'done', due_date: inDays(-1), created_at: new Date().toISOString(),
      },
      {
        id: uid('task'), project_id: pid, phase_id: realPhase?.id ?? null,
        title: 'Entwurf abstimmen', description: null,
        assignee_id: 'demo-user', status: 'in_progress', due_date: inDays(2),
        created_at: new Date().toISOString(),
      },
      {
        id: uid('task'), project_id: pid, phase_id: realPhase?.id ?? null,
        title: 'Quellen dokumentieren', description: null,
        assignee_id: def.type === 'team' ? 'm-tim' : 'demo-user',
        status: 'open', due_date: inDays(5), created_at: new Date().toISOString(),
      },
    )

    db.activities.push(
      { id: uid('act'), project_id: pid, actor_id: 'm-lena', type: 'task_done', payload: { title: 'Konkurrenzanalyse' }, created_at: new Date(Date.now() - 25 * 60000).toISOString() },
      { id: uid('act'), project_id: pid, actor_id: 'demo-user', type: 'comment_added', payload: {}, created_at: new Date(Date.now() - 3 * 3600000).toISOString() },
    )
  }

  // Eine Beispiel-Datei im ersten Projekt (ohne Inhalt – nur Metadaten).
  if (db.projects[0]) {
    db.files.push({
      id: uid('file'),
      project_id: db.projects[0].id,
      name: 'disposition.pdf',
      size: 184320,
      uploaded_by: 'm-tim',
      created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
      data_url: null,
    })
  }

  return db
}

// ---- Persistenz ------------------------------------------------------------
/** Stellt sicher, dass alle Tabellen existieren (Migration alter Staende). */
function normalize(db: Partial<DB>): DB {
  return {
    profiles: db.profiles ?? {},
    projects: db.projects ?? [],
    members: db.members ?? [],
    phases: db.phases ?? [],
    tasks: db.tasks ?? [],
    checklist: db.checklist ?? [],
    comments: db.comments ?? [],
    activities: db.activities ?? [],
    files: db.files ?? [],
  }
}

function load(): DB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return normalize(JSON.parse(raw) as Partial<DB>)
  } catch {
    /* ignore */
  }
  const fresh = seed()
  save(fresh)
  return fresh
}

let db: DB | null = null
function get(): DB {
  if (!db) db = load()
  return db
}
function save(next: DB) {
  db = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}
function commit() {
  if (db) save(db)
}

function name(userId: string | null): string {
  if (!userId) return '—'
  return get().profiles[userId] ?? 'Unbekannt'
}

// ---- Selektoren ------------------------------------------------------------
function projectProgress(projectId: string): number {
  const phaseIds = get().phases.filter((p) => p.project_id === projectId).map((p) => p.id)
  const items = get().checklist.filter((c) => phaseIds.includes(c.phase_id))
  if (items.length === 0) return 0
  return Math.round((items.filter((c) => c.is_done).length / items.length) * 100)
}

function listItem(p: Project): ProjectListItem {
  return {
    id: p.id,
    title: p.title,
    subject: p.subject,
    deadline: p.deadline,
    project_type: p.project_type,
    current_phase: p.current_phase,
    progress: projectProgress(p.id),
  }
}

// ---- API -------------------------------------------------------------------
function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 120))
}

export const demoApi = {
  async getDashboard(): Promise<DashboardData> {
    const d = get()
    const tasksByStatus: Record<TaskStatus, number> = { open: 0, in_progress: 0, review: 0, done: 0 }
    d.tasks.forEach((t) => (tasksByStatus[t.status] += 1))
    const overall = { done: 0, in_progress: 0, open: 0 }
    d.phases.forEach((p) => (overall[p.status] += 1))
    const dueDeadlines = d.projects.filter((p) => {
      if (!p.deadline) return false
      const days = (new Date(p.deadline).getTime() - Date.now()) / 86400000
      return days <= 3
    }).length
    const activities = [...d.activities]
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, 8)
      .map((a) => ({ ...a, actor_name: name(a.actor_id) }))
    return delay({
      stats: {
        activeProjects: d.projects.length,
        openTasks: tasksByStatus.open + tasksByStatus.in_progress + tasksByStatus.review,
        doneTasks: tasksByStatus.done,
        dueDeadlines,
      },
      overall,
      tasksByStatus,
      projects: d.projects.map(listItem),
      activities,
    })
  },

  async listProjects(): Promise<ProjectListItem[]> {
    return delay(get().projects.map(listItem))
  },

  async getProject(id: string): Promise<ProjectFull | null> {
    const d = get()
    const project = d.projects.find((p) => p.id === id)
    if (!project) return delay(null)
    const members: MemberView[] = d.members
      .filter((m) => m.project_id === id)
      .map((m) => ({ user_id: m.user_id, display_name: name(m.user_id), role: m.role }))
    const phases: PhaseView[] = d.phases
      .filter((p) => p.project_id === id)
      .sort((a, b) => a.order_index - b.order_index)
      .map((p) => {
        const checklist = d.checklist.filter((c) => c.phase_id === p.id)
        return {
          phase: p,
          checklist,
          doneCount: checklist.filter((c) => c.is_done).length,
          total: checklist.length,
        }
      })
    return delay({ project, members, phases, progress: projectProgress(id) })
  },

  async createProject(input: CreateProjectInput): Promise<string> {
    const d = get()
    const pid = uid('proj')
    const start = new Date()
    const project: Project = {
      id: pid,
      owner_id: DEMO_USER.id,
      title: input.title,
      subject: input.subject ?? null,
      description: input.description ?? null,
      project_type: input.project_type,
      deadline: input.deadline,
      current_phase: 'informieren',
      join_code: generateJoinCode(),
      created_at: new Date().toISOString(),
    }
    d.projects.push(project)
    d.members.push({ id: uid('mem'), project_id: pid, user_id: DEMO_USER.id, role: 'leader' })
    const schedule = input.deadline ? buildSchedule(input.deadline, start) : []
    for (const p of PHASES) {
      const phaseId = uid('phase')
      const sched = schedule.find((s) => s.key === p.key)
      d.phases.push({
        id: phaseId,
        project_id: pid,
        key: p.key,
        status: p.order === 1 ? 'in_progress' : 'open',
        order_index: p.order,
        start_date: sched?.start ?? null,
        end_date: sched?.end ?? null,
      })
      const labels = input.checklistByPhase[p.key] ?? p.defaultChecklist
      labels.forEach((label) =>
        d.checklist.push({ id: uid('chk'), phase_id: phaseId, label, is_done: false }),
      )
    }
    d.activities.push({
      id: uid('act'), project_id: pid, actor_id: DEMO_USER.id,
      type: 'project_created', payload: { title: input.title },
      created_at: new Date().toISOString(),
    })
    commit()
    return delay(pid)
  },

  async deleteProject(id: string): Promise<void> {
    const d = get()
    const phaseIds = d.phases.filter((p) => p.project_id === id).map((p) => p.id)
    d.projects = d.projects.filter((p) => p.id !== id)
    d.members = d.members.filter((m) => m.project_id !== id)
    d.phases = d.phases.filter((p) => p.project_id !== id)
    d.checklist = d.checklist.filter((c) => !phaseIds.includes(c.phase_id))
    d.tasks = d.tasks.filter((t) => t.project_id !== id)
    d.comments = d.comments.filter((c) => c.project_id !== id)
    d.activities = d.activities.filter((a) => a.project_id !== id)
    commit()
    return delay(undefined)
  },

  async getPhase(
    projectId: string,
    key: PhaseKey,
  ): Promise<{ projectTitle: string; view: PhaseView } | null> {
    const d = get()
    const project = d.projects.find((p) => p.id === projectId)
    const phase = d.phases.find((p) => p.project_id === projectId && p.key === key)
    if (!project || !phase) return delay(null)
    const checklist = d.checklist.filter((c) => c.phase_id === phase.id)
    return delay({
      projectTitle: project.title,
      view: {
        phase,
        checklist,
        doneCount: checklist.filter((c) => c.is_done).length,
        total: checklist.length,
      },
    })
  },

  async toggleChecklistItem(itemId: string, isDone: boolean): Promise<void> {
    const item = get().checklist.find((c) => c.id === itemId)
    if (item) item.is_done = isDone
    commit()
    return delay(undefined)
  },

  async addChecklistItem(phaseId: string, label: string): Promise<void> {
    get().checklist.push({ id: uid('chk'), phase_id: phaseId, label, is_done: false })
    commit()
    return delay(undefined)
  },

  async completePhase(projectId: string, key: PhaseKey): Promise<void> {
    const d = get()
    const phase = d.phases.find((p) => p.project_id === projectId && p.key === key)
    const project = d.projects.find((p) => p.id === projectId)
    if (!phase || !project) return delay(undefined)
    phase.status = 'done'
    const next = PHASES.find((p) => p.order === getPhase(key).order + 1)
    if (next) {
      const nextPhase = d.phases.find((p) => p.project_id === projectId && p.key === next.key)
      if (nextPhase && nextPhase.status === 'open') nextPhase.status = 'in_progress'
      project.current_phase = next.key
    }
    d.activities.push({
      id: uid('act'), project_id: projectId, actor_id: DEMO_USER.id,
      type: 'phase_done', payload: { phase: key }, created_at: new Date().toISOString(),
    })
    commit()
    return delay(undefined)
  },

  async listTasks(): Promise<TaskView[]> {
    const d = get()
    return delay(
      d.tasks.map((t) => ({
        ...t,
        project_title: d.projects.find((p) => p.id === t.project_id)?.title ?? '—',
        assignee_name: t.assignee_id ? name(t.assignee_id) : null,
      })),
    )
  },

  async listProjectTasks(projectId: string): Promise<TaskView[]> {
    const all = await this.listTasks()
    return all.filter((t) => t.project_id === projectId)
  },

  async createTask(input: {
    project_id: string
    phase_id?: string | null
    title: string
    description?: string | null
    assignee_id?: string | null
    due_date?: string | null
  }): Promise<void> {
    const d = get()
    d.tasks.push({
      id: uid('task'),
      project_id: input.project_id,
      phase_id: input.phase_id ?? null,
      title: input.title,
      description: input.description ?? null,
      assignee_id: input.assignee_id ?? null,
      status: 'open',
      due_date: input.due_date ?? null,
      created_at: new Date().toISOString(),
    })
    d.activities.push({
      id: uid('act'), project_id: input.project_id, actor_id: DEMO_USER.id,
      type: 'task_created', payload: { title: input.title }, created_at: new Date().toISOString(),
    })
    commit()
    return delay(undefined)
  },

  async updateTask(
    id: string,
    patch: Partial<Pick<Task, 'status' | 'assignee_id' | 'title' | 'due_date' | 'description'>>,
  ): Promise<void> {
    const d = get()
    const task = d.tasks.find((t) => t.id === id)
    if (task) {
      Object.assign(task, patch)
      if (patch.status === 'done') {
        d.activities.push({
          id: uid('act'), project_id: task.project_id, actor_id: DEMO_USER.id,
          type: 'task_done', payload: { title: task.title }, created_at: new Date().toISOString(),
        })
      }
    }
    commit()
    return delay(undefined)
  },

  async deleteTask(id: string): Promise<void> {
    const d = get()
    d.tasks = d.tasks.filter((t) => t.id !== id)
    commit()
    return delay(undefined)
  },

  async getMembers(projectId: string): Promise<MemberView[]> {
    const d = get()
    return delay(
      d.members
        .filter((m) => m.project_id === projectId)
        .map((m) => ({ user_id: m.user_id, display_name: name(m.user_id), role: m.role })),
    )
  },

  async joinByCode(code: string): Promise<string> {
    const d = get()
    const project = d.projects.find((p) => p.join_code?.toUpperCase() === code.toUpperCase())
    if (!project) throw new Error('Kein Projekt mit diesem Code gefunden.')
    const exists = d.members.some((m) => m.project_id === project.id && m.user_id === DEMO_USER.id)
    if (!exists) {
      d.members.push({ id: uid('mem'), project_id: project.id, user_id: DEMO_USER.id, role: 'member' })
      d.activities.push({
        id: uid('act'), project_id: project.id, actor_id: DEMO_USER.id,
        type: 'member_joined', payload: {}, created_at: new Date().toISOString(),
      })
      commit()
    }
    return delay(project.id)
  },

  async listComments(projectId: string, taskId?: string): Promise<CommentView[]> {
    const d = get()
    return delay(
      d.comments
        .filter((c) => c.project_id === projectId && (taskId ? c.task_id === taskId : !c.task_id))
        .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
        .map((c) => ({ ...c, author_name: name(c.author_id) })),
    )
  },

  async addComment(projectId: string, body: string, taskId?: string): Promise<void> {
    const d = get()
    d.comments.push({
      id: uid('cmt'), project_id: projectId, task_id: taskId ?? null,
      author_id: DEMO_USER.id, body, created_at: new Date().toISOString(),
    })
    d.activities.push({
      id: uid('act'), project_id: projectId, actor_id: DEMO_USER.id,
      type: 'comment_added', payload: {}, created_at: new Date().toISOString(),
    })
    commit()
    return delay(undefined)
  },

  async listActivities(projectId?: string): Promise<ActivityView[]> {
    const d = get()
    return delay(
      d.activities
        .filter((a) => (projectId ? a.project_id === projectId : true))
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
        .map((a) => ({ ...a, actor_name: name(a.actor_id) })),
    )
  },

  async listFiles(projectId: string): Promise<FileView[]> {
    const d = get()
    return delay(
      d.files
        .filter((f) => f.project_id === projectId)
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
        .map((f) => ({
          id: f.id,
          project_id: f.project_id,
          name: f.name,
          size: f.size,
          created_at: f.created_at,
          uploader_name: name(f.uploaded_by),
          url: f.data_url,
        })),
    )
  },

  async uploadFile(projectId: string, file: File): Promise<void> {
    const d = get()
    // Kleine Dateien als Data-URL einbetten (Download im Demo-Modus möglich).
    let dataUrl: string | null = null
    if (file.size <= 1_200_000) {
      dataUrl = await new Promise<string | null>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(file)
      })
    }
    d.files.push({
      id: uid('file'),
      project_id: projectId,
      name: file.name,
      size: file.size,
      uploaded_by: DEMO_USER.id,
      created_at: new Date().toISOString(),
      data_url: dataUrl,
    })
    d.activities.push({
      id: uid('act'), project_id: projectId, actor_id: DEMO_USER.id,
      type: 'file_uploaded', payload: { title: file.name }, created_at: new Date().toISOString(),
    })
    commit()
    return delay(undefined)
  },

  async deleteFile(id: string): Promise<void> {
    const d = get()
    d.files = d.files.filter((f) => f.id !== id)
    commit()
    return delay(undefined)
  },

  async getMyProfile(): Promise<ProfileView> {
    return delay({ id: DEMO_USER.id, display_name: get().profiles[DEMO_USER.id] ?? DEMO_USER.name })
  },

  async updateMyProfile(displayName: string): Promise<void> {
    const d = get()
    d.profiles[DEMO_USER.id] = displayName
    commit()
    return delay(undefined)
  },
}

export type DataApi = typeof demoApi
