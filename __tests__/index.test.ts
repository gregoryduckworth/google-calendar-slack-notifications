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
                    summary: "Test Craftsmanship",
                    description:
                      `#community-dev\n` +
                      `#community-test\n` +
                      `- Agenda item 1\n` +
                      `- Agenda item 2`,
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

  it("posts events to Slack", async () => {
    await run();
    expect(axios.post).toHaveBeenCalledWith(
      "https://slack.com/api/chat.postMessage",
      {
        channel: "#community-test",
        text:
          `Hey <!channel>!\n` +
          `There is a #community-test session starting at 12:00:\n` +
          `- Agenda item 1\n` +
          `- Agenda item 2`,
      },
      {
        headers: {
          authorization: `Bearer token`,
        },
      }
    );
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
