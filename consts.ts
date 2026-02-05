import {TaskPriority, TaskStatus} from "@/data/types";

export const priorityConfig: Record<TaskPriority, { label: string; dotColor: string; textColor: string }> = {
    low: {
        label: 'Низкий',
        dotColor: '#9CA3AF', // gray-400
        textColor: '#6B7280', // gray-600
    },
    medium: {
        label: 'Средний',
        dotColor: '#3B82F6', // blue-500
        textColor: '#2563EB', // blue-600
    },
    high: {
        label: 'Высокий',
        dotColor: '#F97316', // orange-500
        textColor: '#EA580C', // orange-600
    },
    urgent: {
        label: 'Срочный',
        dotColor: '#EF4444', // red-500
        textColor: '#DC2626', // red-600
    },
};

export const statusConfig: Record<TaskStatus, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
    created: {
        label: 'Новая',
        bgColor: '#F3F4F6', // gray-100
        textColor: '#374151', // gray-700
        borderColor: '#D1D5DB', // gray-300
    },
    in_progress: {
        label: 'В работе',
        bgColor: '#DBEAFE', // blue-100
        textColor: '#1E40AF', // blue-700
        borderColor: '#93C5FD', // blue-300
    },
    approval: {
        label: 'На согласовании',
        bgColor: '#FEF3C7', // amber-100
        textColor: '#92400E', // amber-700
        borderColor: '#FCD34D', // amber-300
    },
    completed: {
        label: 'Завершена',
        bgColor: '#D1FAE5', // green-100
        textColor: '#065F46', // green-700
        borderColor: '#53c161', // green-300
    },
};
