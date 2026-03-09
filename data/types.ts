export interface Role {
    id: string;
    name: string;
}

export interface Profile {
    id: string;
    email: string;
    job_title: string;
    full_name: string;
    roles: String[];
    documents: Document[];
    events: Event[];
}
export interface Event {
    id: string;
    title: string;
    description: string;
    startAt: string;
    endAt: string;
    location: string;
    organizer_full_name: string;
    isPublic: boolean;
    organizer_id: string;
}

export interface Document {
    id: string;
    file_name: string;
    url: string;
    uploaded_at: string;
    uploaded_by: string;
    catalog_id: string;
}

export interface Attachment {
    id: string;
    file_name: string;
    url: string;
    uploaded_at: string;
}

export interface Catalog {
    id: string;
    name: string;
    parent_id: string | null;
    children?: Catalog[];
    documents?: Document[];
}

export type TaskStatus = 'created' | 'in_progress' | 'approval' | 'completed';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    author_name: string;
    author_id: string;
    created_at: string;
    due_date: string;
    completed_at?: string;
    attachments?: Attachment[];
    tags?: string[];
    users?: any[];
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'task' | 'event' | 'document';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    is_read: boolean;
    created_at: string;
    related_id?: string;
    related_type?: 'task' | 'event' | 'post' | 'document';
}
