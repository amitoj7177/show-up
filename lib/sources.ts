// Every outside service the app uses. The UI and README both read from this list.
export const SOURCES = [
  {
    name: "Google Gemini API",
    url: "https://aistudio.google.com/docs/models",
    licence: "Google Gemini API terms",
    usedFor: "Checking a goal is safe before a partner sees it, and removing personal details.",
  },
  {
    name: "Auth0",
    url: "https://auth0.com",
    licence: "Auth0 terms of service",
    usedFor: "Keeping emails and passwords safe, and sending password reset emails.",
  },
  {
    name: "Tiger Data (Postgres)",
    url: "https://www.tigerdata.com",
    licence: "Tiger Data terms of service",
    usedFor: "Storing nicknames, goals, pairs and check-ins.",
  },
];
