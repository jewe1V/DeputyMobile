import {Platform, StyleSheet} from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        paddingBottom: 22,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 70 : 50,
    },
    headerContent: {
        flex: 1,
        marginLeft: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 1,
    },
    headerButtonsContainer: {
        flexDirection: 'row',
        gap: 15,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: "auto"
    },
    breadcrumb: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    breadcrumbButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    breadcrumbText: {
        fontSize: 14,
        color: '#2A6E3F',
    },
    breadcrumbCurrent: {
        fontSize: 14,
        color: '#1f2937',
        fontWeight: '500',
    },
    searchContainer: {
        backgroundColor: '#ffffff',
        padding: 12,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 14,
        color: '#1f2937',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
        marginBottom: 12,
        paddingLeft: 4,
    },
    catalogList: {
        gap: 8,
    },
    catalogItem: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 16,
    },
    catalogContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    catalogIconContainer: {
        width: 48,
        height: 48,
        backgroundColor: 'rgba(42, 110, 63, 0.1)',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    catalogInfo: {
        flex: 1,
    },
    catalogName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1f2937',
        marginBottom: 4,
    },
    catalogCount: {
        fontSize: 14,
        color: '#6b7280',
    },
    documentList: {
        gap: 8,
    },
    documentItem: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 16,
    },
    documentContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    documentIconContainer: {
        width: 48,
        height: 48,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    documentInfo: {
        flex: 1,
        minWidth: 0,
    },
    documentName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1f2937',
        marginBottom: 4,
    },
    documentMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 4,
    },
    documentMetaText: {
        fontSize: 12,
        color: '#6b7280',
    },
    documentMetaDot: {
        fontSize: 12,
        color: '#6b7280',
    },
    documentActions: {
        flexDirection: 'row',
        gap: 4,
    },
    documentActionButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyStateIcon: {
        width: 64,
        height: 64,
        backgroundColor: '#f3f4f6',
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    emptyStateTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#6b7280',
        marginBottom: 4,
    },
    emptyStateSubtitle: {
        fontSize: 14,
        color: '#9ca3af',
    },
    fab: {
        position: 'absolute',
        bottom: 80,
        right: 16,
        width: 56,
        height: 56,
        backgroundColor: '#2A6E3F',
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});
