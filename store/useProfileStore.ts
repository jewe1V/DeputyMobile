import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/api/api';
import Toast from 'react-native-toast-message';
import { Profile } from "@/models/ProfileModel";

import { AuthManager } from '@/api/auth';

interface ProfileState {
    profiles: Record<string, Profile>;
    isLoading: boolean;
    error: string | null;
    fetchProfile: (id?: string) => Promise<void>;
}

export const useProfileStore = create<ProfileState>()(
    persist(
        (set, get) => ({
            profiles: {},
            isLoading: false,
            error: null,

            fetchProfile: async (id) => {
                const userId = AuthManager.getUserId();
                // Если id совпадает с текущим пользователем или не указан, используем ключ 'current'
                const isCurrent = !id || id === userId;
                const key = isCurrent ? 'current' : id!;

                try {
                    if (!get().profiles[key]) {
                        set({ isLoading: true });
                    }
                    set({ error: null });

                    // Если запрашиваем себя, идем на /current
                    const url = isCurrent ? '/api/Auth/current' : `/api/Auth/${id}`;
                    const { data } = await apiClient.get(url);

                    set((state) => {
                        const newProfiles = { ...state.profiles, [key]: data };

                        // Если мы получили данные по конкретному ID, который является текущим пользователем,
                        // или получили данные по /current, синхронизируем оба ключа для надежности.
                        if (isCurrent) {
                            newProfiles['current'] = data;
                            if (userId) newProfiles[userId] = data;
                        } else if (data.id === userId) {
                            newProfiles['current'] = data;
                            newProfiles[data.id] = data;
                        }

                        return {
                            profiles: newProfiles,
                            isLoading: false
                        };
                    });
                } catch (error: any) {
                    console.error('Profile fetch error:', error);
                    const errorMessage = 'Не удалось загрузить профиль';

                    if (get().profiles[key]) {
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
            name: 'profile-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
