# drop-bot
A simple Twitch bot with drag and drop command installation. Made with Node.JS.

## Purpose
The purpose of this project was to create a simple to use, customiseable and expandable Twitch chat bot that users can easily run themselves.

The bot uses the tmi.js module to enable connections to Twitch's IRC chat server. By using the tmi.js module users are able to connect to multiple channels using the bot and provide the bots functionality to all of them. 

The bot also uses the chokidar module to monitos a user defined directory for changes to detect additions, changes and removals. These events are then used to add, update and remove commands from the bot dynamically allowing users to create their own command modules and add them to the bot on the fly.
