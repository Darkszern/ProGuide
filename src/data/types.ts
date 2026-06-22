import type {
  Activity,
  ChecklistItem,
  Comment,
  MemberRole,
  Phase,
  PhaseKey,
  Project,
  ProjectType,
  Task,
  TaskStatus,
} from '@/types/db'

export interface ProjectListItem {
  id: string
  title: string
  subject: string | null
  deadline: string | null
  project_type: ProjectType
  current_phase: PhaseKey
  progress: number // 0..100
}

export interface MemberView {
  user_id: string
  display_name: string
  role: MemberRole
}

export interface PhaseView {
  phase: Phase
  checklist: ChecklistItem[]
  doneCount: number
  total: number
}

export interface ProjectFull {
  project: Project
  members: MemberView[]
  phases: PhaseView[]
  progress: number
}

export interface TaskView extends Task {
  project_title: string
  assignee_name: string | null
}

export interface ActivityView extends Activity {
  actor_name: string
}

export interface CommentView extends Comment {
  author_name: string
}

export interface DashboardData {
  stats: {
    activeProjects: number
    openTasks: number
    doneTasks: number
    dueDeadlines: number
  }
  overall: { done: number; in_progress: number; open: number } // Phasen
  tasksByStatus: Record<TaskStatus, number>
  projects: ProjectListItem[]
  activities: ActivityView[]
}

export interface FileView {
  id: string
  project_id: string
  name: string
  size: number
  created_at: string
  uploader_name: string
  /** Direkter Download-Link (Demo: Data-URL, Supabase: Signed URL). */
  url: string | null
}

export interface ProfileView {
  id: string
  display_name: string
}

export interface CreateProjectInput {
  title: string
  subject?: string
  description?: string
  project_type: ProjectType
  deadline: string | null
  /** Pro Phase eine Liste von Checklisten-Labels (aus KI oder Default). */
  checklistByPhase: Record<PhaseKey, string[]>
}
