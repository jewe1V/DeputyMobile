import {Event} from "./EventModel";

export type Role = "Admin" | "Deputy" | "Helper";

export interface Profile {
    id: string;
    email: string;
    job_title: string;
    full_name: string;
    roles: Role[];
    documents: Document[];
    events: Event[];
    event_count: number;
    task_count: number;
    events_organized: Event[];
    tasks: [];
    deputy?: String;
    department?: {
        name: string;
        id: string;
    }
}

export interface ProfileScreenDto {
    id: string;
    email: string;
    job_title: string;
    full_name: string;
    roles: Role[];
    author_event_count: number;
    event_count: number;
    task_count: number;
}
