class CommandHandler {
  constructor(client, staticCommands) {
    this.client = client;
    this.commands = [...staticCommands];
  }

  findCommand(commandName, context) {
    for(let i = 0; i < this.commands.length; i++) {
      if (this.commands[i].name === commandName) {
        return this.commands[i];
      }
    }
    this.client.say(`${context.channel}`, `I'm sorry but I couldn't find the command '${commandName}'`)
    return null;
  }

  execCommand(commandObject, context, remainder) {
    let time = Date.now()
    if (time > commandObject.rateLimit) {
      if (this.handlePerms(commandObject, context)) {
        commandObject.function(context, remainder);
        commandObject.rateLimit = Date.now() + commandObject.rateLimitTime;
      }
      else {
        this.client.say(`${context.channel}`, `I'm sorry but you do not have permission to use the command ${commandObject.name}`);
      }
    }
    else {
      this.client.say(`${context.channel}`, `I'm sorry but the command ${commandObject.name} is rate limited, please wait ${this.parseTime(commandObject.rateLimit - time)} before calling it again`);
    }
  }

  add(mod) {
    console.log(mod);
  }

  update(mod) {
    console.log(mod);
  }

  handlePerms(commandObject, context) {
    let reqPerm = commandObject.perms;
    switch (reqPerm) {
      case 0:
          return true
        break;
      case 1:
        if (context.user.mod || context.user.badges.broadcaster === '1') {
          return true;
        }
        else {
          return false
        }
        break;
      case 2:
        if (context.user.badges.broadcaster === '1') {
          return true;
        }
        else {
          return false;
        }
        break;
      case 3:
        return false;
        break;
    }
  }

  parseTime(time) {
    let hours = Math.floor(time / (60000^2));
    let minutes = Math.floor((time % (60000^2)) / 60000);
    let seconds = ((time % 60000) / 1000).toFixed(0);

    let str = ''

    // TODO: refactor this if else mess
    if (hours > 0) {
      if (hours < 10) {
        str += '0' + hours + ':';
      }
      else {
        str += hours + ':';
      }
    }
    else {
      str += '00:';
    }

    if (minutes > 0) {
      if (minutes < 10) {
        str += '0' + minutes + ':';
      }
      else {
        str += minutes + ':';
      }
    }
    else {
      str += '00:';
    }

    if (seconds > 0) {
      if (seconds < 10) {
        str += '0' + seconds;
      }
      else {
        str += seconds;
      }
    }
    else {
      str += '00';
    }

    return str;
  }
}

class CommandObject {
  constructor(client, options, func) {
    this.client = client;

    this.name = options.commandName;
    this.rateLimitTime = options.rateLimitTime;
    this.rateLimit = 0;
    this.perms = options.perms;

    this.function = func;
  }
}

module.exports = {
  CommandHandler: CommandHandler,
  CommandObject: CommandObject
};
