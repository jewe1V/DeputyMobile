import {StyleSheet} from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 10,
        justifyContent: 'space-between',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 12,
    },
    addButton: {
        backgroundColor: '#0f6319',
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 32,
    },
    emptyText: {
        textAlign: 'center',
        color: '#6b7280',
        fontSize: 15,
        marginTop: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cardTitle: {
        fontSize: 15,
        fontFamily: 'Inter_600SemiBold',
        color: '#0b2340',
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: 16,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: 'PlayfairDisplay_700Bold',
        marginBottom: 12,
        color: '#0b2340',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        padding: 10,
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        marginBottom: 16,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    modalBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginLeft: 8,
    },
    modalCancel: {
        backgroundColor: '#e5e7eb',
    },
    modalSave: {
        backgroundColor: '#0f6319',
    },
    modalBtnText: {
        fontFamily: 'Inter_600SemiBold',
        color: '#0b2340',
    },
});
