import React from "react";
import eventBus from "../EventBus";
import Folder from "./Folder.js";
import File from "./File.js";

class FileFolderNavView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cwd: "\\",
      drives: [],
      filesFoldersArray: [],
      keyCounter: 0,
    };
  }

  componentDidMount() {
    window.electron.send("getDrives", {});

    window.electron.receive("receiveDrives", (data) => {
      this.DrivesRecieved(data);
    });

    window.electron.receive("changeDirectory", (data) => {
      this.DisplayDirectory(data);
    });

    eventBus.on("checkDirectory", (data) => {
      this.CheckDirectory(data);
    });
  }

  render() {
    return <div className="content">{this.state.filesFoldersArray}</div>;
  }

  //See if we need to show the drive listing again or display a directory
  CheckDirectory = (dir) => {
    //check if user is trying to go up another level at the top of a drives direcotry structure
    //If they are we need to show them all the drives rather than a directory
    let displayDrives = false;
    this.state.drives.forEach((drive) => {
      if (dir === drive + "\\..") {
        displayDrives = true;
        return;
      }
    });

    if (displayDrives) window.electron.send("getDrives", {});
    else window.electron.send("getDirectory", dir);
  };

  //Go through an create the needed UI elements for items in the directory
  DisplayDirectory = (dir) => {
    this.setState({ cwd: dir.path });

    let result = [];
    let key = this.state.keyCounter;

    result.push(
      <Folder key={key} path={this.state.cwd + "\\.."} name={".."} />
    );
    key++;

    dir.items.forEach((item) => {
      if (item.isFolder) {
        result.push(<Folder key={key} path={item.path} name={item.name} />);
        key++;
      } else {
        result.push(<File key={key} path={item.path} name={item.name} />);
        key++;
      }
    });

    this.setState({ keyCounter: key });
    //force a re-redner of all file/folder comps so if hoping from one direcotry to another and both have files thubnails will update.
    this.setState({ filesFoldersArray: [] });
    this.setState({ filesFoldersArray: result });
  };

  //Create UI elements for the connected drives
  DisplayDrives = () => {
    let result = [];
    let key = this.state.keyCounter;
    this.state.drives.forEach((drive) => {
      result.push(<Folder key={key} path={drive} name={drive} />);
      key++;
    });
    this.setState({ keyCounter: key });
    //force a re-redner of all file/folder comps so if hoping from one direcotry to another and both have files thubnails will update.
    this.setState({ filesFoldersArray: [] });
    this.setState({ filesFoldersArray: result });
  };

  DrivesRecieved = (data) => {
    this.setState({ drives: data });
    this.DisplayDrives();
  };
}
export default FileFolderNavView;
