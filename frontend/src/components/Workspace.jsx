import React, { Component } from "react";
import { connect } from "react-redux";
import { addServerResponse, addImageMessage } from "../app/store";
import { translations } from "../app/locales";
import ActionPromptCard from "./ActionPromptCard";
import ImageModal from "./ImageModal";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import "../index.css";

class Workspace extends Component {
  constructor(props) {
    super(props);

    this.feedEndRef = React.createRef();

    this.state = {
      modalImage: null,
      isProcessing: false,
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.messages.length !== this.props.messages.length ||
      prevState.isProcessing !== this.state.isProcessing
    ) {
      this.scrollToBottom();
    }
  }

  scrollToBottom = () => {
    if (this.feedEndRef.current) {
      this.feedEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  normalizeImage = (img) => {
    if (!img) return null;
    if (typeof img === "string") return img;
    if (typeof img === "object") return img.content || null;
    return null;
  };

  base64ToBlob = (base64Str) => {
    if (typeof base64Str !== "string") return null;
    if (!base64Str.includes("base64,")) return null;

    try {
      const parts = base64Str.split("base64,");
      const mimeMatch = base64Str.match(/data:(.*?);base64,/);

      if (!mimeMatch) return null;

      const contentType = mimeMatch[1];
      const raw = window.atob(parts[1]);

      const arr = new Uint8Array(raw.length);

      for (let i = 0; i < raw.length; i++) {
        arr[i] = raw.charCodeAt(i);
      }

      return new Blob([arr], { type: contentType });
    } catch (e) {
      console.error("Base64 decode error:", e);
      return null;
    }
  };

  handleExecuteAlgorithm = async (algorithm, param) => {
    const { mainImage, addServerResponse } = this.props;

    const imageData = this.normalizeImage(mainImage);
    if (!imageData) return;

    const blob = this.base64ToBlob(imageData);
    if (!blob) {
      console.error("Invalid image format");
      return;
    }

    this.setState({ isProcessing: true });

    try {
      const formData = new FormData();
      formData.append("image", blob, "source.png");

      let url = `http://127.0.0.1:8000/api/filter/${algorithm}/`;

      if (algorithm === "highboost") {
        url += `?A=${param}`;
      } else {
        url += `?size=${param}`;
      }

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Server error");

      const outputBlob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = () => {
        this.setState({ isProcessing: false });
        addServerResponse({
          id: Date.now(),
          type: "image",
          content: reader.result,
          isResponse: true,
        });
      };

      reader.readAsDataURL(outputBlob);
    } catch (err) {
      console.error(err);
      
      this.setState({ isProcessing: false });
      addServerResponse({
        id: Date.now(),
        type: "error",
        content: "ENGINE ERROR",
        isResponse: true,
      });
    }
  };

  renderMessage = (msg) => {
    const { mainImage, language } = this.props;
    const t = translations[language] || translations.en;

    if (!msg) return null;

    if (msg.type === "loading" || msg.type === "pending") return null;

    if (msg.type === "action_prompt") {
      return (
        <div key={msg.id} className="chat-bubble-wrapper prompt-bubble">
          <ActionPromptCard onExecute={this.handleExecuteAlgorithm} />
        </div>
      );
    }

    if (msg.type === "error") {
      return (
        <div key={msg.id} className="chat-bubble-wrapper server-response error-bubble">
          {/* Subtle clean red indicator bar left side instead of an icon */}
          <Box sx={{ display: 'flex', alignItems: 'center', paddingLeft: '8px', borderLeft: '3px solid #ef5350' }}>
            <div className="chat-status-text" style={{ color: '#ef5350', fontWeight: 'bold' }}>
              {msg.content}
            </div>
          </Box>
        </div>
      );
    }

    const content = this.normalizeImage(msg.content);
    if (!content) return null;

    const mainImg = this.normalizeImage(mainImage);
    const isLatestMain = msg.type === "image" && content === mainImg;

    return (
      <div key={msg.id} className="chat-bubble-wrapper">
        <div className="chat-image-frame">
          {isLatestMain && (
            <div className="latest-main-label">Latest Main</div>
          )}

          <img
            src={content}
            alt="workspace"
            className="chat-preview-img"
            onClick={() => this.setState({ modalImage: content })}
          />
        </div>

        {/* Minimalist, professional text layouts with zero junk icons or emojis */}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
          {msg.isResponse ? (
            <Typography sx={{ color: '#90caf9', fontSize: '0.75rem', letterSpacing: 0.5, fontWeight: 600 }}>
              SUCCESS // COMPLETED
            </Typography>
          ) : (
            <Typography sx={{ color: '#aaaaaa', fontSize: '0.75rem', letterSpacing: 0.5 }}>
              {t.uploadSuccess}
            </Typography>
          )}
        </Box>
      </div>
    );
  };

  render() {
    const { messages, language } = this.props;
    const { isProcessing, modalImage } = this.state;

    return (
      <div className={`workspace ${language === "fa" ? "rtl" : ""}`}>
        <ImageModal
          src={modalImage}
          onClose={() => this.setState({ modalImage: null })}
        />

        <div className="chat-feed-container">
          {messages.map(this.renderMessage)}
          
          {/* Modern monochrome loader container using only default MUI base elements */}
          {isProcessing && (
            <div className="chat-bubble-wrapper server-response">
              <Box 
                className="chat-loading-card" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5, 
                  padding: '12px 20px', 
                  background: '#1a1a1a', 
                  borderRadius: '8px',
                  border: '1px solid #333',
                  width: 'fit-content',
                  marginTop: '10px'
                }}
              >
                <CircularProgress size={16} sx={{ color: "#e0e0e0" }} />
                <Typography sx={{ color: "#e0e0e0", fontSize: '0.82rem', letterSpacing: 1, fontWeight: 500 }}>
                  PROCESSING IMAGE SEQUENCE...
                </Typography>
              </Box>
            </div>
          )}
          
          <div ref={this.feedEndRef} />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  messages: state.app.messages,
  language: state.app.language,
  mainImage: state.app.mainImage,
});

export default connect(mapStateToProps, {
  addServerResponse,
  addImageMessage,
})(Workspace);