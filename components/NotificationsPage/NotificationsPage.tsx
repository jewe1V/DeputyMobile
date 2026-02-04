import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
    ArrowLeft,
    Bell,
    CheckCircle2,
    AlertCircle,
    Info,
    FileText,
    Calendar,
    ClipboardList,
    AlertTriangle,
    XCircle,
    Filter, Plus,
} from 'lucide-react-native';
import { mockNotifications } from '@/data/mockData';
import {Notification, NotificationType, TaskStatus} from '@/data/types';
import { styles } from './notifications-page';
import { router } from 'expo-router';
import {LinearGradient} from "expo-linear-gradient";
import {Select} from "@/components/ui/Select";

const notificationConfig: Record<NotificationType, {
    icon: any;
    bgColor: string;
    iconColor: string;
    borderColor: string;
}> = {
    info: {
        icon: Info,
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        borderColor: 'border-l-blue-500',
    },
    success: {
        icon: CheckCircle2,
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
        borderColor: 'border-l-green-500',
    },
    warning: {
        icon: AlertTriangle,
        bgColor: 'bg-orange-50',
        iconColor: 'text-orange-600',
        borderColor: 'border-l-orange-500',
    },
    error: {
        icon: XCircle,
        bgColor: 'bg-red-50',
        iconColor: 'text-red-600',
        borderColor: 'border-l-red-500',
    },
    task: {
        icon: ClipboardList,
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        borderColor: 'border-l-blue-500',
    },
    event: {
        icon: Calendar,
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600',
        borderColor: 'border-l-purple-500',
    },
    document: {
        icon: FileText,
        bgColor: 'bg-teal-50',
        iconColor: 'text-teal-600',
        borderColor: 'border-l-teal-500',
    },
};

const filterOptions = [
    { label: 'Все уведомления', value: 'all' },
    { label: 'Задачи', value: 'task' },
    { label: 'События', value: 'event' },
    { label: 'Документы', value: 'document' },
    { label: 'Информация', value: 'info' },
    { label: 'Успех', value: 'success' },
    { label: 'Предупреждения', value: 'warning' },
    { label: 'Ошибки', value: 'error' },
];

export function Notifications() {
    const navigation = useNavigation();
    const [notifications, setNotifications] = useState(mockNotifications);
    const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Только что';
        if (diffMins < 60) return `${diffMins} мин назад`;
        if (diffHours < 24) return `${diffHours} ч назад`;
        if (diffDays < 7) return `${diffDays} дн назад`;

        return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const handleMarkAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    };

    const handleNotificationClick = (notification: Notification) => {
        // Отмечаем как прочитанное
        setNotifications(notifications.map(n =>
            n.id === notification.id ? { ...n, isRead: true } : n
        ));

        // Переход на связанную страницу
        if (notification.relatedId && notification.relatedType) {
            switch (notification.relatedType) {
                case 'task':
                    router.push({pathname: '/TaskDetailScreen', params: { id: notification.relatedId }});
                    break;
                case 'event':
                    router.push({pathname: '/EventDetailsScreen', params: { id: notification.relatedId }});
                case 'document':
                    router.push("/CatalogScreen")
                    break;
            }
        }
    };

    const filteredNotifications = filterType === 'all'
        ? notifications
        : notifications.filter(n => n.type === filterType);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const renderNotificationItem = ({ item }: { item: Notification }) => {
        const config = notificationConfig[item.type];
        const Icon = config.icon;

        return (
            <TouchableOpacity
                onPress={() => handleNotificationClick(item)}
                style={[
                    styles.notificationItem,
                    !item.isRead ? styles.unreadNotification : styles.readNotification,
                ]}
            >
                <View style={styles.notificationContent}>
                    {/* Иконка */}
                    <View style={[styles.iconContainer, getBackgroundColor(config.bgColor)]}>
                        <Icon size={20} color={getIconColor(config.iconColor)} />
                    </View>

                    {/* Контент */}
                    <View style={styles.textContainer}>
                        <View style={styles.headerRow}>
                            <Text style={[styles.title, !item.isRead ? styles.unreadTitle : styles.readTitle]}>
                                {item.title}
                            </Text>
                            {!item.isRead && (
                                <View style={styles.unreadDot} />
                            )}
                        </View>
                        <Text style={styles.message} numberOfLines={2}>
                            {item.message}
                        </Text>
                        <Text style={styles.time}>
                            {formatTime(item.createdAt)}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
                <Bell size={32} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>Нет уведомлений</Text>
            <Text style={styles.emptySubtitle}>
                {filterType === 'all'
                    ? 'У вас пока нет уведомлений'
                    : 'Нет уведомлений этого типа'}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#2A6E3F', '#349339']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <ArrowLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Уведомления</Text>
                        <Text style={styles.headerSubtitle}>
                            {unreadCount > 0 ? `${unreadCount} непрочитанных` : 'Все прочитано'}
                        </Text>
                    </View>
                    {unreadCount > 0 && (
                        <TouchableOpacity
                            onPress={handleMarkAllAsRead}
                            style={styles.markAllButton}
                        >
                            <Text style={styles.markAllText}>Прочитать все</Text>
                        </TouchableOpacity>
                    )}
                </View>

            </LinearGradient>

            {/* Фильтры */}
            <LinearGradient colors={['#ebfdeb','#fff']} style={styles.filtersSection}>
                <View style={styles.filtersGrid}>
                    {/* Фильтр по статусу */}
                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>Фильтр</Text>
                        <Select
                            value={filterType}
                            onValueChange={(value) => setFilterType(value as NotificationType | 'all')}
                            items={filterOptions}
                            placeholder="Выберите тип уведомлений"
                        />
                    </View>
                </View>
            </LinearGradient>

            {/* Список уведомлений */}
            <FlatList
                data={filteredNotifications}
                renderItem={renderNotificationItem}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={renderEmptyList}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

// Вспомогательные функции для преобразования Tailwind классов в цвета
const getBackgroundColor = (twClass: string) => {
    const colors: Record<string, string> = {
        'bg-blue-50': '#EFF6FF',
        'bg-green-50': '#F0FDF4',
        'bg-orange-50': '#FFF7ED',
        'bg-red-50': '#FEF2F2',
        'bg-purple-50': '#FAF5FF',
        'bg-teal-50': '#F0FDFA',
    };
    return { backgroundColor: colors[twClass] || '#F3F4F6' };
};

const getIconColor = (twClass: string) => {
    const colors: Record<string, string> = {
        'text-blue-600': '#2563EB',
        'text-green-600': '#16A34A',
        'text-orange-600': '#EA580C',
        'text-red-600': '#DC2626',
        'text-purple-600': '#9333EA',
        'text-teal-600': '#0D9488',
    };
    return colors[twClass] || '#6B7280';
};
