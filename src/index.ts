import axios from "axios";
import { google } from "googleapis";
import htmlToMrkdwn from "html-to-mrkdwn-ts";

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
      if (event.description.includes(`#community-${name}`)) {
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
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `Hey @channel! There is a #community-test meeting starting at ${startTime}:`,
                },
              },
              {
                type: "divider",
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text:
                    `*${event.summary}*` +
                    ` ${zoomLink(event.conferenceData.entryPoints) ?? ""}\n` +
                    `${htmlToMrkdwn(event.description).text}`,
                },
                accessory: {
                  type: "image",
                  image_url:
                    "https://api.slack.com/img/blocks/bkb_template_images/notifications.png",
                  alt_text: "calendar thumbnail",
                },
              },
            ],
          },
          { headers: { authorization: `Bearer ${process.env.SLACK_TOKEN}` } }
        );
      }
    }
  }
};

const zoomLink = (event) => {
  for (const entry of event) {
    if (entry.entryPointType === "video") {
      return `(<${entry.uri}|Zoom Link>)`;
    }
  }
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
