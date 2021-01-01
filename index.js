const Discord = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

const prefix = '/';
const triggerName = 'rtc';

const determineIfRTC = (input) => {
  const lowerInput = input.toLowerCase();
  return lowerInput === 'rtc' || (lowerInput.includes('rtc ') && lowerInput.indexOf('rtc ') === 0) || (lowerInput.includes(' rtc') && lowerInput.indexOf(' rtc') === input.length - 4) || lowerInput.includes(' rtc ');
}

const client = new Discord.Client();

client.login(process.env.BOT_TOKEN);

client.on('message', async (userMessage) => {
  if (userMessage.author.bot) return;
  if (!userMessage.content.startsWith(prefix)) return;
  let commandBody = userMessage.content.slice(prefix.length);
  commandBody = commandBody.trim();
  const args = commandBody.split(/\s+/);
  const shifted = args.shift();
  if (shifted === undefined) {
    return;
  }
  const command = shifted.toLowerCase();

  if (command === triggerName) {
    let users = [];
    if (userMessage.mentions.users.size !== 0) {
      userMessage.mentions.users.map((user => users.push(user)));
    } else {
      users.push(userMessage.author);
    }
    let chan = userMessage.guild.channels.cache.find(channel => channel.type === 'voice' && determineIfRTC(channel.name));
    if (chan === undefined) {
      await userMessage.guild.channels.create('rtc', {type: 'voice'});
      chan = userMessage.guild.channels.cache.find(channel => channel.type === 'voice' && determineIfRTC(channel.name));
    }
    if (users.includes(client.user)) {
      users = userMessage.member.voice.channel.members;
    }
    users.map(user => userMessage.guild.member(user).voice.setChannel(chan.id));
    users.map(user => userMessage.channel.send(`${user}, bye`));
  }
});
