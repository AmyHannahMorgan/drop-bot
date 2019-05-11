const tmi = require('tmi.js');
const ops = require('./options/');
const objects = require('./objects/');
const echo = require('./static-commands/echo');

const client = new tmi.client(ops);
let staticCommands = [];
staticCommands.push(new objects.CommandObject(client, echo.options, echo.func));
const commandHandler = new objects.CommandHandler(client, staticCommands);
client.connect();

client.on('message', messageHandler);

function messageHandler(channel, user, msg, self) {
  if(self) return;

  console.log(`${user.username} : ${msg}`);

  if (msg[0] === '!') {
    let msgClone = msg;
    let msgSplit = msgClone.split(' ');
    let command = msgSplit.shift().replace('!', '', 1);
    msgClone = msgSplit.join(' ');
    let commandObject = commandHandler.findCommand(command, {channel, user, self});
    if (commandObject !== null) {
      commandHandler.execCommand(commandObject, {channel, user, self}, msgClone);
    }
  }

  if((msg.toLowerCase()).includes(`@${client.username}`)) {
    client.say(`${channel}`, `hello @${user.username}`);
  }
}
