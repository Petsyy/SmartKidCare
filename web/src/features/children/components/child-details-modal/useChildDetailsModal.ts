import { useId } from "react";

export function useChildDetailsModal() {
  const titleId = useId();
  const descriptionId = useId();
  const profileTabId = useId();
  const healthTabId = useId();
  const documentsTabId = useId();

  return {
    titleId,
    descriptionId,
    profileTabId,
    healthTabId,
    documentsTabId,
  };
}