import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/api/api';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';
import { Event } from '@/models/EventModel';
import { Task } from '@/models/TaskBoardModel';

export interface DashboardData {
    job_title: string;
    user_name: string;
    event_count: number;
    urgent_event_count: number;
    task_count: number;
    urgent_tasks_count: number;
    tasks: Task[];
    urgent_tasks: Task[];
    urgent_events: Event[];
    events_by_status: {
        Going: Event[];
        NotGoing: Event[];
        Unknown: Event[];
        NotAnswered: Event[];
    };
}

interface DashboardState {
    data: DashboardData | null;
    isLoading: boolean;
    error: string | null;
    lastUpdated: number | null;
    fetchDashboardData: (isRefresh?: boolean) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>()(
    persist(
        (set, get) => ({
            data: null,
            isLoading: false,
            error: null,
            lastUpdated: null,

            fetchDashboardData: async (isRefresh = false) => {
                const netInfoState = await NetInfo.fetch();

                if (!netInfoState.isConnected) {
                    if (get().data) {
                        Toast.show({
                            type: 'info',
                            text1: 'Отсутствует интернет',
                            text2: 'Отображаются сохраненные данные',
                        });
                        set({ isLoading: false });
                    } else {
                        set({
                            error: 'Нет подключения к интернету. Проверьте сеть.',
                            isLoading: false
                        });
                    }
                    return;
                }

                try {
                    if (!isRefresh && !get().data) {
                        set({ isLoading: true });
                    }
                    set({ error: null });

                    const response = await apiClient.get('/api/Dashboard/get', {
                        headers: { 'accept': '*/*' }
                    });

                    set({
                        data: response.data,
                        lastUpdated: Date.now(),
                        isLoading: false
                    });
                } catch (error: any) {
                    console.error('Dashboard fetch error:', error);
                    let errorMessage = 'Не удалось загрузить данные дашборда';

                    if (error.response?.status === 401) {
                        errorMessage = 'Сессия истекла. Пожалуйста, войдите снова';
                    } else if (error.response?.status) {
                        errorMessage = `Ошибка сервера: ${error.response.status}`;
                    }

                    if (get().data) {
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
            name: 'dashboard-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
