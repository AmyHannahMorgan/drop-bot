class CommandHandler {
  constructor(client, staticCommands) {
    this.client = client;
    this.commands = [...staticCommands];
  }

  findCommand(commandName) {
    for(let i = 0; i < this.commands.length; i++) {
      if (this.commands[i].name === commandName) {
        return this.commands[i];
      }
    }
    return null;
  }

  execCommand(commandName, context, remainder) {
    let commandObject = this.findCommand(commandName);
    let time = Date.now()

    if (commandObject !== null) {
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
    else {
      this.client.say(`${context.channel}`, `I'm sorry but I couldn't find the command '${commandName}'`);
    }

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

  add(mod, origin) {
    if (this.checkModule(mod, origin)) {
      if (this.findCommand(mod.options.commandName) === null) {
        let newCommObject = new CommandObject(this.client, mod.options, mod.func, origin);
        console.log({newCommObject});
        this.commands.push(newCommObject);
      }
      else {
        throw `a command with the name '${mod.options.commandName}' already exists`;
      }
    }
  }

  update(mod, orgin) {
    if (this.checkModule(mod, origin)) {
      let commandObj = this.findCommand(mod.options.commandName)
      if (commandObj !== null) {
        if (commandObj.origin === origin) {
          console.log({commandObj, origin});
        }
      }
    }
  }

  checkModule(mod, origin) {
    let optionsCheck, funcCheck;

    if ('options' in mod) {
      if (typeof mod.options === 'object') {
        let hasPerms = 'perms' in mod.options,
        hasRateLimitTime = 'rateLimitTime' in mod.options,
        hasCommandName = 'commandName' in mod.options;

        if (hasPerms && hasRateLimitTime && hasCommandName) {
          let permsType = typeof mod.options.perms === 'number' && mod.options.perms >= 0 && mod.options.perms <4,
          rateLimitType = typeof mod.options.rateLimitTime === 'number',
          commandNameType = typeof mod.options.commandName === 'string';

          if (permsType && rateLimitType && commandNameType) {
            if (!(mod.options.commandName.includes(' '))) {
              optionsCheck = true;
            }
            else {
              throw 'commandName cannot contain spaces';
              return false;
            }
          }
          else {
            let errorMsg = '';

            if (!permsType) {
              errorMsg += 'perms must be a number between 0 and 3 (inclusive) \n';
            }

            if (!rateLimitType) {
              errorMsg += 'rateLimitTime must be a number \n';
            }

            if (!commandNameType) {
              errorMsg += 'commandName must be a string \n';
            }

            throw errorMsg;
            return false;
          }
        }
        else {
          let errorMsg = '';

          if (!hasPerms) {
            errorMsg += 'options in command module is missing perms key \n';
          }

          if (!hasRateLimitTime) {
            errorMsg += 'options in command module is missing rateLimitTime key \n';
          }

          if (!hasCommandName) {
            errorMsg += 'options in command module is missing commandName key \n';
          }

          throw errorMsg;
          return false;
        }
      }
      else {
        throw 'options is not an object';
        return false;
      }
    }
    else {
      throw 'options object is not present in command module';
      return false;
    }

    if ('func' in mod) {
      if (typeof mod.func === 'function') {
        funcCheck = true;
      }
      else {
        throw 'module func must be a function'
        return false;
      }
    }
    else {
      throw 'func function is not present in command module';
      return false;
    }

    if (optionsCheck && funcCheck) {
      console.log(`module '${origin}' is fine`);
      return true
    }
  }
}

class CommandObject {
  constructor(client, options, func, origin) {
    this.client = client;

    this.name = options.commandName;
    this.rateLimitTime = options.rateLimitTime;
    this.rateLimit = 0;
    this.perms = options.perms;

    this.function = func;

    this.origin = origin;
  }
}

module.exports = {
  CommandHandler: CommandHandler,
  CommandObject: CommandObject
};
