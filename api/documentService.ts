import {apiClient, xAppSecret} from './api';

interface DocumentApiResponse {
    id: string;
    file_name: string;
    file_name_encoded: string;
    status: "InProgress" | "ToDo" | "Done";
    start_date: string;
    end_date: string;
    url: string;
    content_type: string;
    size: number;
    uploaded_by_id: string;
    catalog_id: string;
    post_id: string;
    user_name: string;
    post?: {
        id: string;
        title: string;
        summary: string;
        body: string;
        created_by_id: string;
        created_at: string;
        published_at: string;
        thumbnail_url: string;
        attachments: string[];
    };
    uploaded_at: string;
}

export interface Document {
    id: string;
    file_name: string;
    file_name_encoded: string;
    file_size: number;
    uploaded_at: string;
    content_type: string;
    url: string;
    status: "InProgress" | "ToDo" | "Done";
    start_date?: string;
    end_date?: string;
    user_name?: string;
}

class DocumentService {
    private adaptDocument(data: DocumentApiResponse): Document {
        return {
            id: data.id,
            file_name: data.file_name,
            file_name_encoded: data.file_name_encoded,
            file_size: data.size,
            uploaded_at: data.uploaded_at,
            content_type: data.content_type,
            url: data.url,
            status: data.status,
            start_date: data.start_date,
            end_date: data.end_date,
            user_name: data.user_name,
        };
    }

    async getDocumentsByCatalog(catalogId: string): Promise<Document[]> {
        try {
            const response = await apiClient.get(`/api/Documents/by-catalog/${catalogId}`);

            const data = response.data;

            let documentsData = Array.isArray(data) ? data : (data?.data || []);
            return Array.isArray(documentsData)
                ? documentsData.map(item => this.adaptDocument(item))
                : [];
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
            const formData = new FormData();
            formData.append('File', {
                uri: file.uri,
                name: file.name,
                type: file.type || 'application/octet-stream',
            } as any);
            formData.append('CatalogId', catalogId);
            formData.append('DocumentStatus', (documentStatus ?? 0).toString());

            if (startDate) {
                formData.append('StartDate', startDate);
            }

            if (endDate) {
                formData.append('EndDate', endDate);
            }

            const response = await apiClient.post('/api/Documents/upload', formData, {
                headers: { 
                    'Accept': 'application/json',
                    'X-App-Secret': xAppSecret
                }
            });

            const data: DocumentApiResponse = response.data;
            return this.adaptDocument(data);
        } catch (error) {
            console.error('[DocumentService] Ошибка при загрузке файла:', error);
            throw error;
        }
    }

    async deleteDocument(documentId: string): Promise<void> {
        try {
            await apiClient.delete(`/api/Documents/${documentId}`);
        } catch (error) {
            console.error('[DocumentService] Ошибка при удалении файла:', error);
            throw error;
        }
    }

    async updateDocumentStatus(documentId: string, newStatus: string): Promise<Document> {
        const response = await apiClient.post('/Documents/update', null, {
            params: {
                documentId: documentId,
                newStatus: newStatus
            },
            validateStatus: (status) => true
        });

        if (response.status < 200 || response.status >= 300) {
            const errorText = typeof response.data === 'string'
                ? response.data
                : JSON.stringify(response.data);
            throw new Error(errorText || 'Не удалось изменить статус документа');
        }

        return response.data;
    };
}

export const documentService = new DocumentService();
