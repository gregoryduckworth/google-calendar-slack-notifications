import axios from "axios";
import { run } from "../src/index";

jest.mock("axios");

jest.mock("googleapis", () => ({
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
                  description: "#community-test",
                },
              ],
            },
          })
        ),
      },
    })),
  },
}));

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
        text: "Hey <!channel>!\nThere is a #community-test session starting at 12:00:\n#community-test",
      },
      { headers: { authorization: `Bearer token` } }
    );
  });
});
