import axios from "axios";
import { google } from "googleapis";

const COMMUNITIES = [
  "accessibility",
  "backend",
  "data",
  "dev",
  "devops",
  "frontend",
  "mobile-apps",
  "security",
  "test",
];

const getClient = async () => {
  const credentials = JSON.parse(process.env.CREDENTIALS);
  return await google.auth.getClient({
    credentials,
    scopes: "https://www.googleapis.com/auth/calendar.readonly",
  });
};

const getCalendar = (client) => {
  return google.calendar({ version: "v3", auth: client });
};

const getEvents = async (calendar) => {
  const now = new Date();
  const nextHour = new Date(new Date().getTime() + 60 * 60 * 1000);

  const res = await calendar.events.list({
    calendarId: process.env.CALENDAR_ID,
    timeMin: now.toISOString(),
    timeMax: nextHour.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 10,
  });
  return res.data.items;
};

const postEventsToSlack = async (events) => {
  if (!events || events.length === 0) {
    console.log("No upcoming events found.");
    return;
  }

  for (const event of events) {
    for (const name of COMMUNITIES) {
      if (containsExactMatch(event.description, `#community-${name}`)) {
        const startTime = new Date(event.start.dateTime).toLocaleTimeString(
          "en-GB",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        );
        axios.post(
          "https://slack.com/api/chat.postMessage",
          {
            channel: `#community-${name}`,
            text:
              `Hey <!channel>!\n` +
              `There is a #community-${name} session starting at ${startTime}:\n` +
              `${eventDescription(event.description)}`,
          },
          { headers: { authorization: `Bearer ${process.env.SLACK_TOKEN}` } }
        );
      }
    }
  }
};

const eventDescription = (description) => {
  for (const name of COMMUNITIES) {
    description = description
      .split("\n")
      .filter(function (line) {
        return line.indexOf(`#community-${name}`) == -1;
      })
      .join("\n");
  }
  return `${description}`;
};

const escapeRegExpMatch = (str) => {
  return str.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
};

const containsExactMatch = (str, match) => {
  const escapedMatch = escapeRegExpMatch(match).replace(/\s+/g, "\\s+");
  const pattern = new RegExp(`^${escapedMatch}$`, "m");
  return pattern.test(str);
};

export const run = async () => {
  const client = await getClient();
  if (client) {
    const calendar = getCalendar(client);
    const events = await getEvents(calendar);
    postEventsToSlack(events);
  }
};

module.exports.run = run;
