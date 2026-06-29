import React, { Component } from "react";
import { connect } from "react-redux";

import CustomTitleBar from "./components/CustomTitleBar";   // Make sure path is correct
import Header from "./components/Header";
import Workspace from "./components/Workspace";

class App extends Component {
  componentDidMount() {
    document.documentElement.classList.toggle("dark", this.props.darkMode);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.darkMode !== this.props.darkMode) {
      document.documentElement.classList.toggle("dark", this.props.darkMode);
    }
  }

  render() {
    return (
      <div className="app">
        <CustomTitleBar />           {/* ← Should be visible */}

        <div className="app-content" style={{ paddingTop: '42 px' }}>
          <Header />
          <Workspace />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  darkMode: state.app.darkMode,
});

export default connect(mapStateToProps)(App);