export const GREETING_PATTERN = /^(hi|hello|hey|good morning|good afternoon|good evening|kumusta|kamusta|magandang umaga|magandang hapon|magandang gabi)[.!?]*$/i;

export const ACKNOWLEDGEMENT_PATTERN = /^(thanks|thanks a lot|thank you|thank you so much|ty|ok|okay|alright|got it|noted|salamat|maraming salamat|naiintindihan|sige)[.!?]*$/i;

export const CONVERSATION_CLOSURE_PATTERN = /^(no(?:pe)?\s*(?:,)?\s*(?:thank\s*you|thanks)|not now(?:\s*(?:,)?\s*(?:thank\s*you|thanks))?|wala na(?:\s*,?\s*(?:salamat))?|hindi na muna(?:\s*,?\s*(?:salamat))?)\s*[.!?]*$/i;

export const AFFIRMATIVES = new Set([
  "yes", "y", "yeah", "yep", "sure", "ok", "okay", "yes please", "sure please", "go ahead", "proceed",
  "oo", "opo", "sige"
]);
