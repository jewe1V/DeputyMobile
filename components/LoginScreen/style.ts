import {StyleSheet} from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    header: {
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 40,
    },
    emblem: {
        width: 80,
        height: 80,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontFamily: 'PlayfairDisplay_700Bold',
        color: '#1F2937',
        textAlign: 'center',
    },
    form: {
        paddingHorizontal: 24,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
        marginBottom: 16,
        color: '#1F2937',
    },
    loginButton: {
        backgroundColor: '#0f6219',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    disabledButton: {
        backgroundColor: '#9CA3AF',
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
    },
    guestButton: {
        backgroundColor: 'transparent',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    guestButtonText: {
        color: '#6B7280',
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
    },
});
