export interface Role {
    id: string;
    name: string;
}

export interface Profile {
    id: string;
    fullName: string;
    email: string;
    jobTitle: string;
    userRoles: Role[];
}

export interface Post {
    id: string;
    title: string;
    summary: string;
    body: string;
    thumbnailUrl: string;
    publishedAt: string;
    authorId: string;
    author?: Profile;
    attachments?: (Document | Attachment)[];
}

export interface Event {
    id: string;
    title: string;
    description: string;
    startAt: string;
    endAt: string;
    location: string;
    organizerFullName: string;
    isPublic: boolean;
    organizerId: string;
}

export interface Document {
    id: string;
    fileName: string;
    url: string;
    uploadedAt: string;
    uploadedBy: string;
    catalogId: string;
}

export interface Attachment {
    id: string;
    fileName: string;
    url: string;
    uploadedAt: string;
}

export interface Catalog {
    id: string;
    name: string;
    parentId: string | null;
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
    authorName: string;
    authorId: string;
    createdAt: string;
    dueDate: string;
    completedAt?: string;
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
    isRead: boolean;
    createdAt: string;
    relatedId?: string;
    relatedType?: 'task' | 'event' | 'post' | 'document';
}
