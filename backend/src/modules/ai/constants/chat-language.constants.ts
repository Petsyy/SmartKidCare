import type {
  AIResponseLanguage,
  FollowUpChoice,
  PendingTimeframe,
} from "../types/core-ai-chat.types";

export const languageCopy = {
  en: {
    greeting:
      "Hello! I can help with your child's attendance and feeding records. What would you like to know?",
    acknowledgement:
      "You're welcome. Ask anytime about your child's attendance or feeding.",
    unsupported:
      "I can help with your child's attendance and feeding records. Try asking if your child was present today, how many absences they had, or what meals were served.",
    missingChild: "Please specify which child you want to check.",
    closure: "You're welcome! Ask me anytime about your child's records.",
    providerUnavailable:
      "I couldn't generate an AI response right now. Please try asking about your child's attendance or feeding again.",
  },
  fil: {
    greeting:
      "Kumusta! Matutulungan kitang tingnan ang attendance at feeding records ng iyong anak. Ano ang nais mong malaman?",
    acknowledgement:
      "Walang anuman. Maaari kang magtanong anumang oras tungkol sa attendance o pagkain ng iyong anak.",
    unsupported:
      "Matutulungan kitang tingnan ang attendance at feeding records ng iyong anak. Maaari mong itanong kung pumasok siya ngayon, kung ilang araw siyang lumiban, o kung anong pagkain ang inihain.",
    missingChild: "Piliin muna kung sinong anak ang nais mong tingnan.",
    closure:
      "Walang anuman! Maaari kang magtanong anumang oras tungkol sa records ng iyong anak.",
    providerUnavailable:
      "Hindi ako makagawa ng AI response ngayon. Pakisubukang magtanong muli tungkol sa attendance o pagkain ng iyong anak.",
  },
} as const;

export const timeframeLabel = (
  timeframe: PendingTimeframe,
  language: AIResponseLanguage,
): string => {
  const labels: Record<AIResponseLanguage, Record<PendingTimeframe, string>> = {
    en: {
      today: "today",
      yesterday: "yesterday",
      week: "this week",
      last_week: "last week",
      month: "this month",
      last_month: "last month",
      recent: "recently",
    },
    fil: {
      today: "ngayon",
      yesterday: "kahapon",
      week: "ngayong linggo",
      last_week: "noong nakaraang linggo",
      month: "ngayong buwan",
      last_month: "noong nakaraang buwan",
      recent: "sa mga kamakailang record",
    },
  };
  return labels[language][timeframe];
};

export const buildDomainPrompt = (
  choiceTimeframe: PendingTimeframe,
  language: AIResponseLanguage,
): string => {
  if (language === "fil") {
    return `Sige. Gusto mo ba ng detalye tungkol sa attendance, pagkain, o pareho ${timeframeLabel(choiceTimeframe, language)}?`;
  }
  return `Sure. Do you want attendance details, feeding details, or both for your child ${timeframeLabel(choiceTimeframe, language)}?`;
};

export const buildScopedQuestion = (
  choice: FollowUpChoice,
  timeframe: PendingTimeframe,
  language: AIResponseLanguage,
): string => {
  if (language === "fil") {
    const domain =
      choice === "attendance"
        ? "attendance"
        : choice === "feeding"
          ? "pagkain"
          : "attendance at pagkain";
    return `Ipakita ang detalye ng ${domain} ${timeframeLabel(timeframe, language)}.`;
  }
  const domain =
    choice === "attendance"
      ? "attendance"
      : choice === "feeding"
        ? "feeding"
        : "attendance and feeding";
  return `Show ${domain} details for your child ${timeframeLabel(timeframe, language)}.`;
};
