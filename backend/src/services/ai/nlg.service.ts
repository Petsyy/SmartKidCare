// import {
//   GenerateChildReportResult,
//   ToolTimeframe,
//   SummarizeAttendanceResult,
//   SummarizeAttendanceClassResult,
//   SummarizeFeedingResult,
//   SummarizeFeedingClassResult,
// } from "./mongoAgentTools.service";
// import { AIResponseLanguage } from "./language.service";
// import {
//   ChildReportInsight,
//   InsightBlock,
//   analyzeAttendanceInsight,
//   analyzeChildReportInsight,
//   analyzeFeedingInsight,
// } from "./insights.service";
// import {
//   recommendForAttendance,
//   recommendForChildReport,
//   recommendForFeeding,
// } from "./recommendations.service";

// type ReplyAudienceRole = "parent" | "teacher" | "admin";
// type InsightLevel = InsightBlock["level"];
// type OverallLevel = ChildReportInsight["overallLevel"];
// type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

// const DAY_MS = 24 * 60 * 60 * 1000;
// const ISO_DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// const TIMEFRAME_LABELS: Record<
//   AIResponseLanguage,
//   Record<ToolTimeframe, string>
// > = {
//   en: {
//     today: "today",
//     week: "this week",
//     last_week: "last week",
//     month: "this month",
//     recent: "recently",
//   },
//   tl: {
//     today: "ngayong araw",
//     week: "ngayong linggo",
//     last_week: "nakaraang linggo",
//     month: "ngayong buwan",
//     recent: "kamakailan",
//   },
// };

// const ATTENDANCE_RATE_TEXT: Record<
//   AIResponseLanguage,
//   Record<InsightLevel, (rate: number) => string>
// > = {
//   en: {
//     excellent: (rate) =>
//       `Attendance is excellent at ${rate}%, with very consistent participation.`,
//     good: (rate) =>
//       `Attendance remains strong at ${rate}%, showing consistent participation.`,
//     watch: (rate) => `Attendance is ${rate}%, and may need closer monitoring.`,
//     critical: (rate) =>
//       `Attendance is ${rate}%, and needs immediate attention.`,
//   },
//   tl: {
//     excellent: (rate) =>
//       `Napakahusay ng attendance sa ${rate}%, at napaka-konsistent ng pagpasok.`,
//     good: (rate) =>
//       `Maganda ang attendance sa ${rate}%, at konsistent ang pagpasok.`,
//     watch: (rate) =>
//       `Ang attendance ay ${rate}%, at kailangan ng mas malapit na pag-monitor.`,
//     critical: (rate) =>
//       `Ang attendance ay ${rate}%, at nangangailangan ng agarang aksyon.`,
//   },
// };

// const FEEDING_RATE_TEXT: Record<
//   AIResponseLanguage,
//   Record<InsightLevel, (rate: number) => string>
// > = {
//   en: {
//     excellent: (rate) => `Feeding consistency is excellent at ${rate}%.`,
//     good: (rate) => `Feeding consistency remains strong at ${rate}%.`,
//     watch: (rate) =>
//       `Feeding consistency is ${rate}%, and may need closer monitoring.`,
//     critical: (rate) =>
//       `Feeding consistency is ${rate}%, and needs immediate attention.`,
//   },
//   tl: {
//     excellent: (rate) => `Napakahusay ng feeding consistency sa ${rate}%.`,
//     good: (rate) => `Maganda ang feeding consistency sa ${rate}%.`,
//     watch: (rate) =>
//       `Ang feeding consistency ay ${rate}%, at kailangan ng mas malapit na pag-monitor.`,
//     critical: (rate) =>
//       `Ang feeding consistency ay ${rate}%, at nangangailangan ng agarang aksyon.`,
//   },
// };

// const OVERALL_TEXT: Record<AIResponseLanguage, Record<OverallLevel, string>> = {
//   en: {
//     excellent: "Overall performance is excellent this period.",
//     good: "Overall performance is good with minor areas to monitor.",
//     watch: "Overall performance is moderate and should be monitored.",
//     critical: "Overall performance needs attention right now.",
//   },
//   tl: {
//     excellent: "Napakahusay ng overall performance sa panahong ito.",
//     good: "Maganda ang overall performance, may kaunting bahagi lang na dapat bantayan.",
//     watch: "Katamtaman ang overall performance at dapat bantayan.",
//     critical: "Kailangan ng agarang atensyon ang overall performance.",
//   },
// };

// function normalizeAudienceRole(role: string): ReplyAudienceRole {
//   const normalized = String(role).trim().toLowerCase();
//   if (normalized === "teacher") return "teacher";
//   if (normalized === "admin") return "admin";
//   return "parent";
// }

// function joinReplyLines(lines: Array<string | undefined>): string {
//   return lines.filter((line): line is string => Boolean(line)).join("\n");
// }

// function joinReplySections(sections: Array<string | undefined>): string {
//   return sections
//     .filter((section): section is string => Boolean(section))
//     .join("\n\n");
// }

// function roleAwareLine(params: {
//   language: AIResponseLanguage;
//   isParentAudience: boolean;
//   enParent: string;
//   enOther: string;
//   tlParent: string;
//   tlOther: string;
// }): string {
//   const { language, isParentAudience, enParent, enOther, tlParent, tlOther } =
//     params;

//   if (language === "tl") {
//     return isParentAudience ? tlParent : tlOther;
//   }
//   return isParentAudience ? enParent : enOther;
// }

// function timeframeLabel(
//   timeframe: ToolTimeframe,
//   language: AIResponseLanguage,
// ): string {
//   return TIMEFRAME_LABELS[language][timeframe];
// }

// function formatAbsentDatesSentence(
//   absentDates: string[],
//   language: AIResponseLanguage,
// ): string {
//   if (!absentDates.length) return "";

//   if (language === "tl") {
//     if (absentDates.length === 1) {
//       return `Ang pagliban ay noong ${absentDates[0]}.`;
//     }
//     return `Naitala ang pagliban noong ${absentDates.join(", ")}.`;
//   }

//   if (absentDates.length === 1) {
//     return `The absence was on ${absentDates[0]}.`;
//   }
//   return `Absences were recorded on ${absentDates.join(", ")}.`;
// }

// function riskLevelFromInsight(level: InsightLevel | OverallLevel): RiskLevel {
//   if (level === "critical") return "HIGH";
//   if (level === "watch") return "MEDIUM";
//   return "LOW";
// }

// function riskLevelLine(level: InsightLevel | OverallLevel): string {
//   return `Risk Level: ${riskLevelFromInsight(level)}`;
// }

// function sanitizeAction(action: string): string {
//   return action
//     .replace(/^[\-\u2022\s]+/, "")
//     .replace(/\s+/g, " ")
//     .trim();
// }

// function suggestedActionsSection(
//   recommendations: string[],
//   fallbackAction: string,
// ): string {
//   const actions = recommendations
//     .map(sanitizeAction)
//     .filter(Boolean)
//     .slice(0, 3);

//   const safeActions = actions.length ? actions : [fallbackAction];
//   return ["Suggested Actions:", ...safeActions.map((action) => `- ${action}`)].join(
//     "\n",
//   );
// }

// function followUpSection(question: string): string {
//   return `Follow-up: ${question}`;
// }

// function fallbackAttendanceAction(language: AIResponseLanguage): string {
//   return language === "tl"
//     ? "Ipagpatuloy ang regular na pag-monitor ng attendance ngayong linggo."
//     : "Monitor attendance closely this week.";
// }

// function fallbackFeedingAction(language: AIResponseLanguage): string {
//   return language === "tl"
//     ? "Ipagpatuloy ang regular na pag-monitor ng feeding consistency ngayong linggo."
//     : "Monitor feeding consistency closely this week.";
// }

// function fallbackReportAction(language: AIResponseLanguage): string {
//   return language === "tl"
//     ? "I-monitor nang regular ang attendance at feeding records ngayong linggo."
//     : "Monitor attendance and feeding records closely this week.";
// }

// function classAttendanceActions(
//   level: InsightLevel,
//   language: AIResponseLanguage,
// ): string[] {
//   if (language === "tl") {
//     if (level === "critical") {
//       return [
//         "I-monitor nang mas malapitan ang attendance ngayong linggo.",
//         "Suriin ang posibleng health o schedule issues.",
//         "Makipag-coordinate sa mga parent kung magpapatuloy ang absences.",
//       ];
//     }

//     if (level === "watch") {
//       return [
//         "I-review ang attendance trend kada araw.",
//         "Mag-set ng mabilis na follow-up para sa mga absent entries.",
//       ];
//     }

//     return [
//       "Panatilihin ang kasalukuyang attendance routine.",
//       "Ikumpara ang performance sa susunod na linggo para sa trend checking.",
//     ];
//   }

//   if (level === "critical") {
//     return [
//       "Monitor attendance closely this week.",
//       "Check for health or schedule barriers.",
//       "Coordinate with parents if absences continue.",
//     ];
//   }

//   if (level === "watch") {
//     return [
//       "Review attendance trend by date.",
//       "Set quick follow-ups for absent entries.",
//     ];
//   }

//   return [
//     "Maintain the current attendance routine.",
//     "Compare performance again next week to track trend stability.",
//   ];
// }

// function classFeedingActions(
//   level: InsightLevel,
//   language: AIResponseLanguage,
// ): string[] {
//   if (language === "tl") {
//     if (level === "critical") {
//       return [
//         "I-monitor nang mas malapitan ang meal completion ngayong linggo.",
//         "Suriin ang pattern ng missed meals.",
//         "Makipag-coordinate sa parents tungkol sa feeding concerns.",
//       ];
//     }

//     if (level === "watch") {
//       return [
//         "I-review ang meal history kada araw.",
//         "Mag-set ng follow-up sa mga batang madalas may missed meals.",
//       ];
//     }

//     return [
//       "Panatilihin ang kasalukuyang feeding routine.",
//       "Dagdagan ang meal variety kung posible.",
//     ];
//   }

//   if (level === "critical") {
//     return [
//       "Monitor meal completion closely this week.",
//       "Review missed meal patterns.",
//       "Coordinate with parents about ongoing feeding concerns.",
//     ];
//   }

//   if (level === "watch") {
//     return [
//       "Review meal history by date.",
//       "Set follow-ups for children with repeated missed meals.",
//     ];
//   }

//   return [
//     "Maintain the current feeding routine.",
//     "Add more meal variety where possible.",
//   ];
// }

// function classCountLabel(count: number, language: AIResponseLanguage): string {
//   if (language === "tl") {
//     return `${count} bata`;
//   }
//   return `${count} ${count === 1 ? "child" : "children"}`;
// }

// function englishToBe(count: number): "was" | "were" {
//   return count === 1 ? "was" : "were";
// }

// function attendanceRateSentence(
//   rate: number,
//   level: InsightLevel,
//   language: AIResponseLanguage,
// ): string {
//   return ATTENDANCE_RATE_TEXT[language][level](rate);
// }

// function feedingRateSentence(
//   rate: number,
//   level: InsightLevel,
//   language: AIResponseLanguage,
// ): string {
//   return FEEDING_RATE_TEXT[language][level](rate);
// }

// function overallSentence(
//   level: OverallLevel,
//   language: AIResponseLanguage,
// ): string {
//   return OVERALL_TEXT[language][level];
// }

// function englishPossessive(name: string): string {
//   return /s$/i.test(name) ? `${name}'` : `${name}'s`;
// }

// function toDayNumber(dateKey: string): number | null {
//   if (!ISO_DATE_KEY_REGEX.test(dateKey)) return null;

//   const [yearRaw, monthRaw, dayRaw] = dateKey.split("-");
//   const year = Number(yearRaw);
//   const month = Number(monthRaw);
//   const day = Number(dayRaw);

//   if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
//     return null;
//   }

//   return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
// }

// function longestAbsenceStreak(absentDates: string[]): {
//   count: number;
//   start: string;
//   end: string;
// } | null {
//   const dates = Array.from(
//     new Set(absentDates.filter((date) => ISO_DATE_KEY_REGEX.test(date))),
//   ).sort();

//   if (dates.length < 2) return null;

//   let best = { count: 1, start: dates[0], end: dates[0] };
//   let current = { count: 1, start: dates[0], end: dates[0] };

//   for (let index = 1; index < dates.length; index += 1) {
//     const previous = dates[index - 1];
//     const currentDate = dates[index];
//     const previousDay = toDayNumber(previous);
//     const currentDay = toDayNumber(currentDate);

//     const isConsecutive =
//       previousDay !== null && currentDay !== null && currentDay - previousDay === 1;

//     if (isConsecutive) {
//       current.count += 1;
//       current.end = currentDate;
//     } else {
//       if (current.count > best.count) {
//         best = { ...current };
//       }
//       current = { count: 1, start: currentDate, end: currentDate };
//     }
//   }

//   if (current.count > best.count) {
//     best = { ...current };
//   }

//   return best.count >= 2 ? best : null;
// }

// function absenceStreakSentence(
//   absentDates: string[],
//   language: AIResponseLanguage,
//   subject: "child" | "class" = "child",
// ): string {
//   const streak = longestAbsenceStreak(absentDates);
//   if (!streak) return "";

//   if (language === "tl") {
//     if (subject === "class") {
//       return `May ${streak.count}-sunod-sunod na araw ng pagliban sa class mula ${streak.start} hanggang ${streak.end}.`;
//     }
//     return `May ${streak.count}-sunod-sunod na araw ng pagliban mula ${streak.start} hanggang ${streak.end}.`;
//   }

//   if (subject === "class") {
//     return `A ${streak.count}-day consecutive class-absence streak was recorded from ${streak.start} to ${streak.end}.`;
//   }

//   return `A ${streak.count}-day consecutive absence streak was recorded from ${streak.start} to ${streak.end}.`;
// }

// function attendanceFollowUpQuestion(params: {
//   attendanceRate: number;
//   totalRecords: number;
//   timeframe: ToolTimeframe;
//   language: AIResponseLanguage;
//   isClass?: boolean;
// }): string {
//   const {
//     attendanceRate,
//     totalRecords,
//     timeframe,
//     language,
//     isClass = false,
//   } = params;

//   if (language === "tl") {
//     if (totalRecords === 0) {
//       return isClass
//         ? "Gusto mo bang i-check ang ibang timeframe para sa class attendance?"
//         : "Gusto mo bang simulan ang daily attendance tracking ngayong linggo?";
//     }
//     if (attendanceRate < 50) {
//       return isClass
//         ? "Gusto mo bang suriin ang posibleng dahilan ng class absences?"
//         : "Gusto mo bang suriin ang posibleng dahilan ng mga pagliban?";
//     }
//     if (attendanceRate < 80) {
//       return isClass
//         ? "Gusto mo bang tingnan ang attendance details kada araw para sa class?"
//         : "Gusto mo bang tingnan ang attendance details para sa mga araw na absent?";
//     }
//     if (attendanceRate >= 95) {
//       return timeframe === "last_week"
//         ? "Gusto mo bang ikumpara ito sa nakaraang linggo bago nito?"
//         : "Gusto mo bang ikumpara ang linggong ito sa nakaraang linggo?";
//     }
//     return isClass
//       ? "Gusto mo bang i-review ang class attendance trend kada araw?"
//       : "Gusto mo bang i-review ang attendance trend kada araw?";
//   }

//   if (totalRecords === 0) {
//     return isClass
//       ? "Would you like to check another timeframe for class attendance?"
//       : "Would you like to start tracking attendance daily this week?";
//   }
//   if (attendanceRate < 50) {
//     return isClass
//       ? "Would you like to review possible causes of class absences?"
//       : "Would you like to review possible causes of absences?";
//   }
//   if (attendanceRate < 80) {
//     return isClass
//       ? "Would you like to review class attendance details by date?"
//       : "Would you like to review attendance details for the missed days?";
//   }
//   if (attendanceRate >= 95) {
//     return timeframe === "last_week"
//       ? "Would you like to compare this with the previous week?"
//       : "Would you like to compare this week with last week?";
//   }

//   return isClass
//     ? "Would you like to review the class attendance trend by date?"
//     : "Would you like to review attendance details by date?";
// }

// function feedingFollowUpQuestion(params: {
//   feedingRate: number;
//   totalRecords: number;
//   timeframe: ToolTimeframe;
//   language: AIResponseLanguage;
//   isClass?: boolean;
// }): string {
//   const {
//     feedingRate,
//     totalRecords,
//     timeframe,
//     language,
//     isClass = false,
//   } = params;

//   if (language === "tl") {
//     if (totalRecords === 0) {
//       return isClass
//         ? "Gusto mo bang i-check ang ibang timeframe para sa class feeding?"
//         : "Gusto mo bang simulan ang daily meal tracking ngayong linggo?";
//     }
//     if (feedingRate < 50) {
//       return isClass
//         ? "Gusto mo bang suriin ang detalye ng missed meals ng class?"
//         : "Gusto mo bang suriin ang detalye ng mga missed meals?";
//     }
//     if (feedingRate < 85) {
//       return isClass
//         ? "Gusto mo bang tingnan ang class meal history details?"
//         : "Gusto mo bang tingnan ang meal history details?";
//     }
//     if (feedingRate >= 95) {
//       return timeframe === "last_week"
//         ? "Gusto mo bang ikumpara ito sa nakaraang linggo bago nito?"
//         : "Gusto mo bang ikumpara ang linggong ito sa nakaraang linggo?";
//     }
//     return isClass
//       ? "Gusto mo bang makatanggap ng suggestions para sa mas consistent na class feeding?"
//       : "Gusto mo bang makatanggap ng suggestions para mapabuti ang feeding consistency?";
//   }

//   if (totalRecords === 0) {
//     return isClass
//       ? "Would you like to check another timeframe for class feeding?"
//       : "Would you like to start tracking meals daily this week?";
//   }
//   if (feedingRate < 50) {
//     return isClass
//       ? "Would you like to review missed class meal details?"
//       : "Would you like to review missed meal details?";
//   }
//   if (feedingRate < 85) {
//     return isClass
//       ? "Would you like to review class meal history details?"
//       : "Would you like to see meal history details?";
//   }
//   if (feedingRate >= 95) {
//     return timeframe === "last_week"
//       ? "Would you like to compare this with the previous week?"
//       : "Would you like to compare this week with last week?";
//   }

//   return isClass
//     ? "Would you like suggestions to improve class feeding consistency?"
//     : "Would you like suggestions to improve feeding consistency?";
// }

// function reportFollowUpQuestion(
//   result: GenerateChildReportResult,
//   language: AIResponseLanguage,
// ): string {
//   const attendanceRate = result.attendance.attendanceRate;
//   const feedingRate = result.feeding.feedingRate;

//   if (language === "tl") {
//     if (result.attendance.totalDays === 0 && result.feeding.totalMeals === 0) {
//       return "Gusto mo bang simulan ang daily tracking para sa attendance at feeding?";
//     }
//     if (attendanceRate < 50) {
//       return "Gusto mo bang suriin ang posibleng dahilan ng mga pagliban?";
//     }
//     if (feedingRate < 50) {
//       return "Gusto mo bang tingnan ang detalye ng meal history?";
//     }
//     if (attendanceRate < 80 || feedingRate < 85) {
//       return "Gusto mo bang makatanggap ng specific suggestions para mapabuti ang consistency?";
//     }
//     if (result.timeframe === "last_week") {
//       return "Gusto mo bang ikumpara ito sa nakaraang linggo bago nito?";
//     }
//     return "Gusto mo bang i-review ang attendance trend ngayong linggo?";
//   }

//   if (result.attendance.totalDays === 0 && result.feeding.totalMeals === 0) {
//     return "Would you like to start daily tracking for attendance and feeding?";
//   }
//   if (attendanceRate < 50) {
//     return "Would you like to review possible causes of absences?";
//   }
//   if (feedingRate < 50) {
//     return "Would you like to see meal history details?";
//   }
//   if (attendanceRate < 80 || feedingRate < 85) {
//     return "Would you like suggestions to improve consistency?";
//   }
//   if (result.timeframe === "last_week") {
//     return "Would you like to compare this with the previous week?";
//   }

//   return "Would you like to review this week's attendance trend?";
// }

// export function composeAttendanceClassReply(
//   result: SummarizeAttendanceClassResult,
//   language: AIResponseLanguage = "en",
// ): string {
//   const rangeText = timeframeLabel(result.timeframe, language);

//   if (result.totalRecords === 0) {
//     const noDataLine =
//       language === "tl"
//         ? `Wala pang class attendance records ${rangeText}.`
//         : `No class attendance records are available ${rangeText}.`;

//     return joinReplySections([
//       noDataLine,
//       riskLevelLine("watch"),
//       suggestedActionsSection(
//         classAttendanceActions("watch", language),
//         fallbackAttendanceAction(language),
//       ),
//       followUpSection(
//         attendanceFollowUpQuestion({
//           attendanceRate: 0,
//           totalRecords: 0,
//           timeframe: result.timeframe,
//           language,
//           isClass: true,
//         }),
//       ),
//     ]);
//   }

//   const insight = analyzeAttendanceInsight({
//     tool: "summarize_attendance",
//     timeframe: result.timeframe,
//     present: result.present,
//     absent: result.absent,
//     totalDays: result.totalRecords,
//     attendanceRate: result.attendanceRate,
//     absentDates: result.absentDates,
//   });

//   const summaryLine =
//     language === "tl"
//       ? result.timeframe === "today"
//         ? `Ngayong araw, ${classCountLabel(result.present, language)} ang present at ${classCountLabel(result.absent, language)} ang absent.`
//         : `Para sa ${rangeText}, may ${result.present} present records at ${result.absent} absent records sa ${classCountLabel(result.totalChildren, language)}.`
//       : result.timeframe === "today"
//         ? `Today, ${classCountLabel(result.present, language)} ${englishToBe(result.present)} marked present and ${classCountLabel(result.absent, language)} ${englishToBe(result.absent)} marked absent.`
//         : `For ${rangeText}, attendance shows ${result.present} present records and ${result.absent} absent records across ${classCountLabel(result.totalChildren, language)}.`;

//   const metricsLine = `Attendance: ${result.present}/${result.totalRecords} records (${result.attendanceRate}%).`;

//   const detailSection = joinReplyLines([
//     attendanceRateSentence(result.attendanceRate, insight.level, language),
//     formatAbsentDatesSentence(result.absentDates, language),
//     absenceStreakSentence(result.absentDates, language, "class"),
//   ]);

//   return joinReplySections([
//     summaryLine,
//     metricsLine,
//     riskLevelLine(insight.level),
//     detailSection,
//     suggestedActionsSection(
//       classAttendanceActions(insight.level, language),
//       fallbackAttendanceAction(language),
//     ),
//     followUpSection(
//       attendanceFollowUpQuestion({
//         attendanceRate: result.attendanceRate,
//         totalRecords: result.totalRecords,
//         timeframe: result.timeframe,
//         language,
//         isClass: true,
//       }),
//     ),
//   ]);
// }

// export function composeFeedingClassReply(
//   result: SummarizeFeedingClassResult,
//   language: AIResponseLanguage = "en",
// ): string {
//   const rangeText = timeframeLabel(result.timeframe, language);

//   if (result.totalRecords === 0) {
//     const noDataLine =
//       language === "tl"
//         ? `Wala pang class feeding records ${rangeText}.`
//         : `No class feeding records are available ${rangeText}.`;

//     return joinReplySections([
//       noDataLine,
//       riskLevelLine("watch"),
//       suggestedActionsSection(
//         classFeedingActions("watch", language),
//         fallbackFeedingAction(language),
//       ),
//       followUpSection(
//         feedingFollowUpQuestion({
//           feedingRate: 0,
//           totalRecords: 0,
//           timeframe: result.timeframe,
//           language,
//           isClass: true,
//         }),
//       ),
//     ]);
//   }

//   const insight = analyzeFeedingInsight({
//     tool: "summarize_feeding",
//     timeframe: result.timeframe,
//     completed: result.completed,
//     missed: result.missed,
//     totalMeals: result.totalRecords,
//     feedingRate: result.feedingRate,
//     foods: result.foods,
//   });

//   const summaryLine =
//     language === "tl"
//       ? result.timeframe === "today"
//         ? `Ngayong araw, ${result.completed} feeding records ang completed at ${result.missed} ang missed para sa ${classCountLabel(result.totalChildren, language)}.`
//         : `Para sa ${rangeText}, may ${result.completed} completed feeding records at ${result.missed} missed records sa ${classCountLabel(result.totalChildren, language)}.`
//       : result.timeframe === "today"
//         ? `Today, feeding shows ${result.completed} completed records and ${result.missed} missed records across ${classCountLabel(result.totalChildren, language)}.`
//         : `For ${rangeText}, feeding shows ${result.completed} completed records and ${result.missed} missed records across ${classCountLabel(result.totalChildren, language)}.`;

//   const metricsLine = `Feeding Completion: ${result.completed}/${result.totalRecords} records (${result.feedingRate}%).`;

//   const foodsLine =
//     result.foods.length === 0
//       ? ""
//       : language === "tl"
//         ? `Mga naihain na pagkain: ${result.foods.join(", ")}.`
//         : `Meals served included ${result.foods.join(", ")}.`;

//   const detailSection = joinReplyLines([
//     feedingRateSentence(result.feedingRate, insight.level, language),
//     foodsLine,
//   ]);

//   return joinReplySections([
//     summaryLine,
//     metricsLine,
//     riskLevelLine(insight.level),
//     detailSection,
//     suggestedActionsSection(
//       classFeedingActions(insight.level, language),
//       fallbackFeedingAction(language),
//     ),
//     followUpSection(
//       feedingFollowUpQuestion({
//         feedingRate: result.feedingRate,
//         totalRecords: result.totalRecords,
//         timeframe: result.timeframe,
//         language,
//         isClass: true,
//       }),
//     ),
//   ]);
// }

// export async function composeAttendanceReply(
//   result: SummarizeAttendanceResult,
//   insight: InsightBlock = analyzeAttendanceInsight(result),
//   language: AIResponseLanguage = "en",
//   role: string = "parent",
// ): Promise<string> {
//   const audienceRole = normalizeAudienceRole(role);
//   const isParentAudience = audienceRole === "parent";
//   const childName = String(result.childName ?? "").trim();
//   const recommendations = await recommendForAttendance(
//     result,
//     insight,
//     language,
//   );
//   const rangeText = timeframeLabel(result.timeframe, language);

//   if (result.totalDays === 0) {
//     const noDataMessage =
//       language === "tl"
//         ? "Wala pang attendance records para sa napiling timeframe."
//         : insight.interpretation;

//     return joinReplySections([
//       noDataMessage,
//       "Attendance: 0/0 days (0%).",
//       riskLevelLine(insight.level),
//       suggestedActionsSection(
//         recommendations,
//         fallbackAttendanceAction(language),
//       ),
//       followUpSection(
//         attendanceFollowUpQuestion({
//           attendanceRate: result.attendanceRate,
//           totalRecords: result.totalDays,
//           timeframe: result.timeframe,
//           language,
//         }),
//       ),
//     ]);
//   }

//   const summaryLine =
//     result.timeframe === "today"
//       ? result.absent > 0
//         ? roleAwareLine({
//             language,
//             isParentAudience,
//             enParent: "Your child was absent today.",
//             enOther: childName
//               ? `${childName} was absent today.`
//               : "This child was absent today.",
//             tlParent: "Absent ang anak mo ngayong araw.",
//             tlOther: childName
//               ? `Absent si ${childName} ngayong araw.`
//               : "Absent ang batang ito ngayong araw.",
//           })
//         : roleAwareLine({
//             language,
//             isParentAudience,
//             enParent: "Yes, your child was present today.",
//             enOther: childName
//               ? `Yes, ${childName} was present today.`
//               : "Yes, this child was present today.",
//             tlParent: "Oo, present ang anak mo ngayong araw.",
//             tlOther: childName
//               ? `Oo, present si ${childName} ngayong araw.`
//               : "Oo, present ang batang ito ngayong araw.",
//           })
//       : roleAwareLine({
//           language,
//           isParentAudience,
//           enParent: `Your child attended ${result.present} out of ${result.totalDays} school days ${rangeText}, with ${result.absent} absence${result.absent === 1 ? "" : "s"}.`,
//           enOther: childName
//             ? `${childName} attended ${result.present} out of ${result.totalDays} school days ${rangeText}, with ${result.absent} absence${result.absent === 1 ? "" : "s"}.`
//             : `This child attended ${result.present} out of ${result.totalDays} school days ${rangeText}, with ${result.absent} absence${result.absent === 1 ? "" : "s"}.`,
//           tlParent: `Present ang anak mo sa ${result.present} sa ${result.totalDays} araw ng klase ${rangeText}, na may ${result.absent} pagliban.`,
//           tlOther: childName
//             ? `Present si ${childName} sa ${result.present} sa ${result.totalDays} araw ng klase ${rangeText}, na may ${result.absent} pagliban.`
//             : `Present ang batang ito sa ${result.present} sa ${result.totalDays} araw ng klase ${rangeText}, na may ${result.absent} pagliban.`,
//         });

//   const metricsLine =
//     language === "tl"
//       ? `Attendance: ${result.present}/${result.totalDays} araw (${result.attendanceRate}%).`
//       : `Attendance: ${result.present}/${result.totalDays} days (${result.attendanceRate}%).`;

//   const detailSection = joinReplyLines([
//     attendanceRateSentence(result.attendanceRate, insight.level, language),
//     formatAbsentDatesSentence(result.absentDates, language),
//     absenceStreakSentence(result.absentDates, language, "child"),
//   ]);

//   return joinReplySections([
//     summaryLine,
//     metricsLine,
//     riskLevelLine(insight.level),
//     detailSection,
//     suggestedActionsSection(recommendations, fallbackAttendanceAction(language)),
//     followUpSection(
//       attendanceFollowUpQuestion({
//         attendanceRate: result.attendanceRate,
//         totalRecords: result.totalDays,
//         timeframe: result.timeframe,
//         language,
//       }),
//     ),
//   ]);
// }

// export async function composeFeedingReply(
//   result: SummarizeFeedingResult,
//   insight: InsightBlock = analyzeFeedingInsight(result),
//   language: AIResponseLanguage = "en",
//   role: string = "parent",
// ): Promise<string> {
//   const audienceRole = normalizeAudienceRole(role);
//   const isParentAudience = audienceRole === "parent";
//   const childName = String(result.childName ?? "").trim();
//   const recommendations = await recommendForFeeding(result, insight, language);
//   const rangeText = timeframeLabel(result.timeframe, language);
//   const foodsText =
//     result.foods.length === 0
//       ? ""
//       : language === "tl"
//         ? `Kasama sa mga inihain na pagkain ang ${result.foods.join(", ")}.`
//         : `Meals served included ${result.foods.join(", ")}.`;

//   if (result.totalMeals === 0) {
//     const noDataMessage =
//       language === "tl"
//         ? "Wala pang feeding records para sa napiling timeframe."
//         : insight.interpretation;

//     return joinReplySections([
//       noDataMessage,
//       "Feeding Completion: 0/0 meals (0%).",
//       riskLevelLine(insight.level),
//       suggestedActionsSection(recommendations, fallbackFeedingAction(language)),
//       followUpSection(
//         feedingFollowUpQuestion({
//           feedingRate: result.feedingRate,
//           totalRecords: result.totalMeals,
//           timeframe: result.timeframe,
//           language,
//         }),
//       ),
//     ]);
//   }

//   const summaryLine = roleAwareLine({
//     language,
//     isParentAudience,
//     enParent: `Your child completed ${result.completed} out of ${result.totalMeals} meals ${rangeText}, with ${result.missed} missed.`,
//     enOther: childName
//       ? `${childName} completed ${result.completed} out of ${result.totalMeals} meals ${rangeText}, with ${result.missed} missed.`
//       : `This child completed ${result.completed} out of ${result.totalMeals} meals ${rangeText}, with ${result.missed} missed.`,
//     tlParent: `Nakumpleto ng anak mo ang ${result.completed} sa ${result.totalMeals} meals ${rangeText}, at may ${result.missed} na hindi nakumpleto.`,
//     tlOther: childName
//       ? `Nakumpleto ni ${childName} ang ${result.completed} sa ${result.totalMeals} meals ${rangeText}, at may ${result.missed} na hindi nakumpleto.`
//       : `Nakumpleto ng batang ito ang ${result.completed} sa ${result.totalMeals} meals ${rangeText}, at may ${result.missed} na hindi nakumpleto.`,
//   });

//   const metricsLine = `Feeding Completion: ${result.completed}/${result.totalMeals} meals (${result.feedingRate}%).`;

//   const detailSection = joinReplyLines([
//     feedingRateSentence(result.feedingRate, insight.level, language),
//     foodsText,
//   ]);

//   return joinReplySections([
//     summaryLine,
//     metricsLine,
//     riskLevelLine(insight.level),
//     detailSection,
//     suggestedActionsSection(recommendations, fallbackFeedingAction(language)),
//     followUpSection(
//       feedingFollowUpQuestion({
//         feedingRate: result.feedingRate,
//         totalRecords: result.totalMeals,
//         timeframe: result.timeframe,
//         language,
//       }),
//     ),
//   ]);
// }

// export async function composeChildReportReply(
//   result: GenerateChildReportResult,
//   insight: ChildReportInsight = analyzeChildReportInsight(result),
//   language: AIResponseLanguage = "en",
//   role: string = "parent",
// ): Promise<string> {
//   const audienceRole = normalizeAudienceRole(role);
//   const isParentAudience = audienceRole === "parent";
//   const childName = String(
//     result.childName ?? result.attendance.childName ?? result.feeding.childName ?? "",
//   ).trim();
//   const recommendations = await recommendForChildReport(
//     result,
//     insight,
//     language,
//   );
//   const rangeText = timeframeLabel(result.timeframe, language);

//   const introLine = roleAwareLine({
//     language,
//     isParentAudience,
//     enParent: `Here is your child's update ${rangeText}.`,
//     enOther: childName
//       ? `Here is ${englishPossessive(childName)} update ${rangeText}.`
//       : `Here is this child's update ${rangeText}.`,
//     tlParent: `Narito ang update ng anak mo ${rangeText}.`,
//     tlOther: childName
//       ? `Narito ang update ni ${childName} ${rangeText}.`
//       : `Narito ang update ng batang ito ${rangeText}.`,
//   });

//   const attendanceLine =
//     language === "tl"
//       ? `Attendance: ${result.attendance.present}/${result.attendance.totalDays} araw na present (${result.attendance.attendanceRate}%).`
//       : `Attendance: ${result.attendance.present}/${result.attendance.totalDays} days present (${result.attendance.attendanceRate}%).`;

//   const feedingLine =
//     language === "tl"
//       ? `Feeding Completion: ${result.feeding.completed}/${result.feeding.totalMeals} meals na nakumpleto (${result.feeding.feedingRate}%).`
//       : `Feeding Completion: ${result.feeding.completed}/${result.feeding.totalMeals} meals completed (${result.feeding.feedingRate}%).`;

//   const mealsLine =
//     result.feeding.foods.length === 0
//       ? ""
//       : language === "tl"
//         ? `Kasama sa mga inihain na pagkain ang ${result.feeding.foods.join(", ")}.`
//         : `Meals served included ${result.feeding.foods.join(", ")}.`;

//   const detailSection = joinReplyLines([
//     overallSentence(insight.overallLevel, language),
//     attendanceRateSentence(
//       result.attendance.attendanceRate,
//       insight.attendance.level,
//       language,
//     ),
//     feedingRateSentence(
//       result.feeding.feedingRate,
//       insight.feeding.level,
//       language,
//     ),
//     formatAbsentDatesSentence(result.attendance.absentDates, language),
//     absenceStreakSentence(result.attendance.absentDates, language, "child"),
//     mealsLine,
//   ]);

//   return joinReplySections([
//     introLine,
//     joinReplyLines([attendanceLine, feedingLine]),
//     riskLevelLine(insight.overallLevel),
//     detailSection,
//     suggestedActionsSection(recommendations, fallbackReportAction(language)),
//     followUpSection(reportFollowUpQuestion(result, language)),
//   ]);
// }
