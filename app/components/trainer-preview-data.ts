/** Fictional trainer records for the approved UI preview. Never treat as client data. */
export const trainerClients = [
  { id: "maya", initials: "MA", name: "Maya Adams", summary: "Plan review due today", detail: "Strength A · two sessions this week", next: "Review her plan", tone: "reward" },
  { id: "jordan", initials: "JL", name: "Jordan Lee", summary: "Question about Friday", detail: "Friday's session · message to answer", next: "Reply to a question", tone: "calm" },
  { id: "tara", initials: "TN", name: "Tara Noor", summary: "Weekly check-in complete", detail: "Consistency goal · one extra set", next: "See her update", tone: "coach" },
] as const;
