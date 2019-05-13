const fs = require('fs');
const pathModule = require('path');
const staticModuleHolder = [];

const tmi = require('tmi.js');
const options = require('./options/');

const chokidar = require('chokidar');

const objects = require('./objects/');

const dir = pathModule.join(__dirname, 'static-commands');
let commandHandler = null, client = null;
loadModules(dir, staticModuleHolder, () => {
  client = new tmi.client(options.tmiOptions);

  let staticCommands = [];
  for (var i = 0; i < staticModuleHolder.length; i++) {
    staticCommands.push(new objects.CommandObject(client, staticModuleHolder[i].options, staticModuleHolder[i].func));
  }
  commandHandler = new objects.CommandHandler(client, staticCommands);
});
let commandModules = [];
loadModules(options.commandModulesPath, commandModules, () => {
  for (let i = 0; i < commandModules.length; i++) {
    commandHandler.commands.push(new objects.CommandObject(client, commandModules[i].options, commandModules[i].func));
  }

  const commandWatcher = chokidar.watch(options.commandModulesPath, {persistant: true, ignoreInitial: true});

  commandWatcher
    .on('addDir', path => {
      console.log(`directory: ${path} was added to ${options.commandModulesPath}`);
      let f = pathModule.join(__dirname, path, 'index.js');
      console.log(f);
      try {
        if (fs.existsSync(f)) {
          console.log(`${path} contains an index.js file`);
          commandHandler.add(require(f));
        }
      }
      catch (e) {
        console.log(e);
      }
    })
    .on('add', (path, stats) => {
      console.log({path, stats});
      if (stats.isFile()) {
        if ((path.toLowerCase()).includes('index.js')) {
          try {
            let f = pathModule.join(__dirname, path);
            commandHandler.add(require(f));
          } catch (e) {
            console.log(e);
          }
        }
      }
    })
    .on('change', (path, stats) => {
      console.log({path, stats});
      if (stats.isFile()) {
        if ((path.toLowerCase()).includes('index.js')) {
          try {
            let f = pathModule.join(__dirname, path);
            commandHandler.update(require(f));
          } catch (e) {
            console.log(e);
          }
        }
      }
    })
    .on('ready', () => console.log('watcher is ready'));

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
