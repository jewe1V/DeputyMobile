import React, {useState, useEffect, useMemo} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
    ArrowLeft,
    Bell,
    Calendar,
    ClipboardList,
} from 'lucide-react-native';
import { styles } from './notifications-page';
import { router } from 'expo-router';
import { LinearGradient } from "expo-linear-gradient";
import { Select } from "@/components/ui/Select";
import { AuthTokenManager } from "@/components/LoginScreen/LoginScreen";
import {Notification, NotificationType} from "@/models/NotificationModel";
import {apiUrl} from "@/api/api"

const notificationConfig: Record<NotificationType, { icon: any; iconColor: string }> = {
    Task: {
        icon: ClipboardList,
        iconColor: '#268356',
    },
    Event: {
        icon: Calendar,
        iconColor: '#8B5CF6',
    },
};

const filterOptions = [
    { label: 'Все уведомления', value: 'all' },
    { label: 'Задачи', value: 'Task' },
    { label: 'События', value: 'Event' },
];

export function Notifications() {
    const navigation = useNavigation();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = async () => {
        try {
            setError(null);
            const token = await AuthTokenManager.getToken();

            if (!token) {
                throw new Error('Токен авторизации не найден');
            }

            const response = await fetch(`${apiUrl}/api/Notify/all`, {
                method: 'GET',
                headers: {
                    'accept': '*/*',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }

            const data: Notification[] = await response.json();

            setNotifications(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось загрузить уведомления');
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

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

    const handleNotificationClick = (notification: Notification) => {
        if (notification.notify_type === 'Task') {
            router.push('/TaskBoardScreen');
        } else if (notification.notify_type === 'Event') {
            router.push('/EventsScreen');
        } else {
            router.push({
                pathname: '/NotificationDetailScreen',
                params: { id: notification.id, notification: JSON.stringify(notification) }
            });
        }
    };

    const filteredNotifications = useMemo(() => {
        if (filterType === 'all') return notifications;
        return notifications.filter(n => n.notify_type === filterType);
    }, [notifications, filterType]);

    const renderNotificationItem = ({ item }: { item: Notification }) => {
        const config = notificationConfig[item.notify_type] || { icon: Bell, iconColor: '#9CA3AF' };
        const Icon = config.icon;

        return (
            <TouchableOpacity onPress={() => handleNotificationClick(item)} style={styles.notificationItem}>
                <View style={styles.notificationContent}>
                    <View style={styles.iconContainer}>
                        <Icon size={20} color={"#268356"} />
                    </View>

                    <View style={styles.textContainer}>
                        <View style={styles.headerRow}>
                            <Text style={styles.title}>{item.title}</Text>
                        </View>
                        <Text style={styles.message} numberOfLines={2}>
                            {typeof item.description === 'string' && item.description.startsWith('{')
                                ? 'Новое уведомление'
                                : item.description}
                        </Text>
                        <Text style={styles.time}>
                            {formatTime(item.notify_date)}
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

    const renderError = () => (
        <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
                <Text style={styles.retryButtonText}>Повторить</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2A6E3F" />
            </View>
        );
    }

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
                    </View>
                </View>
            </LinearGradient>

            {/* Фильтры */}
            <LinearGradient colors={['#ebfdeb', '#fff']} style={styles.filtersSection}>
                <View style={styles.filtersGrid}>
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
            {error ? renderError() : (
                <FlatList
                    data={filteredNotifications}
                    renderItem={renderNotificationItem}
                    keyExtractor={(item) => item.id}
                    ListEmptyComponent={renderEmptyList}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                />
            )}
        </View>
    );
}
