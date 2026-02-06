import { CatalogItem, catalogService } from '@/api/catalogService';
import { Document, documentService } from '@/api/documentService';
import * as DocumentPicker from 'expo-document-picker';
import {
    File,
    FileSpreadsheet,
    FileText,
    Folder,
} from 'lucide-react-native';
import { useState } from 'react';

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
    getFileIcon: (item: CatalogItem, size?: number) => JSX.Element;
    getFileSize: (fileSize: number) => string;
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
                    parentId: null,
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
                const emptyRoot: CatalogItem = { id: 'empty', name: label, parentId: null, type: 'catalog' };
                setCurrentRootCatalog(emptyRoot);
                setCatalogHierarchy(new Map());
                
                setCurrentCatalog(emptyRoot);
                setCurrentCatalogLabel(label);
                setBreadcrumbPath([{ id: 'empty', name: label }]);
            }
        } catch (error: any) {
            console.error('[FileManager] Ошибка при загрузке каталога:', error);
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
            
            handleOpenCatalog(catalogType, selectedPath.name);
            return;
        }

        const catalogInHierarchy = catalogHierarchy.get(selectedPath.id);
        
        if (catalogInHierarchy) {
            if (catalogInHierarchy.children && catalogInHierarchy.children.length > 0) {
                const newPath = breadcrumbPath.slice(0, index + 1);
                setBreadcrumbPath(newPath);
                setCurrentCatalog(catalogInHierarchy);
                setDocuments([]);
                return;
            }
        }

        const newPath = breadcrumbPath.slice(0, index + 1);
        setBreadcrumbPath(newPath);

        setLoading(true);
        setError(null);
        setDocuments([]);

        try {
            const docs = await documentService.getDocumentsByCatalog(selectedPath.id);
            setDocuments(docs);
            setCurrentCatalog({
                id: selectedPath.id,
                name: selectedPath.name,
                parentId: null,
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
        setDocuments([]);
        try {
            const docs = await documentService.getDocumentsByCatalog(catalog.id);
            setDocuments(docs);
            setCurrentCatalog(catalog);
            setBreadcrumbPath([...breadcrumbPath, { id: catalog.id, name: catalog.name }]);
        } catch (err: any) {
            console.error('[FileManager] Ошибка при загрузке документов:', err);
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

        try {
            const parentId = currentCatalog?.id && currentCatalog.id !== 'empty' ? currentCatalog.id : undefined;
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
                        parentId: null,
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
                            const docs = await documentService.getDocumentsByCatalog(currentCatalogId);
                            setDocuments(docs);
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

    const getFileIcon = (item: CatalogItem, size = 20): JSX.Element => {
        if (item.children) {
            return <Folder size={size} color="#2A6E3F" />;
        }

        const ext = item.name.split('.').pop()?.toLowerCase();

        switch (ext) {
            case 'pdf':
                return <FileText size={size} color="#ef4444" />;
            case 'doc':
            case 'docx':
                return <FileText size={size} color="#3b82f6" />;
            case 'xls':
            case 'xlsx':
                return <FileSpreadsheet size={size} color="#16a34a" />;
            default:
                return <File size={size} color="#6b7280" />;
        }
    };

    const getFileSize = (fileSize: number): string => {
        if (fileSize > 0) {
            return `${(fileSize / 1024).toFixed(2)} КБ`;
        }
        return 'N/A';
    };

    const handleUploadFile = async () => {
        if (!currentCatalog || currentCatalog.id === 'empty') {
            setUploadError('Выберите каталог для загрузки файла');
            return;
        }

        try {
            setUploading(true);
            setUploadError(null);

            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
            });

            if (result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                
                const uploadedDoc = await documentService.uploadDocument(
                    {
                        uri: file.uri,
                        name: file.name,
                        type: file.mimeType || 'application/octet-stream',
                    },
                    currentCatalog.id
                );

                console.log('[FileManager] Файл успешно загружен:', uploadedDoc);
                
                // Перезагружаем документы в текущем каталоге
                const updatedDocs = await documentService.getDocumentsByCatalog(currentCatalog.id);
                setDocuments(updatedDocs);
            }
        } catch (error: any) {
            console.error('[FileManager] Ошибка при загрузке файла:', error);
            setUploadError(error?.message || 'Не удалось загрузить файл');
        } finally {
            setUploading(false);
        }
    };

    const displayCatalogs = currentCatalog?.children || [];

    const filteredCatalogs = displayCatalogs.filter((cat: CatalogItem) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredDocuments = documents.filter((doc: Document) =>
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
        getFileIcon,
        getFileSize,
    };

    const computed: FileManagerComputed = {
        displayCatalogs,
        filteredCatalogs,
        filteredDocuments,
    };

    return { state, handlers, computed };
};
