import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/api/api';
import Toast from 'react-native-toast-message';

export interface PhonebookModel {
    full_name: string;
    job_title: string;
    city_phone: string;
    internal_phone: string;
    office_number: string;
}

interface PhonebookState {
    data: PhonebookModel[];
    isLoading: boolean;
    error: string | null;
    fetchPhonebook: (isRefresh?: boolean) => Promise<void>;
}

export const usePhonebookStore = create<PhonebookState>()(
    persist(
        (set, get) => ({
            data: [],
            isLoading: false,
            error: null,

            fetchPhonebook: async (isRefresh = false) => {
                try {
                    if (!isRefresh && get().data.length === 0) {
                        set({ isLoading: true });
                    }
                    set({ error: null });

                    const { data } = await apiClient.get<PhonebookModel[]>('/api/PhoneBook');
                    set({ data, isLoading: false });
                } catch (error: any) {
                    console.error('Phonebook fetch error:', error);
                    const errorMessage = 'Не удалось загрузить телефонную книгу';

                    if (get().data.length > 0) {
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
            name: 'phonebook-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
