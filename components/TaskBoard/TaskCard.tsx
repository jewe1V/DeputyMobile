import React from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { Calendar, CircleDotDashed, Layers, Users } from "lucide-react-native";
import { Task } from "@/models/TaskBoardModel";
import { useTheme } from "@/context/ThemeContext";

interface TaskCardProps {
    task: Task;
    onPress: () => void;
}

const priorityConfig = {
    1: { label: 'Низкий' },
    2: { label: 'Средний' },
    3: { label: 'Высокий' },
    4: { label: 'Срочный' },
    5: { label: 'Критический' }
};

export function TaskCard({ task, onPress }: TaskCardProps) {
    const { colors, isDark } = useTheme();
    const expectedEndDate = new Date(task.expected_end_date);
    const isOverdue = new Date() > expectedEndDate && task.status !== 'completed';

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    };

    const priorityLabel = priorityConfig[task.priority as keyof typeof priorityConfig]?.label || 'medium';

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={styles.content}>
                <View style={styles.topRow}>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                        {task.title}
                    </Text>
                    <View style={[styles.deadlineBlock, isOverdue && styles.deadlineBlockOverdue, isOverdue && isDark && { backgroundColor: '#7f1d1d', borderColor: '#680e0e' }]}>
                        <Calendar size={12} color={isOverdue ? (isDark ? "#d6baba" : "#B91C1C") : colors.subtext} />
                        <Text style={[styles.deadlineText, { color: colors.subtext }, isOverdue && styles.deadlineTextOverdue, isOverdue && isDark && { color: "#d6baba" }]}>
                            {formatDate(expectedEndDate)}
                        </Text>
                    </View>
                </View>

                <Text style={[styles.description, { color: colors.subtext }]} numberOfLines={1}>
                    {task.description || "Нет описания задачи"}
                </Text>

                {/* Инфо-панель: теги переносятся, assignees всегда справа */}
                <View style={styles.infoPanel}>
                    <View style={styles.tagGroup}>
                        <View style={[styles.statusTag, { backgroundColor: isDark ? colors.primary + '20' : '#f0fdfd', borderColor: isDark ? colors.primary + '40' : '#DCFCE7' }]}>
                            <CircleDotDashed size={12} color={isDark ? colors.roleText : "#2A6E3F"} />
                            <Text style={[styles.statusLabel, { color: isDark ? colors.roleText : "#2a6e4f" }]}>
                                {task.status}
                            </Text>
                        </View>
                        <View style={[styles.priorityTag, { backgroundColor: isDark ? colors.primary + '20' : '#F0FDF4', borderColor: isDark ? colors.primary + '40' : '#DCFCE7' }]}>
                            <Layers size={12} color={isDark ? colors.roleText : "#2A6E3F"} />
                            <Text style={[styles.priorityLabel, { color: isDark ? colors.roleText : "#2A6E3F" }]} numberOfLines={1}>
                                {priorityLabel}
                            </Text>
                        </View>

                        {isOverdue && (
                            <View style={[styles.overdueTag, { backgroundColor: isDark ? '#334155' : '#F9FAFB', borderColor: colors.border }]}>
                                <Text style={[styles.overdueTagText, { color: colors.text }]}>просрочено</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.assignees}>
                        {task.users && task.users.length > 0 ? (
                            <View style={[styles.userBadge, { backgroundColor: isDark ? colors.iconBox : '#F3F4F6' }]}>
                                <Users size={12} color={colors.subtext} />
                                <Text style={[styles.userCount, { color: colors.text }]}>{task.users.length}</Text>
                            </View>
                        ) : (
                            <Text style={styles.noAssignee}>Не назначен</Text>
                        )}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        marginBottom: 8,
    },
    content: {
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
        marginRight: 10,
    },
    deadlineBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 6,
        borderRadius: 6,
    },
    deadlineText: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '500',
    },
    deadlineBlockOverdue: {
        backgroundColor: '#FEE2E2',
        borderColor: '#FECACA',
        borderWidth: 1,
    },
    deadlineTextOverdue: {
        color: '#B91C1C',
        fontWeight: '700',
    },
    description: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 10,
    },
    infoPanel: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'nowrap', // запрещаем перенос всей панели
    },
    tagGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap', // теги переносятся внутри этой группы
        gap: 6,
        rowGap: 6,
        flex: 1, // занимает всё доступное пространство
        marginRight: 8, // отступ от assignees
    },
    priorityTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    priorityLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#2A6E3F',
        textTransform: 'lowercase',
        flexShrink: 1, // обрезаем длинный текст
    },
    statusTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#f0fdfd',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    statusLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#2a6e4f',
        textTransform: 'lowercase',
    },
    overdueTag: {
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    overdueTagText: {
        fontSize: 11,
        color: '#374151',
        fontWeight: '600',
    },
    assignees: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 0, // НЕ сжимается, всегда справа
    },
    userBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    userCount: {
        fontSize: 11,
        fontWeight: '600',
        color: '#4B5563',
    },
    noAssignee: {
        fontSize: 11,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
    dateText: {
        fontSize: 12,
        color: '#2A6E3F',
    },
});
