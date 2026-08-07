export const GREETING_PATTERN = /^(hi|hello|hey|good morning|good afternoon|good evening)[.!?]*$/i;

export const ACKNOWLEDGEMENT_PATTERN = /^(thanks|thanks a lot|thank you|thank you so much|ty|ok|okay|alright|got it|noted)[.!?]*$/i;

export const CONVERSATION_CLOSURE_PATTERN = /^(no(?:pe)?\s*(?:,)?\s*(?:thank\s*you|thanks)|not now(?:\s*(?:,)?\s*(?:thank\s*you|thanks))?)\s*[.!?]*$/i;

export const AFFIRMATIVES = new Set([
  "yes", "y", "yeah", "yep", "sure", "ok", "okay", "yes please", "sure please", "go ahead", "proceed"
]);
