import {Profile} from "@/models/ProfileModel";

export interface Department {
    id: string;
    name: string;
}

interface DepartmentWithUsers extends Department {
    users?: Profile[];
}
