import {Platform, StyleSheet} from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        backgroundColor: '#2A6E3F',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        paddingBottom: 32,
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,  // Не сжимается
    },
    headerTitleContainer: {
        flex: 1,  // Занимает доступное пространство
        marginRight: 12,
        marginLeft: 24,// Отступы от кнопок
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 40,  // Минимальная высота как у кнопок
    },
    taskTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 600,
        lineHeight: 24,
        maxWidth: '100%',
    },
    statusBadge: {
        marginTop: 8,
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#fdfffe',
    },
    statusBadgeText: {
        fontSize: 12,
        color: '#30823a',
    },

    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 24,
    },
    section: {
        backgroundColor: '#FFFFFF',
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#272c33',
        marginBottom: 12,
    },
    statusGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusButton: {
        flex: 1,
        minWidth: '45%',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    metadataItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    priorityDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    metadataContent: {
        flex: 1,
    },
    metadataLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    metadataValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    metadataRow: {
        gap: 16,
    },
    dateItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    dateContent: {
        flex: 1,
    },
    dateLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    dateValue: {
        fontSize: 14,
        color: '#111827',
        lineHeight: 20,
    },
    overdueText: {
        color: '#DC2626',
        fontWeight: '500',
    },
    overdueDays: {
        fontSize: 12,
        color: '#DC2626',
    },
    descriptionText: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    participantsContainer: {
        gap: 16,
    },
    participantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    participantInfo: {
        flex: 1,
    },
    participantName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 2,
    },
    participantRole: {
        fontSize: 12,
        color: '#6B7280',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tagItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#374151',
    },
    commentsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    commentsPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    commentsPlaceholderTitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 12,
        marginBottom: 4,
    },
    commentsPlaceholderSubtitle: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    bottomSpacer: {
        height: 80,
    },
    actionsContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    deleteButton: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FCA5A5',
    },
    deleteButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#DC2626',
        marginLeft: 8,
    },
});
