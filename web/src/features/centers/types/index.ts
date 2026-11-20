export interface DaycareCenter {
  _id: string;
  name: string;
  barangay: string;
  code: string;
  address?: string;
  isActive: boolean;
  assignedCDW?: string;
  childrenCount?: number;
  attendanceToday?: { present: number; total: number };
  lastActivity?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CenterStatusFilter = "all" | "active" | "inactive";

export type AddCenterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: Partial<DaycareCenter>) => Promise<void>;
};

export type EditCenterModalProps = {
  center: DaycareCenter | null;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<DaycareCenter>) => Promise<void>;
};

