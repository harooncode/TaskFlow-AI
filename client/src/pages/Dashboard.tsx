import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import TaskForm from "../components/TaskForm";
import AIAssistentDrawer from "../components/AIAssistentDrawer";
import DashboardHeader from "../components/DashboardHeader";
import DashboardStats from "../components/DashboardStats";
import TaskFilters from "../components/TaskFilters";
import TaskBoard from "../components/TaskBoard";
import DeleteTask from "../components/DeleteTask";
import NotificationPopupDrawer from "../components/NotificationPopupDrawer";
import AnalyticsDrawer from "../components/AnalyticsDrawer";
import { errorBox } from "../ui";
import type { Stats, Status, Task, TaskInput } from "../types";


export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filters, setFilters] = useState({ q: "", priority: "" });
  const [editing, setEditing] = useState<Task | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [aiFocusedTask, setAiFocusedTask] = useState<Task | null>(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Delete confirmation modal state
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, s] = await Promise.all([
        api.getTasks(filters),
        api.getStats(),
      ]);
      setTasks(t.tasks);
      setStats(s.stats);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  // Create a new task
  const create = async (data: TaskInput) => {
    await api.createTask(data);
    await load();
  };

  // Update an existing task
  const update = async (data: TaskInput) => {
    if (!editing) return;
    await api.updateTask(editing._id, data);
    setEditing(null);
    await load();
  };


  // Change task status
  const changeStatus = async (id: string, status: Status) => {
    await api.updateTask(id, { status });
    await load();
  };

  // Open the confirmation popup
  const remove = (id: string) => {
    const selectedTask = tasks.find((task) => task._id === id);

    if (selectedTask) {
      setTaskToDelete(selectedTask);
      setError("");
    }
  };

  // Delete only after the user confirms
  const confirmDelete = async () => {
    if (!taskToDelete || isDeleting) return;

    setIsDeleting(true);
    setError("");

    try {
      await api.deleteTask(taskToDelete._id);
      setTaskToDelete(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Determine overdue tasks using the same due-date field as your Task model.
  const overdueTasks = tasks.filter((task) => {
    if (!task.dueDate || task.status === "done") return false;

    const dueDate = new Date(task.dueDate);
    return !Number.isNaN(dueDate.getTime()) && dueDate < new Date();
  });

  const initial = user?.name?.trim()?.charAt(0).toUpperCase() || "U";

  return (
    <div className="mx-auto w-full max-w-[1800px] px-3 pb-8 pt-3 sm:px-5 sm:pb-10 sm:pt-5 2xl:px-8">


      <DashboardHeader
        initial={initial}
        userName={user?.name}
        userEmail={user?.email}
        overdueCount={stats?.overdue ?? 0}
        isNotificationsOpen={isNotificationsOpen}
        onToggleNotifications={() => {
          setIsAnalyticsOpen(false);
          setIsCopilotOpen(false);
          setIsNotificationsOpen((v) => !v);
        }}
        onToggleAnalytics={() => {
          setIsCopilotOpen(false);
          setIsNotificationsOpen(false);
          setIsAnalyticsOpen((v) => !v);
        }}
        onOpenAI={() => {
          setAiFocusedTask(null);
          setIsAnalyticsOpen(false);
          setIsNotificationsOpen(false);
          setIsCopilotOpen(true);
        }}
        onLogout={logout}
      />


      {/* Statistics */}
      {stats && <DashboardStats stats={stats} />}

      <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:gap-5 xl:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside>
          {editing ? (
            <TaskForm
              key={editing._id}
              initial={editing}
              onSubmit={update}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <TaskForm onSubmit={create} />
          )}
        </aside>

        <main>

          {/*Task Filters (search and priority)*/}
          <TaskFilters filters={filters} setFilters={setFilters} />

          {error && <div className={`${errorBox} mb-3`}>{error}</div>}

          {/*TaskBoard (in Progress, To do, Done)*/}
          <TaskBoard tasks={tasks} loading={loading} onStatusChange={changeStatus} onEdit={setEditing} onDelete={remove} onAskAI={(task) => {
            setAiFocusedTask(task);
            setIsNotificationsOpen(false);
            setIsAnalyticsOpen(false);
            setIsCopilotOpen(true);
          }} />
        </main>
      </div>

      {/* Notifications popup drawer */}
      <NotificationPopupDrawer
        isOpen={isNotificationsOpen}
        overdueTasks={overdueTasks}
        onClose={() => setIsNotificationsOpen(false)}
        onTaskClick={(task) => {
          setEditing(task);
          setIsNotificationsOpen(false);
        }}
      />

      {/* Delete confirmation modal */}
      <DeleteTask
        taskToDelete={taskToDelete}
        isDeleting={isDeleting}
        error={error}
        onCancel={() => setTaskToDelete(null)}
        onConfirm={confirmDelete}
      />

      {/*AI Chatbot*/}
      <AIAssistentDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        focusedTask={aiFocusedTask}
        onClearFocusedTask={() => setAiFocusedTask(null)}
        onSubtasksCreated={load}
      />

      {/* Analytics / Charts*/}
      <AnalyticsDrawer
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        stats={stats}
      />
    </div>
  );
}