import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/api/api';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';
import { Department } from "@/models/DepartmentModel";

interface DepartmentsState {
    departments: Department[];
    isLoading: boolean;
    error: string | null;
    fetchDepartments: (isRefresh?: boolean) => Promise<void>;
}

export const useDepartmentsStore = create<DepartmentsState>()(
    persist(
        (set, get) => ({
            departments: [],
            isLoading: false,
            error: null,

            fetchDepartments: async (isRefresh = false) => {
                const netInfoState = await NetInfo.fetch();

                if (!netInfoState.isConnected) {
                    if (get().departments.length > 0) {
                        Toast.show({
                            type: 'info',
                            text1: 'Отсутствует интернет',
                            text2: 'Отображаются сохраненные данные',
                        });
                    } else {
                        set({ error: 'Нет подключения к интернету' });
                    }
                    return;
                }

                try {
                    if (!isRefresh && get().departments.length === 0) {
                        set({ isLoading: true });
                    }
                    set({ error: null });

                    const response = await apiClient.get('/api/Department/get-all', {
                        headers: { 'Accept': 'application/json' }
                    });

                    set({ departments: response.data, isLoading: false });
                } catch (error: any) {
                    console.error('Departments fetch error:', error);
                    const errorMessage = 'Не удалось загрузить список отделов';

                    if (get().departments.length > 0) {
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
            name: 'departments-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
