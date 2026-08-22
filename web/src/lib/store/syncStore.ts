import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../supabase';
import { toast } from 'sonner';

export interface PendingJob {
  id: string;
  job_type: string;
  payload: any;
  timestamp: number;
}

interface SyncStore {
  queue: PendingJob[];
  enqueueJob: (job: PendingJob) => void;
  removeJob: (id: string) => void;
  processQueue: () => Promise<void>;
}

export const useSyncStore = create<SyncStore>()(
  persist(
    (set, get) => ({
      queue: [],
      enqueueJob: (job) => set((state) => ({ queue: [...state.queue, job] })),
      removeJob: (id) => set((state) => ({ queue: state.queue.filter(j => j.id !== id) })),
      processQueue: async () => {
        const queue = get().queue;
        if (queue.length === 0) return;
        
        if (!navigator.onLine) return;

        let processed = 0;
        for (const job of queue) {
          try {
            const { error } = await supabase.from('print_jobs').insert({
              job_type: job.job_type,
              payload: job.payload,
              status: 'pending'
            });
            if (!error) {
              get().removeJob(job.id);
              processed++;
            }
          } catch (e) {
            console.error("Error syncing job", e);
          }
        }

        if (processed > 0) {
          toast.success(`Se han sincronizado ${processed} comandas que estaban pendientes`);
        }
      }
    }),
    {
      name: 'pos-sync-queue',
    }
  )
);
