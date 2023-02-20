# google-calendar-slack-notifications

## Description

A lambda created to run every hour, to notify the correct community channel based on the description that the calendar event has.

## Background Setup

- Ensure that you have setup a `service_account` in the Google Developer Console that has the ability to view the CalendarAPI.
  - Make sure you have copied the `JSON` for the account details into `CREDENTIALS` variable in the `.env` file.
- Ensure you have the correct AWS credentials to deploy a lambda through serverless.

## Setup

1. Run `npm i` to install the dependencies
