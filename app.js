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

let commandModulesPath;
if (pathModule.isAbsolute(options.commandModulesPath)) {
  commandModulesPath = options.commandModulesPath;
}
else {
  commandModulesPath = pathModule.join(__dirname, options.commandModulesPath);
}

const commandModules = [];

loadModules(commandModulesPath, commandModules, () => {
  for (let i = 0; i < commandModules.length; i++) {
    commandHandler.commands.push(new objects.CommandObject(client, commandModules[i].options, commandModules[i].func));
  }

  const commandWatcher = chokidar.watch(options.commandModulesPath, {persistant: true, ignoreInitial: true});

  commandWatcher
    .on('addDir', path => {
      console.log(`directory: ${path} was added to ${options.commandModulesPath}`);
      let f = pathModule.join(commandModulesPath, cutPath(path), 'index.js');
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
            let f = pathModule.join(commandModulesPath, cutPath(path));
            commandHandler.add(require(f));
          } catch (e) {
            console.log(e);
          }
        }
      }
    })
    .on('change', (path, stats) => {
      console.log(`${path} changed`);
      console.log({path, stats});
      if (stats.isFile()) {
        if ((path.toLowerCase()).includes('index.js')) {
          try {
            let f = pathModule.join(commandModulesPath, cut(path));
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

    commandHandler.execCommand(command, {channel, user, self}, msgClone);
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
      console.log(f);
      try {
        holder.push(require(f));
      } catch (e) {
        console.log(e);
      }

    }
    callback();
  });
}

function cutPath(path) {
  let cutIndex = path.indexOf('\\');

  if (cutIndex !== -1) {
    return path.slice(cutIndex);
  }
  else {
    cutIndex = path.indexOf('/');
    return path.slice(cutIndex);
  }
}
