export interface ChildName {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}

const getChildFullName = (child: ChildName) =>
  [child.firstName, child.middleName, child.lastName].filter(Boolean).join(" ");

export const compareChildrenByName = (left: ChildName, right: ChildName) =>
  getChildFullName(left).localeCompare(getChildFullName(right), "en", {
    sensitivity: "base",
  });

export const sortChildrenByName = <T extends ChildName>(
  children: readonly T[],
) => [...children].sort(compareChildrenByName);
