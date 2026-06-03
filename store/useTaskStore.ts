import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { taskService } from '@/api/taskService';
import Toast from 'react-native-toast-message';
import { Task } from '@/models/TaskBoardModel';

interface TaskState {
    tasks: Task[];
    statuses: { name: string; isDefault: boolean }[];
    isLoading: boolean;
    error: string | null;
    fetchTasks: (taskMode: string, userRole: string, isRefresh?: boolean) => Promise<void>;
    fetchStatuses: () => Promise<void>;
}

export const useTaskStore = create<TaskState>()(
    persist(
        (set, get) => ({
            tasks: [],
            statuses: [],
            isLoading: false,
            error: null,

            fetchStatuses: async () => {
                try {
                    const data = await taskService.getStatuses();
                    set({ statuses: data });
                } catch (err) {
                    console.error('Error fetching statuses:', err);
                }
            },

            fetchTasks: async (taskMode, userRole, isRefresh = false) => {
                try {
                    if (!isRefresh && get().tasks.length === 0) {
                        set({ isLoading: true });
                    }
                    set({ error: null });

                    let apiData: Task[] = [];
                    switch (taskMode) {
                        case 'all':
                            apiData = userRole === 'Admin'
                                ? await taskService.getAllTasks()
                                : await taskService.getTasksByCurrentUser();
                            break;
                        case 'my_tasks':
                            apiData = await taskService.getTasksByCurrentUser();
                            break;
                        case 'assigned':
                            apiData = await taskService.getAssignedTasks();
                            break;
                        case 'authored':
                            apiData = await taskService.getAuthorTasks();
                            break;
                        default:
                            apiData = await taskService.getTasksByCurrentUser();
                    }

                    set({ tasks: apiData, isLoading: false });
                } catch (error: any) {
                    console.error('Tasks fetch error:', error);
                    const errorMessage = error?.message || 'Не удалось загрузить задачи';

                    if (get().tasks.length > 0) {
                        Toast.show({
                            type: 'error',
                            text1: 'Ошибка обновления',
                            text2: errorMessage,
                        });
                        set({ isLoading: false });
                    } else {
                        set({ error: errorMessage, isLoading: false });
                    }
                }
            },
        }),
        {
            name: 'task-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
