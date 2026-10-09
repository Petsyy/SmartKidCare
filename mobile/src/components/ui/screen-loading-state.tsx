import { ScreenSkeleton, type ScreenSkeletonVariant } from "./screen-skeleton";

export interface ScreenLoadingStateProps {
  title: string;
  message: string;
  className?: string;
  variant?: ScreenSkeletonVariant;
}

/**
 * Consistent full-screen loading feedback for authenticated app screens.
 */
export function ScreenLoadingState({
  title,
  message,
  className = "",
  variant = "list",
}: ScreenLoadingStateProps) {
  return (
    <ScreenSkeleton
      variant={variant}
      className={className}
      accessibilityLabel={`${title}. ${message}`}
    />
  );
}
