import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/api/api';
import Toast from 'react-native-toast-message';

interface EventDetailsState {
    events: Record<string, any>;
    isLoading: boolean;
    fetchEventDetails: (id: string, isRefresh?: boolean) => Promise<void>;
}

export const useEventDetailsStore = create<EventDetailsState>()(
    persist(
        (set, get) => ({
            events: {},
            isLoading: false,

            fetchEventDetails: async (id, isRefresh = false) => {
                try {
                    if (!isRefresh && !get().events[id]) {
                        set({ isLoading: true });
                    }

                    const { data } = await apiClient.get(`/api/Events/${id}`);

                    set((state) => ({
                        events: { ...state.events, [id]: data },
                        isLoading: false
                    }));
                } catch (error: any) {
                    console.error('Event details fetch error:', error);
                    set({ isLoading: false });

                    if (get().events[id]) {
                        Toast.show({
                            type: 'error',
                            text1: 'Ошибка обновления',
                            text2: 'Не удалось загрузить свежие данные события',
                        });
                    }
                }
            },
        }),
        {
            name: 'event-details-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
