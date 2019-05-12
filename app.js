const fs = require('fs');
const pathModule = require('path');
const staticModuleHolder = [];

const tmi = require('tmi.js');
const ops = require('./options/');

const objects = require('./objects/');

const dir = pathModule.join(__dirname, 'static-commands');
let commandHandler = null, client = null;
console.log(dir);
loadModules(dir, staticModuleHolder, () => {
  client = new tmi.client(ops);

  let staticCommands = [];
  for (var i = 0; i < staticModuleHolder.length; i++) {
    staticCommands.push(new objects.CommandObject(client, staticModuleHolder[i].options, staticModuleHolder[i].func));
  }
  commandHandler = new objects.CommandHandler(client, staticCommands);

  client.connect();

  client.on('message', messageHandler);
});

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

function loadModules(path, holder, callback) {
  fs.readdir(path, (err, files) => {
    let f;
    for (let i = 0; i < files.length; i++) {
      f = pathModule.join(path, files[i])
      holder.push(require(f));
    }
    callback();
  });
}
