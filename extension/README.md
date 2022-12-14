# Twitter Feed Experiment via Chrome Extension

## Development:

0. `npm install`

1. `npx webpack --watch`

2. Chrome > Extensions > Load Unpacked > Select `build` folder

This repo is set up with `crx-hotreload`, which means that as soon as files in the `build` directory are updated (with webpack), the Chrome page will reload itself.

## Injection Architecture

When injecting tweets, the extension queries a very simple backend powered by S3. The extension queries for 64 tweets at a time to avoid lagging the page with too many round-trip network requests.

The query asks for an S3 folder named with the `registrationCode` found in client localStorage. Within this folder the query asks for the latest file which should have the name `YYYY-MM-DD-registrationCode.json` equivalent to today's date.

If this file is not found, we write a log warning/error.

A cron job to populate the S3 bucket can be found in the XXX repository.

Fuck it let's go server/DB architecture wayyy easier. I guess just use aws infra.
