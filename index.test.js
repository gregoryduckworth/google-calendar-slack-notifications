const { run } = require('./index');
const axios = require('axios');
const fs = require('fs');
const { google } = require('googleapis');

jest.mock('googleapis', () => ({
  google: {
    auth: {
      getClient: jest.fn(() => Promise.resolve({ auth: 'client-auth' })),
    },
    calendar: jest.fn(() => ({
      events: {
        list: jest.fn(() => Promise.resolve({ data: { items: [{ start: { dateTime: '2022-01-01T12:00:00Z' }, description: 'community-test' }] } })),
      },
    })),
  }
}));

jest.mock('axios', () => {
  return {
    post: jest.fn(() => Promise.resolve({ data: {} })),
  };
});

jest.mock('fs', () => {
  return {
    readFileSync: jest.fn(() => '{ "test": "credentials" }'),
  };
});

describe('Calendar', () => {
  beforeEach(() => {
    process.env.SLACK_TOKEN = 'token';
    process.env.CALENDAR_ID = 'calendar-id';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('posts events to Slack', async () => {
    await run();

    expect(axios.post).toHaveBeenCalledWith('https://slack.com/api/chat.postMessage', {
      channel: '#community-test',
      text: 'Hey @channel! There is a community meeting starting at 12:00',
    }, { headers: { authorization: `Bearer token` } });
  });
});
