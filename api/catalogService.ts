import {apiClient} from "./api";

interface CatalogApiResponse {
    id: string;
    name: string;
    parent_catalog_id: string | null;
}

type CatalogItemType = 'catalog' | 'document';

export interface CatalogItem {
    id: string;
    name: string;
    parent_catalog_id: string | null;
    type: CatalogItemType;
    children?: CatalogItem[];
}

class CatalogService {
    private buildTree(items: CatalogItem[], parentId: string | null = null): CatalogItem[] {
        return items
            .filter(item => item.parent_catalog_id === parentId)
            .map(item => ({
                ...item,
                children: this.buildTree(items, item.id)
            }));
    }

    private adaptCatalog(data: CatalogApiResponse): CatalogItem {
        return {
            id: data.id,
            name: data.name,
            parent_catalog_id: data.parent_catalog_id || null,
            type: 'catalog',
        };
    }

    async getPublicCatalogs(): Promise<CatalogItem[]> {
        try {
            const response = await apiClient.get('/api/Catalogs/public');

            const data = response.data;
            let catalogsData = Array.isArray(data) ? data : (data?.data || []);
            return Array.isArray(catalogsData)
                ? this.buildTree(catalogsData.map(item => this.adaptCatalog(item)))
                : [];
        } catch (error) {
            console.error('[CatalogService] Ошибка при получении открытых каталогов:', error);
            throw error;
        }
    }

    async getMysCatalogs(): Promise<CatalogItem[]> {
        try {
            const response = await apiClient.get('/api/Catalogs/mine');

            const data = response.data;
            let catalogsData = Array.isArray(data) ? data : (data?.data || []);
            return Array.isArray(catalogsData)
                ? this.buildTree(catalogsData.map(item => this.adaptCatalog(item)))
                : [];
        } catch (error) {
            console.error('[CatalogService] Ошибка при получении личных каталогов:', error);
            throw error;
        }
    }

    async getDeputyCatalogs(): Promise<CatalogItem[]> {
        try {
            const response = await apiClient.get('/api/Catalogs/deputy');

            const data = response.data;
            let catalogsData = Array.isArray(data) ? data : (data?.data || []);
            return Array.isArray(catalogsData)
                ? this.buildTree(catalogsData.map(item => this.adaptCatalog(item)))
                : [];
        } catch (error) {
            console.error('[CatalogService] Ошибка при получении каталогов депутата:', error);
            throw error;
        }
    }

    async createPublicCatalog(name: string, parentCatalogId?: string): Promise<CatalogItem> {
        try {
            const body: any = { name };
            if (parentCatalogId) {
                body.parent_catalog_id = parentCatalogId;
            }

            const response = await apiClient.post('/api/Catalogs/create-public', body);

            const data: CatalogApiResponse = response.data;
            return this.adaptCatalog(data);
        } catch (error) {
            console.error('[CatalogService] Ошибка при создании открытого каталога:', error);
            throw error;
        }
    }

    async createPrivateCatalog(name: string, parentCatalogId?: string): Promise<CatalogItem> {
        try {
            const body: any = { name };
            if (parentCatalogId) {
                body.parent_catalog_id = parentCatalogId;
            }

            const response = await apiClient.post('/api/Catalogs/create-private', body);

            const data: CatalogApiResponse = response.data;
            return this.adaptCatalog(data);
        } catch (error) {
            console.error('[CatalogService] Ошибка при создании личного каталога:', error);
            throw error;
        }
    }
}

export const catalogService = new CatalogService();
