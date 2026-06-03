import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/api/api';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';
import { Profile } from "@/models/ProfileModel";

interface ProfileState {
    profiles: Record<string, Profile>; // key is id or 'current'
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
                const key = id || 'current';
                const netInfoState = await NetInfo.fetch();

                if (!netInfoState.isConnected) {
                    if (get().profiles[key]) {
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
                    if (!get().profiles[key]) {
                        set({ isLoading: true });
                    }
                    set({ error: null });

                    const url = id ? `/api/Auth/${id}` : '/api/Auth/current';
                    const { data } = await apiClient.get(url);

                    set((state) => ({
                        profiles: { ...state.profiles, [key]: data },
                        isLoading: false
                    }));
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
