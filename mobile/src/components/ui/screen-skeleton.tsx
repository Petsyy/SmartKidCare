import { View } from "react-native";
import { SkeletonBlock, SkeletonGroup, SkeletonText } from "./skeleton";

export type ScreenSkeletonVariant =
  | "dashboard"
  | "list"
  | "details"
  | "form"
  | "records";

export interface ScreenSkeletonProps {
  variant?: ScreenSkeletonVariant;
  accessibilityLabel?: string;
  className?: string;
  itemCount?: number;
}

function ListCard() {
  return (
    <View className="flex-row items-center rounded-2xl border border-gray-100 bg-white p-4">
      <SkeletonBlock className="h-14 w-14 rounded-2xl bg-gray-200" />
      <View className="ml-4 flex-1">
        <SkeletonBlock className="h-4 w-1/2 rounded-full bg-gray-200" />
        <SkeletonText lines={2} className="mt-3" />
      </View>
    </View>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <View className="rounded-3xl bg-white p-5">
        <SkeletonBlock className="h-5 w-2/5 rounded-full bg-gray-200" />
        <SkeletonBlock className="mt-4 h-8 w-3/5 rounded-full bg-gray-200" />
        <SkeletonText lines={2} className="mt-4" />
      </View>
      <View className="flex-row gap-3">
        <SkeletonBlock className="h-28 flex-1 rounded-3xl bg-gray-200" />
        <SkeletonBlock className="h-28 flex-1 rounded-3xl bg-gray-200" />
      </View>
      <ListCard />
      <ListCard />
    </>
  );
}

function DetailsSkeleton() {
  return (
    <>
      <View className="items-center rounded-3xl bg-white p-6">
        <SkeletonBlock className="h-24 w-24 rounded-full bg-gray-200" />
        <SkeletonBlock className="mt-4 h-6 w-1/2 rounded-full bg-gray-200" />
        <SkeletonBlock className="mt-3 h-4 w-1/3 rounded-full bg-gray-200" />
      </View>
      <View className="rounded-3xl bg-white p-5">
        <SkeletonText lines={4} />
      </View>
      <View className="rounded-3xl bg-white p-5">
        <SkeletonText lines={3} />
      </View>
    </>
  );
}

function FormSkeleton() {
  return (
    <View className="rounded-3xl bg-white p-5">
      {Array.from({ length: 4 }, (_, index) => (
        <View key={index} className={index > 0 ? "mt-5" : ""}>
          <SkeletonBlock className="h-3 w-1/3 rounded-full bg-gray-200" />
          <SkeletonBlock className="mt-2 h-14 w-full rounded-2xl bg-gray-200" />
        </View>
      ))}
      <SkeletonBlock className="mt-6 h-14 w-full rounded-2xl bg-gray-200" />
    </View>
  );
}

function RecordsSkeleton() {
  return (
    <>
      <SkeletonBlock className="h-14 w-full rounded-2xl bg-gray-200" />
      <View className="rounded-3xl bg-white p-5">
        <View className="mb-5 flex-row items-center justify-between">
          <SkeletonBlock className="h-5 w-2/5 rounded-full bg-gray-200" />
          <SkeletonBlock className="h-9 w-24 rounded-xl bg-gray-200" />
        </View>
        <View className="flex-row flex-wrap gap-y-3">
          {Array.from({ length: 28 }, (_, index) => (
            <View key={index} className="w-[14.28%] items-center">
              <SkeletonBlock className="h-9 w-9 rounded-xl bg-gray-200" />
            </View>
          ))}
        </View>
      </View>
      <SkeletonBlock className="h-28 w-full rounded-3xl bg-gray-200" />
    </>
  );
}

export function ScreenSkeleton({
  variant = "list",
  accessibilityLabel = "Loading screen content",
  className = "",
  itemCount = 4,
}: ScreenSkeletonProps) {
  return (
    <SkeletonGroup
      className={`flex-1 gap-4 bg-gray-50 px-5 py-5 ${className}`}
      accessibilityLabel={accessibilityLabel}
    >
      {variant === "dashboard" ? <DashboardSkeleton /> : null}
      {variant === "details" ? <DetailsSkeleton /> : null}
      {variant === "form" ? <FormSkeleton /> : null}
      {variant === "records" ? <RecordsSkeleton /> : null}
      {variant === "list"
        ? Array.from({ length: itemCount }, (_, index) => <ListCard key={index} />)
        : null}
    </SkeletonGroup>
  );
}
