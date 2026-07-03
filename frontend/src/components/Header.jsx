import React, { Component } from "react";
import { connect } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

import {
  toggleDarkMode,
  toggleLanguage,
  addImageMessage,
  addActionPrompt,
  clearChat,
} from "../app/store";
import { translations } from "../app/locales";

import LanguageIcon from "@mui/icons-material/Language";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";

import "../Css/Header.css";

class Header extends Component {
  constructor(props) {
    super(props);
    this.fileInputRef = React.createRef();
    this.state = { 
      visible: false,
      showHint: true 
    };
  }

  componentDidMount() {
    window.addEventListener("mousemove", this.handleMouseMove);
  }

  componentWillUnmount() {
    window.removeEventListener("mousemove", this.handleMouseMove);
  }

  handleMouseMove = (e) => {
    const shouldShow = e.clientY < 110;

    if (shouldShow) {
      if (!this.state.visible) this.setState({ visible: true, showHint: false });
      return;
    }

    if (this.state.visible) {
      this.setState({ visible: false, showHint: true });
    }
  };

  handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => this.props.addImageMessage(ev.target.result);
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  render() {
    const { darkMode, language, toggleDarkMode, toggleLanguage, clearChat, addActionPrompt, mainImage } = this.props;
    const t = translations[language] || translations.en;

    return (
      <>
        <AnimatePresence>
          {this.state.visible && (
            <motion.header
              className={`header ${darkMode ? "dark" : "light"}`}
              initial={{ y: -70, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -70, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
            >
              <input 
                type="file" 
                ref={this.fileInputRef} 
                style={{ display: "none" }} 
                accept="image/*" 
                onChange={this.handleFileChange} 
              />

              <div className="header-ribbon">
                <motion.button 
                  className="ribbon-btn primary" 
                  onClick={() => this.fileInputRef.current.click()} 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <UploadFileIcon fontSize="small" /> <span>{t.openFile}</span>
                </motion.button>

                <motion.button 
                  className="ribbon-btn danger" 
                  onClick={clearChat} 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <DeleteOutlinedIcon fontSize="small" /> <span>{t.closeFile}</span>
                </motion.button>

                <motion.button 
                  className="ribbon-btn accent" 
                  onClick={addActionPrompt} 
                  disabled={!mainImage}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <AutoFixHighIcon fontSize="small" /> <span>{t.action}</span>
                </motion.button>

                <div className="header-actions">
                  <motion.button 
                    className="ribbon-btn icon-only" 
                    onClick={toggleLanguage}
                    whileHover={{ scale: 1.1 }}
                  >
                    <LanguageIcon />
                  </motion.button>
                  <motion.button 
                    className="ribbon-btn icon-only" 
                    onClick={toggleDarkMode}
                    whileHover={{ scale: 1.1 }}
                  >
                    {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                  </motion.button>
                </div>
              </div>
            </motion.header>
          )}
        </AnimatePresence>

        {/* Centered High-Tech Hint */}
        <AnimatePresence>
          {this.state.showHint && (
            <motion.div 
              className="header-hint"
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ 
                opacity: 0.85, 
                scale: 1, 
                y: 0 
              }}
              exit={{ opacity: 0, scale: 0.8, y: -30 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <motion.div 
                animate={{ 
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.15, 1]
                }}
                transition={{ duration: 2.8, repeat: Infinity }}
              >
                ⚡
              </motion.div>
              <span>{t.moveCursorTop}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }
}

export default connect(
  (state) => ({
    language: state.app.language,
    darkMode: state.app.darkMode,
    mainImage: state.app.mainImage,
  }),
  { toggleDarkMode, toggleLanguage, addImageMessage, addActionPrompt, clearChat }
)(Header);