const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  protocol,
} = require("electron");
const fs = require("fs");
const nodeDiskInfo = require("node-disk-info");
const path = require("path");
const cp = require("child_process");
const n = cp.fork(`${__dirname}/fork.js`);
let data = {};

const supportedFileTypes = require("./SupportedFileTypes");
let win;

function createWindow() {
  try {
    let rawdata = fs.readFileSync(path.join(process.cwd(), "data.json"));
    data = JSON.parse(rawdata);
  } catch (e) {
    // if the file doesn't exist create it!
    if (e.code === "ENOENT") {
      let data2write = JSON.stringify(data);
      fs.writeFileSync(path.join(process.cwd(), "data.json"), data2write);
    } else {
      console.error(e); // log other errors
    }
  }

  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false, // is default value after Electron v5
      nodeIntegrationInWorker: true,
      contextIsolation: true, // protect against prototype pollution
      enableRemoteModule: false, // turn off remote
      webSecurity: app.isPackaged,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  //win.setMenu(null);

  const startUrl = app.isPackaged
    ? path.join(__dirname, "index.html")
    : process.env.ELECTRON_START_URL;

  //load the index.html from a url
  win.loadURL(startUrl);

  // Open the DevTools.
  if (!app.isPackaged) win.webContents.openDevTools();

  win.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

// Setup a local proxy to adjust the paths of requested files when loading
// them from the local production bundle (e.g.: local fonts, etc...).
function setupLocalFilesNormalizerProxy() {
  protocol.registerHttpProtocol(
    "file",
    (request, callback) => {
      const url = request.url.substring(8);
      callback({ path: path.normalize(`${__dirname}/${url}`) });
    },
    (error) => {
      if (error) console.error("Failed to register protocol");
    }
  );
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  setupLocalFilesNormalizerProxy();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.

  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

//fixed washed out colors in screenshots on windwos with HDR enabled.
app.commandLine.appendSwitch("force-color-profile", "srgb");

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on("getDrives", async (event, args) => {
  let mountpoints = [];

  let disks = await nodeDiskInfo.getDiskInfo();
  disks.forEach((disk) => {
    mountpoints.push(disk.mounted + "\\");
  });

  win.webContents.send("receiveDrives", mountpoints);
});

ipcMain.on("getDirectory", (event, args) => {
  let files;
  try {
    files = fs.readdirSync(args, { withFileTypes: true });
  } catch (e) {
    if (e.code === "ENOENT") ipcMain.send("getDrives");
    console.log(e);
  }

  let result = [];

  files
    .filter((dirent) => dirent.isDirectory())
    .forEach((dir) => {
      try {
        /*
        make sure user can access the directory.
        fs.accessSync seems to not actually do this 
        though the docs would make you think thats what it is for.
        */
        fs.readdirSync(path.join(args, dir.name));
        result.push({
          path: path.join(args, dir.name),
          name: dir.name,
          isFolder: true,
        });
      } catch (err) {
        //not an accessible dir; don't add.
        if (err.code === "EPERM") return;

        //Log other errors
        console.error(err);
      }
    });

  files
    .filter((dirent) => dirent.isFile())
    .forEach((file) => {
      //Make sure the files are of the type we want. Video files.
      if (supportedFileTypes.includes(path.extname(file.name).toUpperCase()))
        result.push({
          path: path.join(args, file.name),
          name: file.name,
          isFolder: false,
        });
    });

  win.webContents.send("changeDirectory", {
    items: result,
    path: path.normalize(args),
  });
});

ipcMain.on("getImage", (event, args) => {
  if (data[`${args}`] && data[`${args}`].imagePath) {
    win.webContents.send("receiveImage", {
      path: args,
      imagePath: data[`${args}`].imagePath,
    });
  } else {
    n.send(args);
  }
});

n.on("message", (args) => {
  win.webContents.send("receiveImage", args);

  data[`${args.path}`]["imagePath"] = `${args.imagePath}`;

  let data2write = JSON.stringify(data);
  fs.writeFileSync(path.join(process.cwd(), "data.json"), data2write);
});

ipcMain.on("updateWatchedStatus", (event, args) => {
  //Create show entry if it doesn't exists
  if (!data[`${args.path}`]) data[`${args.path}`] = {};

  data[`${args.path}`]["watched"] = args.watched;

  let data2write = JSON.stringify(data);
  fs.writeFileSync(path.join(process.cwd(), "data.json"), data2write);

  win.webContents.send("receiveWatchedStatus", {
    path: args.path,
    watched: data[`${args.path}`].watched,
  });
});

ipcMain.on("getWatchedStatus", (event, args) => {
  if (!data[`${args}`]) data[`${args}`] = {};
  let result = false;

  if (data[`${args}`] && data[`${args}`].watched) {
    result = data[`${args}`].watched;
  }

  win.webContents.send("receiveWatchedStatus", { path: args, watched: result });
});

ipcMain.on("openDirDialog", async (event, data) => {
  let response = await dialog.showOpenDialog(win, {
    properties: ["openDirectory"],
  });
  if (!response.canceled)
    win.webContents.send("fileDialogResponse", response.filePaths[0]);
});

ipcMain.on("openFile", (event, filePath) => {
  shell.openPath(filePath);
});
