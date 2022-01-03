import "./App.css";
import FileFolderNavView from "./Components/FileFolderNavView";
import Navbar from "./Components/Navbar";
import React from "react";
//import eventBus from "./Components/EventBus";

class App extends React.Component {
  render() {
    return (
      <div id="App">
        <div className="header">🎞Media Tracker🎞</div>
        <FileFolderNavView />
        <Navbar />
      </div>
    );
  }
}

export default App;
