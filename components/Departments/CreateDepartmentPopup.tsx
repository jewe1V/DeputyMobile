import React, {useRef, useEffect, useState, useCallback} from 'react';
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
import { useTheme } from '@/context/ThemeContext';

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
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [name, setName] = useState('');

    const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;
    const panY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

    const open = useCallback(() => {
        Animated.timing(panY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [panY]);

    const closeAnim = (callback?: () => void) => Animated.timing(panY, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
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
                if (gestureState.dy > 0) {
                    panY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100) {
                    handleClose();
                } else {
                    Animated.timing(panY, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            open();
        } else {
            panY.setValue(SHEET_HEIGHT);
        }
    }, [visible, open, panY, SHEET_HEIGHT]);

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
                                height: SHEET_HEIGHT,
                                backgroundColor: colors.card
                            }
                        ]}
                    >
                        <View {...panResponder.panHandlers} style={styles.dragArea}>
                            <View style={[styles.dragIndicator, { backgroundColor: colors.border }]} />
                            <Text style={[styles.title, { color: colors.text }]}>Новый отдел</Text>
                        </View>

                        <View style={styles.content}>
                            <TextInput
                                style={[styles.input, { backgroundColor: isDark ? colors.background : '#f8fafc', borderColor: colors.border, color: colors.text }]}
                                placeholder="Название подразделения"
                                value={name}
                                onChangeText={setName}
                                autoFocus
                                placeholderTextColor={colors.subtext}
                            />

                            <TouchableOpacity
                                style={[styles.submitButton, { backgroundColor: colors.primary }, !name.trim() && styles.disabledButton]}
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
        bottom: 0,
        left: 0,
        right: 0,
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
        borderRadius: 3,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    content: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        fontSize: 16,
        marginBottom: 24,
    },
    submitButton: {
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
