export const accessPackages = [
  {
    id: "community",
    name: "Community Access",
    price: "$0 · no credit card",
    liveClasses: "No allowance specified",
    onDemand: "Free platform-wide releases only",
    fitcoinCap: "100 FC per day",
    features: ["Community challenges", "Browse coaches, programs and classes", "Post, comment, invite and share", "Limited badges", "Message Board", "View-only calendar"],
  },
  {
    id: "core",
    name: "Core Circle Access",
    price: "Price to be confirmed",
    liveClasses: "3 live classes per month",
    onDemand: "3 on-demand classes per week",
    fitcoinCap: "200 FC per day",
    features: ["Limited leaderboard", "Badges and platform challenges", "CircleCoin and Marketplace access", "Community participation and Message Board", "Full calendar access"],
  },
  {
    id: "full",
    name: "Full Circle Access",
    price: "Price to be confirmed",
    liveClasses: "Unlimited live classes",
    onDemand: "Unlimited on-demand classes",
    fitcoinCap: "300 FC per day",
    features: ["Full leaderboard", "Badges and platform challenges", "CircleCoin and Marketplace access", "Community participation and Message Board", "DM coaches", "Full calendar access"],
  },
] as const;

export const fitCirclePlus = {
  name: "Healthy Life+",
  price: "$8.99 per month or $70 per year",
  features: ["Mindflow mood, energy, breathwork, meditation and journal", "Fuelmode micronutrients, meal ideas and macro calculator", "FitForum coach Q&A", "FaceOff challenges"],
} as const;
