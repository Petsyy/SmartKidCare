import type { AIResponseLanguage, AIRiskLevel } from "../../api/api.types";

export const AI_CHAT_COPY = {
  en: {
    subtitle: "Ask about your child’s attendance and meals. You can use English or Filipino.",
    thinking: "Thinking…",
    tryAsking: "Try asking",
    replyingAbout: "Replying about",
    offlineTitle: "Offline · saved chat history is read-only",
    offlineBody: "Connect to the internet to send a new message.",
    emptyTitle: "How can I help?",
    emptyBody: (_name: string) =>
      "Ask about your child’s attendance and meals. You can use English or Filipino.",
    placeholder: (name: string) =>
      `Ask about ${name || "your child"}'s attendance or feeding...`,
    send: "Send message to AI assistant",
    rateLimited: "Too many questions were sent. Please wait and try again.",
    sendFailed: "I couldn't send that message. Please try again.",
    languageLabel: "Response language",
    loadErrorTitle: "Couldn't load child context",
    loadErrorBody: "Please try again so I can answer using the right child records.",
    noChildTitle: "No child linked yet",
    noChildBody: "Link a child to your parent account before using the AI assistant.",
    tryAgain: "Try Again",
    loading: "Loading...",
    offlinePlaceholder: "Connect to the internet to send a message",
    contextPlaceholder: "Loading your child records...",
    noChildPlaceholder: "Link a child before chatting...",
    deleteTitle: "Delete chat history?",
    deleteBody: "This removes the encrypted chat history saved on this device.",
    cancel: "Cancel",
    delete: "Delete",
    suggestions: [
      "Was my child present today?",
      "Pumasok ba ang anak ko ngayon?",
      "What did my child eat this week?",
      "Ano ang kinain ng anak ko ngayong linggo?",
    ],
  },
  fil: {
    subtitle: "Magtanong tungkol sa attendance at pagkain",
    thinking: "Nag-iisip…",
    tryAsking: "Subukang itanong",
    replyingAbout: "Sagot tungkol kay",
    offlineTitle: "Offline · mababasa lamang ang naka-save na usapan",
    offlineBody: "Kumonekta sa internet upang magpadala ng mensahe.",
    emptyTitle: "Paano ako makatutulong?",
    emptyBody: (name: string) =>
      `Magtanong tungkol sa records ni ${name || "iyong anak"} o pumili ng mungkahi sa ibaba.`,
    placeholder: (name: string) =>
      `Magtanong tungkol sa attendance o pagkain ni ${name || "iyong anak"}...`,
    send: "Magpadala ng mensahe sa AI assistant",
    rateLimited: "Masyadong maraming tanong ang ipinadala. Maghintay at subukan muli.",
    sendFailed: "Hindi naipadala ang mensahe. Pakisubukan muli.",
    languageLabel: "Wika ng sagot",
    loadErrorTitle: "Hindi ma-load ang impormasyon ng anak",
    loadErrorBody: "Subukan muli upang magamit ko ang tamang records ng iyong anak.",
    noChildTitle: "Wala pang naka-link na anak",
    noChildBody: "Mag-link muna ng anak sa iyong parent account bago gamitin ang AI assistant.",
    tryAgain: "Subukan Muli",
    loading: "Naglo-load...",
    offlinePlaceholder: "Kumonekta sa internet upang magpadala",
    contextPlaceholder: "Nilo-load ang records ng iyong anak...",
    noChildPlaceholder: "Mag-link muna ng anak bago makipag-chat...",
    deleteTitle: "Burahin ang chat history?",
    deleteBody: "Buburahin nito ang encrypted chat history sa device na ito.",
    cancel: "Kanselahin",
    delete: "Burahin",
    suggestions: [
      "Pumasok ba ang anak ko ngayon?",
      "Ilang araw lumiban ang anak ko noong nakaraang linggo?",
      "Ano ang kinain ng anak ko ngayong linggo?",
      "Ibuod ang attendance at pagkain ng anak ko noong nakaraang linggo.",
    ],
  },
} as const;

export const getRiskLabel = (
  riskLevel: AIRiskLevel,
  _language?: AIResponseLanguage,
): string => {
  const labels: Record<AIRiskLevel, string> = {
    LOW: "Low Risk",
    MEDIUM: "Medium Risk",
    HIGH: "High Risk",
  };
  return labels[riskLevel];
};
