import { useState, useEffect } from "react";
import type { Child } from "@/types/child";
import {
  createChild,
  deleteChild,
  getChildren,
  updateChild,
} from "../api/child.api";
import { showErrorModal, showParentCredentialsModal } from "../utils/sweetalert.modal";

export type ChildFormData = {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  age: string | number;
  gender: "male" | "female";
  enrollmentDate: string;
  schoolYear: string;
  parentLastName: string;
  parentFirstName: string;
  parentMiddleName: string;
  parentEmail: string;
  parentPhone: string;
  teacherId?: string;
  studentId: string;
};

export function useChildrenManagement() {
  const [children, setChildren] = useState<Child[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchChildren = async () => {
    setIsLoading(true);
    try {
      const data = await getChildren();
      setChildren(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch children:", error);
      setChildren([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const handleSaveChild = async (
    childData: ChildFormData,
    files?: {
      birthCertificate?: File | null;
      parentId?: File | null;
    },
  ) => {
    try {
      const data = await createChild(
        {
          ...childData,
          status: "Active",
        },
        {
          birthCertificate: files?.birthCertificate ?? undefined,
          parentId: files?.parentId ?? undefined,
        },
      );

      await fetchChildren();

      if (data.parentCredentials) {
        const creds = {
          email: data.parentCredentials.email ?? "",
          password: data.parentCredentials.tempPassword ?? "",
        };
        setTimeout(() => showParentCredentialsModal(creds), 350);
      }

      return true;
    } catch (error) {
      console.error("Failed to save child:", error);
      showErrorModal(
        error instanceof Error ? error.message : "Failed to save child",
      );
      return false;
    }
  };

  const handleChangeStatus = async (child: Child, newStatus: string) => {
    if (!newStatus) return;
    try {
      const updated = await updateChild(child._id, { status: newStatus });
      setChildren((prev) =>
        prev.map((c) => (c._id === child._id ? updated : c)),
      );
    } catch (err: any) {
      showErrorModal(err.message || "Failed to update status");
    }
  };

  const handleUnlinkParent = async (child: Child) => {
    if (!child.parent) {
      showErrorModal("Child has no linked parent.");
      return;
    }
    try {
      const updated = await updateChild(child._id, { unlinkParent: true });
      setChildren((prev) =>
        prev.map((c) => (c._id === child._id ? updated : c)),
      );
    } catch (err: any) {
      showErrorModal(err.message || "Failed to unlink parent");
    }
  };

  const handleDeleteChild = async (child: Child) => {
    try {
      await deleteChild(child._id);
      setChildren((prev) => prev.filter((item) => item._id !== child._id));
    } catch (err: any) {
      showErrorModal(err.message || "Failed to delete child");
    }
  };

  const filteredChildren = children.filter((child) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    const name =
      `${child.firstName} ${child.lastName} ${child.middleName || ""}`.toLowerCase();
    const nameLastFirstMiddle = [
      child.lastName,
      child.firstName,
      child.middleName,
    ]
      .filter((value) => String(value || "").trim().length > 0)
      .join(", ")
      .toLowerCase();
    const studentId = (child.studentId || "").toLowerCase();
    const age = String(child.age ?? "").toLowerCase();
    const gender = (child.gender || "").toLowerCase();
    const schoolYear = (child.schoolYear || "").toLowerCase();
    const status = (child.status || "").toLowerCase();
    const teacherName = child.teacher
      ? `${child.teacher.firstName} ${child.teacher.middleName || ""} ${child.teacher.lastName}`.toLowerCase()
      : "";
    return (
      name.includes(q) ||
      nameLastFirstMiddle.includes(q) ||
      studentId.includes(q) ||
      age.includes(q) ||
      gender.includes(q) ||
      schoolYear.includes(q) ||
      status.includes(q) ||
      teacherName.includes(q)
    );
  });

  return {
    children,
    setChildren,
    search,
    setSearch,
    isLoading,
    filteredChildren,
    fetchChildren,
    handleSaveChild,
    handleChangeStatus,
    handleUnlinkParent,
    handleDeleteChild,
  };
}
