import type { Child } from "@/types/child";
export * from "../components/child-details-modal/types";

export interface MenuState {
  openMenuUserId: string | null;
  menuAnchorRect: DOMRect | null;
  menuUser: any | null;
}

export type UseChildrenFiltersProps = {
  childrenList: Child[];
};

export type ChildForEdit = {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string | Date;
  age: string | number;
  gender: string;
  homeAddress?: string;
  parentRelationship?: string;
  weight?: number | null;
  height?: number | null;
  enrollmentDate: string | Date;
  schoolYear: string;
  studentId?: string;
  teacher?: {
    _id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email?: string;
  } | null;
};

export type UseEditChildFormProps = {
  child: ChildForEdit;
  onClose: () => void;
  onUpdated: (updated: ChildForEdit) => void;
};
