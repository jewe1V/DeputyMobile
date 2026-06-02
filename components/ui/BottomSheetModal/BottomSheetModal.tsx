import React, { useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Animated,
    PanResponder,
    Dimensions,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetModalProps {
    /** Видимость модалки */
    visible: boolean;
    /** Коллбэк закрытия */
    onClose: () => void;
    /** Заголовок модалки */
    title?: string;
    /** Содержимое */
    children: React.ReactNode;
    /**
     * Высота модалки в процентах от экрана (0..1).
     * Например, 0.7 = 70% экрана. По умолчанию 0.7.
     */
    heightFraction?: number;
    /**
     * Порог свайпа для закрытия (в пикселях).
     * По умолчанию 120.
     */
    swipeThreshold?: number;
    /** Отключить скролл содержимого (если контент фиксированный) */
    scrollEnabled?: boolean;
    /** Обработка клавиатуры через KeyboardAvoidingView */
    keyboardAvoiding?: boolean;
    /** Кастомный компонент вместо заголовка */
    renderHeader?: () => React.ReactNode;
    /** Контент футера (кнопки и т.п.), рендерится ВНЕ скролла */
    renderFooter?: () => React.ReactNode;
    /** Дополнительные стили для контейнера sheet */
    sheetStyle?: object;
    /** Дополнительные стили для контейнера контента (ScrollView contentContainer) */
    contentContainerStyle?: object;
}

export const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
                                                                      visible,
                                                                      onClose,
                                                                      title,
                                                                      children,
                                                                      heightFraction = 0.7,
                                                                      swipeThreshold = 120,
                                                                      scrollEnabled = true,
                                                                      keyboardAvoiding = false,
                                                                      renderHeader,
                                                                      renderFooter,
                                                                      sheetStyle,
                                                                      contentContainerStyle,
                                                                  }) => {
    const insets = useSafeAreaInsets();
    const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    // Позиция, в которую sheet «приезжает»
    const startY = SCREEN_HEIGHT * (1 - heightFraction);

    const open = useCallback(() => {
        Animated.timing(panY, {
            toValue: startY,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [panY, startY]);

    const close = useCallback(
        (callback?: () => void) => {
            Animated.timing(panY, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: false,
            }).start(() => {
                callback?.();
            });
        },
        [panY],
    );

    const handleClose = useCallback(() => {
        close(onClose);
    }, [close, onClose]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
            onPanResponderMove: (_, gs) => {
                if (gs.dy > 0) {
                    panY.setValue(startY + gs.dy);
                }
            },
            onPanResponderRelease: (_, gs) => {
                if (gs.dy > swipeThreshold) {
                    close(onClose);
                } else {
                    Animated.timing(panY, {
                        toValue: startY,
                        duration: 200,
                        useNativeDriver: false,
                    }).start();
                }
            },
        }),
    ).current;

    // Пересоздаём panResponder при изменении startY / swipeThreshold
    // (для простоты — достаточно, если они не меняются динамически)

    useEffect(() => {
        if (visible) {
            open();
        } else {
            panY.setValue(SCREEN_HEIGHT);
        }
    }, [visible, open, panY]);

    const renderDefaultHeader = () => (
        <View style={styles.headerContainer}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
        </View>
    );

    const content = (
        <>
            {/* Drag-зона */}
            <View {...panResponder.panHandlers} style={styles.dragArea}>
                <View style={styles.dragIndicator} />
                {renderHeader ? renderHeader() : renderDefaultHeader()}
            </View>

            {/* Основное содержимое */}
            {scrollEnabled ? (
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: insets.bottom + 24 + (renderFooter ? 80 : 0) },
                        contentContainerStyle,
                    ]}
                >
                    {children}
                </ScrollView>
            ) : (
                <View
                    style={[
                        styles.staticContent,
                        { paddingBottom: insets.bottom + 24 },
                        contentContainerStyle,
                    ]}
                >
                    {children}
                </View>
            )}

            {/* Футер */}
            {renderFooter && (
                <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
                    {renderFooter()}
                </View>
            )}
        </>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                {/* Тап по затемнению — закрыть */}
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
                            height: SCREEN_HEIGHT * heightFraction,
                        },
                        sheetStyle,
                    ]}
                >
                    {keyboardAvoiding ? (
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={{ flex: 1 }}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                        >
                            {content}
                        </KeyboardAvoidingView>
                    ) : (
                        content
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    dismiss: {
        flex: 1,
    },
    sheet: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: SCREEN_HEIGHT,
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        elevation: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
    },
    dragArea: {
        paddingTop: 12,
        paddingBottom: 4,
        width: '100%',
        alignItems: 'center',
    },
    dragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#E2E8F0',
        borderRadius: 2.5,
        marginBottom: 16,
    },
    headerContainer: {
        marginBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0b2340',
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 4,
    },
    staticContent: {
        flex: 1,
        paddingTop: 4,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 12,
        paddingHorizontal: 0,
        backgroundColor: '#ffffff',
    },
});
