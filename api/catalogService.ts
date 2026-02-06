import { AuthTokenManager } from '@/components/LoginScreen/LoginScreen';
import { apiUrl } from './api';

export interface CatalogApiResponse {
    id: string;
    name: string;
    parentCatalogId: string | null;
}

export type CatalogItemType = 'catalog' | 'document';

export interface CatalogItem {
    id: string;
    name: string;
    parentId: string | null;
    type: CatalogItemType;
    children?: CatalogItem[];
}

class CatalogService {
    private getAuthHeaders() {
        const token = AuthTokenManager.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
        };
    }

    private buildTree(items: CatalogItem[], parentId: string | null = null): CatalogItem[] {
        return items
            .filter(item => item.parentId === parentId)
            .map(item => ({
                ...item,
                children: this.buildTree(items, item.id)
            }));
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

    private adaptCatalog(data: CatalogApiResponse): CatalogItem {
        return {
            id: data.id,
            name: data.name,
            parentId: data.parentCatalogId || null,
            type: 'catalog',
        };
    }

    async getPublicCatalogs(): Promise<CatalogItem[]> {
        try {
            const response = await this.fetchWithTimeout(`${apiUrl}/api/Catalogs/public`, {
                method: 'GET',
                headers: this.getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`Ошибка при получении открытых каталогов: ${response.status}`);
            }

            const data = await response.json();
            
            let catalogsData = Array.isArray(data) ? data : (data?.data || []);
            const catalogs = Array.isArray(catalogsData) 
                ? this.buildTree(catalogsData.map(item => this.adaptCatalog(item)))
                : [];
            return catalogs;
        } catch (error) {
            console.error('[CatalogService] Ошибка при получении открытых каталогов:', error);
            throw error;
        }
    }

    async getMysCatalogs(): Promise<CatalogItem[]> {
        try {
            const response = await this.fetchWithTimeout(`${apiUrl}/api/Catalogs/mine`, {
                method: 'GET',
                headers: this.getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`Ошибка при получении личных каталогов: ${response.status}`);
            }

            const data = await response.json();
            
            let catalogsData = Array.isArray(data) ? data : (data?.data || []);
            const catalogs = Array.isArray(catalogsData) 
                ? this.buildTree(catalogsData.map(item => this.adaptCatalog(item)))
                : [];
            return catalogs;
        } catch (error) {
            console.error('[CatalogService] Ошибка при получении личных каталогов:', error);
            throw error;
        }
    }

    async getDeputyCatalogs(): Promise<CatalogItem[]> {
        try {
            const response = await this.fetchWithTimeout(`${apiUrl}/api/Catalogs/deputy`, {
                method: 'GET',
                headers: this.getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`Ошибка при получении каталогов депутата: ${response.status}`);
            }

            const data = await response.json();
            
            let catalogsData = Array.isArray(data) ? data : (data?.data || []);
            const catalogs = Array.isArray(catalogsData) 
                ? this.buildTree(catalogsData.map(item => this.adaptCatalog(item)))
                : [];
            return catalogs;
        } catch (error) {
            console.error('[CatalogService] Ошибка при получении каталогов депутата:', error);
            throw error;
        }
    }

    async getAllCatalogs(): Promise<{ public: CatalogItem[]; mine: CatalogItem[]; deputy: CatalogItem[] }> {
        try {
            const [publicCatalogs, mineCatalogs, deputyCatalogs] = await Promise.all([
                this.getPublicCatalogs(),
                this.getMysCatalogs(),
                this.getDeputyCatalogs(),
            ]);

            return {
                public: publicCatalogs,
                mine: mineCatalogs,
                deputy: deputyCatalogs,
            };
        } catch (error) {
            console.error('[CatalogService] Ошибка при загрузке всех каталогов:', error);
            throw error;
        }
    }

    async createPublicCatalog(name: string, parentCatalogId?: string): Promise<CatalogItem> {
        try {
            const body: any = { name };
            if (parentCatalogId) {
                body.parentCatalogId = parentCatalogId;
            }

            const response = await this.fetchWithTimeout(`${apiUrl}/api/Catalogs/create-public`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                throw new Error(`Ошибка при создании открытого каталога: ${response.status}`);
            }

            const data: CatalogApiResponse = await response.json();
            const catalog = this.adaptCatalog(data);
            return catalog;
        } catch (error) {
            console.error('[CatalogService] Ошибка при создании открытого каталога:', error);
            throw error;
        }
    }

    async createPrivateCatalog(name: string, parentCatalogId?: string): Promise<CatalogItem> {
        try {
            const body: any = { name };
            if (parentCatalogId) {
                body.parentCatalogId = parentCatalogId;
            }

            const response = await this.fetchWithTimeout(`${apiUrl}/api/Catalogs/create-private`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                throw new Error(`Ошибка при создании личного каталога: ${response.status}`);
            }

            const data: CatalogApiResponse = await response.json();
            const catalog = this.adaptCatalog(data);
            return catalog;
        } catch (error) {
            console.error('[CatalogService] Ошибка при создании личного каталога:', error);
            throw error;
        }
    }
}

export const catalogService = new CatalogService();
