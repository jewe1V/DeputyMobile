import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/api/api';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';
import { Profile } from "@/models/ProfileModel";

interface UsersState {
    users: Profile[];
    isLoading: boolean;
    error: string | null;
    fetchUsers: (isRefresh?: boolean) => Promise<void>;
}

export const useUsersStore = create<UsersState>()(
    persist(
        (set, get) => ({
            users: [],
            isLoading: false,
            error: null,

            fetchUsers: async (isRefresh = false) => {
                const netInfoState = await NetInfo.fetch();

                if (!netInfoState.isConnected) {
                    if (get().users.length > 0) {
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
                    if (!isRefresh && get().users.length === 0) {
                        set({ isLoading: true });
                    }
                    set({ error: null });

                    const response = await apiClient.get('/api/Auth/all', {
                        headers: { 'Accept': 'application/json' }
                    });

                    const data = response.data ? response.data : [];
                    set({ users: data, isLoading: false });
                } catch (error: any) {
                    console.error('Users fetch error:', error);
                    const errorMessage = 'Не удалось загрузить пользователей';

                    if (get().users.length > 0) {
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
            name: 'users-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
