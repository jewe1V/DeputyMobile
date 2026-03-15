import {NotificationType} from "@/models/NotificationModel";
import {Profile} from "@/models/ProfileModel";

export interface Event {
    id: string;
    title: string;
    description: string;
    start_at: string;
    end_at: string;
    location: string;
    isPublic: boolean;
    organizer_id: string;
    created_at: string;
    type: "Event" | "Meeting" | "Commission";
    notification_type: NotificationType;
    telegram_endpoint: string;
    attachments: [];
    participants: Profile[];
}
