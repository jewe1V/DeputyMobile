import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        backgroundColor: '#0f6319',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#0f6319',
    },
    userDetails: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 16,
        color: 'white',
        fontWeight: '500',
    },
    userName: {
        fontSize: 18,
        color: 'white',
        fontWeight: '600',
    },
    userJob: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    content: {
        paddingHorizontal: 16,
        marginTop: -16,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    seeAllText: {
        fontSize: 14,
        color: '#0f6319',
        fontWeight: '500',
    },
    cardsContainer: {
        gap: 8,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cardMain: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 8,
    },
    cardTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '500',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeText: {
        fontSize: 12,
        color: '#6b7280',
    },
    overdueText: {
        color: '#dc2626',
        fontWeight: '500',
    },
    urgentText: {
        color: '#ea580c',
        fontWeight: '500',
    },
    eventDate: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: 'rgba(15, 99, 25, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    eventDateDay: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f6319',
    },
    eventDateMonth: {
        fontSize: 12,
        color: '#0f6319',
        textTransform: 'lowercase',
    },
    docIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    docInfo: {
        fontSize: 12,
        color: '#6b7280',
    },
    emptyCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    emptyText: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 8,
    },
    bottomSpacing: {
        height: 16,
    },
});
