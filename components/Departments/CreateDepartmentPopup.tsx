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
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CreateDepartmentPopupProps {
    visible: boolean;
    onClose: () => void;
    onCreate: (name: string) => Promise<void>;
    loading: boolean;
}

export const CreateDepartmentPopup: React.FC<CreateDepartmentPopupProps> = ({
                                                                                visible,
                                                                                onClose,
                                                                                onCreate,
                                                                                loading
                                                                            }) => {
    const insets = useSafeAreaInsets();
    const [name, setName] = useState('');

    const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;
    const START_Y = SCREEN_HEIGHT - SHEET_HEIGHT;

    const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    const resetPositionAnim = Animated.timing(panY, {
        toValue: START_Y,
        duration: 300,
        useNativeDriver: false,
    });

    const closeAnim = (callback?: () => void) => Animated.timing(panY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: false,
    }).start(callback);

    const handleClose = () => {
        closeAnim(() => {
            setName('');
            onClose();
        });
    };

    const handleCreate = async () => {
        if (!name.trim()) return;
        await onCreate(name);
        // Закрываем только после успешного создания (вызывается в родителе)
        handleClose();
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy < 0) return; // Не даем тянуть вверх выше лимита
                panY.setValue(START_Y + gestureState.dy);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100) {
                    handleClose();
                } else {
                    resetPositionAnim.start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            resetPositionAnim.start();
        }
    }, [visible]);

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.overlay}>
                    <TouchableOpacity
                        style={styles.dismiss}
                        activeOpacity={1}
                        onPress={handleClose}
                    />

                    <Animated.View
                        style={[
                            styles.sheet,
                            {
                                transform: [{ translateY: panY }],
                                paddingBottom: insets.bottom + 20,
                                height: SHEET_HEIGHT
                            }
                        ]}
                    >
                        <View {...panResponder.panHandlers} style={styles.dragArea}>
                            <View style={styles.dragIndicator} />
                            <Text style={styles.title}>Новый отдел</Text>
                        </View>

                        <View style={styles.content}>
                            <TextInput
                                style={styles.input}
                                placeholder="Название подразделения"
                                value={name}
                                onChangeText={setName}
                                autoFocus
                                placeholderTextColor="#94a3b8"
                            />

                            <TouchableOpacity
                                style={[styles.submitButton, !name.trim() && styles.disabledButton]}
                                onPress={handleCreate}
                                disabled={loading || !name.trim()}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : ( <Text style={styles.submitText}>Создать</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    dismiss: {
        flex: 1,
    },
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
    },
    dragArea: {
        paddingTop: 12,
        paddingBottom: 20,
        alignItems: 'center',
    },
    dragIndicator: {
        width: 38,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
    },
    content: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        padding: 10,
        fontSize: 16,
        color: '#1e293b',
        marginBottom: 24,
    },
    submitButton: {
        backgroundColor: '#2A6E3F',
        borderRadius: 16,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    disabledButton: {
        backgroundColor: '#94a3b8',
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
