import axios from "axios";
import { run } from "../index";

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

jest.mock("fs", () => {
  return {
    readFileSync: jest.fn(() => '{ "test": "credentials" }'),
  };
});

describe("Calendar", () => {
  beforeEach(() => {
    process.env.SLACK_TOKEN = "token";
    process.env.CALENDAR_ID = "calendar_id";
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("posts events to Slack", async () => {
    // set up mock for axios.get
    const mock = jest.spyOn(axios, "post");
    mock.mockReturnValueOnce(Promise.resolve({ data: {} }));

    await run();

    expect(axios.post).toHaveBeenCalledWith(
      "https://slack.com/api/chat.postMessage",
      {
        channel: "#community-test",
        text: "Hey @channel! There is a test community meeting starting at 12:00",
      },
      { headers: { authorization: `Bearer token` } }
    );
  });
});
