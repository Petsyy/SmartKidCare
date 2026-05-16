import { Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { STEPS } from "@/src/features/enrollment/constants";
import type { Step } from "@/src/features/enrollment/types";

const STEP_POSITIONS = [0.125, 0.375, 0.625, 0.875] as const;
const STEP_CHIP = 36;
const STEP_CHIP_HALF = STEP_CHIP / 2;
const TRACK_LEFT_PCT = STEP_POSITIONS[0] * 100;
const TRACK_WIDTH_PCT =
  (STEP_POSITIONS[STEPS.length - 1] - STEP_POSITIONS[0]) * 100;

export function StepProgress({ step }: { step: Step }) {
  const segmentFill =
    step <= 1 ? 0 : Math.min(1, (step - 1) / (STEPS.length - 1));

  return (
    <View className="w-full">
      <View className="relative h-11 w-full">
        <View
          pointerEvents="none"
          className="absolute bg-gray-200"
          style={{
            left: `${TRACK_LEFT_PCT}%`,
            width: `${TRACK_WIDTH_PCT}%`,
            top: STEP_CHIP_HALF - 1,
            height: 2,
            zIndex: 0,
          }}
        />
        <View
          pointerEvents="none"
          className="absolute bg-emerald-500"
          style={{
            left: `${TRACK_LEFT_PCT}%`,
            width: `${TRACK_WIDTH_PCT * segmentFill}%`,
            top: STEP_CHIP_HALF - 1,
            height: 2,
            zIndex: 0,
          }}
        />

        {STEPS.map((item, index) => {
          const isDone = step > item.id;
          const isActive = step === item.id;
          const leftPct = STEP_POSITIONS[index] * 100;

          return (
            <View
              key={item.id}
              pointerEvents="none"
              style={{
                position: "absolute",
                left: `${leftPct}%`,
                top: 0,
                width: STEP_CHIP,
                height: STEP_CHIP,
                zIndex: 1,
                transform: [{ translateX: -STEP_CHIP_HALF }],
              }}
            >
              <View
                className="h-9 w-9 items-center justify-center rounded-full border-2"
                style={
                  isDone
                    ? { borderColor: "#10B981", backgroundColor: "#10B981" }
                    : isActive
                      ? {
                          borderColor: "#0D9488",
                          backgroundColor: "#0D9488",
                          shadowColor: "#000000",
                          shadowOpacity: 0.08,
                          shadowRadius: 2,
                          shadowOffset: { width: 0, height: 1 },
                          elevation: 1,
                        }
                      : { borderColor: "#E5E7EB", backgroundColor: "#FFFFFF" }
                }
              >
                {isDone ? (
                  <Check size={16} color="#FFFFFF" />
                ) : (
                  <Text
                    className="text-sm font-bold"
                    style={{ color: isActive ? "#FFFFFF" : "#6B7280" }}
                  >
                    {item.id}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View className="relative mt-1.5 min-h-[24px] w-full">
        {STEPS.map((item, index) => {
          const leftPct = STEP_POSITIONS[index] * 100;
          return (
            <View
              key={item.id}
              style={{
                position: "absolute",
                left: `${leftPct}%`,
                width: 108,
                transform: [{ translateX: -54 }],
              }}
            >
              <Text
                className="text-center text-[11px] font-semibold leading-tight"
                style={{ color: step === item.id ? "#0F766E" : "#6B7280" }}
              >
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
