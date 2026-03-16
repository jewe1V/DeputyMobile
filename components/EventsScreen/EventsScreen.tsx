import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl, TouchableOpacity, Platform
} from 'react-native';
import { Calendar } from '@/components/EventsScreen/Calendar';
import { EventCard } from '@/components/EventsScreen/EventCard';
import { Event } from '@/models/EventModel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiUrl } from "@/api/api";
import {Plus} from "lucide-react-native";
import {LinearGradient} from "expo-linear-gradient";
import {router} from "expo-router";
import {AuthManager} from "@/components/LoginScreen/LoginScreen";
import {Select} from "@/components/ui/Select";
import {SchedulePopup} from "@/components/EventsScreen/SchedulePopup";

const EventsScreen: React.FC = () => {
    const now = new Date();
    const [viewDate, setViewDate] = useState({ year: now.getFullYear(), month: now.getMonth() });
    const [selectedDate, setSelectedDate] = useState<string | undefined>();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isDayModalVisible, setIsDayModalVisible] = useState(false);
    const [selectedDayEvents, setSelectedDayEvents] = useState<Event[]>([]);

    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
    const [eventsFilter, setEventsFilter] = useState<'all' | 'mine' | 'past'>('all');

    const insets = useSafeAreaInsets();

    const loadEvents = useCallback(async (year: number, month: number, isRefresh = false, isOnlyMy = false) => {
        try {
            const token = AuthManager.getToken();
            if (!isRefresh) setLoading(true);

            // Сохраняем, какой месяц мы загрузили
            setViewDate({ year, month });

            const from = new Date(year, month, 1).toISOString();
            const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

            const response = await fetch(
                `${apiUrl}/api/Events/upcoming?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&onlyMy=${isOnlyMy}`,
                {
                    headers: { Accept: 'text/plain', Authorization: `Bearer ${token}` },
                }
            );
            const data: Event[] = await response.json();
            setEvents(data);
        } catch (e) {
            console.error('Ошибка при загрузке событий:', e);
        } finally {
            if (isRefresh) setRefreshing(false);
            else setLoading(false);
        }
    }, []);

    // Обработка смены режима отображения
    const handleViewModeChange = (mode: 'calendar' | 'list') => {
        setViewMode(mode);
        const today = new Date();

        if (mode === 'list') {
            setSelectedDate(undefined);
            // Если мы в календаре ушли в другой месяц, при переходе в список возвращаемся к текущему
            if (viewDate.month !== today.getMonth() || viewDate.year !== today.getFullYear()) {
                loadEvents(today.getFullYear(), today.getMonth(), false, eventsFilter === 'mine');
            }
        }
    };

    // Первичная загрузка и реакция на смену фильтра (мои/все)
    useEffect(() => {
        loadEvents(viewDate.year, viewDate.month, false, eventsFilter === 'mine');
    }, [eventsFilter]); // Убрали loadEvents из зависимостей, чтобы избежать циклов

    const onRefresh = async () => {
        setRefreshing(true);
        await loadEvents(viewDate.year, viewDate.month, true, eventsFilter === 'mine');
    };

    const filteredEvents = useMemo(() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        if (viewMode === 'calendar' && selectedDate) {
            return events.filter(ev => ev.start_at.split('T')[0] === selectedDate);
        }

        return events.filter(ev => {
            const eventDate = new Date(ev.start_at);
            if (eventsFilter === 'past') {
                return eventDate < todayStart;
            }
            // Для "Все" и "Мои" показываем и будущие, и сегодняшние (даже если утро прошло)
            return eventDate >= todayStart;
        });
    }, [events, selectedDate, viewMode, eventsFilter]);

    const grouped = useMemo(() => {
        const map: Record<string, Event[]> = {};
        filteredEvents.forEach(event => {
            const dateKey = event.start_at.split('T')[0];
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(event);
        });
        return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    }, [filteredEvents]);

    const handleDateSelect = useCallback((date: string) => {
        setSelectedDate(date);

        // Ищем события на эту дату
        const dayEvents = events.filter(ev => ev.start_at.split('T')[0] === date);

        if (dayEvents.length > 0) {
            setSelectedDayEvents(dayEvents);
            setIsDayModalVisible(true);
        }
    }, [events]);

    return (
        <View style={{flex: 1, backgroundColor: '#f9f9f9' }}>
            <LinearGradient
                colors={['#2A6E3F', '#349339']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + 15 }]}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>События</Text>
                    <Text style={styles.headerSubtitle}>Запланировано {filteredEvents.length}</Text>
                </View>
                <TouchableOpacity style={styles.newTaskButton} onPress={() => router.push("/CreateEventScreen")}>
                    <Plus size={20} color="white" />
                </TouchableOpacity>
            </LinearGradient>

            {/* Блок фильтров */}
            <LinearGradient colors={['#ebfdeb', '#fff']} style={styles.filtersSection}>
                <View style={styles.filtersGrid}>
                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>Отображение</Text>
                        <Select
                            value={viewMode}
                            onValueChange={(v) => handleViewModeChange(v as 'calendar' | 'list')}
                            items={[
                                { label: 'Календарь', value: 'calendar' },
                                { label: 'Список', value: 'list' },
                            ]}
                        />
                    </View>
                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>События</Text>
                        <Select
                            value={eventsFilter}
                            onValueChange={(v) => setEventsFilter(v as any)}
                            items={[
                                { label: 'Все', value: 'all' },
                                { label: 'Мои', value: 'mine' },
                                { label: 'Прошедшие', value: 'past' },
                            ]}
                        />
                    </View>
                </View>
            </LinearGradient>

            {viewMode === 'calendar' ? (
                <View style={styles.calendarContainer}>
                    <Calendar
                        selectedDate={selectedDate}
                        onSelectDate={handleDateSelect} // Используем новую функцию
                        events={events}
                        onMonthChange={(y, m) => loadEvents(y, m, false, eventsFilter === 'mine')}
                    />
                    {/* Список здесь больше не выводим */}
                </View>
            ) : (
                // Список выводится ТОЛЬКО в режиме 'list'
                <View style={[styles.contentSection, { marginTop: 16 }]}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#0f6119" />
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
                                            <EventCard key={ev.id} event={ev} onPress={() => router.push({ pathname: '/(screens)/EventDetailsScreen', params: { id: ev.id } })}/>
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
            )}

            {/* Попап расписания дня */}
            <SchedulePopup
                visible={isDayModalVisible}
                onClose={() => setIsDayModalVisible(false)}
                events={selectedDayEvents}
                date={selectedDate}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        paddingBottom: 40, // Увеличил padding, чтобы фильтр красиво перекрывал градиент
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

    // Новые стили для фильтров
    filtersSection: {
        padding: 12,
        marginTop: -24, // Фильтр "налезает" на хидер
        borderRadius: 20,
        marginHorizontal: 15,
        backgroundColor: "transparent",
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
        zIndex: 10,
    },
    filtersGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    filterGroup: {
        flex: 1,
    },
    filterLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
        marginLeft: 2,
    },

    calendarContainer: {
        marginTop: 10,
        alignItems: 'center',
    },
    contentSection: {
        flex: 1, // Чтобы FlatList корректно скроллился
        paddingHorizontal: 16,
    },
    emptyText: {
        fontSize: 15,
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
        color: '#0f6119',
        textTransform: 'capitalize',
    },
    listContent: {
        paddingBottom: 100, // Увеличен padding снизу для комфортного скролла
        paddingTop: 10,
    },
});

export default EventsScreen;
