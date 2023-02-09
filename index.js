require('dotenv').config();
const { google } = require('googleapis');
const axios = require('axios');
const fs = require('fs');
const slackURL = 'https://slack.com/api/chat.postMessage';

const COMMUNITIES = [
  'accessibility',
  'backend',
  'data',
  'dev',
  'devops',
  'frontend',
  'mobile-apps',
  'security',
  'test',
];

let credentials = JSON.parse(fs.readFileSync('./credentials.json', 'utf8'));

const getClient = async () => {
  return await google.auth.getClient({
    credentials,
    scopes: 'https://www.googleapis.com/auth/calendar.readonly',
  });
};

const getCalendar = (client) => {
  return google.calendar({ version: 'v3', auth: client });
};

const getEvents = async (calendar) => {
  const now = new Date();
  const nextHour = new Date(new Date().getTime() + (60 * 60 * 1000));

  const res = await calendar.events.list({
    calendarId: process.env.CALENDAR_ID,
    timeMin: now.toISOString(),
    timeMax: nextHour.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 10
  });

  return res.data.items;
};

const postEventsToSlack = async (events) => {
  if (!events || events.length === 0) {
    console.log('No upcoming events found.');
    return;
  }

  events.forEach((event) => {
    for (const name of COMMUNITIES) {
      if (isExactMatch(event.description, `community-${name}`)) {
        const start = new Date(event.start.dateTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        axios.post(slackURL, {
          channel: `#community-${name}`,
          text: `Hey @channel! There is a community meeting starting at ${start}`
        }, { headers: { authorization: `Bearer ${process.env.SLACK_TOKEN}` } });
      }
    }
  });
};

const escapeRegExpMatch = function(s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

const isExactMatch = (str, match) => {
  return new RegExp(`^${escapeRegExpMatch(match)}$`).test(str);
};

module.exports.run = async () => {
  const client = await getClient();
  const calendar = getCalendar(client);
  const events = await getEvents(calendar);
  postEventsToSlack(events);
};
