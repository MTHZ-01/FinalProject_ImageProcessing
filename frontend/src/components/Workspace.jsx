import React, { Component } from "react";
import { connect } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

import {
  addServerResponse,
  addImageMessage,
  setMainImage,
} from "../app/store";

import { translations } from "../app/locales";
import ActionPromptCard from "./ActionPromptCard";
import ImageModal from "./ImageModal";
import LoadingIndicator from "./LoadingIndicator";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import "../index.css";
import BgGif from "../assets/Bg.gif";

class Workspace extends Component {
  constructor(props) {
    super(props);
    this.feedEndRef = React.createRef();
    this.socket = null;

    this.state = {
      modalImage: null,
      isProcessing: false,
      contextMenu: null,
      selectedImage: null,
      visible: true,
      lastScrollY: 0,
    };

    // Keep an active map of callbacks indexed by specific request IDs
    this.activeCallbacks = new Map();
  }

  componentDidMount() {
    this.connectWebSocket();
    window.addEventListener("scroll", this.handleScroll);
  }

  componentWillUnmount() {
    if (this.socket) this.socket.close();
    window.removeEventListener("scroll", this.handleScroll);
  }

  connectWebSocket = () => {
    this.socket = new WebSocket("ws://127.0.0.1:8000/ws/filter/");

    this.socket.onopen = () => {
      console.log("✅ WebSocket connected to Image Filter Service");
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // 1. Direct routing: If it has a requestId, send it straight to the ActionPromptCard
      if (data.requestId && this.activeCallbacks.has(data.requestId)) {
        const { resolve, reject } = this.activeCallbacks.get(data.requestId);
        this.activeCallbacks.delete(data.requestId);
        this.setState({ isProcessing: false });

        if (data.status === "success") {
          resolve(data.image);
        } else {
          reject(new Error(data.message || "Processing failed"));
        }
        return;
      }

      // 2. ABSOLUTELY NO CHAT BUBBLE GENERATION HERE FOR PREVIEWS.
      // This fallback only handles global, untracked system errors if they happen.
      this.setState({ isProcessing: false });
      if (data.status !== "success") {
        this.props.addServerResponse({
          type: "error",
          content: data.message || "Critical system execution failure",
        });
      }
    };

    this.socket.onerror = (err) => {
      console.error("WebSocket Error:", err);
      this.setState({ isProcessing: false });
      this.activeCallbacks.forEach(({ reject }) => reject(err));
      this.activeCallbacks.clear();
    };

    this.socket.onclose = () => console.log("WebSocket connection closed");
  };

  handleFinalApply = (resultImage) => {
    if (!resultImage) return;
    this.props.addServerResponse({
      content: resultImage,
      isResponse: true,
    });
    this.props.setMainImage(resultImage);
  };

  handleExecuteAlgorithm = (algorithm, params, isPreview = true) => {
    return new Promise((resolve, reject) => {
      const { mainImage } = this.props;
      const imageData = this.normalizeImage(mainImage);

      if (!imageData) {
        return reject(new Error("No main image available"));
      }

      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        return reject(new Error("WebSocket is not connected"));
      }

      // ONLY set the global workspace loading spinner if it's the FINAL submission
      if (!isPreview) {
        this.setState({ isProcessing: true });
      }

      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      this.activeCallbacks.set(requestId, { resolve, reject });

      try {
        const payload = {
          requestId: requestId,
          algorithm: algorithm,
          params: {
            size: params.kernelSize,
            sigma: params.sigma,
            A: params.boostFactor,
            mask: params.laplacianMask,
            gamma: params.gamma,
          },
          image: imageData,
        };

        this.socket.send(JSON.stringify(payload));
      } catch (err) {
        console.error("Error sending WebSocket message:", err);
        this.activeCallbacks.delete(requestId);
        this.setState({ isProcessing: false });
        reject(err);
      }
    });
  };

  componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.messages.length !== this.props.messages.length ||
      prevState.isProcessing !== this.state.isProcessing
    ) {
      this.scrollToBottom();
    }
  }

  handleScroll = () => {
    const currentScrollY = window.scrollY;
    const { lastScrollY, visible } = this.state;

    if (currentScrollY > lastScrollY && currentScrollY > 120) {
      if (visible) this.setState({ visible: false });
    } else {
      if (!visible) this.setState({ visible: true });
    }

    this.setState({ lastScrollY: currentScrollY });
  };

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

  handleContextMenu = (event, image) => {
    event.preventDefault();
    this.setState({
      contextMenu: {
        mouseX: event.clientX + 2,
        mouseY: event.clientY - 6,
      },
      selectedImage: image,
    });
  };

  handleCloseMenu = () => {
    this.setState({ contextMenu: null, selectedImage: null });
  };

  handleSetMainImage = () => {
    this.props.setMainImage(this.state.selectedImage);
    this.setState({ contextMenu: null, selectedImage: null });
  };

  renderMessage = (msg) => {
    const { mainImage, language } = this.props;
    const t = translations[language] || translations.en;

    if (!msg || msg.type === "loading" || msg.type === "pending") return null;

    if (msg.type === "action_prompt") {
      return (
        <motion.div
          key={msg.id}
          className="chat-bubble-wrapper prompt-bubble"
          initial={{ opacity: 0, y: 80, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <ActionPromptCard
            onExecute={this.handleExecuteAlgorithm}
            onFinalApply={this.handleFinalApply}
            mainImage={mainImage}
            language={language}
            darkMode={this.props.darkMode}
          />
        </motion.div>
      );
    }

    if (msg.type === "error") {
      return (
        <motion.div
          key={msg.id}
          className="chat-bubble-wrapper server-response error-bubble"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Box sx={{ display: "flex", alignItems: "center", paddingLeft: "8px", borderLeft: "3px solid #ef5350" }}>
            <div className="chat-status-text" style={{ color: "#ef5350", fontWeight: "bold" }}>
              {msg.content}
            </div>
          </Box>
        </motion.div>
      );
    }

    const content = this.normalizeImage(msg.content);
    if (!content) return null;

    const mainImg = this.normalizeImage(mainImage);
    const isLatestMain = msg.type === "image" && content === mainImg;

    return (
      <motion.div
        key={msg.id}
        className="chat-bubble-wrapper"
        initial={{ opacity: 0, y: 100, scale: 0.88, rotateX: 15 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        exit={{ opacity: 0, y: -80, scale: 0.9 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        layout
        whileHover={{ scale: 1.015 }}
      >
        <motion.div className="chat-image-frame" whileHover={{ scale: 1.025 }} transition={{ duration: 0.3 }}>
          {isLatestMain && (
            <motion.div
              className="latest-main-label"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Latest Main
            </motion.div>
          )}

          <motion.img
            src={content}
            alt="workspace"
            className="chat-preview-img"
            onClick={() => this.setState({ modalImage: content })}
            onContextMenu={(e) => this.handleContextMenu(e, content)}
            whileHover={{ scale: 1.04, filter: "brightness(1.12) saturate(1.15)" }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.25 }}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
            {msg.isResponse ? (
              <Typography sx={{ color: "#90caf9", fontSize: "0.75rem", letterSpacing: 0.5, fontWeight: 600 }}>
                {t.successCompleted}
              </Typography>
            ) : (
              <Typography sx={{ color: "#aaaaaa", fontSize: "0.75rem", letterSpacing: 0.5 }}>
                {t.uploadSuccess}
              </Typography>
            )}
          </Box>
        </motion.div>
      </motion.div>
    );
  };

  render() {
    const { messages, language } = this.props;
    const { isProcessing, modalImage, contextMenu, visible } = this.state;

    const t = translations[language] || translations.en;

    return (
      <div
        className={`workspace ${language === "fa" ? "rtl" : ""}`}
        style={{
          position: "relative",
          height: "100vh",
          width: "100%",
          overflow: "hidden",
          paddingTop: "0",
        }}
      >
        <div
          className="workspace-bg"
          style={{
            backgroundImage: `url(${BgGif})`,
          }}
        />
        <ImageModal
          src={modalImage}
          onClose={() => this.setState({ modalImage: null })}
        />

        <Menu
          open={contextMenu !== null}
          onClose={this.handleCloseMenu}
          anchorReference="anchorPosition"
          anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
        >
          <MenuItem onClick={this.handleSetMainImage}>{t.latestMain}</MenuItem>
        </Menu>

        <motion.div
          className="chat-feed-container"
          animate={{
            opacity: visible ? 1 : 0.35,
            y: visible ? 0 : -30
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "40px 20px 140px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "40px",
            width: "100%",
            maxWidth: "800px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <AnimatePresence>
            {messages.map(this.renderMessage)}
          </AnimatePresence>

          {isProcessing && <LoadingIndicator />}

          <div ref={this.feedEndRef} />
        </motion.div>

        <footer className="workspace-footer">
          {t.footerText}
        </footer>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  messages: state.app.messages,
  language: state.app.language,
  darkMode: state.app.darkMode,
  mainImage: state.app.mainImage,
});

export default connect(mapStateToProps, {
  addServerResponse,
  addImageMessage,
  setMainImage,
})(Workspace);