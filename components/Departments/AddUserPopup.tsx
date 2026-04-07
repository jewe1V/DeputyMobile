import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    PanResponder,
    Dimensions,
    FlatList,
    ActivityIndicator,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Profile } from "@/models/ProfileModel";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AddUserPopupProps {
    visible: boolean;
    onClose: () => void;
    availableUsers: Profile[];
    onAdd: (userId: string) => void;
    loading: boolean;
}

export const AddUserPopup: React.FC<AddUserPopupProps> = ({
                                                              visible,
                                                              onClose,
                                                              availableUsers,
                                                              onAdd,
                                                              loading
                                                          }) => {
    const insets = useSafeAreaInsets();

    // Шторка на 80% высоты экрана
    const SHEET_HEIGHT = SCREEN_HEIGHT * 0.8;
    const panY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

    const openAnim = Animated.timing(panY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
    });

    const closeAnim = (callback?: () => void) => Animated.timing(panY, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
    }).start(callback);

    const handleClose = () => {
        closeAnim(onClose);
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Разрешаем жест только если тянут вниз и список в самом верху
                return gestureState.dy > 5;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy < 0) return;
                panY.setValue(gestureState.dy);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 150) {
                    handleClose();
                } else {
                    openAnim.start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            openAnim.start();
        }
    }, [visible]);

    const renderItem = ({ item }: { item: Profile }) => (
        <TouchableOpacity
            style={styles.userCard}
            onPress={() => onAdd(item.id)}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {(item.full_name || item.email || '?').charAt(0).toUpperCase()}
                </Text>
            </View>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.full_name || 'Без имени'}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
            </View>
            <Ionicons name="add-circle-outline" size={26} color="#2A6E3F" />
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.dismiss} activeOpacity={1} onPress={handleClose} />

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <Animated.View
                        style={[
                            styles.sheet,
                            {
                                transform: [{ translateY: panY }],
                                height: SHEET_HEIGHT,
                                paddingBottom: insets.bottom
                            }
                        ]}
                    >
                        <View {...panResponder.panHandlers} style={styles.dragArea}>
                            <View style={styles.dragIndicator} />
                            <Text style={styles.title}>Добавить сотрудника</Text>
                        </View>

                        <View style={styles.content}>
                            {availableUsers.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="people-outline" size={48} color="#94a3b8" />
                                    <Text style={styles.emptyText}>Нет доступных пользователей</Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={availableUsers}
                                    keyExtractor={(item) => item.id}
                                    renderItem={renderItem}
                                    contentContainerStyle={styles.list}
                                    showsVerticalScrollIndicator={false}
                                />
                            )}
                        </View>

                        {loading && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color="#2A6E3F" />
                            </View>
                        )}
                    </Animated.View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    dismiss: {
        ...StyleSheet.absoluteFillObject,
    },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        width: '100%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
    },
    dragArea: {
        paddingTop: 12,
        paddingBottom: 16,
        alignItems: 'center',
    },
    dragIndicator: {
        width: 38,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        marginBottom: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    content: {
        flex: 1,
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ebfdeb',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#2A6E3F',
        fontWeight: '700',
        fontSize: 16,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
    },
    userEmail: {
        fontSize: 13,
        color: '#64748b',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    emptyText: {
        marginTop: 12,
        color: '#64748b',
        fontSize: 14,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    }
});
