import {Task, TaskStatus} from "@/data/types";
import {ScrollView, Text, View} from "react-native";
import React from "react";
import {styles} from "@/components/TaskBoard/style";
import {AlertCircle, CheckCircle2, Circle, Clock} from "lucide-react-native";
import {TaskCard} from "@/components/TaskBoard/TaskCard";

export const statusConfig: Record<TaskStatus, {
    label: string;
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
}> = {
    created: {
        label: 'Создана',
        icon: Circle,
        color: '#6b7280',
        bgColor: '#f3f4f6',
    },
    in_progress: {
        label: 'В работе',
        icon: Clock,
        color: '#3b82f6',
        bgColor: '#dbeafe',
    },
    approval: {
        label: 'На согласовании',
        icon: AlertCircle,
        color: '#f59e0b',
        bgColor: '#fef3c7',
    },
    completed: {
        label: 'Завершена',
        icon: CheckCircle2,
        color: '#10b981',
        bgColor: '#d1fae5',
    },
};

interface StatusColumnProps {
    status: TaskStatus;
    tasks: Task[];
    onTaskPress: (taskId: string) => void;
}

export function StatusColumn({ status, tasks, onTaskPress }: StatusColumnProps) {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <View style={styles.statusColumn}>
            <View style={styles.columnHeader}>
                <View style={styles.columnTitle}>
                    <Icon size={16} color={config.color} />
                    <Text style={styles.columnLabel}>{config.label}</Text>
                </View>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{tasks.length}</Text>
                </View>
            </View>

            <ScrollView style={styles.tasksList} showsVerticalScrollIndicator={false}>
                {tasks.length > 0 ? (
                    tasks.map((task) => (
                        <TaskCard key={task.id} task={task} onPress={onTaskPress} />
                    ))
                ) : (
                    <View style={styles.emptyColumn}>
                        <Text style={styles.emptyText}>Задач нет</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
