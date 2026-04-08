import { Document } from '@/api/documentService';
import { AlertCircle } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Modal,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type DocumentStatus = 'ToDo' | 'InProgress' | 'Done' | 'Rejected' | string;

interface DocumentDetailModalProps {
    visible: boolean;
    document: Document | null;
    onClose: () => void;
    onDelete: (documentId: string) => Promise<void>;
    onStatusChange?: (documentId: string, newStatus: DocumentStatus) => Promise<Document>;
    getFileSize: (fileSize: number) => string;
}

export function DocumentDetailModal({ visible, document, onClose, onDelete, onStatusChange, getFileSize }: DocumentDetailModalProps) {
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const insets = useSafeAreaInsets();

    const START_Y = SCREEN_HEIGHT * 0.2;

    const resetPositionAnim = Animated.timing(panY, {
        toValue: START_Y,
        duration: 300,
        useNativeDriver: true,
    });

    const closeAnim = (callback?: () => void) => Animated.timing(panY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
    }).start(callback);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
            onPanResponderMove: (_, gestureState) => {
                panY.setValue(Math.max(START_Y, START_Y + gestureState.dy));
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100) {
                    closeAnim(onClose);
                } else {
                    resetPositionAnim.start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (visible) {
            resetPositionAnim.start();
            setDeleteError(null);
        }
    }, [visible]);

    const handleDelete = () => {
        Alert.alert(
            'Удалить файл?',
            `Вы уверены, что хотите удалить файл "${document?.file_name}"? Это действие нельзя отменить.`,
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Удалить',
                    onPress: async () => {
                        if (!document) return;
                        try {
                            setDeleting(true);
                            setDeleteError(null);
                            await onDelete(document.id);
                            closeAnim(onClose);
                        } catch (error: any) {
                            console.error('[DocumentDetailModal] Ошибка при удалении:', error);
                            setDeleteError(error?.message || 'Не удалось удалить файл');
                        } finally {
                            setDeleting(false);
                        }
                    },
                    style: 'destructive',
                },
            ],
            { cancelable: true }
        );
    };

    if (!document) return null;

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Не указана';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={() => closeAnim(onClose)}>
            <View style={[styles.overlay, { paddingBottom: insets.bottom }]}>
                <TouchableOpacity style={styles.dismiss} activeOpacity={1} onPress={() => closeAnim(onClose)} />
                <Animated.View style={[styles.sheet, { transform: [{ translateY: panY }], paddingBottom: insets.bottom + 20 }]}>
                    <View {...panResponder.panHandlers} style={styles.dragArea}>
                        <View style={styles.dragIndicator} />
                        <Text style={styles.modalTitle}>Информация о файле</Text>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Информация о файле */}
                        <View style={styles.fileCard}>
                            <View style={styles.fileInfo}>
                                <Text style={styles.fileName}>{document.file_name}{document.content_type}</Text>
                                <Text style={styles.fileSize}>{getFileSize(document.file_size)}</Text>
                            </View>
                        </View>

                        {/* Статус */}
                        <View style={styles.statusSection}>
                            <Text style={styles.fieldLabel}>Статус документа:</Text>
                            <View style={styles.statusContainer}>
                                <Text style={styles.statusValue}>{document.status || 'Не указан'}</Text>
                            </View>
                        </View>

                        {/* Детали */}
                        <View style={styles.detailsSection}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Автор:</Text>
                                <Text style={styles.detailValue}>{document.user_name || 'Не указан'}</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Дата загрузки:</Text>
                                <Text style={styles.detailValue}>{formatDate(document.uploaded_at)}</Text>
                            </View>

                            {document.start_date && (
                                <>
                                    <View style={styles.divider} />
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Дата начала:</Text>
                                        <Text style={styles.detailValue}>{formatDate(document.start_date)}</Text>
                                    </View>
                                </>
                            )}

                            {document.end_date && (
                                <>
                                    <View style={styles.divider} />
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Дата окончания:</Text>
                                        <Text style={styles.detailValue}>{formatDate(document.end_date)}</Text>
                                    </View>
                                </>
                            )}
                        </View>

                        {/* Ошибка */}
                        {deleteError && (
                            <View style={styles.errorContainer}>
                                <AlertCircle size={20} color="#ef4444" />
                                <Text style={styles.errorText}>{deleteError}</Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Кнопка удаления */}
                    <TouchableOpacity
                        style={[styles.deleteButton, deleting && { opacity: 0.6 }]}
                        onPress={handleDelete}
                        disabled={deleting}
                    >
                        {deleting ? (
                            <ActivityIndicator size="small" color="#E02424" />
                        ) : (
                            <Text style={styles.deleteButtonText}>Удалить файл</Text>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
}

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
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        elevation: 25,
    },
    dragArea: {
        paddingTop: 12,
        paddingBottom: 4,
        alignItems: 'center',
    },
    dragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 2.5,
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0b2340',
        textAlign: 'center',
        marginBottom: 20,
    },
    fileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    fileIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    fileIconText: {
        fontSize: 24,
    },
    fileInfo: {
        flex: 1,
    },
    fileName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    fileSize: {
        fontSize: 13,
        color: '#64748b',
    },
    statusSection: {
        marginBottom: 24,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 8,
    },
    statusContainer: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
    },
    statusValue: {
        fontSize: 15,
        color: '#374151',
    },
    detailsSection: {
        marginBottom: 24,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    detailLabel: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: '#1f2937',
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
        marginLeft: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEE2E2',
        borderRadius: 12,
        padding: 14,
        gap: 10,
    },
    errorText: {
        flex: 1,
        fontSize: 13,
        color: '#991b1b',
        fontWeight: '500',
    },
    deleteButton: {
        borderWidth: 1,
        borderColor: '#FFA39E',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    deleteButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#E02424',
    },
});
