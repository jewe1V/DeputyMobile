import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Calendar,
    Clock,
    ChevronRight,
    CheckCircle2,
    Bell,
    AlertCircle,
} from 'lucide-react-native';
import { currentUser, mockTasks, mockEvents, mockDocuments } from '@/data/mockData';
import {styles} from './style';
import Animated, {FadeInUp, FadeInDown, FadeInRight, ZoomIn} from 'react-native-reanimated';
import {router} from "expo-router";
import {useSafeAreaInsets} from "react-native-safe-area-context";

export function Dashboard() {
    const insets = useSafeAreaInsets();
    const upcomingTasks = mockTasks
        .filter(task => task.status !== 'completed')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 3);

    // Получаем ближайшие мероприятия
    const upcomingEvents = mockEvents
        .filter(event => new Date(event.startAt) > new Date())
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
        .slice(0, 3);

    // Получаем последние загруженные файлы
    const recentDocuments = [...mockDocuments]
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        .slice(0, 3);

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name[0];
    };

    const getTaskStatusColor = (status: string) => {
        switch (status) {
            case 'created':
                return { backgroundColor: '#f3f4f6', color: '#374151' };
            case 'in_progress':
                return { backgroundColor: '#E8F5E9', color: '#2E7D32' };
            case 'approval':
                return { backgroundColor: '#FFFBEB', color: '#B45309' };
            default:
                return { backgroundColor: '#f3f4f6', color: '#374151' };
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

    const activeTasks = mockTasks.filter(task => task.status !== 'completed').length;
    const urgentTasks = upcomingTasks.filter(task => {
        const days = getDaysUntilDue(task.dueDate);
        return days <= 2 && days >= 0;
    }).length;

    return (
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
            <View>
                <LinearGradient
                    colors={['#2A6E3F', '#349339']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.header, {paddingTop: insets.top}]}
                >
                    <View style={styles.headerContent}>
                        <View style={styles.userInfoRow}>
                            <TouchableOpacity style={styles.userProfileButton} onPress={() => router.push("/ProfileScreen")}>
                                <View style={styles.avatarContainer}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>
                                            {getInitials(currentUser.fullName)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={styles.greeting}>Добрый день,</Text>
                                    <Text style={styles.userName}>{currentUser.fullName.split(' ')[1]}</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.notificationButton} onPress={() => router.push("/NotificationScreen")}>
                                <Bell size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.jobTitle}>{currentUser.jobTitle}</Text>
                        <Text style={styles.organization}>Городская Дума Екатеринбурга</Text>
                    </View>
                </LinearGradient>
            </View>

            <View style={styles.content}>
                <View style={styles.statsGrid}>

                    {/* --- КАРТОЧКА 1 --- */}
                    <Animated.View style={styles.statCardContainer} entering={FadeInDown.delay(200).duration(600).springify()}>
                        <LinearGradient colors={['#ffffff','#f3fdf3']} style={styles.statCard}>
                            <View style={styles.statIcon}><Calendar size={20} color="black" /></View>
                            <Text style={styles.statNumber}>{upcomingEvents?.length || 0}</Text>
                            <Text style={styles.statLabel}>Мероприятий</Text>
                        </LinearGradient>
                    </Animated.View>

                    {/* --- КАРТОЧКА 2 --- */}
                    <Animated.View style={styles.statCardContainer} entering={FadeInDown.delay(400).duration(600).springify()}>
                        <LinearGradient colors={['#ffffff','#f3fdf3']} style={styles.statCard}>
                            <View style={styles.statIcon}><CheckCircle2 size={20} color="black" /></View>
                            <Text style={styles.statNumber}>{activeTasks || 0}</Text>
                            <Text style={styles.statLabel}>Задач</Text>
                        </LinearGradient>
                    </Animated.View>

                    {/* --- КАРТОЧКА 3 --- */}
                    <Animated.View style={styles.statCardContainer} entering={FadeInDown.delay(600).duration(600).springify()}>
                        <LinearGradient colors={['#ffffff','#f3fdf3']} style={styles.statCard}>
                            <View style={styles.statIcon}><AlertCircle size={20} color="black" /></View>
                            <Text style={styles.statNumber}>{urgentTasks || 0}</Text>
                            <Text style={styles.statLabel}>Срочных задач</Text>
                        </LinearGradient>
                    </Animated.View>

                </View>

                {/* --- СЕКЦИЯ: МОИ ЗАДАЧИ --- */}
                <Animated.View
                    entering={FadeInDown.delay(700).duration(600)}
                    style={styles.section}
                >
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Мои задачи</Text>
                    </View>

                    <View style={styles.cardsContainer}>
                        {upcomingTasks.length > 0 ? (
                            upcomingTasks.map((task, index) => {
                                const daysLeft = getDaysUntilDue(task.dueDate);
                                const isUrgent = daysLeft <= 2 && daysLeft >= 0;
                                const isOverdue = daysLeft < 0;
                                const statusColors = getTaskStatusColor(task.status);

                                return (
                                    <Animated.View
                                        key={task.id}
                                        // Каждая карточка вылетает чуть позже предыдущей
                                        entering={FadeInRight.delay(800 + index * 100).duration(500).springify()}
                                    >
                                        <TouchableOpacity style={styles.card}>
                                            <View style={styles.cardContent}>
                                                <View style={styles.cardTextContainer}>
                                                    <Text style={styles.cardTitle} numberOfLines={2}>
                                                        {task.title}
                                                    </Text>
                                                    <View style={styles.cardTags}>
                                                        <View style={[styles.tag, { backgroundColor: statusColors.backgroundColor }]}>
                                                            <Text style={[styles.tagText, { color: statusColors.color }]}>
                                                                {getTaskStatusLabel(task.status)}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.timeTag}>
                                                            <Clock size={14} color={isOverdue ? '#dc2626' : isUrgent ? '#f97316' : '#6b7280'} />
                                                            <Text style={[styles.timeText, { color: isOverdue ? '#dc2626' : isUrgent ? '#f97316' : '#6b7280', fontWeight: '500' }]}>
                                                                {isOverdue ? `Просрочено ${Math.abs(daysLeft)} дн.` : daysLeft === 0 ? 'Сегодня' : `${daysLeft} дн.`}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                                <ChevronRight size={20} color="#9ca3af" />
                                            </View>
                                        </TouchableOpacity>
                                    </Animated.View>
                                );
                            })
                        ) : (
                            // Плавное увеличение пустой карточки, если задач нет
                            <Animated.View entering={ZoomIn.delay(800)} style={styles.emptyCard}>
                                <View style={styles.emptyIconContainer}>
                                    <CheckCircle2 size={32} color="#4CAF50" />
                                </View>
                                <Text style={styles.emptyTitle}>Нет активных задач</Text>
                                <Text style={styles.emptySubtitle}>Все задачи выполнены</Text>
                            </Animated.View>
                        )}
                    </View>
                </Animated.View>

                {/* --- СЕКЦИЯ: ПРЕДСТОЯЩИЕ МЕРОПРИЯТИЯ --- */}
                <Animated.View
                    entering={FadeInDown.delay(1000).duration(600)}
                    style={styles.section}
                >
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Предстоящие мероприятия</Text>
                    </View>

                    <View style={styles.cardsContainer}>
                        {upcomingEvents.length > 0 ? (
                            upcomingEvents.map((event, index) => (
                                <Animated.View
                                    key={event.id}
                                    // Появляются с небольшим сдвигом справа
                                    entering={FadeInRight.delay(1100 + index * 100).duration(500).springify()}
                                >
                                    <TouchableOpacity style={styles.card}>
                                        <View style={styles.cardContent}>
                                            <View style={styles.eventDateContainer}>
                                                <Text style={styles.eventDay}>
                                                    {new Date(event.startAt).toLocaleDateString('ru-RU', { day: 'numeric' })}
                                                </Text>
                                                <Text style={styles.eventMonth}>
                                                    {new Date(event.startAt).toLocaleDateString('ru-RU', { month: 'short' }).toUpperCase()}
                                                </Text>
                                            </View>
                                            <View style={styles.cardTextContainer}>
                                                <Text style={styles.cardTitle} numberOfLines={2}>
                                                    {event.title}
                                                </Text>
                                                <View style={styles.eventTime}>
                                                    <Clock size={14} color="#6b7280" />
                                                    <Text style={styles.eventTimeText}>
                                                        {formatDate(event.startAt)}
                                                    </Text>
                                                </View>
                                                {event.isPublic && (
                                                    <View style={styles.publicBadge}>
                                                        <Text style={styles.publicBadgeText}>Публичное мероприятие</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <ChevronRight size={20} color="#9ca3af" />
                                        </View>
                                    </TouchableOpacity>
                                </Animated.View>
                            ))
                        ) : (
                            <Animated.View entering={ZoomIn.delay(1100)} style={[styles.emptyCard, { backgroundColor: '#F5F9FF' }]}>
                                <View style={[styles.emptyIconContainer, { backgroundColor: '#E3F2FD' }]}>
                                    <Calendar size={32} color="#1976D2" />
                                </View>
                                <Text style={styles.emptyTitle}>Нет предстоящих мероприятий</Text>
                                <Text style={styles.emptySubtitle}>Календарь пуст</Text>
                            </Animated.View>
                        )}
                    </View>
                </Animated.View>
            </View>
        </ScrollView>
    );
}
