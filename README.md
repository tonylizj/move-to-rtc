# move-to-rtc

The rtc channel is a voice channel with a name that includes 'rtc' as a separate word. If multiple rtc channels exist, the one with the lowest id is considered the rtc channel.

### move-to-rtc is a Discord bot that provides highly requested functionality such as moving yourself to the rtc channel, moving everyone in a channel to the rtc channel, moving selected users to the rtc channel, and moving everyone from the rtc channel to random channels.

usage: /rtc @username @username ...

This bot moves all the mentioned users to the rtc channel, creating one first if it doesn't exist. If no users are mentioned (/rtc) it moves yourself. If you mention the bot (/rtc @move-to-rtc) it moves everyone in your voice channel to the rtc channel. If you mention yourself (/rtc @yourusername) it moves everyone from the rtc channel to random channels.

For security reasons, you need to input your own bot token into a .env file. This is not provided.
