import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl, TouchableOpacity, Platform
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Calendar } from '@/components/EventsScreen/Calendar';
import { EventCard } from '@/components/EventsScreen/EventCard';
import { Event } from '@/models/Event';
import { Header } from "@/components/ui/Header";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiUrl } from "@/api/api";
import {CirclePlus, Plus} from "lucide-react-native";
import {LinearGradient} from "expo-linear-gradient";
import {router} from "expo-router";

type RouteParams = {
    params?: {
        refresh?: string;
    };
};

const EventsScreen: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState<string | undefined>();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RouteParams>>();

    const loadEvents = useCallback(async (year: number, month: number, isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);
            const from = new Date(year, month, 1).toISOString();
            const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

            const response = await fetch(
                `${apiUrl}/api/Events/upcoming?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
                {
                    headers: { Accept: 'text/plain' },
                }
            );

            if (!response.ok) throw new Error('Ошибка загрузки событий');

            const data: Event[] = await response.json();
            setEvents(data);
        } catch (e) {
            console.error('Ошибка при загрузке событий:', e);
        } finally {
            if (isRefresh) setRefreshing(false);
            else setLoading(false);
        }
    }, []);

    const refreshNow = async () => {
        const now = new Date();
        await loadEvents(now.getFullYear(), now.getMonth(), true);
    };

    // Первичная загрузка
    useEffect(() => {
        const now = new Date();
        loadEvents(now.getFullYear(), now.getMonth());
    }, [loadEvents]);

    // 🔄 Проверка параметра refresh
    useEffect(() => {
        if (route.params?.refresh === 'true') {
            refreshNow();
            // сбрасываем параметр, чтобы не было повторных перезагрузок
            navigation.setParams({ refresh: undefined } as any);
        }
    }, [route.params?.refresh]);

    const onRefresh = async () => {
        setRefreshing(true);
        const now = new Date();
        await loadEvents(now.getFullYear(), now.getMonth(), true);
    };

    const filteredEvents = useMemo(() => {
        if (selectedDate) {
            return events.filter(ev => ev.startAt.split('T')[0] === selectedDate);
        }
        const now = new Date();
        return events.filter(ev => new Date(ev.startAt) >= now);
    }, [events, selectedDate]);

    const grouped = useMemo(() => {
        const map: Record<string, Event[]> = {};
        filteredEvents.forEach(event => {
            const dateKey = event.startAt.split('T')[0];
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(event);
        });
        return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    }, [filteredEvents]);

    return (
        <View>
            <LinearGradient
                colors={['#2A6E3F', '#349339']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top }]}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Cобытия</Text>
                    <Text style={styles.headerSubtitle}>Запланировано 0</Text>
                </View>
                <TouchableOpacity style={styles.newTaskButton} onPress={() => router.push("/CreateEventScreen")}>
                    <Plus size={20} color="white" />
                </TouchableOpacity>
            </LinearGradient>

            <View style={styles.calendarContainer}>
                <Calendar
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    events={events}
                    onMonthChange={loadEvents}
                />
            </View>
            <View style={styles.contentSection}>
                {loading ? (
                    <ActivityIndicator size="large" color="#0a58ff" style={{ marginTop: 20 }} />
                ) : grouped.length === 0 ? (
                    <Text style={styles.emptyText}>
                        {selectedDate
                            ? 'На выбранную дату пока ничего не запланировано.'
                            : 'В этом месяце пока ничего не запланировано.'}
                    </Text>
                ) : (
                    <FlatList
                        data={grouped}
                        keyExtractor={([date]) => date}
                        renderItem={({ item }) => {
                            const [date, dayEvents] = item;
                            const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('ru-RU', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                            });
                            return (
                                <View style={styles.groupBlock}>
                                    <View style={styles.dateBadge}>
                                        <Text style={styles.dateBadgeText}>{formattedDate}</Text>
                                    </View>
                                    {dayEvents.map(ev => (
                                        <EventCard key={ev.id} event={ev} />
                                    ))}
                                </View>
                            );
                        }}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#0f6219']}
                                tintColor="#0a58ff"
                            />
                        }
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        paddingBottom: 32,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    headerContent: {
        marginLeft: 10
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 1,
    },
    newTaskButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: "auto"
    },
    calendarContainer: {
        marginTop: -20,
        paddingHorizontal: 16,
    },
    contentSection: {
        paddingHorizontal: 16,
    },
    emptyText: {
        fontSize: 15,
        fontFamily: 'Inter_400Regular',
        color: '#6b7280',
        textAlign: 'center',
        marginTop: 20,
    },
    groupBlock: {
        marginBottom: 20,
    },
    dateBadge: {
        backgroundColor: '#e6ecff',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    dateBadgeText: {
        fontSize: 13,
        fontFamily: 'Inter_600SemiBold',
        color: '#0f6119',
        textTransform: 'capitalize',
    },
    listContent: {
        paddingBottom: 32,
    },
});

export default EventsScreen;
