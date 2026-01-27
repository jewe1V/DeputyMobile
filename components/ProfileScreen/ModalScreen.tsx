import React, { useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    ActivityIndicator
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ModalScreenProps } from "@/models/Event";
import { getDisplayDate } from "@/utils";
import { AuthTokenManager } from '@/components/LoginScreen/LoginScreen';
import { Ionicons } from '@expo/vector-icons';
import {apiUrl} from "@/api/api";

export const ModalScreen: React.FC<ModalScreenProps> = ({
                                                            modalPost,
                                                            onClose,
                                                            onPostDelete
                                                        }) => {
    const insets = useSafeAreaInsets();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!modalPost) return;

        // Проверяем авторизацию
        const token = AuthTokenManager.getToken();
        if (!token) {
            Alert.alert('Ошибка', 'Для удаления поста необходимо авторизоваться');
            return;
        }

        Alert.alert(
            'Удаление поста',
            'Вы уверены, что хотите удалить этот пост? Это действие нельзя отменить.',
            [
                {
                    text: 'Отмена',
                    style: 'cancel',
                },
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            const response = await fetch(`${apiUrl}/api/Posts/${modalPost.id}`, {
                                method: 'DELETE',
                                headers: {
                                    'accept': '*/*',
                                    'Authorization': `Bearer ${token}`,
                                },
                            });

                            if (response.ok) {
                                if (onPostDelete) {
                                    onPostDelete(modalPost.id);
                                }
                                // Закрываем модальное окно
                                onClose();
                            } else if (response.status === 401) {
                                Alert.alert('Ошибка', 'Недостаточно прав для удаления поста');
                            } else if (response.status === 404) {
                                Alert.alert('Ошибка', 'Пост не найден');
                            } else {
                                throw new Error(`Ошибка сервера: ${response.status}`);
                            }
                        } catch (error) {
                            console.error('Ошибка при удалении поста:', error);
                            Alert.alert('Ошибка', 'Не удалось удалить пост. Попробуйте позже.');
                        } finally {
                            setIsDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    const canDeletePost = () => {
        // Проверяем, может ли текущий пользователь удалить пост
        // Можно добавить дополнительную логику проверки прав
        return AuthTokenManager.isTokenValid() && modalPost !== null;
    };

    return (
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
            <View style={styles.modalHeader}>
                <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                    <Ionicons name="chevron-back" size={24} color="#0a58ff" />
                </TouchableOpacity>

                <View style={{ flex: 1 }} />

                {modalPost && (
                    <View style={styles.headerActions}>
                        {canDeletePost() && (
                            <TouchableOpacity
                                onPress={handleDelete}
                                disabled={isDeleting}
                                style={[styles.headerButton, isDeleting && styles.disabledButton]}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator size="small" color="#dc2626" />
                                ) : (
                                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>

            {modalPost && (
                <ScrollView
                    contentContainerStyle={{ padding: 18 }}
                    showsVerticalScrollIndicator={false}
                >
                    {modalPost.thumbnailUrl && (
                        <Image
                            source={{ uri: modalPost.thumbnailUrl }}
                            style={styles.modalImage}
                            resizeMode="cover"
                        />
                    )}

                    <Text style={styles.modalTitle}>{modalPost.title}</Text>

                    <Text style={styles.modalDate}>
                        {getDisplayDate(modalPost)}
                    </Text>

                    <Text style={styles.modalBody}>{modalPost.body}</Text>
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        backgroundColor: '#f6f7fb'
    },
    loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f6f7fb'
    },
    header: {
        marginTop: 12,
        marginBottom: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    emblem: {
        width: 52,
        height: 52,
        marginRight: 12
    },
    hTitle: {
        fontSize: 18,
        fontFamily: 'PlayfairDisplay_700Bold',
        color: '#0b2340'
    },
    hSub: {
        fontSize: 12,
        color: '#6b7280',
        fontFamily: 'Inter_400Regular'
    },
    headerDot: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff'
    },

    /* modal */
    modalContainer: {
        flex: 1,
        backgroundColor: '#fff'
    },
    modalHeader: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerButton: {
        padding: 8,
        borderRadius: 8,
    },
    modalClose: {
        fontSize: 22,
        color: '#0f6319'
    },
    modalShare: {
        fontSize: 20,
        color: '#0f6219'
    },
    modalImage: {
        width: '100%',
        height: 220,
        borderRadius: 12,
        marginBottom: 16
    },
    modalCate: {
        fontSize: 13,
        color: '#0f6018',
        marginBottom: 8,
        fontFamily: 'Inter_600SemiBold'
    },
    modalTitle: {
        fontSize: 28,
        marginBottom: 8,
        fontFamily: 'PlayfairDisplay_700Bold',
        color: '#0b2140'
    },
    modalDate: {
        fontSize: 12,
        color: '#7b8794',
        marginBottom: 12,
        fontFamily: 'Inter_400Regular'
    },
    modalBody: {
        fontSize: 16,
        color: '#344054',
        lineHeight: 22,
        fontFamily: 'Inter_400Regular',
        marginBottom: 20,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#dc2626',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
        marginTop: 10,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
    },
    disabledButton: {
        opacity: 0.6,
    },

    bottomNav: {
        position: 'absolute',
        left: 16,
        right: 16,
        height: 66,
        backgroundColor: '#fff',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
    },
    navItem: {
        alignItems: 'center'
    },
    navText: {
        fontSize: 13,
        color: '#6b7280',
        fontFamily: 'Inter_400Regular'
    },
    navActive: {
        color: '#28954a',
        fontFamily: 'Inter_600SemiBold'
    },
});
