import React from "react";
import { GiCancel } from "react-icons/gi";
import { GiConfirmed } from "react-icons/gi";

class FileWatchedButton extends React.Component {
  render() {
    return this.props.watched ? (
      <GiConfirmed
        color="lightgreen"
        onClick={() => {
          this.props.SetWatched(!this.props.watched);
        }}
      />
    ) : (
      <GiCancel
        color="rgb(255, 75, 75)"
        onClick={() => {
          this.props.SetWatched(!this.props.watched);
        }}
      />
    );
  }
}

export default FileWatchedButton;
