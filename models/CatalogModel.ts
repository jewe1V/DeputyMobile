export interface Catalog {
    id: string;
    name: string;
    parent_id: string | null;
    children?: Catalog[];
    documents?: Document[];
}

export interface Document {
    id: string;
    file_name: string;
    url: string;
    uploaded_at: string;
    uploaded_by: string;
    catalog_id: string;
}
