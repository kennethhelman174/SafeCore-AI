import { toast } from "sonner";

interface SyncTask {
  id: string;
  url: string;
  method: string;
  body: any;
  timestamp: number;
}

const SYNC_QUEUE_KEY = "safecore_sync_queue";

export function loadSyncQueue(): SyncTask[] {
  const data = localStorage.getItem(SYNC_QUEUE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveToSyncQueue(task: Omit<SyncTask, "id" | "timestamp">) {
  const queue = loadSyncQueue();
  const newTask: SyncTask = {
    ...task,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now()
  };
  queue.push(newTask);
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  toast.warning("Offline: Action queued for synchronization");
  return newTask;
}

export async function processSyncQueue(token: string) {
  const queue = loadSyncQueue();
  if (queue.length === 0) return;

  const remaining: SyncTask[] = [];
  let successCount = 0;

  for (const task of queue) {
    try {
      const res = await fetch(task.url, {
        method: task.method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(task.body)
      });

      if (res.ok) {
        successCount++;
      } else {
        remaining.push(task);
      }
    } catch (error) {
      remaining.push(task);
    }
  }

  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));

  if (successCount > 0) {
    toast.success(`Sync Complete: ${successCount} items synchronized`);
  }
}

export function saveDraft(key: string, data: any) {
  localStorage.setItem(`draft_${key}`, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
}

export function getDraft(key: string) {
  const data = localStorage.getItem(`draft_${key}`);
  return data ? JSON.parse(data) : null;
}

export function clearDraft(key: string) {
  localStorage.removeItem(`draft_${key}`);
}
