import {NotificationType} from "@/models/NotificationModel";

export enum EventType {
    Event,
    Meeting, // заседание
    Commission, // комиссия
}
export interface Event {
    id: string;
    title: string;
    description: string;
    start_at: string;
    end_at: string;
    location: string;
    organizer: string;
    isPublic: boolean;
    organizer_id: string;
    created_at: string;
    type: EventType;
    notification_type: NotificationType;
    telegram_endpoint: string;
    attachments: [];
    participants: [];
}
