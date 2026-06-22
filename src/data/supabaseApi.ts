// Supabase-Implementierung der Daten-API. Spiegelt die Methoden von demoApi.
// RLS sorgt dafuer, dass Selects automatisch auf Projekte des Nutzers begrenzt sind.
import { supabase } from '@/lib/supabase'
import { PHASES, getPhase } from '@/lib/iperka'
import { buildSchedule } from '@/lib/schedule'
import { generateJoinCode } from '@/lib/utils'
import type { PhaseKey, Project, Task, TaskStatus } from '@/types/db'
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

async function uidOrThrow(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error('Nicht angemeldet.')
  return data.user.id
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  return res.data
}

async function profileNames(ids: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return {}
  const data = check(
    await supabase.from('profiles').select('id, display_name').in('id', unique),
  )
  const map: Record<string, string> = {}
  ;(data ?? []).forEach((p) => (map[p.id] = p.display_name ?? 'Unbekannt'))
  return map
}

async function progressFor(projectIds: string[]): Promise<Record<string, number>> {
  if (projectIds.length === 0) return {}
  const phases = check(
    await supabase.from('phases').select('id, project_id').in('project_id', projectIds),
  ) as Array<{ id: string; project_id: string }>
  const phaseToProject: Record<string, string> = {}
  phases.forEach((p) => (phaseToProject[p.id] = p.project_id))
  const items = check(
    await supabase
      .from('checklist_items')
      .select('phase_id, is_done')
      .in('phase_id', phases.map((p) => p.id)),
  ) as Array<{ phase_id: string; is_done: boolean }>

  const total: Record<string, number> = {}
  const done: Record<string, number> = {}
  projectIds.forEach((id) => {
    total[id] = 0
    done[id] = 0
  })
  items.forEach((it) => {
    const pid = phaseToProject[it.phase_id]
    if (!pid) return
    total[pid] = (total[pid] ?? 0) + 1
    if (it.is_done) done[pid] = (done[pid] ?? 0) + 1
  })
  const result: Record<string, number> = {}
  projectIds.forEach((id) => {
    result[id] = total[id] ? Math.round((done[id] / total[id]) * 100) : 0
  })
  return result
}

export const supabaseApi = {
  async getDashboard(): Promise<DashboardData> {
    const projects = check(
      await supabase.from('projects').select('*').order('created_at', { ascending: false }),
    ) as Project[]
    const ids = projects.map((p) => p.id)
    const progress = await progressFor(ids)

    const phaseRows = (ids.length
      ? (check(await supabase.from('phases').select('status').in('project_id', ids)) as Array<{
          status: 'open' | 'in_progress' | 'done'
        }>)
      : [])
    const overall = { done: 0, in_progress: 0, open: 0 }
    phaseRows.forEach((p) => (overall[p.status] += 1))

    const taskRows = (ids.length
      ? (check(await supabase.from('tasks').select('status').in('project_id', ids)) as Array<{
          status: TaskStatus
        }>)
      : [])
    const tasksByStatus: Record<TaskStatus, number> = { open: 0, in_progress: 0, review: 0, done: 0 }
    taskRows.forEach((t) => (tasksByStatus[t.status] += 1))

    const activityRows = (ids.length
      ? (check(
          await supabase
            .from('activities')
            .select('*')
            .in('project_id', ids)
            .order('created_at', { ascending: false })
            .limit(8),
        ) as ActivityView[])
      : [])
    const names = await profileNames(activityRows.map((a) => a.actor_id))

    const dueDeadlines = projects.filter((p) => {
      if (!p.deadline) return false
      return (new Date(p.deadline).getTime() - Date.now()) / 86400000 <= 3
    }).length

    return {
      stats: {
        activeProjects: projects.length,
        openTasks: tasksByStatus.open + tasksByStatus.in_progress + tasksByStatus.review,
        doneTasks: tasksByStatus.done,
        dueDeadlines,
      },
      overall,
      tasksByStatus,
      projects: projects.map((p) => ({
        id: p.id, title: p.title, subject: p.subject, deadline: p.deadline,
        project_type: p.project_type, current_phase: p.current_phase, progress: progress[p.id] ?? 0,
      })),
      activities: activityRows.map((a) => ({ ...a, actor_name: names[a.actor_id] ?? 'Unbekannt' })),
    }
  },

  async listProjects(): Promise<ProjectListItem[]> {
    const projects = check(
      await supabase.from('projects').select('*').order('created_at', { ascending: false }),
    ) as Project[]
    const progress = await progressFor(projects.map((p) => p.id))
    return projects.map((p) => ({
      id: p.id, title: p.title, subject: p.subject, deadline: p.deadline,
      project_type: p.project_type, current_phase: p.current_phase, progress: progress[p.id] ?? 0,
    }))
  },

  async getProject(id: string): Promise<ProjectFull | null> {
    const project = check(
      await supabase.from('projects').select('*').eq('id', id).maybeSingle(),
    ) as Project | null
    if (!project) return null

    const memberRows = check(
      await supabase.from('project_members').select('user_id, role').eq('project_id', id),
    ) as Array<{ user_id: string; role: 'leader' | 'member' }>
    const names = await profileNames(memberRows.map((m) => m.user_id))
    const members: MemberView[] = memberRows.map((m) => ({
      user_id: m.user_id, display_name: names[m.user_id] ?? 'Unbekannt', role: m.role,
    }))

    const phaseRows = check(
      await supabase.from('phases').select('*').eq('project_id', id).order('order_index'),
    ) as PhaseView['phase'][]
    const items = check(
      await supabase
        .from('checklist_items')
        .select('*')
        .in('phase_id', phaseRows.map((p) => p.id)),
    ) as PhaseView['checklist']

    const phases: PhaseView[] = phaseRows.map((p) => {
      const checklist = items.filter((c) => c.phase_id === p.id)
      return { phase: p, checklist, doneCount: checklist.filter((c) => c.is_done).length, total: checklist.length }
    })
    const allItems = phases.flatMap((p) => p.checklist)
    const progress = allItems.length
      ? Math.round((allItems.filter((c) => c.is_done).length / allItems.length) * 100)
      : 0
    return { project, members, phases, progress }
  },

  async createProject(input: CreateProjectInput): Promise<string> {
    const owner = await uidOrThrow()
    const project = check(
      await supabase
        .from('projects')
        .insert({
          owner_id: owner,
          title: input.title,
          subject: input.subject ?? null,
          description: input.description ?? null,
          project_type: input.project_type,
          deadline: input.deadline,
          join_code: generateJoinCode(),
        })
        .select()
        .single(),
    ) as Project
    // Trigger hat Phasen + Owner-Mitgliedschaft erzeugt.
    const phases = check(
      await supabase.from('phases').select('id, key, order_index').eq('project_id', project.id),
    ) as Array<{ id: string; key: PhaseKey; order_index: number }>

    const schedule = input.deadline ? buildSchedule(input.deadline) : []
    for (const ph of phases) {
      const sched = schedule.find((s) => s.key === ph.key)
      if (sched) {
        await supabase.from('phases').update({ start_date: sched.start, end_date: sched.end }).eq('id', ph.id)
      }
      const labels = input.checklistByPhase[ph.key] ?? []
      if (labels.length) {
        await supabase.from('checklist_items').insert(
          labels.map((label, i) => ({ phase_id: ph.id, label, order_index: i })),
        )
      }
    }
    await supabase.from('activities').insert({
      project_id: project.id, actor_id: owner, type: 'project_created', payload: { title: input.title },
    })
    return project.id
  },

  async deleteProject(id: string): Promise<void> {
    check(await supabase.from('projects').delete().eq('id', id).select())
  },

  async getPhase(projectId: string, key: PhaseKey) {
    const project = check(
      await supabase.from('projects').select('title').eq('id', projectId).maybeSingle(),
    ) as { title: string } | null
    const phase = check(
      await supabase.from('phases').select('*').eq('project_id', projectId).eq('key', key).maybeSingle(),
    ) as PhaseView['phase'] | null
    if (!project || !phase) return null
    const checklist = check(
      await supabase.from('checklist_items').select('*').eq('phase_id', phase.id).order('order_index'),
    ) as PhaseView['checklist']
    return {
      projectTitle: project.title,
      view: { phase, checklist, doneCount: checklist.filter((c) => c.is_done).length, total: checklist.length },
    }
  },

  async toggleChecklistItem(itemId: string, isDone: boolean): Promise<void> {
    check(await supabase.from('checklist_items').update({ is_done: isDone }).eq('id', itemId).select())
  },

  async addChecklistItem(phaseId: string, label: string): Promise<void> {
    check(await supabase.from('checklist_items').insert({ phase_id: phaseId, label }).select())
  },

  async completePhase(projectId: string, key: PhaseKey): Promise<void> {
    const actor = await uidOrThrow()
    await supabase.from('phases').update({ status: 'done' }).eq('project_id', projectId).eq('key', key)
    const next = PHASES.find((p) => p.order === getPhase(key).order + 1)
    if (next) {
      await supabase
        .from('phases')
        .update({ status: 'in_progress' })
        .eq('project_id', projectId)
        .eq('key', next.key)
        .eq('status', 'open')
      await supabase.from('projects').update({ current_phase: next.key }).eq('id', projectId)
    }
    await supabase.from('activities').insert({
      project_id: projectId, actor_id: actor, type: 'phase_done', payload: { phase: key },
    })
  },

  async listTasks(): Promise<TaskView[]> {
    const tasks = check(
      await supabase
        .from('tasks')
        .select('*, projects(title)')
        .order('created_at', { ascending: false }),
    ) as Array<Task & { projects: { title: string } | null }>
    const names = await profileNames(tasks.map((t) => t.assignee_id ?? '').filter(Boolean))
    return tasks.map((t) => ({
      ...t,
      project_title: t.projects?.title ?? '—',
      assignee_name: t.assignee_id ? (names[t.assignee_id] ?? 'Unbekannt') : null,
    }))
  },

  async listProjectTasks(projectId: string): Promise<TaskView[]> {
    return (await this.listTasks()).filter((t) => t.project_id === projectId)
  },

  async createTask(input: {
    project_id: string
    phase_id?: string | null
    title: string
    description?: string | null
    assignee_id?: string | null
    due_date?: string | null
  }): Promise<void> {
    const actor = await uidOrThrow()
    check(
      await supabase.from('tasks').insert({
        project_id: input.project_id,
        phase_id: input.phase_id ?? null,
        title: input.title,
        description: input.description ?? null,
        assignee_id: input.assignee_id ?? null,
        due_date: input.due_date ?? null,
      }).select(),
    )
    await supabase.from('activities').insert({
      project_id: input.project_id, actor_id: actor, type: 'task_created', payload: { title: input.title },
    })
  },

  async updateTask(
    id: string,
    patch: Partial<Pick<Task, 'status' | 'assignee_id' | 'title' | 'due_date' | 'description'>>,
  ): Promise<void> {
    const updated = check(await supabase.from('tasks').update(patch).eq('id', id).select().single()) as Task
    if (patch.status === 'done') {
      const actor = await uidOrThrow()
      await supabase.from('activities').insert({
        project_id: updated.project_id, actor_id: actor, type: 'task_done', payload: { title: updated.title },
      })
    }
  },

  async deleteTask(id: string): Promise<void> {
    check(await supabase.from('tasks').delete().eq('id', id).select())
  },

  async getMembers(projectId: string): Promise<MemberView[]> {
    const rows = check(
      await supabase.from('project_members').select('user_id, role').eq('project_id', projectId),
    ) as Array<{ user_id: string; role: 'leader' | 'member' }>
    const names = await profileNames(rows.map((m) => m.user_id))
    return rows.map((m) => ({ user_id: m.user_id, display_name: names[m.user_id] ?? 'Unbekannt', role: m.role }))
  },

  async joinByCode(code: string): Promise<string> {
    const userId = await uidOrThrow()
    const project = check(
      await supabase.from('projects').select('id').eq('join_code', code.toUpperCase()).maybeSingle(),
    ) as { id: string } | null
    if (!project) throw new Error('Kein Projekt mit diesem Code gefunden.')
    check(
      await supabase
        .from('project_members')
        .upsert({ project_id: project.id, user_id: userId, role: 'member' }, { onConflict: 'project_id,user_id' })
        .select(),
    )
    await supabase.from('activities').insert({
      project_id: project.id, actor_id: userId, type: 'member_joined', payload: {},
    })
    return project.id
  },

  async listComments(projectId: string, taskId?: string): Promise<CommentView[]> {
    let q = supabase.from('comments').select('*').eq('project_id', projectId).order('created_at')
    q = taskId ? q.eq('task_id', taskId) : q.is('task_id', null)
    const rows = check(await q) as CommentView[]
    const names = await profileNames(rows.map((c) => c.author_id))
    return rows.map((c) => ({ ...c, author_name: names[c.author_id] ?? 'Unbekannt' }))
  },

  async addComment(projectId: string, body: string, taskId?: string): Promise<void> {
    const author = await uidOrThrow()
    check(
      await supabase.from('comments').insert({
        project_id: projectId, task_id: taskId ?? null, author_id: author, body,
      }).select(),
    )
    await supabase.from('activities').insert({
      project_id: projectId, actor_id: author, type: 'comment_added', payload: {},
    })
  },

  async listActivities(projectId?: string): Promise<ActivityView[]> {
    let q = supabase.from('activities').select('*').order('created_at', { ascending: false }).limit(50)
    if (projectId) q = q.eq('project_id', projectId)
    const rows = check(await q) as ActivityView[]
    const names = await profileNames(rows.map((a) => a.actor_id))
    return rows.map((a) => ({ ...a, actor_name: names[a.actor_id] ?? 'Unbekannt' }))
  },

  async listFiles(projectId: string): Promise<FileView[]> {
    const rows = check(
      await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false }),
    ) as Array<{
      id: string
      project_id: string
      name: string
      storage_path: string
      uploaded_by: string
      created_at: string
    }>
    const names = await profileNames(rows.map((f) => f.uploaded_by))
    const result: FileView[] = []
    for (const f of rows) {
      const { data: signed } = await supabase.storage
        .from('project-files')
        .createSignedUrl(f.storage_path, 3600)
      result.push({
        id: f.id,
        project_id: f.project_id,
        name: f.name,
        size: 0,
        created_at: f.created_at,
        uploader_name: names[f.uploaded_by] ?? 'Unbekannt',
        url: signed?.signedUrl ?? null,
      })
    }
    return result
  },

  async uploadFile(projectId: string, file: File): Promise<void> {
    const uploader = await uidOrThrow()
    const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_')
    const path = `${projectId}/${crypto.randomUUID()}-${safe}`
    const up = await supabase.storage.from('project-files').upload(path, file)
    if (up.error) throw new Error(up.error.message)
    check(
      await supabase
        .from('files')
        .insert({ project_id: projectId, name: file.name, storage_path: path, uploaded_by: uploader })
        .select(),
    )
    await supabase.from('activities').insert({
      project_id: projectId, actor_id: uploader, type: 'file_uploaded', payload: { title: file.name },
    })
  },

  async deleteFile(id: string): Promise<void> {
    const row = check(
      await supabase.from('files').select('storage_path').eq('id', id).maybeSingle(),
    ) as { storage_path: string } | null
    if (row) await supabase.storage.from('project-files').remove([row.storage_path])
    check(await supabase.from('files').delete().eq('id', id).select())
  },

  async getMyProfile(): Promise<ProfileView> {
    const id = await uidOrThrow()
    const row = check(
      await supabase.from('profiles').select('id, display_name').eq('id', id).maybeSingle(),
    ) as { id: string; display_name: string | null } | null
    return { id, display_name: row?.display_name ?? '' }
  },

  async updateMyProfile(displayName: string): Promise<void> {
    const id = await uidOrThrow()
    check(await supabase.from('profiles').update({ display_name: displayName }).eq('id', id).select())
    await supabase.auth.updateUser({ data: { display_name: displayName } })
  },
}
