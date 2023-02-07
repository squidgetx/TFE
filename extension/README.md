# Twitter Feed Experiment via Chrome Extension

## Development:

0. `npm install`

1. `npx webpack --watch`

2. Chrome > Extensions > Load Unpacked > Select `build` folder

## Overview

This extension monitors the user's Twitter feed and injects/removes content based on their (random) assignment to an experimental treatment condition.

`accounts.js` contains a list of accounts whose Tweets should be removed from users' timeline

`background.js` handles all server communication (fetching tweets to inject, sending behavioral data to log)

`completecode.js` is a simple module that generates psuedo-unique registration codes for users to submit during the installation process

`content.js` is the main entrypoint/wrapper for the feed modification code

`log.js` manages logging user data

`popup.js` manages the extension pop up and registration workflow

`twitter_parser.js` parses tweet HTML from the timeline into structured objects that can be manipulated/logged

`twitter_svgs.js` is a utility class that holds SVG icons used on Twitter

`twitter.js` handles all Twitter-specific parsing code, including injection rendering
