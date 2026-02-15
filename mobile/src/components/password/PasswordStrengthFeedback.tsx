import { useMemo } from "react";
import { Text, View } from "react-native";
import { getPasswordStrengthFeedback } from "@/src/validations/password-validation";

type PasswordStrengthFeedbackProps = {
  password: string;
};

export default function PasswordStrengthFeedback({
  password,
}: PasswordStrengthFeedbackProps) {
  const feedback = useMemo(
    () => getPasswordStrengthFeedback(password),
    [password],
  );

  if (!password) {
    return (
      <View className="mt-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
        <Text className="text-xs text-gray-600">
          Use a strong password that follows the rules below.
        </Text>
      </View>
    );
  }

  return (
    <View className="mt-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-xs font-medium text-gray-600">Password strength</Text>
        <Text className="text-xs font-semibold" style={{ color: feedback.color }}>
          {feedback.label}
        </Text>
      </View>

      <View className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <View
          className="h-2 rounded-full"
          style={{
            width: `${feedback.percent}%`,
            backgroundColor: feedback.color,
          }}
        />
      </View>

      <View className="mt-3">
        {feedback.rules.map((rule) => (
          <Text
            key={rule.id}
            className={rule.isMet ? "mb-1 text-xs text-emerald-700" : "mb-1 text-xs text-gray-600"}
          >
            {rule.isMet ? "[OK] " : "[ ] "}
            {rule.label}
          </Text>
        ))}
      </View>
    </View>
  );
}
