# bili-bot v2
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
