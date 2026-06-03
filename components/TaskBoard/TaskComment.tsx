// components/TaskComment.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { User, Trash2 } from 'lucide-react-native';
import { AuthManager } from '@/api/auth';
import { TaskComment } from './TaskDetail';
import { useTheme } from '@/context/ThemeContext';

interface TaskCommentProps {
    comment: TaskComment;
    onDelete: (commentId: string) => void;
    isDeleting?: boolean;
}

export const TaskCommentComponent: React.FC<TaskCommentProps> = ({
                                                                     comment,
                                                                     onDelete,
                                                                     isDeleting = false,
                                                                 }) => {
    const { colors, isDark } = useTheme();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const userId = AuthManager.getUserId();
    const userRole = AuthManager.getRole();

    const canDelete = userRole === 'Admin' || userId === comment.author_id;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Только что';
        if (diffMins < 60) return `${diffMins} мин. назад`;
        if (diffHours < 24) return `${diffHours} ч. назад`;
        if (diffDays === 1) return 'Вчера';
        if (diffDays < 7) return `${diffDays} дн. назад`;

        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDeletePress = () => {
        if (Platform.OS === 'web') {
            if (window.confirm('Удалить комментарий?')) {
                onDelete(comment.id);
            }
        } else {
            Alert.alert(
                'Удаление комментария',
                'Вы уверены, что хотите удалить этот комментарий?',
                [
                    { text: 'Отмена', style: 'cancel' },
                    {
                        text: 'Удалить',
                        style: 'destructive',
                        onPress: () => onDelete(comment.id)
                    }
                ]
            );
        }
    };

    const getInitials = (name: string) => {
        return name?.charAt(0)?.toUpperCase() || '?';
    };

    const getAvatarColor = (email: string) => {
        const colors = ['#2A6E3F', '#349339', '#166534', '#14532d', '#15803d'];
        const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    const avatarColor = getAvatarColor(comment.author?.email || comment.author_id);

    return (
        <View style={[styles.commentContainer, { backgroundColor: isDark ? colors.card : '#ffffff', borderColor: colors.border, shadowOpacity: isDark ? 0 : 0.05 }]}>
            <View style={styles.commentAvatar}>
                <View style={[styles.commentAvatarCircle, { backgroundColor: avatarColor + (isDark ? '40' : '20') }]}>
                    <Text style={[styles.commentAvatarText, { color: isDark ? '#fff' : avatarColor }]}>
                        {getInitials(comment.author?.full_name || comment.author?.email || 'П')}
                    </Text>
                </View>
            </View>

            <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                    <Text style={[styles.commentAuthor, { color: colors.text }]}>
                        {comment.author?.full_name || comment.author?.email || 'Пользователь'}
                    </Text>
                    <Text style={[styles.commentDate, { color: colors.subtext }]}>{formatDate(comment.date)}</Text>

                    {canDelete && (
                        <TouchableOpacity
                            style={styles.commentDeleteBtn}
                            onPress={handleDeletePress}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <ActivityIndicator size="small" color="#ef4444" />
                            ) : (
                                <Trash2 size={16} color={colors.subtext} />
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={[styles.commentText, { color: isDark ? colors.subtext : '#475569' }]}>{comment.text}</Text>
            </View>
        </View>
    );
};

const styles = {
    commentContainer: {
        flexDirection: 'row' as const,
        marginBottom: 20,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    commentAvatar: {
        marginRight: 12,
    },
    commentAvatarCircle: {
        width: 48,
        height: 48,
        borderRadius: "50%",
        justifyContent: 'center',
        alignItems: 'center',
    },
    commentAvatarText: {
        fontSize: 16,
        fontWeight: '600',
    },
    commentContent: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        gap: 8,
    },
    commentAuthor: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    commentDate: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 2,
    },
    commentDeleteBtn: {
        marginLeft: 'auto',
        padding: 4,
    },
    commentText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
        marginTop: -6,
        marginBottom: 6,
    },
    commentJobTitle: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 4,
    },
};
