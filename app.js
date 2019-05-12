const tmi = require('tmi.js');
const ops = require('./options/');

const client = new tmi.client(ops);
client.connect();

client.on('message', messageHandler);

function messageHandler(channel, user, msg, self) {
  if(self) return;

  if((msg.toLowerCase()).includes(`@${client.username}`)) {
    client.say(`${channel}`, `hello @${user.username}`);
  }
  
  console.log(`${user.username} : ${msg}`);
}
