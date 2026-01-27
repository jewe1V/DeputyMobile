import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
    ArrowLeft,
    Calendar,
    Clock,
    Tag,
    Edit,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Circle,
} from 'lucide-react-native';
import { mockTasks } from '@/data/mockData';

const statusConfig = {
    created: {
        label: 'Создана',
        icon: Circle,
        color: '#d1d5db',
        bgColor: '#f3f4f6',
        textColor: '#374151',
    },
    in_progress: {
        label: 'В работе',
        icon: Clock,
        color: '#3b82f6',
        bgColor: '#dbeafe',
        textColor: '#1e40af',
    },
    approval: {
        label: 'На согласовании',
        icon: AlertCircle,
        color: '#f59e0b',
        bgColor: '#fef3c7',
        textColor: '#92400e',
    },
    completed: {
        label: 'Завершена',
        icon: CheckCircle2,
        color: '#10b981',
        bgColor: '#d1fae5',
        textColor: '#065f46',
    },
};

const priorityConfig = {
    low: { label: 'Низкий', bgColor: '#f3f4f6', textColor: '#4b5563' },
    medium: { label: 'Средний', bgColor: '#dbeafe', textColor: '#1d4ed8' },
    high: { label: 'Высокий', bgColor: '#fed7aa', textColor: '#c2410c' },
    urgent: { label: 'Срочный', bgColor: '#fecaca', textColor: '#dc2626' },
};

export default function TaskDetail() {
    const { taskId } = useLocalSearchParams<{ taskId: string }>();
    const insets = useSafeAreaInsets();

    const task = mockTasks.find((t) => t.id === taskId);

    if (!task) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <View style={{ padding: 4 }}>
                            <ArrowLeft size={20} color="#000" />
                        </View>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 18, fontWeight: '600' }}>Задача не найдена</Text>
                </View>
            </SafeAreaView>
        );
    }

    const StatusIcon = statusConfig[task.status].icon;
    const dueDate = new Date(task.dueDate);
    const createdDate = new Date(task.createdAt);
    const today = new Date();
    const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysLeft < 0 && task.status !== 'completed';
    const isUrgent = daysLeft <= 2 && daysLeft >= 0 && task.status !== 'completed';

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name[0];
    };

    const handleDelete = () => {
        Alert.alert(
            'Удалить задачу',
            'Вы уверены, что хотите удалить эту задачу? Это действие нельзя отменить.',
            [
                { text: 'Отмена', style: 'cancel' },
                { text: 'Удалить', style: 'destructive', onPress: () => {
                        // Здесь будет логика удаления
                        router.back();
                    }},
            ]
        );
    };

    const handleMarkComplete = () => {
        // Здесь будет логика изменения статуса задачи
        Alert.alert('Задача завершена', 'Задача отмечена как завершенная');
    };

    const formatDateTime = (date: Date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleDateString('ru-RU', { month: 'long' });
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${day} ${month} ${year}, ${hours}:${minutes}`;
    };

    return (
        <View style={{ flex: 1, backgroundColor: 'white', paddingTop: insets.top }}>
            {/* Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 16,
                backgroundColor: '#0f6319',
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255, 255, 255, 0.2)',
            }}>
                <TouchableOpacity onPress={() => router.back()}>
                    <View style={{ padding: 4 }}>
                        <ArrowLeft size={20} color="white" />
                    </View>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '600', color: 'white' }}>
                        Детали задачи
                    </Text>
                </View>
                <TouchableOpacity onPress={() => router.push(`/(screens)/TaskEdit?taskId=${task.id}`)}>
                    <View style={{ padding: 4 }}>
                        <Edit size={20} color="white" />
                    </View>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={{ flex: 1 }}>
                <View style={{ padding: 16, gap: 20 }}>
                    {/* Title and Priority */}
                    <View>
                        <View style={{ marginBottom: 12 }}>
                            <Text style={{ fontSize: 20, fontWeight: '600', flex: 1 }}>
                                {task.title}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 20,
                                borderWidth: 1,
                                borderColor: statusConfig[task.status].color,
                                backgroundColor: statusConfig[task.status].bgColor,
                            }}>
                                <StatusIcon size={12} color={statusConfig[task.status].textColor} />
                                <Text style={{ fontSize: 12, color: statusConfig[task.status].textColor }}>
                                    {statusConfig[task.status].label}
                                </Text>
                            </View>
                            <View style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 20,
                                borderWidth: 1,
                                borderColor: priorityConfig[task.priority].textColor,
                                backgroundColor: priorityConfig[task.priority].bgColor,
                            }}>
                                <Text style={{ fontSize: 12, color: priorityConfig[task.priority].textColor }}>
                                    {priorityConfig[task.priority].label}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={{ height: 1, backgroundColor: '#e5e7eb' }} />

                    {/* Description */}
                    <View>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                            Описание
                        </Text>
                        <Text style={{ fontSize: 14, color: '#4b5563' }}>{task.description}</Text>
                    </View>

                    <View style={{ height: 1, backgroundColor: '#e5e7eb' }} />

                    {/* Timeline */}
                    <View style={{ gap: 12 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                            Сроки
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                                <Calendar size={16} color="#4b5563" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 12, color: '#6b7280' }}>Создана</Text>
                                <Text style={{ fontSize: 14 }}>{formatDateTime(createdDate)}</Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                backgroundColor: isOverdue ? '#fef2f2' : isUrgent ? '#ffedd5' : '#eff6ff',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Clock size={16} color={isOverdue ? '#dc2626' : isUrgent ? '#f97316' : '#3b82f6'} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 12, color: '#6b7280' }}>Срок выполнения</Text>
                                <Text style={{ fontSize: 14 }}>{formatDateTime(dueDate)}</Text>
                                <Text style={{
                                    fontSize: 12,
                                    color: isOverdue ? '#dc2626' : isUrgent ? '#f97316' : '#6b7280',
                                }}>
                                    {isOverdue
                                        ? `Просрочено на ${Math.abs(daysLeft)} дн.`
                                        : daysLeft === 0
                                            ? 'Сегодня'
                                            : `Осталось ${daysLeft} дн.`}
                                </Text>
                            </View>
                        </View>

                        {task.completedAt && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCircle2 size={16} color="#10b981" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Завершена</Text>
                                    <Text style={{ fontSize: 14 }}>{formatDateTime(new Date(task.completedAt))}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    <View style={{ height: 1, backgroundColor: '#e5e7eb' }} />

                    {/* Participants */}
                    <View style={{ gap: 12 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                            Участники
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#0f6319', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: 'white' }}>
                                    {getInitials(task.assignedToProfile?.fullName || '')}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '500' }}>{task.assignedToProfile?.fullName}</Text>
                                <Text style={{ fontSize: 12, color: '#6b7280' }}>Исполнитель</Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#4b5563' }}>
                                    {getInitials(task.createdByProfile?.fullName || '')}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '500' }}>{task.createdByProfile?.fullName}</Text>
                                <Text style={{ fontSize: 12, color: '#6b7280' }}>Постановщик</Text>
                            </View>
                        </View>
                    </View>

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                        <>
                            <View style={{ height: 1, backgroundColor: '#e5e7eb' }} />
                            <View>
                                <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                                    Теги
                                </Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                    {task.tags.map((tag) => (
                                        <View
                                            key={tag}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 4,
                                                backgroundColor: '#f3f4f6',
                                                paddingHorizontal: 12,
                                                paddingVertical: 6,
                                                borderRadius: 16,
                                            }}
                                        >
                                            <Tag size={12} color="#4b5563" />
                                            <Text style={{ fontSize: 12, color: '#374151' }}>{tag}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>

            {/* Actions */}
            <View style={{
                padding: 16,
                borderTopWidth: 1,
                borderTopColor: '#e5e7eb',
                paddingBottom: insets.bottom + 16,
                gap: 8,
            }}>
                {task.status !== 'completed' && (
                    <TouchableOpacity
                        onPress={handleMarkComplete}
                        style={{
                            backgroundColor: '#0f6319',
                            paddingVertical: 12,
                            borderRadius: 8,
                            alignItems: 'center',
                            flexDirection: 'row',
                            justifyContent: 'center',
                        }}
                    >
                        <CheckCircle2 size={16} color="white" style={{ marginRight: 8 }} />
                        <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>
                            Отметить как завершенную
                        </Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    onPress={handleDelete}
                    style={{
                        paddingVertical: 12,
                        borderRadius: 8,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#dc2626',
                        flexDirection: 'row',
                        justifyContent: 'center',
                    }}
                >
                    <Trash2 size={16} color="#dc2626" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#dc2626', fontSize: 14, fontWeight: '500' }}>
                        Удалить задачу
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
