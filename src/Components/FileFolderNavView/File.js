import React from "react";
import logo from "../../logo.svg";
import FileWatchedButton from "./FileWatchedButton";
import { GiPlayButton } from "react-icons/gi";

class File extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      watched: false,
      imgSrc: logo,
    };
  }

  componentDidMount() {
    window.electron.send("getWatchedStatus", this.props.path);
    window.electron.send("getImage", this.props.path);

    window.electron.receive("receiveImage", (data) => {
      this.RecieveImage(data);
    });
    window.electron.receive("receiveWatchedStatus", (data) => {
      this.RecieveWatchedStatus(data);
    });
  }

  render() {
    return (
      <div className="filecomp">
        <img
          alt={this.props.name}
          src={this.state.imgSrc}
          className="filecomp-img"
        />

        <div
          className="filecomp-hover"
          onDoubleClick={() => {
            window.electron.send("openFile", this.props.path);
            this.SetWatched(true);
          }}
        >
          <div className="filecomp-path">{this.props.name}</div>
        </div>

        <div className="filecomp-buttons">
          <div className="filecomp-button">
            <GiPlayButton
              color="skyblue"
              onClick={() => {
                window.electron.send("openFile", this.props.path);
                this.SetWatched(true);
              }}
            />
          </div>
          <div className="filecomp-button">
            <FileWatchedButton
              watched={this.state.watched}
              SetWatched={this.SetWatched}
            />
          </div>
        </div>
      </div>
    );
  }

  RecieveImage = (data) => {
    if (this.props.path === data.path)
      this.setState({ imgSrc: data.imagePath });
  };

  RecieveWatchedStatus = (data) => {
    if (this.props.path === data.path) {
      this.setState({ watched: data.watched });
    }
  };

  SetWatched = (didWatch) => {
    window.electron.send("updateWatchedStatus", {
      path: this.props.path,
      watched: didWatch,
    });
  };
}

export default File;
