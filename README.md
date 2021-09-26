# bili-bot v4.0.0
[![bilibili](https://img.shields.io/badge/bilibili-API-0ACDFF?logo=bilibili)](https://www.bilibili.com) 
[![discord-bot](https://img.shields.io/badge/discord-bot-_.svg?colorB=8C9EFF&logo=discord)](https://discord.js.org)

Discord bot for playing Bilibili video

A fork project from https://github.com/JyaouShingan/bili-bot

## Installation
### 1. Install `NodeJs` version >= v10
### 2. Install `FFMpeg` library

On macOS:
```
brew install ffmpeg
```

On Debian-Linux:
```
apt-get install ffmpeg
```

On Windows:

Refer to https://github.com/m-ab-s/media-autobuild_suite

Make sure ffmpeg executable is in system `PATH` environment variable

### 3. Install and run MongoDB

On macOS:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

On Debian-Linux:

Refer to https://docs.mongodb.com/manual/tutorial/install-mongodb-on-debian/

On Windows:

Create a new atlas cluster -> 
- https://www.mongodb.com/cloud/atlas
- https://www.mongodb.com/products/compass

Make sure `mongodb` service is running before starting the bot.

### 4. Install dependency

```
npm install
```

*If Sodium doesn't work, use libsodium-wrappers instead*

## Configuration

Create a file under root directory named `.env`:
```dotenv
DiscordToken=your_token
MONGO_URI=mongodb_url
DB_NAME=database_name
YTApiKey=youtubeAPIKey
```

## Run
```
npm start
```
