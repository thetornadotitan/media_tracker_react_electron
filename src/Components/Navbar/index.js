import React from "react";
import eventBus from "../EventBus";

class Navbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cwd: "\\",
    };
  }

  componentDidMount() {
    window.electron.receive("fileDialogResponse", (data) => {
      eventBus.dispatch("checkDirectory", data);
    });

    window.electron.receive("changeDirectory", (dir) => {
      this.setState({ cwd: dir.path });
    });
  }

  render() {
    return (
      <div className="nav-bar">
        <div className="nav-bar-path">{this.state.cwd}</div>
        <button
          onClick={() => window.electron.send("openDirDialog", {})}
          className="nav-bar-search"
        >
          Search
        </button>
      </div>
    );
  }
}

export default Navbar;
