import { CatalogItem, catalogService } from '@/api/catalogService';
import { Document, documentService } from '@/api/documentService';
import * as DocumentPicker from 'expo-document-picker';
import {
    File,
    FileSpreadsheet,
    FileText,
    Folder,
    Presentation,
    Archive,
    Music,
    Video,
} from 'lucide-react-native';

import {JSX, useMemo, useRef, useState} from 'react';
import {AuthManager} from "@/components/LoginScreen/LoginScreen";
import * as FileSystem from 'expo-file-system/legacy';
import {apiUrl} from "@/api/api";
import Toast from "react-native-toast-message";
import { open } from 'react-native-file-viewer-turbo';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import {Alert} from "react-native";

export interface FileManagerState {
    currentCatalog: CatalogItem | null;
    currentCatalogLabel: string;
    searchQuery: string;
    loading: boolean;
    error: string | null;
    documents: Document[];
    showCreateModal: boolean;
    catalogName: string;
    creatingCatalog: boolean;
    createError: string | null;
    breadcrumbPath: { id: string; name: string }[];
    currentRootCatalog: CatalogItem | null;
    catalogHierarchy: Map<string, CatalogItem>;
    selectedDocument: Document | null;
    showDocumentDetailModal: boolean;
    isRefreshing: boolean;
    uploading: boolean;
    uploadProgress: number;
}

export interface FileManagerHandlers {
    handleOpenCatalog: (type: 'public' | 'mine' | 'deputy', label: string) => Promise<void>;
    handleGoBack: () => void;
    handleBreadcrumbClick: (index: number) => Promise<void>;
    handleOpenChildCatalog: (catalog: CatalogItem) => Promise<void>;
    handleOpenCreateModal: () => void;
    handleCreateCatalog: () => Promise<void>;
    handleSearchChange: (query: string) => void;
    handleCloseCreateModal: () => void;
    handleCatalogNameChange: (name: string) => void;
    handleUploadFile: () => Promise<void>;
    handleOpenDocumentDetail: (document: Document) => void;
    handleCloseDocumentDetail: () => void;
    handleDeleteDocument: (documentId: string) => Promise<void>;
    getFileIcon: (item: CatalogItem, size?: number) => JSX.Element;
    getFileSize: (fileSize: number) => string;
    handleRefresh: () => Promise<void>;
    handleDownloadDocument: (doc: Document) => Promise<void>;
    handleStatusChange: (documentId: string, newStatus: string) => Promise<Document>;
    cancelUpload: () => void;
}

export interface FileManagerComputed {
    displayCatalogs: CatalogItem[];
    filteredCatalogs: CatalogItem[];
    filteredDocuments: Document[];
}

export const useFileManagerPresenter = () => {
    const [currentCatalog, setCurrentCatalog] = useState<CatalogItem | null>(null);
    const [currentCatalogLabel, setCurrentCatalogLabel] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [catalogName, setCatalogName] = useState('');
    const [creatingCatalog, setCreatingCatalog] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [breadcrumbPath, setBreadcrumbPath] = useState<{ id: string; name: string }[]>([]);
    const [currentRootCatalog, setCurrentRootCatalog] = useState<CatalogItem | null>(null);
    const [catalogHierarchy, setCatalogHierarchy] = useState<Map<string, CatalogItem>>(new Map());
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [documentsCache, setDocumentsCache] = useState<Map<string, Document[]>>(new Map());
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [showDocumentDetailModal, setShowDocumentDetailModal] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const xhrRef = useRef<XMLHttpRequest | null>(null);

    // Функция для построения плоской карты каталогов для быстрого поиска
    const buildCatalogMap = (catalogs: CatalogItem[], map: Map<string, CatalogItem> = new Map()): Map<string, CatalogItem> => {
        catalogs.forEach(catalog => {
            map.set(catalog.id, catalog);
            if (catalog.children && catalog.children.length > 0) {
                buildCatalogMap(catalog.children, map);
            }
        });
        return map;
    };

    const loadDocumentsWithCache = async (catalogId: string): Promise<Document[]> => {
        if (documentsCache.has(catalogId)) {
            return documentsCache.get(catalogId) || [];
        }
        const docs = await documentService.getDocumentsByCatalog(catalogId);

        const newCache = new Map(documentsCache);
        newCache.set(catalogId, docs);
        setDocumentsCache(newCache);

        return docs;
    };

    const handleOpenCatalog = async (type: 'public' | 'mine' | 'deputy', label: string) => {
        setLoading(true);
        setError(null);
        setDocuments([]);
        try {
            let catalogs: CatalogItem[];

            if (type === 'public') {
                catalogs = await catalogService.getPublicCatalogs();
            } else if (type === 'mine') {
                catalogs = await catalogService.getMysCatalogs();
            } else {
                catalogs = await catalogService.getDeputyCatalogs();
            }

            if (catalogs.length > 0) {
                const rootCatalog: CatalogItem = {
                    id: `root-${type}`,
                    name: label,
                    parent_catalog_id: null,
                    type: 'catalog',
                    children: catalogs,
                };
                setCurrentRootCatalog(rootCatalog);
                const hierarchy = buildCatalogMap([rootCatalog]);
                setCatalogHierarchy(hierarchy);

                setCurrentCatalog(rootCatalog);
                setCurrentCatalogLabel(label);
                setBreadcrumbPath([{ id: rootCatalog.id, name: label }]);
            } else {
                const emptyRoot: CatalogItem = { id: 'empty', name: label, parent_catalog_id: null, type: 'catalog' };
                setCurrentRootCatalog(emptyRoot);
                setCatalogHierarchy(new Map());

                setCurrentCatalog(emptyRoot);
                setCurrentCatalogLabel(label);
                setBreadcrumbPath([{ id: 'empty', name: label }]);
            }
        } catch (error: any) {
            setError(error?.message || 'Не удалось загрузить каталог');
            setCurrentCatalog(null);
            setCurrentCatalogLabel('');
        } finally {
            setLoading(false);
        }
    };

    const handleGoBack = () => {
        setCurrentCatalog(null);
        setCurrentCatalogLabel('');
        setSearchQuery('');
        setError(null);
        setDocuments([]);
        setBreadcrumbPath([]);
        setCurrentRootCatalog(null);
        setCatalogHierarchy(new Map());
    };

    const handleBreadcrumbClick = async (index: number) => {
        if (index === -1) {
            handleGoBack();
            return;
        }

        const selectedPath = breadcrumbPath[index];

        if (selectedPath.id.startsWith('root-')) {
            let catalogType: 'public' | 'mine' | 'deputy' = 'public';
            if (selectedPath.id === 'root-public') catalogType = 'public';
            else if (selectedPath.id === 'root-mine') catalogType = 'mine';
            else if (selectedPath.id === 'root-deputy') catalogType = 'deputy';

            await handleOpenCatalog(catalogType, selectedPath.name);
            return;
        }

        const catalogInHierarchy = catalogHierarchy.get(selectedPath.id);

        if (catalogInHierarchy) {
            if (catalogInHierarchy.children && catalogInHierarchy.children.length > 0) {
                const newPath = breadcrumbPath.slice(0, index + 1);
                setBreadcrumbPath(newPath);
                setCurrentCatalog(catalogInHierarchy);
                setLoading(true);
                try {
                    const cachedDocs = await loadDocumentsWithCache(catalogInHierarchy.id);
                    setDocuments(cachedDocs);
                } catch (err: any) {
                    console.error('[FileManager] Ошибка при загрузке документов:', err);
                    setError(err?.message || 'Не удалось загрузить документы');
                    setDocuments([]);
                } finally {
                    setLoading(false);
                }
                return;
            }
        }

        const newPath = breadcrumbPath.slice(0, index + 1);
        setBreadcrumbPath(newPath);

        setLoading(true);
        setError(null);

        try {
            const docs = await loadDocumentsWithCache(selectedPath.id);
            setDocuments(docs);
            setCurrentCatalog({
                id: selectedPath.id,
                name: selectedPath.name,
                parent_catalog_id: null,
                type: 'catalog',
            });
        } catch (err: any) {
            console.error('[FileManager] Ошибка при переходе:', err);
            setError(err?.message || 'Не удалось загрузить каталог');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChildCatalog = async (catalog: CatalogItem) => {
        setLoading(true);
        setError(null);
        try {
            const docs = await loadDocumentsWithCache(catalog.id);
            setDocuments(docs);
            setCurrentCatalog(catalog);
            setBreadcrumbPath([...breadcrumbPath, { id: catalog.id, name: catalog.name }]);
        } catch (err: any) {
            setError(err?.message || 'Не удалось загрузить документы');
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreateModal = () => {
        setCatalogName('');
        setCreateError(null);
        setShowCreateModal(true);
    };

    const handleCloseCreateModal = () => {
        setShowCreateModal(false);
        setCatalogName('');
        setCreateError(null);
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
    };

    const handleCatalogNameChange = (name: string) => {
        setCatalogName(name);
    };

    const handleCreateCatalog = async () => {
        if (!catalogName.trim()) {
            setCreateError('Введите название каталога');
            return;
        }

        setCreatingCatalog(true);
        setCreateError(null);
        let parentId: string | undefined = undefined;

        try {
            if (
                currentCatalog?.id &&
                currentCatalog.id !== 'empty' &&
                !currentCatalog.id.startsWith('root-')
            ) {
                parentId = currentCatalog.id;
            }
            const currentBreadcrumbPath = [...breadcrumbPath];
            const currentCatalogId = currentCatalog?.id;

            if (currentCatalogLabel === 'Личный') {
                await catalogService.createPrivateCatalog(catalogName.trim(), parentId);
            } else {
                await catalogService.createPublicCatalog(catalogName.trim(), parentId);
            }

            handleCloseCreateModal();

            if (currentCatalog && currentCatalogId) {
                const catalogType = currentCatalogLabel === 'Личный' ? 'mine' :
                                  currentCatalogLabel === 'Каталог депутата' ? 'deputy' : 'public';

                let updatedCatalogs: CatalogItem[];

                if (catalogType === 'public') {
                    updatedCatalogs = await catalogService.getPublicCatalogs();
                } else if (catalogType === 'mine') {
                    updatedCatalogs = await catalogService.getMysCatalogs();
                } else {
                    updatedCatalogs = await catalogService.getDeputyCatalogs();
                }

                if (updatedCatalogs.length > 0) {
                    const rootCatalog: CatalogItem = {
                        id: `root-${catalogType}`,
                        name: currentCatalogLabel,
                        parent_catalog_id: null,
                        type: 'catalog',
                        children: updatedCatalogs,
                    };

                    const hierarchy = buildCatalogMap([rootCatalog]);
                    setCatalogHierarchy(hierarchy);
                    setCurrentRootCatalog(rootCatalog);

                    if (currentCatalogId.startsWith('root-')) {
                        setCurrentCatalog(rootCatalog);
                    } else {
                        const updatedCatalog = hierarchy.get(currentCatalogId);
                        if (updatedCatalog) {
                            setCurrentCatalog(updatedCatalog);
                            // Инвалидируем кэш для текущего каталога
                            const newCache = new Map(documentsCache);
                            newCache.delete(currentCatalogId);
                            setDocumentsCache(newCache);
                            // Загружаем обновленный список документов
                            const docs = await documentService.getDocumentsByCatalog(currentCatalogId);
                            setDocuments(docs);
                            // Добавляем в кэш
                            const updatedCache = new Map(newCache);
                            updatedCache.set(currentCatalogId, docs);
                            setDocumentsCache(updatedCache);
                        }
                    }

                    setBreadcrumbPath(currentBreadcrumbPath);
                }
            }
        } catch (err: any) {
            console.error('[FileManager] Ошибка при создании каталога:', err);
            setCreateError(err?.message || 'Не удалось создать каталог');
        } finally {
            setCreatingCatalog(false);
        }
    };

    const handleRefresh = async () => {
        // Если мы не выбрали ни один раздел (мы на главном экране), обновлять нечего
        if (!currentCatalog && breadcrumbPath.length === 0) return;

        setIsRefreshing(true);
        setError(null);

        try {
            // 1. Определяем текущий корневой раздел для обновления структуры папок
            let catalogType: 'public' | 'mine' | 'deputy' | null = null;
            if (breadcrumbPath.length > 0) {
                const rootId = breadcrumbPath[0].id;
                if (rootId === 'root-public') catalogType = 'public';
                else if (rootId === 'root-mine') catalogType = 'mine';
                else if (rootId === 'root-deputy') catalogType = 'deputy';
            }

            // 2. Обновляем иерархию папок
            if (catalogType) {
                let updatedCatalogs: CatalogItem[] = [];
                if (catalogType === 'public') {
                    updatedCatalogs = await catalogService.getPublicCatalogs();
                } else if (catalogType === 'mine') {
                    updatedCatalogs = await catalogService.getMysCatalogs();
                } else if (catalogType === 'deputy') {
                    updatedCatalogs = await catalogService.getDeputyCatalogs();
                }

                if (updatedCatalogs.length > 0) {
                    const rootCatalog: CatalogItem = {
                        id: `root-${catalogType}`,
                        name: breadcrumbPath[0].name,
                        parent_catalog_id: null,
                        type: 'catalog',
                        children: updatedCatalogs,
                    };

                    const hierarchy = buildCatalogMap([rootCatalog]);
                    setCatalogHierarchy(hierarchy);
                    setCurrentRootCatalog(rootCatalog);

                    // Обновляем текущий каталог новыми данными (если в нем создали новую подпапку)
                    if (currentCatalog) {
                        if (currentCatalog.id.startsWith('root-')) {
                            setCurrentCatalog(rootCatalog);
                        } else {
                            const updatedCurrent = hierarchy.get(currentCatalog.id);
                            if (updatedCurrent) {
                                setCurrentCatalog(updatedCurrent);
                            }
                        }
                    }
                }
            }

            // 3. Обновляем документы для текущей папки (если это не корень)
            if (currentCatalog && !currentCatalog.id.startsWith('root-') && currentCatalog.id !== 'empty') {
                const currentId = currentCatalog.id;

                // Удаляем старые данные из кэша
                const newCache = new Map(documentsCache);
                newCache.delete(currentId);
                setDocumentsCache(newCache);

                // Загружаем свежие документы
                const freshDocs = await documentService.getDocumentsByCatalog(currentId);
                setDocuments(freshDocs);

                // Сохраняем свежие документы в кэш
                const updatedCache = new Map(newCache);
                updatedCache.set(currentId, freshDocs);
                setDocumentsCache(updatedCache);
            }

        } catch (err: any) {
            console.error('[FileManager] Ошибка при обновлении:', err);
            setError(err?.message || 'Не удалось обновить данные');
        } finally {
            setIsRefreshing(false);
        }
    };

    const getFileIcon = (item: CatalogItem, size = 20): JSX.Element => {
        if (item.children) {
            return <Folder size={size} color="#2A6E3F" />;
        }

        const ext = item.name.split('.').pop()?.toLowerCase();

        switch (ext) {
            // Документы
            case 'pdf':
                return <FileText size={size} color="#ef4444" />;
            case 'doc':
            case 'docx':
                return <FileText size={size} color="#3b82f6" />;
            case 'xls':
            case 'xlsx':
                return <FileSpreadsheet size={size} color="#16a34a" />;
            case 'txt':
                return <FileText size={size} color="#6b7280" />;

            // Презентации
            case 'ppt':
            case 'pptx':
                return <Presentation size={size} color="#f97316" />;

            // Архивы
            case 'zip':
            case 'rar':
            case '7z':
            case 'tar':
            case 'gz':
                return <Archive size={size} color="#f59e0b" />;

            // Аудио
            case 'mp3':
            case 'wav':
            case 'ogg':
            case 'flac':
            case 'aac':
                return <Music size={size} color="#10b981" />;

            // Видео
            case 'mp4':
            case 'avi':
            case 'mkv':
            case 'mov':
            case 'wmv':
            case 'flv':
                return <Video size={size} color="#ef4444" />;

            default:
                return <File size={size} color="#6b7280" />;
        }
    };

    const getFileSize = (fileSize: number): string => {
        if (!fileSize || fileSize <= 0) return 'N/A';

        const units = ['Б', 'КБ', 'МБ', 'ГБ'];
        let size = fileSize;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    };

    // Функция загрузки файла с прогрессом
    const uploadFileToServer = async (fileInfo: { uri: string; name: string; mimeType?: string }, catalogId: string) => {
        return new Promise<Document>((resolve, reject) => {
            const formData = new FormData();

            // Добавляем файл
            formData.append('File', {
                uri: fileInfo.uri,
                name: fileInfo.name,
                type: fileInfo.mimeType || 'application/octet-stream',
            } as any);

            // Добавляем CatalogId как обычное поле form-data (не JSON)
            formData.append('CatalogId', catalogId);

            const xhr = new XMLHttpRequest();
            xhrRef.current = xhr;

            // Отслеживаем прогресс загрузки
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const progress = event.loaded / event.total;
                    setUploadProgress(progress);
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        // Пытаемся распарсить ответ как JSON
                        const response = JSON.parse(xhr.response);
                        resolve(response);
                    } catch (e) {
                        // Если ответ не JSON, возможно это просто текст
                        console.log('Response text:', xhr.response);
                        resolve({ id: xhr.response, success: true } as any);
                    }
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Network error during upload'));
            });

            xhr.addEventListener('abort', () => {
                reject(new Error('Upload cancelled'));
            });

            const token = AuthManager.getToken();

            // Используем правильный URL (как в curl)
            xhr.open('POST', `${apiUrl}/api/Documents/upload`);

            // Устанавливаем заголовки (Content-Type не устанавливаем, браузер сам добавит с boundary)
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.setRequestHeader('Accept', 'text/plain'); // Как в curl примере

            // Отправляем FormData
            xhr.send(formData);
        });
    };

// Обновленная функция handleUploadFile
    const handleUploadFile = async () => {
        if (!currentCatalog || currentCatalog.id === 'empty') {
            setUploadError('Выберите каталог для загрузки файла');
            return;
        }

        Alert.alert('Загрузить файл', 'Выберите источник', [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Галерея', onPress: () => processSelection('gallery') },
            { text: 'Файлы', onPress: () => processSelection('files') },
        ]);


        // Внутренняя логика обработки (чтобы не дублировать код загрузки ниже)
        const processSelection = async (source: 'gallery' | 'files') => {
            try {
                let result;

                if (source === 'gallery') {
                    result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.All,
                        quality: 0.8,
                    });
                } else {
                    result = await DocumentPicker.getDocumentAsync({
                        type: '*/*',
                        copyToCacheDirectory: true,
                    });
                }

                if (result.canceled || !result.assets?.length) return;

                // Начинаем процесс загрузки только после того, как файл выбран
                setUploading(true);
                setUploadProgress(0);
                setUploadError(null);

                const file = result.assets[0];

                // Нормализация данных (у ImagePicker и DocumentPicker разные имена полей)
                const fileName = (file as any).name || (file as any).fileName || file.uri.split('/').pop() || 'upload_file';
                const fileSize = (file as any).size || (file as any).fileSize || 0;
                const fileMime = file.mimeType || 'application/octet-stream';

                // Проверка размера (50 MB)
                const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
                if (fileSize > MAX_FILE_SIZE_BYTES) {
                    Toast.show({
                        type: 'error',
                        text1: 'Файл слишком большой',
                        text2: 'Максимальный размер 50 МБ',
                    });
                    setUploading(false);
                    return;
                }

                const currentCatalogId = currentCatalog.id;

                // 2. Сама загрузка (твоя функция)
                await uploadFileToServer(
                    {
                        uri: file.uri,
                        name: fileName,
                        mimeType: fileMime,
                    },
                    currentCatalogId
                );

                setUploadProgress(0);
                Toast.show({
                    type: 'success',
                    text1: 'Успех',
                    text2: 'Файл успешно загружен',
                });

                // 3. Обновление списка и кэша
                const newCache = new Map(documentsCache);
                newCache.delete(currentCatalogId);
                setDocumentsCache(newCache);

                const docs = await documentService.getDocumentsByCatalog(currentCatalogId);
                setDocuments(docs);

                const updatedCache = new Map(newCache);
                updatedCache.set(currentCatalogId, docs);
                setDocumentsCache(updatedCache);

            } catch (error: any) {
                console.error('[FileManager] Ошибка:', error);
                if (error.message !== 'Upload cancelled') {
                    setUploadError(error?.message || 'Не удалось загрузить файл');
                    Toast.show({
                        type: 'error',
                        text1: 'Ошибка',
                        text2: error?.message || 'Не удалось загрузить файл',
                    });
                }
                setUploadProgress(0);
            } finally {
                setUploading(false);
                xhrRef.current = null;
            }
        };
    };

// Функция для отмены загрузки
    const cancelUpload = () => {
        if (xhrRef.current) {
            xhrRef.current.abort();
            xhrRef.current = null;
        }
        setUploading(false);
        setUploadProgress(0);
        setUploadError(null);
    };


    const handleOpenDocumentDetail = (document: Document) => {
        setSelectedDocument(document);
        setShowDocumentDetailModal(true);
    };

    const handleCloseDocumentDetail = () => {
        setShowDocumentDetailModal(false);
        setSelectedDocument(null);
    };

    const MIME_TO_EXT: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'text/plain': 'txt',
        // добавь другие по необходимости
    };

    const handleDownloadDocument = async (doc: Document) => {
        try {
            const token = AuthManager.getToken();

            const extension = doc.content_type?.startsWith('.')
                ? doc.content_type
                : `.${MIME_TO_EXT[doc.content_type] || 'dat'}`;

            const localFileName = doc.file_name.endsWith(extension)
                ? doc.file_name
                : `${doc.file_name}${extension}`;

            const fileUri = `${FileSystem.documentDirectory}${localFileName}`;

            // --- ШАГ 1: ПРОВЕРКА ЛОКАЛЬНОГО ФАЙЛА ---
            const fileInfo = await FileSystem.getInfoAsync(fileUri);

            if (fileInfo.exists) {
                console.log('Файл найден локально, открываем...');
                await openFileWithFallback(fileUri, doc.content_type, localFileName);
                return; // Запрос на сервер не улетает
            }

            // --- ШАГ 2: ЕСЛИ ФАЙЛА НЕТ, СКАЧИВАЕМ ---
            const downloadUrl = `${apiUrl}/api/files/${encodeURIComponent(doc.file_name)}`;
            const tempUri = `${FileSystem.cacheDirectory}${doc.file_name}_temp`;

            Toast.show({
                type: 'info',
                text1: 'Загрузка...',
            });

            const downloadResult = await FileSystem.downloadAsync(
                downloadUrl,
                tempUri,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (downloadResult.status !== 200) throw new Error('Download failed');

            // Перемещаем из временного кеша в постоянные документы
            await FileSystem.moveAsync({
                from: tempUri,
                to: fileUri
            });

            await openFileWithFallback(fileUri, doc.content_type, localFileName);

        } catch (error) {
            console.error('Ошибка:', error);
            Toast.show({ type: 'error', text1: 'Ошибка', text2: 'Не удалось обработать файл' });
        }
    };

    const openFileWithFallback = async (uri: string, mime: string, name: string) => {
        try {
            // 1. Проверяем, поддерживает ли устройство шеринг (на всякий случай)
            const canShare = await Sharing.isAvailableAsync();

            if (!canShare) {
                throw new Error('Sharing not available');
            }

            try {
                await open(uri, {
                    showOpenWithDialog: true,
                    displayName: name
                });
            } catch (openError) {
                console.log('Прямое открытие не удалось, вызываем Sharing...');
                await triggerShare(uri, mime, name);
            }

        } catch (e) {
            // Если даже основной блок упал, принудительно вызываем шеринг
            await triggerShare(uri, mime, name);
        }
    };

// Выносим Sharing в отдельную чистую функцию
    const triggerShare = async (uri: string, mime: string, name: string) => {
        try {
            await Sharing.shareAsync(uri, {
                mimeType: mime,
                dialogTitle: `Открыть файл: ${name}`,
                UTI: mime,
            });
        } catch (finalError) {
            Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: 'Нет приложений для обработки этого файла'
            });
        }
    };

    const handleDeleteDocument = async (documentId: string) => {
        try {
            await documentService.deleteDocument(documentId);

            // Удаляем документ из текущего списка
            const updatedDocuments = documents.filter(doc => doc.id !== documentId);
            setDocuments(updatedDocuments);

            // Инвалидируем кэш для текущего каталога
            if (currentCatalog) {
                const newCache = new Map(documentsCache);
                newCache.delete(currentCatalog.id);
                setDocumentsCache(newCache);
            }

            console.log('[FileManager] Документ успешно удален');
        } catch (error: any) {
            console.error('[FileManager] Ошибка при удалении документа:', error);
            throw error;
        }
    };

    const handleStatusChange = async (documentId: string, newStatus: string) => {
        try {
            const updated = await documentService.updateDocumentStatus(documentId, newStatus);
            // Обновить локальный список документов при необходимости
            return updated;
        } catch (error) {
            console.error('Ошибка изменения статуса:', error);
            throw error;
        }
    };

    const displayCatalogs = currentCatalog?.children || [];

    const filteredCatalogs = useMemo(() => {
        return displayCatalogs.filter(cat =>
            cat.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [displayCatalogs, searchQuery]);

    const filteredDocuments = useMemo(() => {
        return documents.filter(doc =>
            doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [documents, searchQuery]);

    const state: FileManagerState = {
        currentCatalog,
        currentCatalogLabel,
        searchQuery,
        loading,
        error,
        documents,
        showCreateModal,
        catalogName,
        creatingCatalog,
        createError,
        breadcrumbPath,
        currentRootCatalog,
        catalogHierarchy,
        selectedDocument,
        showDocumentDetailModal,
        isRefreshing,
        uploading,
        uploadProgress
    };

    const handlers: FileManagerHandlers = {
        handleOpenCatalog,
        handleGoBack,
        handleBreadcrumbClick,
        handleOpenChildCatalog,
        handleOpenCreateModal,
        handleCreateCatalog,
        handleSearchChange,
        handleCloseCreateModal,
        handleCatalogNameChange,
        handleUploadFile,
        handleOpenDocumentDetail,
        handleCloseDocumentDetail,
        handleDeleteDocument,
        getFileIcon,
        getFileSize,
        handleRefresh,
        handleDownloadDocument,
        handleStatusChange,
        cancelUpload
    };

    const computed: FileManagerComputed = {
        displayCatalogs,
        filteredCatalogs,
        filteredDocuments,
    };

    return { state, handlers, computed };
};
