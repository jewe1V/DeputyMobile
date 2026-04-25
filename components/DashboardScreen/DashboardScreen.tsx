import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    CheckCircle2,
    Bell,
    AlertCircle,
    RefreshCw, Phone
} from 'lucide-react-native';
import { styles } from './style';
import Animated, { FadeInDown} from 'react-native-reanimated';
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {AuthManager} from "@/components/LoginScreen/LoginScreen";
import { apiUrl } from '@/api/api';
import {Event} from "@/models/EventModel"
import {EventCard} from "@/components/EventsScreen/EventCard";
import {Task} from "@/models/TaskBoardModel";
import {formatDateToDay} from "@/utils";
import {TaskCard} from "@/components/TaskBoard/TaskCard";
import { StatCard } from './StatCard';
import {HeaderSkeleton} from "@/components/DashboardScreen/HeaderSkeleton";

interface DashboardData {
    job_title: string;
    user_name: string;
    event_count: number;
    urgent_event_count: number;
    task_count: number;
    urgent_tasks_count: number;
    tasks: any[];
    urgent_tasks: any[];
    urgent_events: any[];
    events_by_status: {
        Going: any[];
        NotGoing: any[];
        Unknown: any[];
        NotAnswered: any[];
    };
}

export function Dashboard() {
    const insets = useSafeAreaInsets();

    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchDashboardData(false);
    }, []);

    const fetchDashboardData = async (isRefresh = false) => {
        try {
            if (!isRefresh) {
                setIsLoading(true);
            }
            setError(null);

            const token = AuthManager.getToken();

            if (!token) {
                setError('Не найден токен авторизации');
                return;
            }

            const response = await fetch(`${apiUrl}/api/Dashboard/get`, {
                method: 'GET',
                headers: {
                    'accept': '*/*',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setError('Сессия истекла. Пожалуйста, войдите снова');
                } else {
                    setError(`Ошибка сервера: ${response.status}`);
                }
                return;
            }

            const json = await response.json();
            setData(json);
        } catch (error) {
            console.error(error);
            setError('Не удалось загрузить данные дашборда. Проверьте подключение к интернету');
        } finally {
            if (!isRefresh) {
                setIsLoading(false);
            }
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDashboardData(true);
    }, []);

    const getInitials = (name: string) => {
        if (!name) return '';
        const parts = name.split(' ');
        return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name[0];
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return `Сегодня, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return `Завтра, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
            });
        }
    };

    if (isLoading) {
        return (
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#2A6E3F']}
                        tintColor="#2A6E3F"
                    />
                }
            >
                <HeaderSkeleton insetsTop={insets.top}/>
            </ScrollView>
        );
    }
    if (error || !data) {
        return (
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#2A6E3F']}
                        tintColor="#2A6E3F"
                    />
                }
            >
                <HeaderSkeleton insetsTop={insets.top}/>
                <View style={[styles.content, { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 }]}>
                    <View style={{
                        backgroundColor: '#FEF2F2',
                        padding: 20,
                        borderRadius: 12,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#FEE2E2',
                        marginHorizontal: 20
                    }}>
                        <AlertCircle size={48} color="#DC2626" />
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#991B1B', marginTop: 10, textAlign: 'center' }}>
                            Ошибка загрузки
                        </Text>
                        <Text style={{ fontSize: 14, color: '#B91C1C', marginTop: 5, textAlign: 'center' }}>
                            {error || 'Не удалось загрузить данные'}
                        </Text>
                        <TouchableOpacity
                            onPress={onRefresh}
                            style={{
                                backgroundColor: '#2A6E3F',
                                paddingHorizontal: 20,
                                paddingVertical: 10,
                                borderRadius: 8,
                                marginTop: 15,
                                flexDirection: 'row',
                                alignItems: 'center'
                            }}
                        >
                            <RefreshCw size={18} color="white" />
                            <Text style={{ color: 'white', marginLeft: 8, fontSize: 14, fontWeight: '500' }}>
                                Повторить попытку
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        );
    }

    const allUpcomingEvents = data.urgent_events || [];
    const displayTasks : Task[] = data.urgent_tasks || [];

    return (
        <View style={{ flex: 1, paddingBottom: insets.bottom + 15 }}>
            <LinearGradient
                colors={['#2A6E3F', '#349339']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{height: insets.top}}
            >
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#2A6E3F']}
                        tintColor="#2A6E3F"
                        title="Обновление..."
                        titleColor="#666"
                    />
                }
            >
                {/* 2. Теперь хедер находится внутри ScrollView и скроллится */}
                <LinearGradient
                    colors={['#2A6E3F', '#349339']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.header, { paddingTop: 15 }]} // Убрали insets.top отсюда
                >
                    <View style={styles.headerContent}>
                        <View style={styles.userInfoRow}>
                            <TouchableOpacity style={styles.userProfileButton} onPress={() => router.push("/ProfileScreen")}>
                                <View style={styles.avatarContainer}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>
                                            {getInitials(data.user_name)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={styles.greeting}>Добрый день,</Text>
                                    <Text style={styles.userName}>{data.user_name}</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.notificationButton} onPress={() => router.push("/NotificationScreen")}>
                                <View pointerEvents={"none"}>
                                    <Bell size={20} color="white" />
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.notificationButton} onPress={() => router.push("/PhonebookScreen")}>
                                <View pointerEvents={"none"}>
                                    <Phone size={20} color="white" />
                                </View>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.jobTitle}>{data?.job_title || 'Сотрудник'}</Text>
                        <Text style={styles.organization}>Екатеринбургская городская дума</Text>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    <View style={styles.statsGrid}>
                        <StatCard iconName={"Calendar"}
                                  count={data.event_count || 0}
                                  labels={['Мероприятие', 'Мероприятия', 'Мероприятий']}
                                  delay={200}
                        />
                        <StatCard iconName={"CheckCircle2"}
                                  count={data.task_count || 0}
                                  labels={['Задача', 'Задачи', 'Задач']}
                                  delay={400}
                        />
                        <StatCard iconName={"AlertCircle"}
                                  count={data.urgent_tasks_count || 0}
                                  labels={['Срочная задача', 'Срочных задачи', 'Срочных задач']}
                                  delay={600}
                        />
                    </View>
                    {displayTasks.length > 0 && (
                        <Animated.View
                            entering={FadeInDown.delay(700).duration(600)}
                            style={styles.section}
                        >
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Мои задачи</Text>
                            </View>

                            <View style={styles.cardsContainer}>
                                {displayTasks.map((task: any, index: number) => (
                                    <TaskCard
                                        key={task.task_id || index}
                                        task={task}
                                        onPress={() => router.push({
                                            pathname: '/(screens)/TaskBoardScreen/TaskDetailScreen',
                                            params: { id: task.task_id }
                                        })}
                                    />
                                ))}
                            </View>
                        </Animated.View>
                    )}

                    {allUpcomingEvents.length > 0 && (
                        <Animated.View
                            entering={FadeInDown.delay(displayTasks.length > 0 ? 1000 : 700).duration(600)}
                            style={styles.section}
                        >
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Предстоящие мероприятия</Text>
                            </View>

                            <View style={styles.cardsContainer}>
                                {allUpcomingEvents.map((event: Event, index: number) => {
                                    const showDate = index === 0 ||
                                        formatDate(event.start_at) !== formatDate(allUpcomingEvents[index - 1].start_at);

                                    return (
                                        <View key={event.id}>
                                            {showDate && (
                                                <Text style={styles.eventDate}>{formatDateToDay(event.start_at)}</Text>
                                            )}
                                            <EventCard
                                                event={event}
                                                index={index}
                                                onPress={() => router.push({
                                                    pathname: '/(screens)/EventsScreen/EventDetailsScreen',
                                                    params: { id: event.id }
                                                })}
                                            />
                                        </View>
                                    );
                                })}
                            </View>
                        </Animated.View>
                    )}

                    {displayTasks.length === 0 && allUpcomingEvents.length === 0 && (
                        <Animated.View
                            entering={FadeInDown.delay(700).duration(600)}
                            style={[styles.section]}
                        >
                            <View style={styles.emptyContainer}>
                                <CheckCircle2 size={48} color="#3bb625" />
                                <Text style={styles.emptyMainTitle}>Нет активных задач</Text>
                                <Text style={styles.emptyMainSubtitle}>
                                    Идеальный момент, чтобы просто побыть в покое и насладиться тишиной
                                </Text>
                            </View>
                        </Animated.View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
