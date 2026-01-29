import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import {SafeAreaProvider} from "react-native-safe-area-context";
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    Calendar,
    Clock,
    FileText,
    ChevronRight,
    CheckCircle2, Bell,
} from 'lucide-react-native';
import { currentUser, mockTasks, mockEvents, mockDocuments } from '@/data/mockData';
import { styles } from './style';
import { router } from 'expo-router';

// Типы для навигации
type RootStackParamList = {
    Tasks: undefined;
    TaskBoardScreen: { taskId: string };
    Calendar: undefined;
    EventsScreen: { id: string };
    Files: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function Dashboard() {
    const navigation = useNavigation<NavigationProp>();

    // Получаем грядущие задачи
    const upcomingTasks = mockTasks
        .filter(task => task.status !== 'completed')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5);

    // Получаем ближайшие мероприятия
    const upcomingEvents = mockEvents
        .filter(event => new Date(event.startAt) > new Date())
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
        .slice(0, 3);

    // Получаем последние загруженные файлы
    const recentDocuments = [...mockDocuments]
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        .slice(0, 4);

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name[0];
    };

    const getTaskStatusColor = (status: string) => {
        switch (status) {
            case 'created':
                return { bg: '#f3f4f6', text: '#374151' };
            case 'in_progress':
                return { bg: '#dbeafe', text: '#1d4ed8' };
            case 'approval':
                return { bg: '#fef3c7', text: '#d97706' };
            default:
                return { bg: '#f3f4f6', text: '#374151' };
        }
    };

    const getTaskStatusLabel = (status: string) => {
        switch (status) {
            case 'created':
                return 'Создана';
            case 'in_progress':
                return 'В работе';
            case 'approval':
                return 'На согласовании';
            default:
                return status;
        }
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

    const getDaysUntilDue = (dueDate: string) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <SafeAreaProvider>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                {/* Header with User Info */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.userInfo} onPress={() => router.push('/ProfileScreen')}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {getInitials(currentUser.fullName)}
                            </Text>
                        </View>
                        <View style={styles.userDetails}>
                            <Text style={styles.userName}>
                                {currentUser.fullName.split(' ')[1]}
                            </Text>

                            <View style={styles.userButton}>
                                <ChevronRight color="white" size={"18"}/>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.userPush} onPress={() => router.push('/DashboardScreen')}>
                            <Bell color="white" size={"18"}/>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {/* Quick Stats */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                                <CheckCircle2 size={20} color="#2563eb" />
                            </View>
                            <Text style={styles.statNumber}>{upcomingTasks.length}</Text>
                            <Text style={styles.statLabel}>Активных задач</Text>
                        </View>

                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                                <Calendar size={20} color="#d97706" />
                            </View>
                            <Text style={styles.statNumber}>{upcomingEvents.length}</Text>
                            <Text style={styles.statLabel}>Мероприятий</Text>
                        </View>

                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#e9d5ff' }]}>
                                <FileText size={20} color="#7c3aed" />
                            </View>
                            <Text style={styles.statNumber}>{recentDocuments.length}</Text>
                            <Text style={styles.statLabel}>Документов</Text>
                        </View>
                    </View>

                    <View style={styles.sectionContainer}>
                        {/* Upcoming Tasks */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Грядущие задачи</Text>
                                <TouchableOpacity
                                    style={styles.seeAllButton}
                                    onPress={() => navigation.navigate('TaskBoardScreen')}
                                >
                                    <Text style={styles.seeAllText}>Все задачи</Text>
                                    <ChevronRight size={16} color="#0f6319" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.cardsContainer}>
                                {upcomingTasks.length > 0 ? (
                                    upcomingTasks.map((task) => {
                                        const daysLeft = getDaysUntilDue(task.dueDate);
                                        const isUrgent = daysLeft <= 2 && daysLeft >= 0;
                                        const isOverdue = daysLeft < 0;
                                        const statusColors = getTaskStatusColor(task.status);

                                        return (
                                            <TouchableOpacity
                                                key={task.id}
                                                style={styles.card}
                                                onPress={() => navigation.navigate('TaskDetailScreen', { taskId: task.id })}
                                            >
                                                <View style={styles.cardContent}>
                                                    <View style={styles.cardMain}>
                                                        <Text style={styles.cardTitle} numberOfLines={1}>
                                                            {task.title}
                                                        </Text>
                                                        <View style={styles.cardTags}>
                                                            <View style={[styles.badge, { backgroundColor: statusColors.bg }]}>
                                                                <Text style={[styles.badgeText, { color: statusColors.text }]}>
                                                                    {getTaskStatusLabel(task.status)}
                                                                </Text>
                                                            </View>
                                                            <View style={styles.timeContainer}>
                                                                <Clock size={12} color={isOverdue ? '#dc2626' : isUrgent ? '#ea580c' : '#6b7280'} />
                                                                <Text style={[
                                                                    styles.timeText,
                                                                    isOverdue && styles.overdueText,
                                                                    isUrgent && styles.urgentText
                                                                ]}>
                                                                    {isOverdue
                                                                        ? `Просрочено ${Math.abs(daysLeft)} дн.`
                                                                        : daysLeft === 0
                                                                            ? 'Сегодня'
                                                                            : `${daysLeft} дн.`}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                    <ChevronRight size={20} color="#9ca3af" />
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })
                                ) : (
                                    <View style={styles.emptyCard}>
                                        <CheckCircle2 size={48} color="#d1d5db" />
                                        <Text style={styles.emptyText}>Нет активных задач</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Upcoming Events */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Предстоящие мероприятия</Text>
                                <TouchableOpacity
                                    style={styles.seeAllButton}
                                    onPress={() => navigation.navigate('EventsScreen')}
                                >
                                    <Text style={styles.seeAllText}>Календарь</Text>
                                    <ChevronRight size={16} color="#0f6319" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.cardsContainer}>
                                {upcomingEvents.length > 0 ? (
                                    upcomingEvents.map((event) => (
                                        <TouchableOpacity
                                            key={event.id}
                                            style={styles.card}
                                            onPress={() => navigation.navigate('EventDetail', { id: event.id })}
                                        >
                                            <View style={styles.cardContent}>
                                                <View style={styles.eventDate}>
                                                    <Text style={styles.eventDateDay}>
                                                        {new Date(event.startAt).getDate()}
                                                    </Text>
                                                    <Text style={styles.eventDateMonth}>
                                                        {new Date(event.startAt).toLocaleDateString('ru-RU', { month: 'short' })}
                                                    </Text>
                                                </View>
                                                <View style={styles.cardMain}>
                                                    <Text style={styles.cardTitle} numberOfLines={1}>
                                                        {event.title}
                                                    </Text>
                                                    <View style={styles.cardTags}>
                                                        <View style={styles.timeContainer}>
                                                            <Clock size={12} color="#6b7280" />
                                                            <Text style={styles.timeText}>
                                                                {formatDate(event.startAt)}
                                                            </Text>
                                                        </View>
                                                        {event.isPublic && (
                                                            <View style={[styles.badge, { backgroundColor: '#d1fae5' }]}>
                                                                <Text style={[styles.badgeText, { color: '#065f46' }]}>
                                                                    Публичное
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                                <ChevronRight size={20} color="#9ca3af" />
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.emptyCard}>
                                        <Calendar size={48} color="#d1d5db" />
                                        <Text style={styles.emptyText}>Нет предстоящих мероприятий</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaProvider>
    );
}
