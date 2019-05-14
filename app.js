// file system and navigation modules, for finding and loading modules dynamically
const fs = require('fs');
const pathModule = require('path');

// tmi.js, for connecting to Twitch's IRC
const tmi = require('tmi.js');

// options for tmi and for command module directory
const options = require('./options/');

// chokidar, for watching directories for changes, additions and deletions
const chokidar = require('chokidar');

// for CommandHandler and CommandObject
const objects = require('./objects/');

const staticModuleHolder = [];

// path to static-commands
const dir = pathModule.join(__dirname, 'static-commands');

// preparing variables for the tmi client and CommandHandler
let commandHandler = null, client = null;

// loads static commands and sets up client and command handler
loadModules(dir, staticModuleHolder, () => {

  // creates client with options from the options module
  client = new tmi.client(options.tmiOptions);

  // creates CommandObjects for each staic command module
  let staticCommands = [];
  for (var i = 0; i < staticModuleHolder.length; i++) {
    staticCommands.push(new objects.CommandObject(client, staticModuleHolder[i][0].options, staticModuleHolder[i][0].func, staticModuleHolder[i][1]));
  }
  // creates a command handler with the loaded static commands
  commandHandler = new objects.CommandHandler(client, staticCommands);
});

// determines if the path to the dynamic commands is absolute or relative
let commandModulesPath;
if (pathModule.isAbsolute(options.commandModulesPath)) {
  commandModulesPath = options.commandModulesPath;
}
else {
  commandModulesPath = pathModule.join(__dirname, options.commandModulesPath);
}

const commandModules = [];

// loads initial dynamic commands
loadModules(commandModulesPath, commandModules, () => {
  // builds commandobjects for each of the command modules
  for (let i = 0; i < commandModules.length; i++) {
    commandHandler.commands.push(new objects.CommandObject(client, commandModules[i][0].options, commandModules[i][0].func, commandModules[i][1]));
  }

  const chokidarOptions = {
    persistant: true,
    ignoreInitial: true,
    usePolling: true
  }

  // initialise directory watcher for dynamic commands
  const commandWatcher = chokidar.watch(options.commandModulesPath, chokidarOptions);

  // setup events for adding, updating and removing dynamic functions
  commandWatcher
    .on('addDir', path => {
      console.log(`directory: ${path} was added to ${options.commandModulesPath}`);
      let f = pathModule.join(commandModulesPath, cutPath(path), 'index.js');
      console.log(f);
      try {
        if (fs.existsSync(f)) {
          console.log(`${path} contains an index.js file`);
          commandHandler.add(require(f), f);
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
            commandHandler.add(require(f), f);
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
            let f = pathModule.join(commandModulesPath, cutPath(path));
            delete require.cache[require.resolve(f)];
            commandHandler.update(require(f), f);
          } catch (e) {
            console.log(e);
          }
        }
      }
    })
    .on('unlink', path => {
      console.log(`unlink path: ${path}`);
      let f = pathModule.join(commandModulesPath, cutPath(path));
      commandHandler.remove(f);
    })
    .on('unlinkDir', path => {
      console.log(`unlink path: ${path}`);
      let f = pathModule.join(commandModulesPath, cutPath(path));
      commandHandler.remove(f);
    })
    .on('ready', () => console.log('watcher is ready'));

  // begins connection to twitch's IRC
  client.connect();

  // setup event for messages to connected chanels
  client.on('message', messageHandler);
});

// logs messages and determines if messages are commands
function messageHandler(channel, user, msg, self) {
  if(self) return;

  console.log(`${user.username} : ${msg}`);

  if (msg[0] === '!') {
    let msgClone = msg;
    let msgSplit = msgClone.split(' ');
    let command = msgSplit.shift().replace('!', '', 1);
    msgClone = msgSplit.join(' ');

    commandHandler.execCommand(command, {channel, user, self}, msgClone);
    return;
  }

  if((msg.toLowerCase()).includes(`hello @${client.username}`)) {
    client.say(`${channel}`, `hello @${user.username}`);
  }
}

// finds all modules in a path and loads them into an array
function loadModules(path, holder, callback) {
  fs.readdir(path, (err, files) => {
    let f;
    for (let i = 0; i < files.length; i++) {
      f = pathModule.join(path, files[i])
      console.log(f);
      try {
        holder.push([require(f), f]);
      } catch (e) {
        console.log(e);
      }

    }
    callback();
  });
}

// turns the paths emitted by chokidar into absolute paths to added, changed or removed directories
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
