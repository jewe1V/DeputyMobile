import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6', // Светлый нейтральный фон
    },
    backgroundAccent: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '45%', // Немного увеличил для лучшего охвата хедера
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    header: {
        alignItems: 'center',
        paddingTop: 80,
        paddingBottom: 30,
        paddingHorizontal: 24,
    },
    emblemContainer: {
        width: 90,
        height: 90,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        // Тень должна быть темной, чтобы выделяться на фоне градиента
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    emblem: {
        width: '100%',
        height: '100%',
    },
    subtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.85)', // Белый с легкой прозрачностью для иерархии
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#ffffff', // Теперь четко видно на зеленом градиенте
        textAlign: 'center',
        lineHeight: 32,
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: 20,
        marginTop: -20, // Слегка "наплывает" на верхний блок
    },
    formCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 8,
    },
    inputWrapper: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151', // Темно-серый для отличной читаемости
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#F9FAFB', // Очень светлый серый
        borderWidth: 1.5,
        borderColor: '#E5E7EB', // Видимая граница в обычном состоянии
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: '#111827', // Почти черный текст ввода
    },
    inputFocused: {
        borderColor: '#095a25', // Акцентная рамка при фокусе
        backgroundColor: '#ffffff', // Белый фон при фокусе для контраста
        // Убрал заливку фона зеленым, так как текст стал бы нечитаемым
    },
    loginButton: {
        backgroundColor: '#095a25',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: '#095a25',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    disabledButton: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0,
        elevation: 0,
    },
    loginButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    supportButton: {
        alignItems: 'center',
        marginTop: 16,
    },
    supportButtonText: {
        color: "#858585",
        fontSize: 14,
        fontWeight: '500',
    },
});
