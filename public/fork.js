const ffmpegStatic = require("ffmpeg-static");
const ffprobeStatic = require("ffprobe-static");
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegStatic.replace("app.asar", "app.asar.unpacked"));
ffmpeg.setFfprobePath(
  ffprobeStatic.path.replace("app.asar", "app.asar.unpacked")
);
const path = require("path");
const { pathToFileURL } = require("url");
const fs = require("fs");

process.on("message", (args) => {
  let fileName = cyrb53(args).toString() + ".png";
  let folderPath = path.join(process.cwd(), "Thumbnails");
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }
  let fullFilePath = path.join(folderPath, fileName);

  ffmpeg(args)
    .screenshots({
      timestamps: ["27%"],
      filename: fileName,
      folder: folderPath,
      size: "256x144",
    })
    .on("end", () => {
      process.send({
        path: args,
        imagePath: pathToFileURL(`${fullFilePath}`).toString(),
      });
    });
});

//Hash for pic names
function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
