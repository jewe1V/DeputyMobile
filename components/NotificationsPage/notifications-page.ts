import {Platform, StyleSheet} from "react-native";

export const styles = StyleSheet.create({
    container: {
          backgroundColor: '#ffffff',
    },
    header: {
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        paddingBottom: 32,
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
    },
    headerContent: {
        flexDirection: 'row',
        paddingHorizontal: 4,
    },
    headerTitleContainer: {
        marginRight: 12,
        marginLeft: 24,
        justifyContent: 'center',
        minHeight: 40,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 600,
        lineHeight: 24,
        maxWidth: '100%',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 1,
    },
    markAllButton: {
        marginLeft: "auto",
        paddingVertical: 6,
    },
    markAllText: {
        fontSize: 14,
        color: '#FFFFFF',
    },
    filtersSection: {
        padding: 12,
        marginTop: -24,
        borderRadius: 20,
        marginHorizontal: 15,
        backgroundColor: "transparent"
    },
    filtersHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    filtersGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    filterGroup: {
        flex: 1,
    },
    filterLabel: {
        fontSize: 14,
        color: '#333333', // gray-600
        marginBottom: 4,
    },
    selectContainer: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
    },
    selectValue: {
        fontSize: 14,
        color: '#374151',
    },
    filterScroll: {
        marginHorizontal: -16,
        paddingHorizontal: 16,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#2A6E3F',
    },
    filterChipText: {
        fontSize: 14,
        color: '#6B7280',
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },
    listContent: {
        flexGrow: 1,
    },
    notificationItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    unreadNotification: {
        backgroundColor: '#FFFFFF',
    },
    readNotification: {
        backgroundColor: '#F9FAFB',
    },
    notificationContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
        minWidth: 0,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    title: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
        marginRight: 8,
    },
    unreadTitle: {
        color: '#111827',
    },
    readTitle: {
        color: '#6B7280',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2A6E3F',
        marginTop: 4,
    },
    message: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
        lineHeight: 20,
    },
    time: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        paddingHorizontal: 32,
    },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#6B7280',
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
});
