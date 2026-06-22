// Zentrale Typen fuer das Supabase-Datenmodell.
// Bewusst handgepflegt gehalten (kein any), passend zur SQL-Migration.

export type Uuid = string
export type Timestamp = string // ISO-8601

export type ProjectType = 'single' | 'team'
export type MemberRole = 'leader' | 'member'
export type PhaseKey =
  | 'informieren'
  | 'planen'
  | 'entscheiden'
  | 'realisieren'
  | 'kontrollieren'
  | 'auswerten'
export type PhaseStatus = 'open' | 'in_progress' | 'done'
export type TaskStatus = 'open' | 'in_progress' | 'review' | 'done'

export interface Profile {
  id: Uuid
  display_name: string | null
  avatar_url: string | null
  role: string | null
}

export interface Project {
  id: Uuid
  owner_id: Uuid
  title: string
  subject: string | null
  description: string | null
  project_type: ProjectType
  deadline: string | null // date (YYYY-MM-DD)
  current_phase: PhaseKey
  join_code: string | null
  created_at: Timestamp
}

export interface ProjectMember {
  id: Uuid
  project_id: Uuid
  user_id: Uuid
  role: MemberRole
}

export interface Phase {
  id: Uuid
  project_id: Uuid
  key: PhaseKey
  status: PhaseStatus
  order_index: number
  start_date: string | null
  end_date: string | null
}

export interface Task {
  id: Uuid
  project_id: Uuid
  phase_id: Uuid | null
  title: string
  description: string | null
  assignee_id: Uuid | null
  status: TaskStatus
  due_date: string | null
  created_at: Timestamp
}

export interface ChecklistItem {
  id: Uuid
  phase_id: Uuid
  label: string
  is_done: boolean
}

export interface Comment {
  id: Uuid
  project_id: Uuid
  task_id: Uuid | null
  author_id: Uuid
  body: string
  created_at: Timestamp
}

export type ActivityType =
  | 'task_done'
  | 'task_created'
  | 'comment_added'
  | 'file_uploaded'
  | 'phase_done'
  | 'project_created'
  | 'member_joined'

export interface Activity {
  id: Uuid
  project_id: Uuid
  actor_id: Uuid
  type: ActivityType
  payload: Record<string, unknown>
  created_at: Timestamp
}

export interface FileRecord {
  id: Uuid
  project_id: Uuid
  name: string
  storage_path: string
  uploaded_by: Uuid
  created_at: Timestamp
}
