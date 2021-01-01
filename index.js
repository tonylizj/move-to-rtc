const Discord = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

const prefix = '/move-';

const determineIfTrigger = (trigger, input) => {
  const lowerInput = input.toLowerCase();
  return lowerInput === trigger || (lowerInput.includes(trigger + ' ') && lowerInput.indexOf(trigger + ' ') === 0) || (lowerInput.includes(' ' + trigger) && lowerInput.indexOf(trigger + ' ') === input.length - (trigger.length + 1)) || lowerInput.includes(' ' + trigger + ' ');
}

const client = new Discord.Client();

client.login(process.env.BOT_TOKEN);

client.on('message', async (userMessage) => {
  if (userMessage.author.bot) return;
  if (!userMessage.content.startsWith(prefix)) return;
  const commandBody = userMessage.content.slice(prefix.length);
  const args = commandBody.split(/\s+/);
  if (args.length() != 2) return;
  for (arg in args) arg = arg.toLowerCase();

  let users = [];
  if (userMessage.mentions.users.size !== 0) {
    userMessage.mentions.users.map((user => users.push(user)));
  } else {
    users.push(userMessage.author);
  }
  let chan = userMessage.guild.channels.cache.find(channel => channel.type === 'voice' && determineIfTrigger(args[0], channel.name));
  if (chan === undefined) {
    await userMessage.guild.channels.create('channel', {type: 'voice'});
    chan = userMessage.guild.channels.cache.find(channel => channel.type === 'voice' && determineIfTrigger(args[0], channel.name));
  }
  if (users.includes(client.user)) {
    users = userMessage.member.voice.channel.members;
  }
  users.map(user => userMessage.guild.member(user).voice.setChannel(chan.id));
  users.map(user => userMessage.channel.send(`${user}, bye`));
});
