import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { taskService } from '@/api/taskService';
import Toast from 'react-native-toast-message';
import { Task } from '@/models/TaskBoardModel';

interface TaskDetailsState {
    tasks: Record<string, Task>;
    isLoading: boolean;
    fetchTaskDetails: (id: string, isRefresh?: boolean) => Promise<void>;
}

export const useTaskDetailsStore = create<TaskDetailsState>()(
    persist(
        (set, get) => ({
            tasks: {},
            isLoading: false,

            fetchTaskDetails: async (id, isRefresh = false) => {
                try {
                    if (!isRefresh && !get().tasks[id]) {
                        set({ isLoading: true });
                    }

                    const data = await taskService.getTaskById(id);

                    set((state) => ({
                        tasks: { ...state.tasks, [id]: data },
                        isLoading: false
                    }));
                } catch (error: any) {
                    console.error('Task details fetch error:', error);
                    set({ isLoading: false });

                    if (get().tasks[id]) {
                        Toast.show({
                            type: 'error',
                            text1: 'Ошибка обновления',
                            text2: 'Не удалось загрузить свежие данные задачи',
                        });
                    }
                }
            },
        }),
        {
            name: 'task-details-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
