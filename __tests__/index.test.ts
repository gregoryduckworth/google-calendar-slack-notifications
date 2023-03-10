import axios from "axios";
import { run } from "../src/index";

jest.mock("axios");

jest.mock("googleapis", () => {
  return {
    google: {
      auth: {
        getClient: jest.fn(() => Promise.resolve({ auth: "client-auth" })),
      },
      calendar: jest.fn(() => ({
        events: {
          list: jest.fn(() =>
            Promise.resolve({
              data: {
                items: [
                  {
                    start: { dateTime: "2022-01-01T12:00:00Z" },
                    summary: "Community Meeting",
                    description: `#community-test #community-dev - Agenda item 1 - Agenda item 2`,
                    conferenceData: {
                      entryPoints: [
                        {
                          entryPointType: "video",
                          uri: "http://example.org",
                        },
                      ],
                    },
                  },
                ],
              },
            })
          ),
        },
      })),
    },
  };
});

describe("Calendar", () => {
  beforeEach(() => {
    process.env.SLACK_TOKEN = "token";
    process.env.CALENDAR_ID = "calendar_id";
    process.env.CREDENTIALS = '{ "test": "credentials" }';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("posts events to Slack in community channels", async () => {
    await run();
    expect(axios.post).toHaveBeenCalledTimes(2);
    for (const name of ["dev", "test"]) {
      expect(axios.post).toHaveBeenCalledWith(
        "https://slack.com/api/chat.postMessage",
        {
          channel: `#community-${name}`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `Hey @channel! There is a meeting starting at 12:00:`,
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
                  `*Community Meeting* (<http://example.org|Zoom Link>)\n` +
                  `#community-test #community-dev - Agenda item 1 - Agenda item 2`,
              },
              accessory: {
                type: "image",
                image_url:
                  "https://api.slack.com/img/blocks/bkb_template_images/notifications.png",
                alt_text: "calendar thumbnail",
              },
            },
          ],
          unfurl_links: false,
        },
        {
          headers: {
            authorization: `Bearer token`,
          },
        }
      );
    }
  });

  it("does not post events to Slack when no events are found", async () => {
    jest.mock("googleapis", () => ({
      google: {
        auth: {
          getClient: jest.fn(() => Promise.resolve({ auth: "client-auth" })),
        },
        calendar: jest.fn(() => ({
          events: {
            list: jest.fn().mockResolvedValue({ data: { items: [] } }),
          },
        })),
      },
    }));
    await run();
    expect(axios.post).not.toHaveBeenCalled();
  });
});
