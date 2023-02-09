# google-calendar-slack-notifications

## Description

A lambda created to run every hour, to notify the correct community channel based on the description that the calendar event has.

## Background Setup

- Ensure that you have setup a `service_account` in the Google Developer Console that has the ability to view the CalendarAPI. 
  - Make sure you have a copy of the `JSON` for the account details.

## Setup

1. Copy the `.env.sample` to `.env`
2. Ensure the credentials from the `service_account` in the [Background Setup](#background-setup) is located in the top folder under the name `credentials.json`
3. Run `npm i` to install the dependencies