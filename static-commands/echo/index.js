const options = {
  commandName : 'echo',
  perms: 0,
  rateLimitTime: 10000
};

function func(context, remainder) {
  this.client.say(`${context.channel}`, remainder);
}

module.exports = {
  options: options,
  func: func
};
