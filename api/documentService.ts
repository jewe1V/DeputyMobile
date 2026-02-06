import { AuthTokenManager } from '@/components/LoginScreen/LoginScreen';
import { apiUrl } from './api';

export interface DocumentApiResponse {
    id: string;
    fileName: string;
    fileNameEncoded: string;
    status: number;
    startDate: string;
    endDate: string;
    url: string;
    contentType: string;
    size: number;
    uploadedById: string;
    catalogId: string;
    postId: string;
    post?: {
        id: string;
        title: string;
        summary: string;
        body: string;
        createdById: string;
        createdAt: string;
        publishedAt: string;
        thumbnailUrl: string;
        attachments: string[];
    };
    uploadedAt: string;
}

export interface Document {
    id: string;
    fileName: string;
    fileSize: number;
    uploadedAt: string;
    contentType: string;
    url: string;
}

class DocumentService {
    private getAuthHeaders() {
        const token = AuthTokenManager.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
        };
    }

    private async fetchWithTimeout(
        url: string,
        options: RequestInit = {},
        timeout: number = 10000
    ): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    private adaptDocument(data: DocumentApiResponse): Document {
        return {
            id: data.id,
            fileName: data.fileName,
            fileSize: data.size,
            uploadedAt: data.uploadedAt,
            contentType: data.contentType,
            url: data.url,
        };
    }

    async getDocumentsByCatalog(catalogId: string): Promise<Document[]> {
        try {
            const response = await this.fetchWithTimeout(
                `${apiUrl}/api/Documents/by-catalog/${catalogId}`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(),
                }
            );

            if (!response.ok) {
                throw new Error(`Ошибка при получении файлов: ${response.status}`);
            }

            const data = await response.json();

            let documentsData = Array.isArray(data) ? data : (data?.data || []);
            const documents = Array.isArray(documentsData)
                ? documentsData.map(item => this.adaptDocument(item))
                : [];

            return documents;
        } catch (error) {
            console.error('[DocumentService] Ошибка при получении файлов:', error);
            throw error;
        }
    }

    async uploadDocument(
        file: { uri: string; name: string; type: string },
        catalogId: string,
        documentStatus?: number,
        startDate?: string,
        endDate?: string
    ): Promise<Document> {
        try {
            console.log('[DocumentService] Загрузка файла:', file.name);
            
            // Читаем файл как Blob
            const fileBlob = await fetch(file.uri).then(r => r.blob());
            
            const formData = new FormData();
            
            // Добавляем файл как Blob с именем
            formData.append('File', fileBlob, file.name);
            
            // Добавляем обязательные параметры
            formData.append('CatalogId', catalogId);
            
            // Добавляем опциональные параметры
            formData.append('DocumentStatus', (documentStatus ?? 0).toString());
            formData.append('StartDate', startDate || '');
            formData.append('EndDate', endDate || '');

            console.log('[DocumentService] FormData prepared:', {
                fileName: file.name,
                fileType: file.type,
                catalogId: catalogId,
            });

            const token = AuthTokenManager.getToken();
            const response = await fetch(
                `${apiUrl}/api/Documents/upload`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : '',
                    },
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[DocumentService] Ошибка ответа сервера:', errorText);
                throw new Error(`Ошибка при загрузке файла: ${response.status}`);
            }

            const data: DocumentApiResponse = await response.json();
            const document = this.adaptDocument(data);
            console.log('[DocumentService] Файл загружен:', document);
            return document;
        } catch (error) {
            console.error('[DocumentService] Ошибка при загрузке файла:', error);
            throw error;
        }
    }
}

export const documentService = new DocumentService();
