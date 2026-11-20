import type { Child } from "@/types/child";
import { formatDate, formatTitleCase } from "../utils";
import { InfoCard } from "../cards";

interface ProfileSectionProps {
  child: Child;
  tabId: string;
}

export function ProfileSection({ child, tabId }: ProfileSectionProps) {
  return (
    <div
      id="profile-panel"
      role="tabpanel"
      aria-labelledby={tabId}
      className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoCard label="School Year" value={child.schoolYear || "Not set"} />
        <InfoCard label="Age" value={child.age || "Not set"} />
        <InfoCard label="Gender" value={formatTitleCase(child.gender)} />
        <InfoCard
          label="Enrollment Date"
          value={formatDate(child.enrollmentDate)}
        />
        <InfoCard label="Date of Birth" value={formatDate(child.dateOfBirth)} />
        <InfoCard
          label="Parent Relationship"
          value={child.parentRelationship || "Not set"}
        />
      </div>

      <InfoCard
        label="Complete Home Address"
        value={child.homeAddress || "Not set"}
      />

      {child.daycareCenter ? (
        <InfoCard label="Daycare Center" value={child.daycareCenter.name} />
      ) : null}
    </div>
  );
}
