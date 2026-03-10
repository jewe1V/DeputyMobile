import {Event} from "./EventModel";

enum Role {
    Admin,
    Deputy,
    Helper
}

export interface Profile {
    id: string;
    email: string;
    job_title: string;
    full_name: string;
    roles: Role[];
    documents: Document[];
    events: Event[];
    events_organized: Event[];
    tasks: [];
    deputy?: String;
}
