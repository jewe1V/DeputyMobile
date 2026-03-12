import {Profile} from "./ProfileModel"

export type NotificationType = "Event" | "Task";

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    description: string;
    notify_date: string;
    notify_type: NotificationType;
    user: Profile | null;
}
