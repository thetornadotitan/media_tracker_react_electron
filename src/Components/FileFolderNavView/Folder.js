import React from "react";
//import eventBus from "../EventBus";
import { ImFolder } from "react-icons/im";
import eventBus from "../EventBus";

class Folder extends React.Component {
  render() {
    return (
      <div className="foldercomp">
        <ImFolder preserveAspectRatio="none" className="foldercomp-img" />

        <div
          className="foldercomp-hover"
          onDoubleClick={() => {
            eventBus.dispatch("checkDirectory", this.props.path);
          }}
        >
          <div className="foldercomp-path">{this.props.name}</div>
        </div>
      </div>
    );
  }
}

export default Folder;
