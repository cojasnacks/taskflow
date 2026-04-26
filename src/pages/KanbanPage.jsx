import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCorners } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTasks } from '../hooks/useTasks'
import { useProjects } from '../hooks/useProjects'
import TaskModal from "../components/shared/TaskModal";
import { format, isPast } from 'date-fns'
import { fr } from 'date-fns/locale'

const COLUMNS = [
  { id: 'todo', label: 'À faire', color: '#888780' },
  { id: 'progress', label: 'En cours', color: '#EF9F27' },
  { id: 'review', label: 'En révision', color: '#7F77DD' },
  { id: 'done', label: 'Terminé', color: '#1D9E75' },
]

const PRIORITY_COLORS = { high: '#E24B4A', medium: '#EF9F27', low: '#1D9E75' }

export default function KanbanPage() {
  const [searchParams] = useSearchParams()
  const projectFilter = searchParams.get('project')
  const { tasks, loading, createTask, updateTask, deleteTask, moveTask } = useTasks(projectFilter)
  const { projects } = useProjects()
  const [activeId, setActiveId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [defaultStatus, setDefaultStatus] = useState('todo')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function getTasksByStatus(status) {
    return tasks.filter(t => t.status === status)
  }

  function handleDragStart({ active }) {
    setActiveId(active.id)
  }

  function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over) return
    const task = tasks.find(t => t.id === active.id)
    const newStatus = over.data?.current?.column || over.id
    if (task && COLUMNS.find(c => c.id === newStatus) && task.status !== newStatus) {
      moveTask(active.id, newStatus)
    }
  }

  function openCreate(status) {
    setDefaultStatus(status)
    setEditTask(null)
    setShowModal(true)
  }

  function openEdit(task) {
    setEditTask(task)
    setShowModal(true)
  }

  async function handleSave(data) {
    if (editTask) {
      await updateTask(editTask.id, data)
    } else {
      await createTask(data)
    }
  }

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null

  if (loading) return <PageShell><div className="flex-1 flex items-center justify-center text-sm text-gray-400">Chargement...</div></PageShell>

  return (
    <PageShell onNew={() => openCreate('todo')}>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 p-4 h-full overflow-x-auto">
          {COLUMNS.map(col => {
            const colTasks = getTasksByStatus(col.id)
            return (
              <KanbanColumn key={col.id} column={col} tasks={colTasks}
                onCardClick={openEdit} onAddClick={() => openCreate(col.id)} />
            )
          })}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {showModal && (
        <TaskModal
          projects={projects}
          task={editTask}
          defaultStatus={defaultStatus}
          defaultProjectId={projectFilter}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          onDelete={editTask ? deleteTask : null}
        />
      )}
    </PageShell>
  )
}

function PageShell({ children, onNew }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-white shrink-0">
        <h1 className="text-sm font-semibold text-gray-900">Kanban</h1>
        {onNew && (
          <button onClick={onNew} className="btn btn-primary text-xs">+ Tâche</button>
        )}
      </header>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}

function KanbanColumn({ column, tasks, onCardClick, onAddClick }) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { column: column.id },
    disabled: true,
  })

  return (
    <div ref={setNodeRef} className="w-56 shrink-0 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full" style={{ background: column.color }} />
        <span className="text-xs font-medium text-gray-600">{column.label}</span>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto pb-2 min-h-16" id={column.id}
          data-column={column.id}>
          {tasks.map(task => (
            <SortableCard key={task.id} task={task} onClick={() => onCardClick(task)} />
          ))}
        </div>
      </SortableContext>
      <button onClick={onAddClick}
        className="mt-2 w-full text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 py-1.5 rounded-lg transition-colors text-left px-2">
        + Ajouter
      </button>
    </div>
  )
}

function SortableCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={onClick} />
    </div>
  )
}

function TaskCard({ task, onClick, isDragging }) {
  const isLate = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'done'
  return (
    <div onClick={onClick}
      className={`bg-white border rounded-xl p-3 cursor-pointer hover:border-gray-300 transition-all select-none ${isDragging ? 'shadow-lg rotate-1' : 'border-gray-200'}`}>
      <p className="text-xs text-gray-800 leading-relaxed mb-2.5">{task.title}</p>
{task.description && (
  <p className="text-[11px] text-gray-400 mb-2 leading-relaxed line-clamp-2">{task.description}</p>
)}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {task.project && (
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: task.project.color }} />
          )}
          <span className="text-[10px] text-gray-400 truncate">{task.project?.name}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {task.due_date && (
            <span className={`text-[10px] ${isLate ? 'text-red-500' : 'text-gray-400'}`}>
              {format(new Date(task.due_date), 'd MMM', { locale: fr })}
            </span>
          )}
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: PRIORITY_COLORS[task.priority] || '#888' }} />
        </div>
      </div>
    </div>
  )
}
