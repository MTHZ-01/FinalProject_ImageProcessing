import React, { Component } from "react";
import { connect } from "react-redux";
import Header from "./components/Header";
import Workspace from "./components/Workspace"; // Import custom view

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
        <Header />
        <Workspace /> 
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  darkMode: state.app.darkMode,
});

export default connect(mapStateToProps)(App);