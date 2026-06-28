import React, { Component } from "react";
import { connect } from "react-redux";
import {
  toggleDarkMode,
  toggleLanguage,
  addImageMessage,
  addActionPrompt,
  clearChat
} from "../app/store";
import { translations } from "../app/locales";

/* Material UI Icons */
import LanguageIcon from "@mui/icons-material/Language";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";

class Header extends Component {
  constructor(props) {
    super(props);
    this.fileInputRef = React.createRef();
  }

  handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (uploadEvent) => {
        this.props.addImageMessage(uploadEvent.target.result);
      };

      reader.readAsDataURL(file);
    }

    e.target.value = "";
  };

  render() {
    const {
      darkMode,
      language,
      toggleDarkMode,
      toggleLanguage,
      clearChat,
      addActionPrompt,
      mainImage
    } = this.props;

    const t = translations[language] || translations.en;

    const iconStyle = {
      fontSize: 18,
      verticalAlign: "middle",
      marginRight: "6px"
    };

    return (
      <div className="header">
        <input
          type="file"
          ref={this.fileInputRef}
          style={{ display: "none" }}
          accept="image/*"
          onChange={this.handleFileChange}
        />

        <div className="header-top">
          <div className="project-title">{t.projectTitle}</div>

          <div className="header-actions">
            <button className="toolbar-btn" onClick={toggleLanguage}>
              <LanguageIcon sx={iconStyle} />
              {t.toggleLang}
            </button>

            <button className="toolbar-btn" onClick={toggleDarkMode}>
              {darkMode ? (
                <LightModeIcon sx={iconStyle} />
              ) : (
                <DarkModeIcon sx={iconStyle} />
              )}
              {darkMode ? t.modeLight : t.modeDark}
            </button>
          </div>
        </div>

        <div className="ribbon">
          <button
            className="ribbon-btn"
            onClick={() => this.fileInputRef.current.click()}
          >
            <UploadFileIcon sx={iconStyle} />
            {t.openFile}
          </button>

          <div className="ribbon-separator" />

          <button className="ribbon-btn" onClick={clearChat}>
            <DeleteOutlinedIcon sx={iconStyle} />
            {t.closeFile}
          </button>

          <div className="ribbon-separator" />

          <button
            className="ribbon-btn"
            onClick={addActionPrompt}
            disabled={!mainImage}
          >
            <AutoFixHighIcon sx={iconStyle} />
            Action
          </button>
        </div>
      </div>
    );
  }
}

export default connect(
  (state) => ({
    language: state.app.language,
    darkMode: state.app.darkMode,
    mainImage: state.app.mainImage
  }),
  {
    toggleDarkMode,
    toggleLanguage,
    addImageMessage,
    addActionPrompt,
    clearChat
  }
)(Header);