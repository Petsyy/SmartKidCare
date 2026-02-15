

export const PASSWORD_MIN_LENGTH = 8;

const startsWithUppercaseRegex = /^[A-Z]/;
const hasSpecialCharacterRegex = /[^A-Za-z0-9]/;
const hasNumberRegex = /[0-9]/;

export type PasswordRuleStatus = {
  id: "minLength" | "startsWithUppercase" | "hasSpecialCharacter";
  label: string;
  isMet: boolean;
};

export type PasswordStrengthFeedback = {
  score: number;
  maxScore: number;
  percent: number;
  label: "Very weak" | "Weak" | "Fair" | "Strong";
  color: string;
  rules: PasswordRuleStatus[];
  isValid: boolean;
};

const getPasswordRuleStatus = (password: string): PasswordRuleStatus[] => {
  return [
    {
      id: "minLength",
      label: `At least ${PASSWORD_MIN_LENGTH} characters`,
      isMet: password.length >= PASSWORD_MIN_LENGTH,
    },
    {
      id: "startsWithUppercase",
      label: "Starts with a capital letter",
      isMet: startsWithUppercaseRegex.test(password),
    },
    {
      id: "hasSpecialCharacter",
      label: "Includes at least one special character",
      isMet: hasSpecialCharacterRegex.test(password),
    },
  ];
};

export const validatePasswordRules = (
  password: string,
): { isValid: boolean; message?: string } => {
  const rules = getPasswordRuleStatus(password);

  if (!password) {
    return { isValid: false, message: "Password is required." };
  }

  if (!rules[0].isMet) {
    return {
      isValid: false,
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
    };
  }

  if (!rules[1].isMet) {
    return {
      isValid: false,
      message: "Password must start with a capital letter.",
    };
  }

  if (!rules[2].isMet) {
    return {
      isValid: false,
      message: "Password must include at least one special character.",
    };
  }

  return { isValid: true };
};

export const getPasswordStrengthFeedback = (
  password: string,
): PasswordStrengthFeedback => {
  const rules = getPasswordRuleStatus(password);
  const ruleScore = rules.filter((rule) => rule.isMet).length;
  const bonusScore = Number(hasNumberRegex.test(password)) + Number(password.length >= 10);
  const maxScore = 5;
  const score = Math.min(ruleScore + bonusScore, maxScore);
  const percent = password ? Math.round((score / maxScore) * 100) : 0;

  if (score <= 1) {
    return {
      score,
      maxScore,
      percent,
      label: "Very weak",
      color: "#ef4444",
      rules,
      isValid: rules.every((rule) => rule.isMet),
    };
  }

  if (score <= 2) {
    return {
      score,
      maxScore,
      percent,
      label: "Weak",
      color: "#f97316",
      rules,
      isValid: rules.every((rule) => rule.isMet),
    };
  }

  if (score <= 4) {
    return {
      score,
      maxScore,
      percent,
      label: "Fair",
      color: "#f59e0b",
      rules,
      isValid: rules.every((rule) => rule.isMet),
    };
  }

  return {
    score,
    maxScore,
    percent,
    label: "Strong",
    color: "#10b981",
    rules,
    isValid: rules.every((rule) => rule.isMet),
  };
};
