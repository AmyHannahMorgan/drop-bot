const options = {
  commandName : 'echo',
  perms: 2,
  rateLimitTime: 0
};

function func(context, remainder) {
  this.client.say(`${context.channel}`, remainder);
}

module.exports = {
  options: options,
  func: func
};
