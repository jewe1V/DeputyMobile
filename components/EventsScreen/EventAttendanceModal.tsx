import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Modal,
    ActivityIndicator, Alert, TextInput, Image, Platform
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { X, Upload, FileText } from 'lucide-react-native';
import { AuthManager } from '@/api/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiClient, apiUrl, xAppSecret } from "@/api/api";
import { BottomSheetModal } from '@/components/ui/BottomSheetModal/BottomSheetModal';
import { useTheme } from '@/context/ThemeContext';

interface Props {
    eventId: string;
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    currentStatus?: 'Yes' | 'No' | 'Unknown';
}

type AttendanceStatus = 'Yes' | 'No' | 'Unknown';

interface UploadedDocument {
    id?: string;
    file_name: string;
    file_name_encoded?: string;
    size?: number;
    url?: string;
    localUri?: string;
    uri?: string;
    mimeType?: string;
    file?: File;
}

export const EventAttendanceModal: React.FC<Props> = ({
                                                          eventId,
                                                          visible,
                                                          onClose,
                                                          onSuccess,
                                                          currentStatus = 'Unknown'
                                                      }) => {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
    const token = AuthManager.getToken();
    const xhrRef = useRef<XMLHttpRequest | null>(null);

    const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>(currentStatus);
    const [excuseNote, setExcuseNote] = useState('');
    const [excuseDocument, setExcuseDocument] = useState<UploadedDocument | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const isImageFile = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'heic', 'webp'].includes(ext || '');
    };

    // Сброс формы при открытии
    useEffect(() => {
        if (visible) {
            // При currentStatus 'Yes' или 'No' — начальный выбор сбрасываем,
            // чтобы пользователь явно выбрал противоположный статус
            setSelectedStatus(currentStatus === 'Unknown' ? 'Unknown' : 'Unknown');
            setExcuseNote('');
            setExcuseDocument(null);
            setError(null);
            setUploadProgress(0);
            setUploading(false);
        }
    }, [visible, currentStatus]);

    // Выбор файла (без отправки на сервер, только локальное сохранение)
    const selectFile = async (fileInfo: { uri: string; name: string; mimeType?: string; file?: File; size?: number }) => {
        try {
            setError(null);
            const mimeType = (fileInfo.file as any)?.type || fileInfo.mimeType;

            setExcuseDocument({
                uri: fileInfo.uri,
                localUri: fileInfo.uri,
                file_name: fileInfo.name,
                mimeType: mimeType,
                file: fileInfo.file,
                size: fileInfo.size,
            });
        } catch (e: any) {
            console.error('Ошибка:', e);
            setError(e?.message || 'Ошибка при выборе файла');
            Alert.alert('Ошибка', e?.message || 'Не удалось выбрать файл');
        }
    };

    // Выбор файла из файловой системы (Mobile)
    const pickFromFiles = async () => {
        const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
        if (result.canceled || !result.assets?.length) return;
        const file = result.assets[0];
        if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
            Alert.alert('Файл слишком большой', 'Максимум 50 МБ');
            return;
        }
        await selectFile({ uri: file.uri, name: file.name, mimeType: file.mimeType, size: file.size });
    };

    // Выбор файла из галереи (Mobile)
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
        await selectFile({ uri: file.uri, name: fileName, mimeType: file.mimeType, size: file.fileSize });
    };

    // Выбор файла для Web платформы
    const pickFileFromWeb = async (): Promise<void> => {
        return new Promise<void>((resolve) => {
            const input = document.createElement('input') as HTMLInputElement;
            input.type = 'file';
            input.accept = '*/*';
            input.style.display = 'none';

            input.onchange = async (event) => {
                const files = (event.target as HTMLInputElement).files;
                if (!files || files.length === 0) {
                    resolve();
                    return;
                }

                const file = files[0];
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    alert('Файл слишком большой. Максимум 50 МБ');
                    resolve();
                    return;
                }

                try {
                    await selectFile({
                        uri: URL.createObjectURL(file),
                        name: file.name,
                        mimeType: file.type || 'application/octet-stream',
                        file: file,
                        size: file.size
                    });
                } catch (error: any) {
                    console.error('Ошибка при загрузке файла:', error);
                    Alert.alert('Ошибка загрузки', error?.message || 'Не удалось загрузить файл');
                } finally {
                    resolve();
                }
            };

            document.body.appendChild(input);
            input.click();
            document.body.removeChild(input);
        });
    };

    // Показать опции выбора файла
    const showUploadOptions = () => {
        if (Platform.OS === 'web') {
            pickFileFromWeb();
            return;
        }

        Alert.alert('Загрузить документ', 'Выберите источник', [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Галерея', onPress: pickFromGallery },
            { text: 'Файлы', onPress: pickFromFiles },
        ]);
    };

    // Отмена загрузки
    const cancelUpload = () => {
        if (xhrRef.current) {
            xhrRef.current.abort();
            xhrRef.current = null;
        }
        setUploading(false);
        setUploadProgress(0);
        setError(null);
    };

    // Загрузка файла на сервер (отдельный метод, вызывается при отправке формы)
    const uploadDocumentToServer = async (): Promise<string> => {
        if (!excuseDocument) throw new Error('Нет документа для загрузки');
        if (!excuseDocument.file) throw new Error('Файл не выбран');

        return new Promise<string>((resolve, reject) => {
            const formData = new FormData();
            const xhr = new XMLHttpRequest();
            xhrRef.current = xhr;

            // Отслеживание прогресса загрузки
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    setUploadProgress(event.loaded / event.total);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.response);
                        // Возвращаем ID загруженного документа
                        resolve(response.id || response.file_name_encoded || response);
                    } catch (e) {
                        resolve(xhr.response);
                    }
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
                }
            });

            xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
            xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

            formData.append('file', excuseDocument.file);

            xhr.open('POST', `${apiUrl}/api/Documents/upload/document`);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.setRequestHeader('X-App-Secret', xAppSecret);
            xhr.send(formData);
        });
    };

    // Отправка ответа об участии
    const submitAttendance = async () => {
        if (selectedStatus === 'Unknown') return;

        try {
            setSubmitting(true);
            setError(null);

            const body: any = { status: selectedStatus };

            if (selectedStatus === 'No') {
                if (excuseNote && excuseNote.trim()) {
                    body.excuse_note = excuseNote.trim();
                }

                // Если есть документ и его еще нет на сервере (нет ID)
                if (excuseDocument && !excuseDocument.id && (excuseDocument as any).file) {
                    setUploading(true);
                    const documentId = await uploadDocumentToServer();
                    body.excuse_document_id = documentId;
                    setUploading(false);
                    setUploadProgress(0);
                }
                // Если документ уже загружен (есть ID)
                else if (excuseDocument && excuseDocument.id) {
                    body.excuse_document_id = excuseDocument.id;
                }
            }

            await apiClient.post(`/api/Events/${eventId}/rsvp`, body);

            onSuccess?.();
            onClose();
        } catch (e: any) {
            console.error('Ошибка:', e);
            setError(e?.message || 'Ошибка сети');
            Alert.alert('Ошибка', e?.message || 'Не удалось отправить ответ');
        } finally {
            setSubmitting(false);
            setUploading(false);
            if (xhrRef.current) {
                xhrRef.current = null;
            }
        }
    };

    // Получение источника изображения для предпросмотра
    const getImageSource = () => {
        if (!excuseDocument) return undefined;

        const imageHeaders = {
            Authorization: `Bearer ${token}`,
            'X-App-Secret': xAppSecret
        };

        // Для локального файла (еще не загружен)
        if (excuseDocument.localUri) {
            return { uri: excuseDocument.localUri };
        }

        // Для загруженного файла (с сервера)
        if (excuseDocument.file_name_encoded) {
            return {
                uri: `${apiUrl}/api/files/${encodeURIComponent(excuseDocument.file_name_encoded)}`,
                headers: imageHeaders
            };
        }

        return undefined;
    };

    const imageSource = getImageSource();
    const isImage = excuseDocument?.file_name && isImageFile(excuseDocument.file_name);

    return (
        <>
            <BottomSheetModal
                visible={visible}
                onClose={onClose}
                title="Участие в мероприятии"
                heightFraction={0.7}
                scrollEnabled={true}
                keyboardAvoiding={true}
            >
                {/* Кнопки статуса */}
                <View style={styles.statusButtons}>
                    {currentStatus !== 'Yes' && (
                        <TouchableOpacity
                            style={[
                                styles.statusButton,
                                { backgroundColor: isDark ? colors.card : '#F9FAFB', borderColor: colors.border },
                                selectedStatus === 'Yes' && [styles.statusButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                            ]}
                            onPress={() => setSelectedStatus('Yes')}
                        >
                            <Text
                                style={[
                                    styles.statusButtonText,
                                    { color: colors.text },
                                    selectedStatus === 'Yes' && styles.statusButtonTextActive,
                                ]}
                            >
                                Пойду
                            </Text>
                        </TouchableOpacity>
                    )}

                    {currentStatus !== 'No' && (
                        <TouchableOpacity
                            style={[
                                styles.statusButton,
                                { backgroundColor: isDark ? colors.card : '#F9FAFB', borderColor: colors.border },
                                selectedStatus === 'No' && [styles.statusButtonActive, { backgroundColor: colors.primary, borderColor: colors.primary }],
                            ]}
                            onPress={() => setSelectedStatus('No')}
                        >
                            <Text
                                style={[
                                    styles.statusButtonText,
                                    { color: colors.text },
                                    selectedStatus === 'No' && styles.statusButtonTextActive,
                                ]}
                            >
                                Не пойду
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Блок причины отказа */}
                {selectedStatus === 'No' && (
                    <View style={styles.excuseContainer}>
                        <TextInput
                            style={[styles.textArea, { backgroundColor: isDark ? colors.card : '#F9FAFB', borderColor: colors.border, color: colors.text }]}
                            value={excuseNote}
                            onChangeText={setExcuseNote}
                            placeholder="Укажите причину отсутствия"
                            placeholderTextColor={colors.subtext}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />

                        <Text style={[styles.label, { color: colors.subtext }]}>Приложить документ</Text>

                        {excuseDocument ? (
                            <View style={[styles.documentPreviewCard, { backgroundColor: isDark ? colors.iconBox : '#F3F4F6' }]}>
                                <TouchableOpacity
                                    style={styles.previewContent}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        if (isImage) {
                                            setIsPreviewOpen(true);
                                        }
                                    }}
                                >
                                    {isImage ? (
                                        <Image
                                            source={imageSource}
                                            style={styles.thumbnail}
                                        />
                                    ) : (
                                        <View style={[styles.fileIconContainer, { backgroundColor: isDark ? colors.primary + '20' : '#D1FAE5' }]}>
                                            <FileText size={24} color={isDark ? colors.roleText : "#2A6E3F"} />
                                        </View>
                                    )}
                                    <View style={styles.fileInfo}>
                                        <Text style={[styles.documentName, { color: colors.text }]} numberOfLines={1}>
                                            {excuseDocument.file_name}
                                        </Text>
                                        <Text style={[styles.fileStatus, { color: colors.subtext }]}>
                                            {excuseDocument.size ? `${(excuseDocument.size / 1024 / 1024).toFixed(2)} МБ` : ''}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => setExcuseDocument(null)}
                                >
                                    <View pointerEvents="none">
                                        <X size={18} color={colors.text} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.addDocumentButton, { borderColor: colors.primary }]}
                                onPress={showUploadOptions}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <View style={styles.uploadProgressContainer}>
                                        <ActivityIndicator color={colors.primary} style={{ marginRight: 10 }} />
                                        <Text style={[styles.addDocumentText, { color: colors.primary }]}>
                                            Загрузка: {Math.round(uploadProgress * 100)}%
                                        </Text>
                                        <TouchableOpacity
                                            style={styles.cancelUploadButton}
                                            onPress={cancelUpload}
                                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        >
                                            <View pointerEvents="none">
                                                <X size={20} color={colors.primary} />
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <Upload size={20} color={colors.primary} />
                                        <Text style={[styles.addDocumentText, { color: colors.primary }]}>Загрузить документ</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Ошибка */}
                {error && (
                    <View style={[styles.errorContainer, { backgroundColor: isDark ? '#450a0a' : '#FEF2F2', borderColor: isDark ? '#991b1b' : '#FEE2E2' }]}>
                        <Text style={[styles.errorLabel, { color: isDark ? '#fecaca' : '#ef4444' }]}>{error}</Text>
                    </View>
                )}

                {/* Кнопка отправки */}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        { backgroundColor: colors.primary },
                        (selectedStatus === 'Unknown' || submitting || uploading) && styles.submitButtonDisabled,
                    ]}
                    onPress={submitAttendance}
                    disabled={selectedStatus === 'Unknown' || submitting || uploading}
                >
                    {submitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.submitButtonText}>Сохранить</Text>
                    )}
                </TouchableOpacity>
            </BottomSheetModal>

            {/* Модалка предпросмотра изображения */}
            <Modal
                visible={isPreviewOpen}
                transparent
                onRequestClose={() => setIsPreviewOpen(false)}
                animationType="fade"
            >
                <View style={styles.fullScreenOverlay}>
                    <TouchableOpacity
                        style={[styles.closePreviewButton, { top: insets.top + 10 }]}
                        onPress={() => setIsPreviewOpen(false)}
                    >
                        <View pointerEvents="none">
                            <X size={30} color="white" />
                        </View>
                    </TouchableOpacity>

                    {excuseDocument && imageSource && (
                        <Image
                            source={imageSource}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}

                    <View style={[styles.previewFooter, { paddingBottom: insets.bottom + 20 }]}>
                        <Text style={styles.previewFooterText}>
                            {excuseDocument?.file_name || 'Файл'}
                        </Text>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    // Кнопки статуса
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

    // Блок причины
    excuseContainer: {
        marginTop: 10,
    },
    textArea: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
        fontSize: 15,
        color: '#0f172a',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 8,
    },

    // Превью документа
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

    // Кнопка загрузки
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
        minHeight: 50,
    },
    addDocumentText: {
        color: '#2A6E3F',
        fontWeight: '600',
    },
    uploadProgressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    cancelUploadButton: {
        marginLeft: 'auto',
    },

    // Кнопка отправки
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

    // Ошибка
    errorContainer: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    errorLabel: {
        color: '#ef4444',
        textAlign: 'center',
        fontSize: 14,
    },

    // Полноэкранный предпросмотр
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
});
