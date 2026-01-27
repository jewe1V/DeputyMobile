import {Text, TouchableOpacity, View} from "react-native";
import {Clock} from "lucide-react-native";
import React from "react";
import {Task} from "@/data/types";
import {styles} from "@/components/TaskBoard/style";

interface TaskCardProps {
    task: Task;
    onPress: (taskId: string) => void;
}

const priorityConfig = {
    low: { label: 'Низкий', color: '#6b7280', bgColor: '#f3f4f6' },
    medium: { label: 'Средний', color: '#3b82f6', bgColor: '#dbeafe' },
    high: { label: 'Высокий', color: '#f97316', bgColor: '#ffedd5' },
    urgent: { label: 'Срочный', color: '#ef4444', bgColor: '#fee2e2' },
};

export function TaskCard({ task, onPress }: TaskCardProps) {
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysLeft < 0 && task.status !== 'completed';
    const isUrgent = daysLeft <= 2 && daysLeft >= 0 && task.status !== 'completed';

    const getTimeColor = () => {
        if (isOverdue) return '#ef4444';
        if (isUrgent) return '#f97316';
        return '#6b7280';
    };

    return (
        <TouchableOpacity
            style={styles.taskCard}
            onPress={() => onPress(task.id)}
            activeOpacity={0.7}
        >
            <View style={styles.taskHeader}>
                <Text style={styles.taskTitle} numberOfLines={2}>
                    {task.title}
                </Text>
                <View style={[
                    styles.priorityBadge,
                    { backgroundColor: priorityConfig[task.priority].bgColor }
                ]}>
                    <Text style={[
                        styles.priorityText,
                        { color: priorityConfig[task.priority].color }
                    ]}>
                        {priorityConfig[task.priority].label}
                    </Text>
                </View>
            </View>

            <Text style={styles.taskDescription} numberOfLines={2}>
                {task.description}
            </Text>

            <View style={styles.taskFooter}>
                <Text style={styles.assigneeText}>
                    {task.assignedToProfile?.fullName.split(' ')[0]}
                </Text>
                <View style={styles.timeContainer}>
                    <Clock size={12} color={getTimeColor()} />
                    <Text style={[styles.timeText, { color: getTimeColor() }]}>
                        {isOverdue
                            ? `Просрочено (${Math.abs(daysLeft)} дн.)`
                            : daysLeft === 0
                                ? 'Сегодня'
                                : `${daysLeft} дн.`}
                    </Text>
                </View>
            </View>

            {task.tags && task.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                    {task.tags.slice(0, 2).map((tag) => (
                        <View key={tag} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                        </View>
                    ))}
                </View>
            )}
        </TouchableOpacity>
    );
}
