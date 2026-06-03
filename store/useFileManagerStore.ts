import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CatalogItem, catalogService } from '@/api/catalogService';
import { Document, documentService } from '@/api/documentService';
import Toast from 'react-native-toast-message';

interface FileManagerStore {
    rootCatalogs: Record<string, CatalogItem[]>; // 'public', 'mine', 'deputy'
    documentsCache: Record<string, Document[]>; // catalogId -> documents
    downloadedFiles: string[]; // list of doc.id that are downloaded
    isLoading: boolean;
    error: string | null;

    fetchRootCatalogs: (type: 'public' | 'mine' | 'deputy') => Promise<CatalogItem[]>;
    fetchDocuments: (catalogId: string, isRefresh?: boolean) => Promise<Document[]>;
    markAsDownloaded: (docId: string) => void;
    removeFromDownloaded: (docId: string) => void;
    invalidateCache: (catalogId: string) => void;
}

export const useFileManagerStore = create<FileManagerStore>()(
    persist(
        (set, get) => ({
            rootCatalogs: {},
            documentsCache: {},
            downloadedFiles: [],
            isLoading: false,
            error: null,

            fetchRootCatalogs: async (type) => {
                try {
                    set({ isLoading: true, error: null });
                    let catalogs: CatalogItem[] = [];
                    if (type === 'public') catalogs = await catalogService.getPublicCatalogs();
                    else if (type === 'mine') catalogs = await catalogService.getMysCatalogs();
                    else catalogs = await catalogService.getDeputyCatalogs();

                    set(state => ({
                        rootCatalogs: { ...state.rootCatalogs, [type]: catalogs },
                        isLoading: false
                    }));
                    return catalogs;
                } catch (e) {
                    set({ isLoading: false, error: 'Ошибка загрузки каталогов' });
                    return get().rootCatalogs[type] || [];
                }
            },

            fetchDocuments: async (catalogId, isRefresh = false) => {
                try {
                    if (!isRefresh && !get().documentsCache[catalogId]) {
                        set({ isLoading: true });
                    }
                    const docs = await documentService.getDocumentsByCatalog(catalogId);
                    set(state => ({
                        documentsCache: { ...state.documentsCache, [catalogId]: docs },
                        isLoading: false
                    }));
                    return docs;
                } catch (e) {
                    set({ isLoading: false });
                    return get().documentsCache[catalogId] || [];
                }
            },

            markAsDownloaded: (docId) => {
                set(state => ({
                    downloadedFiles: state.downloadedFiles.includes(docId)
                        ? state.downloadedFiles
                        : [...state.downloadedFiles, docId]
                }));
            },

            removeFromDownloaded: (docId) => {
                set(state => ({
                    downloadedFiles: state.downloadedFiles.filter(id => id !== docId)
                }));
            },

            invalidateCache: (catalogId) => {
                set(state => {
                    const newCache = { ...state.documentsCache };
                    delete newCache[catalogId];
                    return { documentsCache: newCache };
                });
            },
        }),
        {
            name: 'file-manager-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
