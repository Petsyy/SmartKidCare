export interface ChildName {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}

const compareNamePart = (left: string | null | undefined, right: string | null | undefined) =>
  (left ?? "").localeCompare(right ?? "", "en", { sensitivity: "base" });

export const compareChildrenByName = (left: ChildName, right: ChildName) => {
  const lastNameComparison = compareNamePart(left.lastName, right.lastName);
  if (lastNameComparison !== 0) return lastNameComparison;

  const firstNameComparison = compareNamePart(left.firstName, right.firstName);
  if (firstNameComparison !== 0) return firstNameComparison;

  return compareNamePart(left.middleName, right.middleName);
};

export const formatChildRosterName = (child: ChildName) => {
  const givenNames = [child.firstName, child.middleName]
    .filter(Boolean)
    .join(" ");

  return `${child.lastName}, ${givenNames}`;
};

export const sortChildrenByName = <T extends ChildName>(
  children: readonly T[],
) => [...children].sort(compareChildrenByName);
