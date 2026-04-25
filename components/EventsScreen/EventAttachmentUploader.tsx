import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    ActivityIndicator,
    Alert,
    TextInput,
    Animated,
    PanResponder,
    Dimensions, Image,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
    X,
    Upload,
    Folder,
    AlertCircle,
    ChevronDown,
    Home,
    FileText
} from 'lucide-react-native';
import { catalogService, CatalogItem } from '@/api/catalogService';
import { apiUrl } from '@/api/api';
import { AuthManager } from '@/components/LoginScreen/LoginScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePickerModal from "@/components/ui/Shared/DateTimePickerModal";
import {SkeletonItem} from "@/components/ui/Shared/SkeletonLoader";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
    eventId: string;
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const FILE_STATUSES = {
    ToDo: 'Принят',
    InProgress: 'В работе',
    Done: 'Выполнено'
} as const;

type FileStatus = keyof typeof FILE_STATUSES;

const CatalogSkeletonRow = () => (
    <View style={styles.catalogRowContainer}>
        <View style={styles.catalogSelectArea}>
            <SkeletonItem width={24} height={24} borderRadius={6} />
            <SkeletonItem width="65%" height={16} borderRadius={4} />
        </View>
        <View style={styles.catalogNavButton}>
            <View style={styles.verticalDivider} />
            <SkeletonItem width={20} height={20} borderRadius={10} />
        </View>
    </View>
);

export const EventAttachmentUploader: React.FC<Props> = ({
                                                             eventId,
                                                             visible,
                                                             onClose,
                                                             onSuccess
                                                         }) => {
    const insets = useSafeAreaInsets();

    const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
    // Анимации основной шторки
    const START_Y = SCREEN_HEIGHT * 0.05;
    const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    // Анимации шторки каталогов
    const START_Y_PICKER = SCREEN_HEIGHT * 0.1;
    const panYPicker = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [catalogs, setCatalogs] = useState<CatalogItem[]>([]);
    const [selectedCatalog, setSelectedCatalog] = useState<CatalogItem | null>(null);
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<FileStatus | null>(null);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [showCatalogPicker, setShowCatalogPicker] = useState(false);
    const [currentPath, setCurrentPath] = useState<CatalogItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const xhrRef = useRef<XMLHttpRequest | null>(null);
    const [isStartPickerVisible, setStartPickerVisible] = useState(false);
    const [isEndPickerVisible, setEndPickerVisible] = useState(false);
    const [isStatusSelectOpen, setIsStatusSelectOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const token = AuthManager.getToken();

    const handleClose = useCallback(() => {
        closeMainAnim(() => {
            onClose();
        });
    }, [onClose]);

    const closeMainAnim = (callback?: () => void) => {
        Animated.timing(panY, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: false }).start(callback);
    };

    const openPickerAnim = () => {
        setShowCatalogPicker(true);
        Animated.timing(panYPicker, { toValue: START_Y_PICKER, duration: 300, useNativeDriver: false }).start();
    };

    const closePickerAnim = () => {
        Animated.timing(panYPicker, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: false }).start(() => {
            setShowCatalogPicker(false);
            setCurrentPath([]);
        });
    };

    const mainPanResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
        onPanResponderMove: (_, gs) => gs.dy > 0 && panY.setValue(START_Y + gs.dy),
        onPanResponderRelease: (_, gs) => gs.dy > 150 ? handleClose() : Animated.timing(panY, { toValue: START_Y, duration: 200, useNativeDriver: false }).start()
    })).current;

    const pickerPanResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
        onPanResponderMove: (_, gs) => gs.dy > 0 && panYPicker.setValue(START_Y_PICKER + gs.dy),
        onPanResponderRelease: (_, gs) => gs.dy > 150 ? handleClose() : Animated.timing(panYPicker, { toValue: START_Y_PICKER, duration: 200, useNativeDriver: false }).start()
    })).current;

    const fetchCatalogs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const publicCatalogs = await catalogService.getPublicCatalogs();
            setCatalogs(publicCatalogs);
        } catch (error) {
            console.error('Ошибка при загрузке каталогов:', error);
            setError('Не удалось загрузить список каталогов');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (visible) {
            fetchCatalogs();
            Animated.timing(panY, {
                toValue: START_Y,
                duration: 300,
                useNativeDriver: false
            }).start();
        } else {
            panY.setValue(SCREEN_HEIGHT);
            resetForm();
        }
    }, [visible, fetchCatalogs, panY, START_Y, SCREEN_HEIGHT]);

    const resetForm = useCallback(() => {
        setSelectedCatalog(null);
        setSelectedFile(null);
        setDescription('');
        setStatus(null);
        setStartDate(null);
        setEndDate(null);
        setShowCatalogPicker(false);
        setCurrentPath([]);
        setError(null);
        setIsStatusSelectOpen(false);
        setUploading(false);
        setUploadProgress(0);
        if (xhrRef.current) {
            xhrRef.current.abort();
            xhrRef.current = null;
        }
    }, []);

    const isImageFile = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'heic', 'webp'].includes(ext || '');
    };

    const selectCatalog = (catalog: CatalogItem) => {
        setSelectedCatalog(catalog);
        setShowCatalogPicker(false);
        setCurrentPath([]);
    };

    const handleStartDateConfirm = (date: Date) => {
        setStartDate(date);
        setStartPickerVisible(false);
    };

    const handleEndDateConfirm = (date: Date) => {
        setEndDate(date);
        setEndPickerVisible(false);
    };

    const formatDate = (date: Date | null): string => {
        if (!date) return '';
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const uploadFileToServer = async (fileInfo: { uri: string; name: string; mimeType?: string }) => {
        try {
            setUploading(true);
            setUploadProgress(0);
            setError(null);

            const formData = new FormData();
            formData.append('file', {
                uri: fileInfo.uri,
                name: fileInfo.name,
                type: fileInfo.mimeType || 'application/octet-stream',
            } as any);

            const xhr = new XMLHttpRequest();
            xhrRef.current = xhr;

            const uploadPromise = new Promise<Response>((resolve, reject) => {
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        setUploadProgress(event.loaded / event.total);
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(new Response(xhr.response, {
                            status: xhr.status,
                            statusText: xhr.statusText,
                            headers: new Headers(),
                        }));
                    } else {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Network error during upload'));
                });

                xhr.addEventListener('abort', () => {
                    reject(new Error('Upload cancelled'));
                });

                xhr.open('POST', `${apiUrl}/api/Documents/upload/document`);
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.setRequestHeader('Accept', 'text/plain');
                xhr.send(formData);
            });

            const response = await uploadPromise;

            if (response.status !== 200 && response.status !== 201) {
                throw new Error('Ошибка сервера при загрузке');
            }

            const responseText = await response.text();
            const document = JSON.parse(responseText || '{}');

            setSelectedFile({
                ...document,
                localUri: fileInfo.uri,
                assets: [{
                    uri: fileInfo.uri,
                    name: fileInfo.name,
                    mimeType: fileInfo.mimeType
                }]
            });

        } catch (e: any) {
            if (e.message !== 'Upload cancelled') {
                Alert.alert('Ошибка загрузки', e.message);
            }
        } finally {
            setUploading(false);
            setUploadProgress(0);
            xhrRef.current = null;
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
        Alert.alert('Загрузить файл', 'Выберите источник', [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Галерея', onPress: pickFromGallery },
            { text: 'Файлы', onPress: pickFromFiles },
        ]);
    };

    const uploadFile = async () => {
        if (!selectedFile || !selectedFile.assets?.[0]) {
            Alert.alert('Ошибка', 'Выберите файл для загрузки');
            return;
        }
        if (!selectedCatalog) {
            Alert.alert('Ошибка', 'Выберите каталог для загрузки');
            return;
        }

        try {
            setUploading(true);
            setError(null);

            const file = selectedFile.assets[0];
            const formData = new FormData();

            formData.append('File', {
                uri: file.uri,
                type: file.mimeType || 'application/octet-stream',
                name: file.name || 'file'
            } as any);

            formData.append('CatalogId', selectedCatalog.id);
            if (status) formData.append('DocumentStatus', status);
            if (description) formData.append('description', description);
            if (startDate) formData.append('StartDate', startDate.toISOString());
            if (endDate) formData.append('EndDate', endDate.toISOString());

            const response = await fetch(`${apiUrl}/api/Events/${eventId}/attachments`, {
method: 'POST',
    headers: {
    'Accept': '*/*',
        'Authorization': `Bearer ${token}`,
},
body: formData
});

if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
}

            Toast.show({
                type: 'success',
                text1: 'Успех',
                text2: 'Файл успешно загружен',
                position: 'top',
                visibilityTime: 3000,
                topOffset: 50,
            });
            handleClose();
resetForm();
} catch (error) {
    console.error('Ошибка при загрузке файла:', error);
    setError('Не удалось загрузить файл. Попробуйте позже.');
} finally {
    setUploading(false);
}
};

const renderCatalogContent = () => {
    if (loading) {
        return Array(6).fill(0).map((_, i) => <CatalogSkeletonRow key={i} />);
    }

    const items = currentPath.length === 0 ? catalogs : currentPath[currentPath.length - 1].children || [];
    const currentCatalog = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null;

    // Если мы в каталоге, у которого нет дочерних папок
    if (currentCatalog && (!currentCatalog.children || currentCatalog.children.length === 0)) {
        return (
            <View style={styles.stateContainer}>
                <Folder size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>Папка пуста</Text>
                <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => selectCatalog(currentCatalog)}
                >
                    <Text style={styles.selectButtonText}>Выбрать в качестве каталога</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (items.length === 0) {
        return (
            <View style={styles.stateContainer}>
                <Folder size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>Нет доступных каталогов</Text>
            </View>
        );
    }

    return items.map(item => (
        <View key={item.id} style={styles.catalogRowContainer}>
            <TouchableOpacity style={styles.catalogSelectArea} onPress={() => setCurrentPath([...currentPath, item])}>
                <Folder size={20} color="#2A6E3F" />
                <Text style={styles.catalogItemText} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.catalogNavButton} onPress={() => selectCatalog(item)}>
                <View style={styles.verticalDivider} />
                <Text>Выбрать</Text>
            </TouchableOpacity>
        </View>
    ));
};

return (
    <>
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.dismiss}
                    activeOpacity={1}
                    onPress={handleClose}
                />

                <Animated.View
                    style={[
                        styles.sheet,
                        { transform: [{ translateY: panY }], paddingBottom: insets.bottom + 20 }
                    ]}
                >
                    <View {...mainPanResponder.panHandlers} style={styles.dragArea}>
                        <View style={styles.dragIndicator} />
                        <Text style={styles.title}>Прикрепить файл</Text>
                    </View>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                    >
                    <ScrollView
                        style={styles.form}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.field}>
                            <Text style={styles.label}>
                                Каталог назначения <Text style={styles.requiredStar}>*</Text>
                            </Text>
                            <TouchableOpacity style={styles.selector} onPress={openPickerAnim}>
                                <Text style={[styles.selectorText, !selectedCatalog && styles.placeholderText]}>
                                    {selectedCatalog ? selectedCatalog.name : 'Выберите каталог'}
                                </Text>
                                <Folder size={18} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>
                                Файл <Text style={styles.requiredStar}>*</Text>
                            </Text>
                            {selectedFile && selectedFile.assets?.[0] ? (
                                <View style={styles.documentPreviewCard}>
                                    <TouchableOpacity
                                        style={styles.previewContent}
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            const fileName = selectedFile.assets?.[0]?.name || selectedFile.file_name;
                                            if (fileName && isImageFile(fileName)) {
                                                setIsPreviewOpen(true);
                                            }
                                        }}
                                    >
                                        {(() => {
                                            const fileName = selectedFile.assets?.[0]?.name || selectedFile.file_name;
                                            if (fileName && isImageFile(fileName)) {
                                                const imageUri = selectedFile.file_name
                                                    ? `${apiUrl}/api/files/${encodeURIComponent(selectedFile.file_name)}`
                                                    : selectedFile.assets[0].uri;
                                                return (
                                                    <Image
                                                        source={{ uri: imageUri, headers: { Authorization: `Bearer ${token}` } }}
                                                        style={styles.thumbnail}
                                                    />
                                                );
                                            }
                                            return (
                                                <View style={styles.fileIconContainer}>
                                                    <FileText size={24} color="#2A6E3F" />
                                                </View>
                                            );
                                        })()}
                                        <View style={styles.fileInfo}>
                                            <Text style={styles.documentName} numberOfLines={1}>
                                                {selectedFile.assets?.[0]?.name || selectedFile.file_name || 'Файл'}
                                            </Text>
                                            <Text style={styles.fileStatus}>
                                                {selectedFile.size ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} МБ` : ''}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => setSelectedFile(null)}
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
                                                Загрузка: {Math.round(uploadProgress * 50)}%
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
                                        <>
                                            <Text style={[styles.selectorText, styles.placeholderText]} numberOfLines={1}>
                                                Выберите файл
                                            </Text>
                                            <Upload size={18} color="#94a3b8" />
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Описание</Text>
                            <TextInput
                                style={styles.textArea}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Введите краткое описание документа..."
                                placeholderTextColor="#9ca3af"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Статус обработки</Text>
                            <View style={styles.selectWrapper}>
                                <TouchableOpacity
                                    style={[styles.selector, isStatusSelectOpen && styles.selectorActive]}
                                    onPress={() => setIsStatusSelectOpen(!isStatusSelectOpen)}
                                >
                                    <Text style={[styles.selectorText, !status && styles.placeholderText]}>
                                        {status ? FILE_STATUSES[status] : 'Выберите статус'}
                                    </Text>
                                    <View pointerEvents="none">
                                        <ChevronDown size={18} color="#94a3b8" />
                                    </View>
                                </TouchableOpacity>

                                {isStatusSelectOpen && (
                                    <View style={styles.selectDropdown}>
                                        {Object.entries(FILE_STATUSES).map(([key, value]) => (
                                            <TouchableOpacity
                                                key={key}
                                                style={[styles.selectItem, status === key && styles.selectItemSelected]}
                                                onPress={() => {
                                                    setStatus(key as FileStatus);
                                                    setIsStatusSelectOpen(false);
                                                }}
                                            >
                                                <Text style={[styles.selectItemText, status === key && styles.selectItemTextSelected]}>
                                                    {value}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.label}>Дата начала</Text>
                                <TouchableOpacity style={styles.selector} onPress={() => setStartPickerVisible(true)}>
                                    <Text style={[styles.selectorText, !startDate && styles.placeholderText]}>
                                        {startDate ? formatDate(startDate) : 'Не задана'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.label}>Дата окончания</Text>
                                <TouchableOpacity style={styles.selector} onPress={() => setEndPickerVisible(true)}>
                                    <Text style={[styles.selectorText, !endDate && styles.placeholderText]}>
                                        {endDate ? formatDate(endDate) : 'Не задана'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {error && (
                            <View style={styles.formError}>
                                <AlertCircle size={18} color="#ef4444" />
                                <Text style={styles.formErrorText}>{error}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.uploadButton, (!selectedFile || !selectedCatalog || uploading) && styles.uploadButtonDisabled]}
                            onPress={uploadFile}
                            disabled={!selectedFile || !selectedCatalog || uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <>
                                    <Upload size={20} color="white" />
                                    <Text style={styles.uploadButtonText}>Сохранить документ</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                    </KeyboardAvoidingView>
                </Animated.View>
            </View>
        </Modal>

        <Modal visible={showCatalogPicker} transparent animationType="none" onRequestClose={closePickerAnim}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.dismiss} activeOpacity={1} onPress={closePickerAnim} />
                <Animated.View style={[styles.sheet, { transform: [{ translateY: panYPicker }], height: SCREEN_HEIGHT * 0.85, paddingBottom: insets.bottom + 20 }]}>
                    <View {...pickerPanResponder.panHandlers} style={styles.dragArea}>
                        <View style={styles.dragIndicator} />
                        <Text style={styles.title}>Выбор папки</Text>
                    </View>

                    {currentPath.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.breadcrumbContainer}>
                            <View style={styles.breadcrumbItem}>
                                <TouchableOpacity onPress={() => setCurrentPath([])}>
                                    <View pointerEvents="none">
                                        <Home color="#2A6E3F" size={18} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                            {currentPath.map((item, index) => (
                                <View key={item.id} style={styles.breadcrumbItem}>
                                    <Text style={styles.breadcrumbSeparator}> / </Text>
                                    <TouchableOpacity onPress={() => setCurrentPath(currentPath.slice(0, index + 1))}>
                                        <Text style={styles.breadcrumbText}>{item.name}</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    )}

                    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 10 }}>
                        {renderCatalogContent()}
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>

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
                {selectedFile && (() => {
                    const imageUri = selectedFile.file_name
                        ? `${apiUrl}/api/files/${encodeURIComponent(selectedFile.file_name)}`
                        : selectedFile.assets?.[0]?.uri;
                    if (imageUri) {
                        return (
                            <Image
                                source={{ uri: imageUri, headers: { Authorization: `Bearer ${token}` } }}
                                style={styles.fullImage}
                                resizeMode="contain"
                            />
                        );
                    }
                    return null;
                })()}

                <View style={[styles.previewFooter, { paddingBottom: insets.bottom + 20 }]}>
                    <Text style={styles.previewFooterText}>
                        {selectedFile?.assets?.[0]?.name || selectedFile?.file_name || 'Файл'}
                    </Text>
                </View>
            </View>
        </Modal>

        <DateTimePickerModal
            isVisible={isStartPickerVisible}
            mode="datetime"
            onConfirm={handleStartDateConfirm}
            onCancel={() => setStartPickerVisible(false)}
        />
        <DateTimePickerModal
            isVisible={isEndPickerVisible}
            mode="datetime"
            onConfirm={handleEndDateConfirm}
            onCancel={() => setEndPickerVisible(false)}
        />
    </>
);
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
    },
    staticSheet: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '80%',
        paddingHorizontal: 20,
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
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0b2340',
        marginBottom: 10,
        textAlign: 'center'
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    closeButton: {
        padding: 4,
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
    },
    form: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 150,
        paddingTop: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    field: {
        marginBottom: 18,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 6,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
    },
    selectorActive: {
        borderColor: '#2A6E3F',
        backgroundColor: '#f0fdf4',
    },
    selectorText: {
        fontSize: 15,
        color: '#0f172a',
        flex: 1,
        marginRight: 8,
    },
    placeholderText: {
        color: '#94a3b8',
    },
    textArea: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#0f172a',
        minHeight: 100,
    },
    selectWrapper: {
        position: 'relative',
        zIndex: 1000,
    },
    selectDropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        marginTop: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        zIndex: 1001,
        overflow: 'hidden',
    },
    selectItem: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    selectItemSelected: {
        backgroundColor: '#f0fdf4',
    },
    selectItemText: {
        fontSize: 15,
        color: '#334155',
    },
    selectItemTextSelected: {
        color: '#2A6E3F',
        fontWeight: '600',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: '#2A6E3F',
        marginTop: 8,
        gap: 8,
        shadowColor: '#2A6E3F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    uploadButtonDisabled: {
        backgroundColor: '#cbd5e1',
        shadowOpacity: 0,
        elevation: 0,
    },
    uploadButtonText: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '600',
    },
    breadcrumbContainer: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        maxHeight: 50,
    },
    breadcrumbItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    breadcrumbSeparator: {
        fontSize: 15,
        color: '#94a3b8',
        marginHorizontal: 4,
    },
    breadcrumbText: {
        fontSize: 15,
        color: '#2A6E3F',
        fontWeight: '500',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    backButtonText: {
        fontSize: 15,
        color: '#2A6E3F',
        fontWeight: '600',
    },
    catalogList: {
        maxHeight: SCREEN_HEIGHT * 0.5,
    },
    catalogItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    catalogItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    stateContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
    },
    errorText: {
        marginTop: 12,
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
    },
    retryButtonText: {
        color: '#334155',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
    },
    formError: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#fecaca',
        gap: 10,
    },
    formErrorText: {
        fontSize: 14,
        color: '#b91c1c',
        flex: 1,
    },
    catalogRowContainer: {
        flexDirection: 'row',
        alignItems: 'stretch',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        minHeight: 56,
    },
    catalogSelectArea: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
    },
    catalogNavButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    verticalDivider: {
        width: 1,
        height: '60%',
        backgroundColor: '#f1f5f9',
        marginRight: 12,
    },
    catalogItemText: {
        fontSize: 15,
        color: '#0f172a',
        fontWeight: '500',
        flex: 1,
    },
    requiredStar: {
        color: '#ef4444',
        fontSize: 18,
        fontWeight: '600',
    },
    selectButton: {
        marginTop: 20,
        borderColor: '#2A6E3F',
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignItems: 'center',
    },
    selectButtonText: {
        color: '#2A6E3F',
        fontSize: 16,
        fontWeight: '500',
    },
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
    addDocumentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        borderStyle: 'dashed',
    },
    addDocumentText: {
        fontSize: 15,
        color: '#2A6E3F',
        fontWeight: '500',
    },
    documentPreviewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
    },
    previewContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 6,
        gap: 12,
    },
    thumbnail: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
    },
    fileIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileInfo: {
        flex: 1,
    },
    documentName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#0f172a',
        marginBottom: 4,
    },
    fileStatus: {
        fontSize: 12,
        color: '#64748b',
    },
    removeButton: {
        padding: 12,
        borderLeftWidth: 1,
        borderLeftColor: '#e2e8f0',
    },
});
