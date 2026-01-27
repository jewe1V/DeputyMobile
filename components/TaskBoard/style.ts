import {Dimensions, StyleSheet} from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: -10,
        justifyContent: 'space-between',
    },
    addButton: {
        padding: 8,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        marginHorizontal: 16,
        marginVertical: 12,
        borderRadius: 8,
        padding: 4,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    toggleButtonActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
    },
    toggleTextActive: {
        color: '#0f6319',
    },
    boardContainer: {
        flex: 1,
    },
    boardContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    statusColumn: {
        width: Dimensions.get('window').width * 0.8,
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        marginRight: 12,
        padding: 12,
    },
    columnHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    columnTitle: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    columnLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginLeft: 8,
    },
    countBadge: {
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    countText: {
        fontSize: 12,
        color: '#6b7280',
    },
    tasksList: {
        flex: 1,
    },
    emptyColumn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        fontSize: 14,
        color: '#9ca3af',
    },
    taskCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    taskTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
        marginRight: 8,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '500',
    },
    taskDescription: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 12,
        lineHeight: 16,
    },
    taskFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    assigneeText: {
        fontSize: 12,
        color: '#6b7280',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 12,
        marginLeft: 4,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    tag: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginRight: 4,
        marginBottom: 4,
    },
    tagText: {
        fontSize: 10,
        color: '#6b7280',
    },
    filterContainer: {
        backgroundColor: '#f9fafb',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    filterScroll: {
        flexDirection: 'row',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#d1d5db',
        marginRight: 8,
        backgroundColor: '#fff',
    },
    filterButtonActive: {
        backgroundColor: '#0f6319',
        borderColor: '#0f6319',
    },
    filterButtonText: {
        fontSize: 12,
        color: '#6b7280',
    },
    filterButtonTextActive: {
        color: '#fff',
        fontWeight: '500',
    },
    listContainer: {
        padding: 16,
    },
    listItem: {
        marginBottom: 12,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '500',
    },
    emptyList: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
    emptyListText: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 12,
    },
});
