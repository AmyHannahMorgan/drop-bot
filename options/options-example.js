/*  use this file as a template for your options,
finished rename or copy and rename this file to index.js*/
const tmiOptions = {
  options: {
    clientId: null, // used to identity your app to the api
    debug: false // if true debug messages are shown in the console
  },
  connection: {
    server: 'irc-ws.chat.twitch.tv', // what server to connect to
    port: 80, // what port to connect to
    reconnect: true, // if true attempts to reconnect to server if disconnected
    secure: true // if true uses a secure connection to the server
  },
  identity: {
    username: 'im_a_bot', // the username of the bot
    password: 'oauth:randomchars' // oauth authentification for the bot
  },
  channels: [] // array of channels to join (strings)
}

const commandModulesPath = '' // path to a folder containing command modules, relative paths will be relative to app.js

// exports the above variables so that they can be accessed by app.js
module.exports = {
  tmiOptions: tmiOptions,
  commandModulesPath: commandModulesPath
};
