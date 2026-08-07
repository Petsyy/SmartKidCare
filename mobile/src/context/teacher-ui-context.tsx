import React, { createContext, useContext, useState } from "react";

type TeacherUiContextType = {
  attendanceSearchQuery: string;
  feedingSearchQuery: string;
  childrenSearchQuery: string;
  setAttendanceSearchQuery: (value: string) => void;
  setFeedingSearchQuery: (value: string) => void;
  setChildrenSearchQuery: (value: string) => void;
};

const TeacherUiContext = createContext<TeacherUiContextType | undefined>(undefined);

export const TeacherUiProvider = ({ children }: { children: React.ReactNode }) => {
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState("");
  const [feedingSearchQuery, setFeedingSearchQuery] = useState("");
  const [childrenSearchQuery, setChildrenSearchQuery] = useState("");

  return (
    <TeacherUiContext.Provider
      value={{
        attendanceSearchQuery,
        feedingSearchQuery,
        childrenSearchQuery,
        setAttendanceSearchQuery,
        setFeedingSearchQuery,
        setChildrenSearchQuery,
      }}
    >
      {children}
    </TeacherUiContext.Provider>
  );
};

export const useTeacherUi = () => {
  const context = useContext(TeacherUiContext);
  if (context === undefined) {
    throw new Error("useTeacherUi must be used within a TeacherUiProvider");
  }
  return context;
};
