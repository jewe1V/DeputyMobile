import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView,
    ActivityIndicator, Alert, TextInput, Animated, PanResponder, Dimensions
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { X, Upload, FileText, AlertCircle, Folder, ChevronRight } from 'lucide-react-native';
import { AuthManager } from '@/components/LoginScreen/LoginScreen';
import { apiUrl } from '@/api/api';
import { catalogService, CatalogItem } from '@/api/catalogService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
    eventId: string;
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    currentStatus?: 'Yes' | 'No' | 'Unknown';
}

type AttendanceStatus = 'Yes' | 'No' | 'Unknown';

interface UploadedDocument {
    id: string;
    file_name: string;
    url: string;
}

export const EventAttendanceModal: React.FC<Props> = ({
                                                          eventId,
                                                          visible,
                                                          onClose,
                                                          onSuccess,
                                                          currentStatus = 'Unknown'
                                                      }) => {
    const insets = useSafeAreaInsets();

    const START_Y = SCREEN_HEIGHT * 0.4;
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

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy < 0) return; // Не даем тянуть выше START_Y
                panY.setValue(START_Y + gestureState.dy);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 150) {
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
        }
    }, [visible]);

    // --- Ваша бизнес-логика (без изменений) ---
    const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>(currentStatus);
    const [excuseNote, setExcuseNote] = useState('');
    const [excuseDocument, setExcuseDocument] = useState<UploadedDocument | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [showDocumentPicker, setShowDocumentPicker] = useState(false);
    const [catalogs, setCatalogs] = useState<CatalogItem[]>([]);
    const [loadingCatalogs, setLoadingCatalogs] = useState(false);
    const [selectedCatalog, setSelectedCatalog] = useState<CatalogItem | null>(null);
    const [currentPath, setCurrentPath] = useState<CatalogItem[]>([]);
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
    const [documentError, setDocumentError] = useState<string | null>(null);

    const fetchCatalogs = useCallback(async () => {
        try {
            setLoadingCatalogs(true);
            const publicCatalogs = await catalogService.getPublicCatalogs();
            setCatalogs(publicCatalogs);
        } catch (e) {
            setDocumentError('Не удалось загрузить список каталогов');
        } finally {
            setLoadingCatalogs(false);
        }
    }, []);

    const pickDocument = async () => {
        const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
        if (!result.canceled) setSelectedFile(result);
    };

    const uploadExcuseDocument = async () => {
        if (!selectedFile?.assets?.[0] || !selectedCatalog) return;
        try {
            setUploading(true);
            const token = AuthManager.getToken();
            const file = selectedFile.assets[0];
            const formData = new FormData();
            formData.append('File', { uri: file.uri, type: file.mimeType || 'application/octet-stream', name: file.name } as any);
            formData.append('CatalogId', selectedCatalog.id);

            const response = await fetch(`${apiUrl}/api/Documents/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const document = await response.json();
            setExcuseDocument(document);
            setShowDocumentPicker(false);
        } catch (e) {
            Alert.alert('Ошибка', 'Не удалось загрузить файл');
        } finally {
            setUploading(false);
        }
    };

    const submitAttendance = async () => {
        if (selectedStatus === 'Unknown') return;
        try {
            setSubmitting(true);
            const token = AuthManager.getToken();
            const body: any = { status: selectedStatus };
            if (selectedStatus === 'No') {
                if (excuseNote) body.excuse_note = excuseNote;
                if (excuseDocument) body.excuse_document_id = excuseDocument.id;
            }

            const response = await fetch(`${apiUrl}/api/Events/${eventId}/rsvp`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                closeAnim(() => {
                    onSuccess?.();
                    onClose();
                });
            }
        } catch (e) {
            setError('Ошибка сохранения');
        } finally {
            setSubmitting(false);
        }
    };

    // --- Вспомогательные функции рендера ---
    const renderCatalogList = () => {
        const activeList = currentPath.length === 0 ? catalogs : currentPath[currentPath.length - 1].children || [];
        if (loadingCatalogs) return <ActivityIndicator style={{ marginTop: 20 }} color="#2A6E3F" />;

        return activeList.map(catalog => (
            <TouchableOpacity key={catalog.id} style={styles.catalogItem} onPress={() => catalog.children?.length ? setCurrentPath([...currentPath, catalog]) : setSelectedCatalog(catalog)}>
                <View style={styles.catalogItemContent}>
                    <Folder size={20} color="#2A6E3F" />
                    <Text style={styles.catalogItemText}>{catalog.name}</Text>
                </View>
                {!!catalog.children?.length && <ChevronRight size={20} color="#6b7280" />}
            </TouchableOpacity>
        ));
    };

    return (
        <>
            <Modal visible={visible} transparent animationType="none" onRequestClose={() => closeAnim(onClose)}>
                <View style={styles.overlay}>
                    <TouchableOpacity style={styles.dismiss} activeOpacity={1} onPress={() => closeAnim(onClose)} />

                    <Animated.View style={[styles.sheet, { transform: [{ translateY: panY }], paddingBottom: insets.bottom + 20 }]}>
                        {/* Хендл (Drag Area) */}
                        <View {...panResponder.panHandlers} style={styles.dragArea}>
                            <View style={styles.dragIndicator} />
                            <Text style={styles.title}>Участие в мероприятии</Text>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                            <View style={styles.statusButtons}>
                                <TouchableOpacity
                                    style={[styles.statusButton, selectedStatus === 'Yes' && styles.statusButtonActive]}
                                    onPress={() => setSelectedStatus('Yes')}
                                >
                                    <Text style={[styles.statusButtonText, selectedStatus === 'Yes' && styles.statusButtonTextActive]}>Пойду</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.statusButton, selectedStatus === 'No' && styles.statusButtonActive]}
                                    onPress={() => setSelectedStatus('No')}
                                >
                                    <Text style={[styles.statusButtonText, selectedStatus === 'No' && styles.statusButtonTextActive]}>Не пойду</Text>
                                </TouchableOpacity>
                            </View>

                            {selectedStatus === 'No' && (
                                <View style={styles.excuseContainer}>
                                    <TextInput
                                        style={styles.textArea}
                                        value={excuseNote}
                                        onChangeText={setExcuseNote}
                                        placeholder="Укажите причину отсутствия"
                                        multiline
                                        numberOfLines={4}
                                    />

                                    <Text style={styles.label}>Документ (необязательно)</Text>
                                    {excuseDocument ? (
                                        <View style={styles.documentInfo}>
                                            <FileText size={20} color="#2A6E3F" />
                                            <Text style={styles.documentName} numberOfLines={1}>{excuseDocument.file_name}</Text>
                                            <TouchableOpacity onPress={() => setExcuseDocument(null)}><X size={20} color="#ef4444" /></TouchableOpacity>
                                        </View>
                                    ) : (
                                        <TouchableOpacity style={styles.addDocumentButton} onPress={() => { fetchCatalogs(); setShowDocumentPicker(true); }}>
                                            <Upload size={20} color="#2A6E3F" />
                                            <Text style={styles.addDocumentText}>Загрузить документ</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}

                            {error && <Text style={styles.errorLabel}>{error}</Text>}

                            <TouchableOpacity
                                style={[styles.submitButton, (selectedStatus === 'Unknown' || submitting) && styles.submitButtonDisabled]}
                                onPress={submitAttendance}
                                disabled={selectedStatus === 'Unknown' || submitting}
                            >
                                {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>Сохранить</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </Animated.View>
                </View>
            </Modal>

            {/* Вспомогательная модалка для выбора файла остается стандартной или тоже шторкой */}
            <Modal visible={showDocumentPicker} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={[styles.sheet, { height: '80%', bottom: 0, position: 'absolute' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.title}>Выбор папки</Text>
                            <TouchableOpacity onPress={() => setShowDocumentPicker(false)}><X size={24} color="#0b2340" /></TouchableOpacity>
                        </View>

                        {!selectedCatalog ? (
                            <>
                                {currentPath.length > 0 && (
                                    <TouchableOpacity style={styles.backButton} onPress={() => setCurrentPath(currentPath.slice(0, -1))}>
                                        <Text style={styles.backButtonText}>← Назад</Text>
                                    </TouchableOpacity>
                                )}
                                <ScrollView>{renderCatalogList()}</ScrollView>
                            </>
                        ) : (
                            <View style={styles.fileSelection}>
                                <Text style={styles.selectedCatalogLabel}>Папка: {selectedCatalog.name}</Text>
                                <TouchableOpacity style={styles.fileSelector} onPress={pickDocument}>
                                    <Text>{selectedFile?.assets?.[0]?.name || "Нажмите, чтобы выбрать файл"}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.uploadButton} onPress={uploadExcuseDocument} disabled={uploading}>
                                    {uploading ? <ActivityIndicator color="white" /> : <Text style={{color: 'white'}}>Загрузить в облако</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setSelectedCatalog(null)}><Text style={{textAlign: 'center', marginTop: 10, color: '#ef4444'}}>Сменить папку</Text></TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </>
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
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        elevation: 25,
        shadowColor: "#000",
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
        backgroundColor: '#E5E7EB',
        borderRadius: 2.5,
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0b2340',
        marginBottom: 10,
        textAlign: 'center'
    },
    scrollContent: {
        paddingBottom: 100,
    },
    statusButtons: {
        flexDirection: 'row',
        gap: 12,
        marginVertical: 20,
    },
    statusButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    statusButtonActive: {
        backgroundColor: '#2A6E3F',
        borderColor: '#2A6E3F',
    },
    statusButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    statusButtonTextActive: {
        color: '#fff',
    },
    excuseContainer: {
        marginTop: 10,
    },
    textArea: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        height: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 8,
    },
    addDocumentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderWidth: 1,
        borderColor: '#2A6E3F',
        borderStyle: 'dashed',
        borderRadius: 12,
        gap: 10,
    },
    addDocumentText: {
        color: '#2A6E3F',
        fontWeight: '600',
    },
    documentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderRadius: 12,
        gap: 10,
    },
    documentName: {
        flex: 1,
        fontSize: 14,
    },
    submitButton: {
        marginTop: 30,
        backgroundColor: '#2A6E3F',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    // Styles for document picker modal
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
    },
    catalogItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    catalogItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    catalogItemText: {
        fontSize: 16,
        color: '#1f2937',
    },
    backButton: {
        paddingVertical: 10,
    },
    backButtonText: {
        color: '#2A6E3F',
        fontWeight: '600',
    },
    fileSelection: {
        padding: 10,
    },
    selectedCatalogLabel: {
        marginBottom: 15,
        fontWeight: '600',
    },
    fileSelector: {
        padding: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20,
    },
    uploadButton: {
        backgroundColor: '#2A6E3F',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    errorLabel: {
        color: '#ef4444',
        textAlign: 'center',
        marginTop: 10,
    }
});
