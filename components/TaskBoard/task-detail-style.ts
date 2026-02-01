import {StyleSheet} from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        backgroundColor: '#2A6E3F',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    editButton: {
        padding: 8,
        marginLeft: 8,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 24,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        padding: 16,
    },
    taskTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
        lineHeight: 24,
    },
    statusBadgeContainer: {
        marginTop: 8,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 12,
    },
    statusGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
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
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        padding: 16,
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
