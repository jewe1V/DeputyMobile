import {Profile} from "@/models/ProfileModel";

export interface Department {
    id: string;
    name: string;
}

export interface DepartmentWithUsers extends Department {
    users?: Profile[];
}
