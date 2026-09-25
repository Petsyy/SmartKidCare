import { useEffect, useMemo, useState } from "react";
import { getUsers, type User } from "@/api/authentication.api";
import { useQuery } from "@tanstack/react-query";
import { webQueryKeys } from "@/lib/query-keys";

type UseTeacherCenterFilterOptions = {
  teacherId: string;
  updateTeacherFilter: (id: string) => void;
};

function pickDefaultTeacher(items: User[]): User | null {
  const sorted = [...items].sort((left, right) =>
    `${left.lastName}, ${left.firstName}`.localeCompare(
      `${right.lastName}, ${right.firstName}`,
    ),
  );

  return sorted[0] ?? null;
}

export function useTeacherCenterFilter({
  teacherId,
  updateTeacherFilter,
}: UseTeacherCenterFilterOptions) {

  const [initialized, setInitialized] = useState(false);

  const {
    data: teachers = [],
    isLoading: teachersLoading,
    error,
  } = useQuery({
    queryKey: webQueryKeys.users("teacher"),
    queryFn: () => getUsers({ role: "teacher" }),
  });

  const teachersError = error instanceof Error ? error.message : null;

  useEffect(() => {
    if (teachers.length > 0 && !initialized) {
      const activeTeachers = teachers.filter(
        (teacher) => teacher.isActive !== false,
      );
      const defaultTeacher =
        pickDefaultTeacher(activeTeachers) ?? pickDefaultTeacher(teachers);

      if (defaultTeacher) {
        updateTeacherFilter(defaultTeacher._id);
      } else {
        updateTeacherFilter("");
      }
      setInitialized(true);
    }
  }, [teachers, initialized, updateTeacherFilter]);

  const teacherOptions = useMemo(() => {
    return [...teachers].sort((left, right) =>
      `${left.lastName}, ${left.firstName}`.localeCompare(
        `${right.lastName}, ${right.firstName}`,
      ),
    );
  }, [teachers]);

  useEffect(() => {
    if (!initialized) return; // Wait for initial setup
    
    if (!teacherId) {
      if (teacherOptions.length > 0) {
        updateTeacherFilter(teacherOptions[0]._id);
      }
      return;
    }
    const isTeacherVisible = teacherOptions.some(
      (teacher) => teacher._id === teacherId,
    );
    if (!isTeacherVisible) {
      updateTeacherFilter(teacherOptions[0]?._id ?? "");
    }
  }, [teacherId, teacherOptions, updateTeacherFilter, initialized]);

  return {
    teachers,
    teachersLoading,
    teachersError,

    teacherOptions,
  };
}
