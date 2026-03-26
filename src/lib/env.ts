export const env = {
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:3000",
  timezone: process.env.APP_TIMEZONE ?? "Asia/Tokyo",
  lineChannelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? "",
  lineChannelSecret: process.env.LINE_CHANNEL_SECRET ?? "",
  lineGroupId: process.env.LINE_GROUP_ID || "mock-line-group",
  lineMockMode: (process.env.LINE_MOCK_MODE ?? "true").toLowerCase() === "true",
  cronSecret: process.env.CRON_SECRET ?? ""
};
