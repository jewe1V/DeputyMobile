import {Profile} from "@/models/ProfileModel";

export interface Attachment {
    id: string;
    file_name: string;
    url: string;
    uploaded_at: string;
}

export const priorityMap: Record<number, string> = {
    1: 'Низкий',
    2: 'Средний',
    3: 'Высокий',
    4: 'Срочный',
    5: 'Критический'
};

export interface Task {
    task_id: string;
    author_id: string;
    author_name: string;
    title: string;
    description: string;
    created_at: string;
    updated_at: string;
    start_date: string;
    expected_end_date: string;
    priority: number;
    status: string;
    is_archived: boolean;
    users: Profile[];
    "events": Event[];
    "notifications": Notification[] | null;
}
