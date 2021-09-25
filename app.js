const DiscordRPC = require("discord-rpc"),
  { LastFmNode } = require("lastfm"),
  fs = require("fs");

if (!fs.existsSync("config.json")) {
  fs.copyFileSync("config.example.json", "config.json");
  log.info(
    "Created config.json. Please enter your username in the value of `lastFmUsername`."
  );
  return;
}

const clientId = "740140397162135563";
const config = require("./config");
const rpc = new DiscordRPC.Client({ transport: "ipc" });
const lastFm = new LastFmNode({
  api_key: "52ffa34ebbd200da17da5a6c3aef1b2e",
  useragent: "github.com/FayneAldan/fmcord",
});
const trackStream = lastFm.stream(config.lastFmUsername, { extended: true });

trackStream.on("nowPlaying", (track) => {
  const song = track.name;
  const album = track.album["#text"];
  const artist = track.artist.name;
  const loved = track.loved === "1";

  //console.log("nowPlaying", track);
  if (config.detailedLog) {
    console.log(`▶️ Now Playing
  🎵 ${song}
  👤 ${artist}
  💿 ${album}`);
  } else console.log(`▶️ Now playing: ${song}`);

  const songEmoji =
    loved && config.lovedEmoji ? "❤️ " : config.useEmojis ? "🎵 " : "";
  const artistEmoji = config.useEmojis ? "👤 " : "";
  const albumEmoji = config.useEmojis ? "💿 " : "";
  const smallIcon = loved && config.lovedIcon ? "love" : "play";
  const asName = config.shareUsername ? ` as ${config.lastFmUsername}` : "";

  rpc.setActivity({
    details: songEmoji + song,
    state: artistEmoji + artist,
    largeImageKey: "lastfm",
    smallImageKey: smallIcon,
    largeImageText: `Scrobbling on last.fm${asName}`,
    smallImageText: albumEmoji + album,
  });
});

trackStream.on("stoppedPlaying", () => {
  console.log("⏹️ Stopped playing");
  rpc.clearActivity();
});

trackStream.on("error", (error) => {
  console.error("⚠️ LastFM Error", error);
});

rpc.on("ready", () => {
  const { username } = rpc.user;
  console.log(`✅ Connected: ${username}`);
  trackStream.start();
});

rpc.login({ clientId }).catch(console.warn);
