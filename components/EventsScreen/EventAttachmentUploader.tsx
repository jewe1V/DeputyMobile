import { apiClient, apiUrl, xAppSecret } from '@/api/api';
import { CatalogItem, catalogService } from '@/api/catalogService';
import { AuthManager } from '@/components/LoginScreen/LoginScreen';
import DateTimePickerModal from "@/components/ui/Shared/DateTimePickerModal";
import { SkeletonItem } from "@/components/ui/Shared/SkeletonLoader";
import { BottomSheetModal } from '@/components/ui/BottomSheetModal/BottomSheetModal';
import { useTheme } from '@/context/ThemeContext';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from "expo-image-picker";
import {
    AlertCircle,
    ChevronDown,
    FileText,
    Folder,
    Home,
    Upload,
    X
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

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
        } else {
            resetForm();
        }
    }, [visible, fetchCatalogs]);

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

    const uploadFileToServer = async (fileInfo: { uri: string; name: string; mimeType?: string; file?: File }) => {
        try {
            setError(null);
            const mimeType = (fileInfo.file as any)?.type || fileInfo.mimeType;

            setSelectedFile({
                uri: fileInfo.uri,
                name: fileInfo.name,
                mimeType: mimeType,
                file: fileInfo.file,
                assets: [{
                    uri: fileInfo.uri,
                    name: fileInfo.name,
                    mimeType: mimeType
                }]
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

    const pickFileFromWeb = async () => {
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
                    await uploadFileToServer({
                        uri: URL.createObjectURL(file),
                        name: file.name,
                        mimeType: file.type || 'application/octet-stream',
                        file: file
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

    const pickFromFiles = async () => {
        if (Platform.OS === 'web') {
            return pickFileFromWeb();
        }

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
        if (Platform.OS === 'web') {
            return pickFileFromWeb();
        }

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
        if (Platform.OS === 'web') {
            pickFileFromWeb();
            return;
        }

        Alert.alert('Загрузить файл', 'Выберите источник', [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Галерея', onPress: pickFromGallery },
            { text: 'Файлы', onPress: pickFromFiles },
        ]);
    };

    const uploadFile = async () => {
        if (!selectedFile) {
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

            const formData = new FormData();

            if (Platform.OS === 'web' && (selectedFile as any).file) {
                const token = AuthManager.getToken();
                const xhr = new XMLHttpRequest();
                xhrRef.current = xhr;

                const file = (selectedFile as any).file as File;
                formData.append('File', file);
                formData.append('CatalogId', selectedCatalog.id);
                if (status) formData.append('DocumentStatus', status);
                if (description) formData.append('description', description);
                if (startDate) formData.append('StartDate', startDate.toISOString());
                if (endDate) formData.append('EndDate', endDate.toISOString());

                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        setUploadProgress(event.loaded / event.total);
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        Toast.show({
                            type: 'success',
                            text1: 'Успех',
                            text2: 'Файл успешно загружен',
                            position: 'top',
                            visibilityTime: 3000,
                            topOffset: 50,
                        });
                        onClose();
                        resetForm();
                    } else {
                        throw new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`);
                    }
                });

                xhr.addEventListener('error', () => {
                    throw new Error('Network error during upload');
                });

                xhr.open('POST', `${apiUrl}/api/Events/${eventId}/attachments`);
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.setRequestHeader('X-App-Secret', xAppSecret);
                xhr.send(formData);
            } else {
                formData.append('File', {
                    uri: selectedFile.uri || selectedFile.assets?.[0]?.uri,
                    name: selectedFile.name || selectedFile.assets?.[0]?.name || 'file',
                    type: selectedFile.mimeType || selectedFile.assets?.[0]?.mimeType || 'application/octet-stream',
                } as any);

                formData.append('CatalogId', selectedCatalog.id);
                if (status) formData.append('DocumentStatus', status);
                if (description) formData.append('description', description);
                if (startDate) formData.append('StartDate', startDate.toISOString());
                if (endDate) formData.append('EndDate', endDate.toISOString());

                await apiClient.post(`/api/Events/${eventId}/attachments`, formData, {
                    headers: { 'Accept': 'text/plain' },
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            setUploadProgress(progressEvent.loaded / progressEvent.total);
                        }
                    }
                });

                Toast.show({
                    type: 'success',
                    text1: 'Успех',
                    text2: 'Файл успешно загружен',
                    position: 'top',
                    visibilityTime: 3000,
                    topOffset: 50,
                });
                onClose();
                resetForm();
            }
        } catch (error: any) {
            console.error('Ошибка при загрузке файла:', error);
            setError(error?.message || 'Не удалось загрузить файл. Попробуйте позже.');
            Alert.alert('Ошибка', error?.message || 'Не удалось загрузить файл');
        } finally {
            setUploading(false);
            setUploadProgress(0);
            if (xhrRef.current) {
                xhrRef.current = null;
            }
        }
    };

    const imageHeaders = {
        Authorization: `Bearer ${token}`,
        ...({ 'X-App-Secret': xAppSecret })
    };

    const renderCatalogContent = () => {
        if (loading) {
            return Array(6).fill(0).map((_, i) => <CatalogSkeletonRow key={i} />);
        }

        const items = currentPath.length === 0
            ? catalogs
            : currentPath[currentPath.length - 1].children || [];
        const currentCatalog = currentPath.length > 0
            ? currentPath[currentPath.length - 1]
            : null;

        if (currentCatalog && (!currentCatalog.children || currentCatalog.children.length === 0)) {
            return (
                <View style={styles.stateContainer}>
                    <Folder size={40} color={colors.subtext} />
                    <Text style={[styles.emptyText, { color: colors.subtext }]}>Папка пуста</Text>
                    <TouchableOpacity
                        style={[styles.selectButton, { borderColor: colors.primary }]}
                        onPress={() => selectCatalog(currentCatalog)}
                    >
                        <Text style={[styles.selectButtonText, { color: colors.primary }]}>Выбрать в качестве каталога</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (items.length === 0) {
            return (
                <View style={styles.stateContainer}>
                    <Folder size={40} color={colors.subtext} />
                    <Text style={[styles.emptyText, { color: colors.subtext }]}>Нет доступных каталогов</Text>
                </View>
            );
        }

        return items.map(item => (
            <View key={item.id} style={[styles.catalogRowContainer, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={styles.catalogSelectArea}
                    onPress={() => setCurrentPath([...currentPath, item])}
                >
                    <Folder size={20} color={colors.primary} />
                    <Text style={[styles.catalogItemText, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.catalogNavButton}
                    onPress={() => selectCatalog(item)}
                >
                    <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />
                    <Text style={{ color: colors.primary }}>Выбрать</Text>
                </TouchableOpacity>
            </View>
        ));
    };

    // Кастомный header для каталог-пикера с breadcrumbs
    const renderCatalogPickerHeader = () => (
        <View>
            <Text style={[styles.title, { color: colors.text }]}>Выбор папки</Text>
            {currentPath.length > 0 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={[styles.breadcrumbContainer, { borderBottomColor: colors.border }]}
                >
                    <View style={styles.breadcrumbItem}>
                        <TouchableOpacity onPress={() => setCurrentPath([])}>
                            <View pointerEvents="none">
                                <Home color={colors.primary} size={18} />
                            </View>
                        </TouchableOpacity>
                    </View>
                    {currentPath.map((item, index) => (
                        <View key={item.id} style={styles.breadcrumbItem}>
                            <Text style={[styles.breadcrumbSeparator, { color: colors.subtext }]}> / </Text>
                            <TouchableOpacity onPress={() => setCurrentPath(currentPath.slice(0, index + 1))}>
                                <Text style={[styles.breadcrumbText, { color: colors.primary }]}>{item.name}</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );

    return (
        <>
            {/* ===== Основная модалка ===== */}
            <BottomSheetModal
                visible={visible}
                onClose={onClose}
                title="Прикрепить файл"
                heightFraction={0.92}
                keyboardAvoiding
                scrollEnabled
                contentContainerStyle={styles.scrollContent}
            >
                {/* Каталог */}
                <View style={styles.field}>
                    <Text style={[styles.label, { color: colors.subtext }]}>
                        Каталог назначения <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TouchableOpacity
                        style={[styles.selector, { backgroundColor: isDark ? colors.background : '#f8fafc', borderColor: colors.border }]}
                        onPress={() => setShowCatalogPicker(true)}
                    >
                        <Text style={[styles.selectorText, { color: colors.text }, !selectedCatalog && styles.placeholderText]}>
                            {selectedCatalog ? selectedCatalog.name : 'Выберите каталог'}
                        </Text>
                        <Folder size={18} color={colors.subtext} />
                    </TouchableOpacity>
                </View>

                {/* Файл */}
                <View style={styles.field}>
                    <Text style={[styles.label, { color: colors.subtext }]}>
                        Файл <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    {selectedFile && selectedFile.assets?.[0] ? (
                        <View style={[styles.documentPreviewCard, { backgroundColor: isDark ? colors.background : '#f8fafc', borderColor: colors.border }]}>
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
                                                source={{ uri: imageUri, headers: imageHeaders }}
                                                style={[styles.thumbnail, { backgroundColor: colors.border }]}
                                            />
                                        );
                                    }
                                    return (
                                        <View style={[styles.fileIconContainer, { backgroundColor: colors.border }]}>
                                            <FileText size={24} color={colors.primary} />
                                        </View>
                                    );
                                })()}
                                <View style={styles.fileInfo}>
                                    <Text style={[styles.documentName, { color: colors.text }]} numberOfLines={1}>
                                        {selectedFile.assets?.[0]?.name || selectedFile.file_name || 'Файл'}
                                    </Text>
                                    <Text style={[styles.fileStatus, { color: colors.subtext }]}>
                                        {selectedFile.size ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} МБ` : ''}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.removeButton, { borderLeftColor: colors.border }]}
                                onPress={() => setSelectedFile(null)}
                            >
                                <View pointerEvents="none">
                                    <X size={18} color={colors.text} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.addDocumentButton, { backgroundColor: isDark ? colors.background : '#f8fafc', borderColor: colors.border }]}
                            onPress={showUploadOptions}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <View style={styles.uploadProgressContainer}>
                                    <ActivityIndicator color={colors.primary} style={{ marginRight: 10 }} />
                                    <Text style={[styles.addDocumentText, { color: colors.primary }]}>
                                        Загрузка: {Math.round(uploadProgress * 50)}%
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
                                <>
                                    <Text style={[styles.selectorText, { color: colors.text }, styles.placeholderText]} numberOfLines={1}>
                                        Выберите файл
                                    </Text>
                                    <Upload size={18} color={colors.subtext} />
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {/* Описание */}
                <View style={styles.field}>
                    <Text style={[styles.label, { color: colors.subtext }]}>Описание</Text>
                    <TextInput
                        style={[styles.textArea, { backgroundColor: isDark ? colors.background : '#f8fafc', borderColor: colors.border, color: colors.text }]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Введите краткое описание документа..."
                        placeholderTextColor={colors.subtext}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                {/* Оверлей для закрытия дропдауна при нажатии вне */}
                {isStatusSelectOpen && (
                    <TouchableOpacity
                        style={styles.dropdownOverlay}
                        activeOpacity={1}
                        onPress={() => setIsStatusSelectOpen(false)}
                    />
                )}

                {/* Статус */}
                <View style={[styles.field, isStatusSelectOpen && styles.fieldOnTop]}>
                    <Text style={[styles.label, { color: colors.subtext }]}>Статус обработки</Text>

                    <View style={[styles.selectWrapper, isStatusSelectOpen && styles.selectWrapperOpen]}>
                        <TouchableOpacity
                            style={[styles.selector, { backgroundColor: isDark ? colors.background : '#f8fafc', borderColor: colors.border }, isStatusSelectOpen && styles.selectorActive, isStatusSelectOpen && { borderColor: colors.primary }]}
                            onPress={() => setIsStatusSelectOpen(prev => !prev)}
                            activeOpacity={0.85}
                        >
                            <Text style={[styles.selectorText, { color: colors.text }, !status && styles.placeholderText]}>
                                {status ? FILE_STATUSES[status] : 'Выберите статус'}
                            </Text>
                            <View pointerEvents="none">
                                <ChevronDown size={18} color={colors.subtext} />
                            </View>
                        </TouchableOpacity>

                        {isStatusSelectOpen && (
                            <View style={[styles.selectDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                {Object.entries(FILE_STATUSES).map(([key, value], index, arr) => (
                                    <TouchableOpacity
                                        key={key}
                                        style={[
                                            styles.selectItem,
                                            { backgroundColor: colors.card, borderBottomColor: colors.border },
                                            index === arr.length - 1 && styles.selectItemLast,
                                            status === key && [styles.selectItemSelected, { backgroundColor: isDark ? colors.primary + '20' : '#f0fdf4' }]
                                        ]}
                                        onPress={() => {
                                            setStatus(key as FileStatus);
                                            setIsStatusSelectOpen(false);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.selectItemText,
                                                { color: colors.text },
                                                status === key && [styles.selectItemTextSelected, { color: colors.primary }]
                                            ]}
                                        >
                                            {value}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </View>

                {/* Даты */}
                <View style={styles.row}>
                    <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                        <Text style={[styles.label, { color: colors.subtext }]}>Дата начала</Text>
                        <TouchableOpacity style={[styles.selector, { backgroundColor: isDark ? colors.background : '#f8fafc', borderColor: colors.border }]} onPress={() => setStartPickerVisible(true)}>
                            <Text style={[styles.selectorText, { color: colors.text }, !startDate && styles.placeholderText]}>
                                {startDate ? formatDate(startDate) : 'Не задана'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
                        <Text style={[styles.label, { color: colors.subtext }]}>Дата окончания</Text>
                        <TouchableOpacity style={[styles.selector, { backgroundColor: isDark ? colors.background : '#f8fafc', borderColor: colors.border }]} onPress={() => setEndPickerVisible(true)}>
                            <Text style={[styles.selectorText, { color: colors.text }, !endDate && styles.placeholderText]}>
                                {endDate ? formatDate(endDate) : 'Не задана'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Ошибка */}
                {error && (
                    <View style={[styles.formError, { backgroundColor: isDark ? '#450a0a' : '#fef2f2', borderColor: isDark ? '#991b1b' : '#fecaca' }]}>
                        <AlertCircle size={18} color="#ef4444" />
                        <Text style={[styles.formErrorText, { color: isDark ? '#fca5a5' : '#b91c1c' }]}>{error}</Text>
                    </View>
                )}

                {/* Кнопка загрузки */}
                <TouchableOpacity
                    style={[
                        styles.uploadButton,
                        { backgroundColor: colors.primary },
                        (!selectedFile || !selectedCatalog || uploading) && [styles.uploadButtonDisabled, { backgroundColor: colors.border }]
                    ]}
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
            </BottomSheetModal>

            {/* ===== Модалка выбора каталога ===== */}
            <BottomSheetModal
                visible={showCatalogPicker}
                onClose={() => {
                    setShowCatalogPicker(false);
                    setCurrentPath([]);
                }}
                heightFraction={0.85}
                renderHeader={renderCatalogPickerHeader}
                scrollEnabled={true}
            >
                {renderCatalogContent()}
            </BottomSheetModal>

            {/* ===== Полноэкранный предпросмотр изображения ===== */}
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
                    {selectedFile && (() => {
                        const imageUri = selectedFile.file_name
                            ? `${apiUrl}/api/files/${encodeURIComponent(selectedFile.file_name)}`
                            : selectedFile.assets?.[0]?.uri;
                        if (imageUri) {
                            return (
                                <Image
                                    source={{ uri: imageUri, headers: imageHeaders }}
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

            {/* ===== Date pickers ===== */}
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
    dropdownOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 4999,
    },
    scrollContent: {
        paddingBottom: 150,
        paddingTop: 10,
        overflow: 'visible',
    },

    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 1,
    },

    field: {
        marginBottom: 18,
        zIndex: 1,
        overflow: 'visible',
    },

    fieldOnTop: {
        zIndex: 5000,
    },

    selectWrapper: {
        position: 'relative',
        zIndex: 1,
        overflow: 'visible',
    },

    selectWrapperOpen: {
        zIndex: 5000,
        elevation: 30,
    },

    selectDropdown: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        borderWidth: 1,
        borderRadius: 12,
        marginTop: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 30,
        zIndex: 5001,
        overflow: 'hidden',
    },

    selectItem: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },

    selectItemLast: {
        borderBottomWidth: 0,
    },

    selectItemSelected: {
    },

    selectItemText: {
        fontSize: 15,
    },

    selectItemTextSelected: {
        fontWeight: '600',
    },
    // Контент скролла
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 10,
        textAlign: 'center',
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderRadius: 12,
    },
    selectorActive: {
    },
    selectorText: {
        fontSize: 15,
        flex: 1,
        marginRight: 8,
    },
    placeholderText: {
        color: '#94a3b8',
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        minHeight: 100,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 14,
        marginTop: 8,
        gap: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    uploadButtonDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    uploadButtonText: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '600',
    },

    // Breadcrumbs
    breadcrumbContainer: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        maxHeight: 50,
    },
    breadcrumbItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    breadcrumbSeparator: {
        fontSize: 15,
        marginHorizontal: 4,
    },
    breadcrumbText: {
        fontSize: 15,
        fontWeight: '500',
    },

    // Каталоги
    stateContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 15,
        textAlign: 'center',
    },
    catalogRowContainer: {
        flexDirection: 'row',
        alignItems: 'stretch',
        borderBottomWidth: 1,
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
        marginRight: 12,
    },
    catalogItemText: {
        fontSize: 15,
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
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignItems: 'center',
    },
    selectButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },

    // Ошибка формы
    formError: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        gap: 10,
    },
    formErrorText: {
        fontSize: 14,
        flex: 1,
    },

    // Файл
    addDocumentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderRadius: 12,
        borderStyle: 'dashed',
    },
    addDocumentText: {
        fontSize: 15,
        fontWeight: '500',
    },
    documentPreviewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
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
    },
    fileIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileInfo: {
        flex: 1,
    },
    documentName: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    fileStatus: {
        fontSize: 12,
    },
    removeButton: {
        padding: 12,
        borderLeftWidth: 1,
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
