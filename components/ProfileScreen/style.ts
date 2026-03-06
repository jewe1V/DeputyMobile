import {StyleSheet} from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginTop: 16,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    errorButton: {
        paddingHorizontal: 32,
    },
    header: {
        backgroundColor: '#2A6E3F',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 60,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    settingsButton: {
        padding: 8,
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: -40,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarContainer: {
        alignItems: 'center',
        marginTop: -44,
        marginBottom: 16,
    },
    avatarBase: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#2A6E3F',
        borderWidth: 4,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        // Стили переопределяются через avatarBase
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '600',
    },
    userInfo: {
        alignItems: 'center',
    },
    userName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    userTitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 16,
    },
    infoSection: {
        gap: 16,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 12,
    },
    infoIcon: {
        marginTop: 2,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
    },
    rolesCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    rolesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    rolesTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    rolesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    roleBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    roleText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#2A6E3F',
    },
    actionsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    actionsHeader: {
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    actionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
    },
    actionSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    logoutSection: {
        marginHorizontal: 16,
        marginTop: 24,
    },
    buttonBase: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderRadius: 8,
        paddingHorizontal: 16,
    },
    buttonDefault: {
        backgroundColor: '#2A6E3F',
    },
    buttonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    logoutButton: {
        borderColor: '#FECACA',
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#DC2626',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '500',
    },
});
