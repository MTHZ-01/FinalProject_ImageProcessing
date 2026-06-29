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
import ImageIcon from "@mui/icons-material/Image";

import "../Css/Header.css";

class Header extends Component {
  constructor(props) {
    super(props);
    this.fileInputRef = React.createRef();
    this.state = { visible: true, lastScrollY: 0 };
  }

  componentDidMount() {
    window.addEventListener("scroll", this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
  }

  handleScroll = () => {
    const currentScrollY = window.scrollY;
    if (currentScrollY > this.state.lastScrollY && currentScrollY > 80) {
      if (this.state.visible) this.setState({ visible: false });
    } else {
      if (!this.state.visible) this.setState({ visible: true });
    }
    this.setState({ lastScrollY: currentScrollY });
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
      <AnimatePresence>
        {this.state.visible && (
          <motion.header
            className={`header ${darkMode ? "dark" : "light"}`}
            initial={{ y: -180, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -180, opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed",
              top: "20px",
              left: 0,
              right: 0,
              zIndex: 1,
              background: "rgb(51 51 51 / 26%) !important",
              backdropFilter: "blur(66px) !important",
              WebkitBackdropFilter: "blur(28px)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 10px 40px -10px rgba(0,0,0,0.6)",
            }}
          >
            {/* Rest of your header content remains the same */}
            <input type="file" ref={this.fileInputRef} style={{ display: "none" }} accept="image/*" onChange={this.handleFileChange} />



            <motion.div className="header-ribbon">
              <motion.button className="ribbon-btn primary" onClick={() => this.fileInputRef.current.click()} whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.96 }}>
                <UploadFileIcon fontSize="small" /> <span>{t.openFile}</span>
              </motion.button>
              <motion.button className="ribbon-btn danger" onClick={clearChat} whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.96 }}>
                <DeleteOutlinedIcon fontSize="small" /> <span>{t.closeFile}</span>
              </motion.button>
              <motion.button className="ribbon-btn accent" onClick={addActionPrompt} disabled={!mainImage} whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.96 }}>
                <AutoFixHighIcon fontSize="small" /> <span>Action</span>
              </motion.button>
            </motion.div>
          </motion.header>
        )}
      </AnimatePresence>
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