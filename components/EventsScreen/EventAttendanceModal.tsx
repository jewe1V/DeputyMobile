import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView,
    ActivityIndicator, Alert, TextInput, Animated, PanResponder, Dimensions, Image, ImageSourcePropType
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { X, Upload, FileText } from 'lucide-react-native';
import { AuthManager } from '@/components/LoginScreen/LoginScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {apiClient, apiUrl, xAppSecret} from "@/api/api";
import axios, { AxiosProgressEvent } from 'axios';


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
    file_name_encoded: string;
    size: number;
    url: string;
    localUri?: string;
}

export const EventAttendanceModal: React.FC<Props> = ({
                                                          eventId,
                                                          visible,
                                                          onClose,
                                                          onSuccess,
                                                          currentStatus = 'Unknown'
                                                      }) => {
    const insets = useSafeAreaInsets();
    const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

    const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const [uploadProgress, setUploadProgress] = useState(0);
    const START_Y = SCREEN_HEIGHT * 0.2;
    const token = AuthManager.getToken();
    const isImageFile = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'heic', 'webp'].includes(ext || '');
    };
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const xhrRef = useRef<XMLHttpRequest | null>(null);


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
            setSelectedStatus(currentStatus);
            setExcuseNote('');
            setExcuseDocument(null);
            setError(null);
            setUploadProgress(0);
        }
    }, [visible, currentStatus, eventId]);

    const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>(currentStatus);
    const [excuseNote, setExcuseNote] = useState('');
    const [excuseDocument, setExcuseDocument] = useState<UploadedDocument | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadFileToServer = async (fileInfo: { uri: string; name: string; mimeType?: string; file?: File }) => {
        try {
            setError(null);

            // На вебе не сохраняем неправильный mimeType из браузера
            // Будем использовать тип из оригинального File объекта при отправке
            const mimeType = (fileInfo.file as any)?.type || fileInfo.mimeType;

            // Просто сохраняем файл локально, без загрузки на сервер
            setExcuseDocument({
                uri: fileInfo.uri,
                name: fileInfo.name,
                mimeType: mimeType,
                file: fileInfo.file,
                localUri: fileInfo.uri
            } as any);

        } catch (e: any) {
            console.error('Ошибка:', e);
            setError(e?.message || 'Ошибка при выборе файла');
            Alert.alert('Ошибка', e?.message || 'Не удалось выбрать файл');
        }
    };

    const cancelUpload = () => {
        if (xhrRef.current) {
            xhrRef.current.abort();
            xhrRef.current = null;
        }
        setUploading(false);
        setUploadProgress(0);
        setError(null);
    };

    const pickFromFiles = async () => {
        const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
        if (result.canceled || !result.assets?.length) return;
        const file = result.assets[0];
        if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
            Alert.alert('Файл слишком большой', 'Максимум 50 МБ');
            return;
        }
        await uploadFileToServer({ uri: file.uri, name: file.name, mimeType: file.mimeType });
    };

    const pickFromGallery = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            quality: 0.8,
        });
        if (result.canceled || !result.assets?.length) return;
        const file = result.assets[0];
        if (file.fileSize && file.fileSize > MAX_FILE_SIZE_BYTES) {
            Alert.alert('Файл слишком большой', 'Максимум 50 МБ');
            return;
        }
        const fileName = file.fileName || file.uri.split('/').pop() || 'photo.jpg';
        await uploadFileToServer({ uri: file.uri, name: fileName, mimeType: file.mimeType });
    };

    const showUploadOptions = () => {
        Alert.alert('Загрузить документ', 'Выберите источник', [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Галерея', onPress: pickFromGallery },
            { text: 'Файлы', onPress: pickFromFiles },
        ]);
    };

    const submitAttendance = async () => {
        if (selectedStatus === 'Unknown') return;
        try {
            setSubmitting(true);
            const body: any = { status: selectedStatus };
            
            if (selectedStatus === 'No') {
                if (excuseNote) body.excuse_note = excuseNote;
                
                // Если есть файл и он не был загружен на сервер - загружаем его
                if (excuseDocument && !(excuseDocument as any).id && (excuseDocument as any).file) {
                    const formData = new FormData();
                    const token = AuthManager.getToken();

                    // Используем XMLHttpRequest для надежной передачи
                    const uploadPromise = new Promise<string>((resolve, reject) => {
                        const xhr = new XMLHttpRequest();

                        xhr.upload.addEventListener('progress', (event) => {
                            if (event.lengthComputable) {
                                setUploadProgress(event.loaded / event.total);
                            }
                        });

                        xhr.addEventListener('load', () => {
                            if (xhr.status >= 200 && xhr.status < 300) {
                                try {
                                    const response = JSON.parse(xhr.response);
                                    resolve(response.id || response.file_name_encoded);
                                } catch (e) {
                                    resolve(xhr.response);
                                }
                            } else {
                                reject(new Error(`Upload failed with status ${xhr.status}`));
                            }
                        });

                        xhr.addEventListener('error', () => reject(new Error('Network error')));

                        formData.append('file', (excuseDocument as any).file);
                        
                        xhr.open('POST', `${apiUrl}/api/Documents/upload/document`);
                        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                        xhr.setRequestHeader('X-App-Secret', xAppSecret);
                        xhr.send(formData);
                    });

                    const documentId = await uploadPromise;
                    body.excuse_document_id = documentId;
                    setUploadProgress(0);
                } else if (excuseDocument && (excuseDocument as any).id) {
                    body.excuse_document_id = (excuseDocument as any).id;
                }
            }

            await apiClient.post(`/api/Events/${eventId}/rsvp`, body);

            closeAnim(() => { onSuccess?.(); onClose(); });
        } catch (e: any) {
            console.error('Ошибка:', e);
            setError(e?.message || 'Ошибка сети');
            Alert.alert('Ошибка', e?.message || 'Не удалось отправить ответ');
        } finally {
            setSubmitting(false);
            setUploadProgress(0);
        }
    };

    const getImageSource = (): ImageSourcePropType | undefined => {
        if (!excuseDocument) return undefined;
        const imageHeaders = {
            Authorization: `Bearer ${token}`,
            ...({ 'X-App-Secret': xAppSecret })
        };

        if (excuseDocument.localUri) {
            return { uri: excuseDocument.localUri };
        }

        return {
            uri: `${apiUrl}/api/files/${encodeURIComponent(excuseDocument.file_name_encoded)}`,
            headers: imageHeaders
        };
    };

    const imageSource = getImageSource();

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={() => closeAnim(onClose)}>
            <View style={[styles.overlay, {"paddingBottom": insets.bottom}]}>
                <TouchableOpacity style={styles.dismiss} activeOpacity={1} onPress={() => closeAnim(onClose)} />
                <Animated.View style={[styles.sheet, { transform: [{ translateY: panY }], paddingBottom: insets.bottom + 20 }]}>
                    <View {...panResponder.panHandlers} style={styles.dragArea}>
                        <View style={styles.dragIndicator} />
                        <Text style={styles.title}>Участие в мероприятии</Text>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.statusButtons}>
                            {(currentStatus === 'Unknown' || currentStatus === 'No') && (
                                <TouchableOpacity
                                    style={[styles.statusButton, selectedStatus === 'Yes' && styles.statusButtonActive]}
                                    onPress={() => setSelectedStatus('Yes')}
                                >
                                    <Text style={[styles.statusButtonText, selectedStatus === 'Yes' && styles.statusButtonTextActive]}>
                                        Пойду
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {(currentStatus === 'Unknown' || currentStatus === 'Yes') && (
                                <TouchableOpacity
                                    style={[styles.statusButton, selectedStatus === 'No' && styles.statusButtonActive]}
                                    onPress={() => setSelectedStatus('No')}
                                >
                                    <Text style={[styles.statusButtonText, selectedStatus === 'No' && styles.statusButtonTextActive]}>
                                        Не пойду
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {selectedStatus === 'No' && (
                            <View style={styles.excuseContainer}>
                                <TextInput
                                    style={styles.textArea}
                                    value={excuseNote}
                                    onChangeText={setExcuseNote}
                                    placeholder="Укажите причину отсутствия"
                                    multiline
                                />

                                <Text style={styles.label}>Приложить документ</Text>

                                {excuseDocument ? (
                                <View style={styles.documentPreviewCard}>
                                    <TouchableOpacity
                                        style={styles.previewContent}
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            if (isImageFile(excuseDocument.file_name_encoded)) {
                                                setIsPreviewOpen(true);
                                            }
                                        }}
                                    >
                                        {isImageFile(excuseDocument.file_name_encoded) ? (
                                            <Image
                                                source={imageSource}
                                                style={styles.thumbnail}
                                            />
                                        ) : (
                                            <View style={styles.fileIconContainer}>
                                                <FileText size={24} color="#2A6E3F" />
                                            </View>
                                        )}
                                        <View style={styles.fileInfo}>
                                            <Text style={styles.documentName} numberOfLines={1}>
                                                {excuseDocument.file_name}
                                            </Text>
                                            <Text style={styles.fileStatus}>{(excuseDocument.size / 1024 / 1024).toFixed(2)} МБ</Text>
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => setExcuseDocument(null)}
                                    >
                                        <View pointerEvents={"none"}>
                                        <X size={18} color="#000" />
                                        </View>
                                    </TouchableOpacity>
                                </View>
                                ) : (
                                <TouchableOpacity
                                    style={styles.addDocumentButton}
                                    onPress={showUploadOptions}
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <View style={styles.uploadProgressContainer}>
                                            <ActivityIndicator color="#2A6E3F" style={{ marginRight: 10 }} />
                                            <Text style={styles.addDocumentText}>
                                                Загрузка: {Math.round(uploadProgress * 100)}%
                                            </Text>

                                            <TouchableOpacity
                                                style={styles.cancelUploadButton}
                                                onPress={cancelUpload}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <View pointerEvents="none">
                                                    <X size={20} color="#2A6E3F" />
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <Upload size={20} color="#2A6E3F" />
                                            <Text style={styles.addDocumentText}>Загрузить документ</Text>
                                        </View>
                                    )}
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
                <Modal
                    visible={isPreviewOpen}
                    transparent={true}
                    onRequestClose={() => setIsPreviewOpen(false)}
                    animationType="fade"
                >
                    <View style={styles.fullScreenOverlay}>
                        <TouchableOpacity
                            style={[styles.closePreviewButton, { top: insets.top + 10 }]}
                            onPress={() => setIsPreviewOpen(false)}
                        >
                            <View pointerEvents={"none"}>
                            <X size={30} color="white" />
                            </View>
                        </TouchableOpacity>
                        {excuseDocument &&
                            <Image
                                source={imageSource}
                                style={styles.fullImage}
                                resizeMode="contain"
                            />
                        }

                        <View style={[styles.previewFooter, { paddingBottom: insets.bottom + 20 }]}>
                            <Text style={styles.previewFooterText}>{excuseDocument?.file_name}</Text>
                        </View>
                    </View>
                </Modal>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    dismiss: { flex: 1 },
    sheet: {
        position: 'absolute', left: 0, right: 0, height: SCREEN_HEIGHT,
        backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingHorizontal: 20, elevation: 25,
    },
    dragArea: { paddingTop: 12, paddingBottom: 4, alignItems: 'center' },
    dragIndicator: { width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 2.5, marginBottom: 16 },
    title: { fontSize: 18, fontWeight: '700', color: '#0b2340', textAlign: 'center' },
    statusButtons: { flexDirection: 'row', gap: 12, marginVertical: 20 },
    statusButton: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', backgroundColor: '#F9FAFB' },
    statusButtonActive: { backgroundColor: '#2A6E3F', borderColor: '#2A6E3F' },
    statusButtonText: { fontSize: 16, fontWeight: '600', color: '#374151' },
    statusButtonTextActive: { color: '#fff' },
    excuseContainer: { marginTop: 10 },
    textArea: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, height: 100, textAlignVertical: 'top', marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 8 },

    // Telegram-style Preview
    documentPreviewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 8,
        justifyContent: 'space-between',
    },
    previewContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    thumbnail: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: '#E5E7EB',
    },
    fileIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: '#D1FAE5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fileInfo: {
        marginLeft: 12,
        flex: 1,
    },
    documentName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1f2937',
    },
    fileStatus: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    removeButton: {
        padding: 8,
    },

    addDocumentButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderWidth: 1, borderColor: '#2A6E3F', borderStyle: 'dashed', borderRadius: 12, gap: 10, height: 50 },
    addDocumentText: { color: '#2A6E3F', fontWeight: '600' },
    submitButton: { marginTop: 30, backgroundColor: '#2A6E3F', padding: 16, borderRadius: 12, alignItems: 'center' },
    submitButtonDisabled: { backgroundColor: '#9ca3af' },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    errorLabel: { color: '#ef4444', textAlign: 'center', marginTop: 10 },
    fullScreenOverlay: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closePreviewButton: {
        position: 'absolute',
        right: 20,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 5,
    },
    fullImage: {
        width: '100%',
        height: '80%',
    },
    previewFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 20,
        alignItems: 'center',
    },
    previewFooterText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    uploadProgressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    progressBarBackground: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: 4,
        backgroundColor: '#E5E7EB',
        width: '100%',
        borderRadius: 2,
        overflow: 'hidden'
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#2A6E3F',
    },
    cancelUploadButton: {
        marginLeft: 'auto',
    },
});
