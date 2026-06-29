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

    this.pendingResolve = null;
    this.pendingReject = null;
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
      this.setState({ isProcessing: false });

      if (data.status === "success") {
        if (this.pendingResolve) {
          this.pendingResolve(data.image);
          this.pendingResolve = null;
          this.pendingReject = null;
        } else {
          this.props.addServerResponse({
            content: data.image,
            isResponse: true,
          });
        }
      } else {
        this.props.addServerResponse({
          type: "error",
          content: data.message || "Processing failed",
        });

        if (this.pendingReject) {
          this.pendingReject(new Error(data.message));
          this.pendingReject = null;
        }
      }
    };

    this.socket.onerror = (err) => {
      console.error("WebSocket Error:", err);
      this.setState({ isProcessing: false });
      if (this.pendingReject) this.pendingReject(err);
    };

    this.socket.onclose = () => console.log("WebSocket connection closed");
  };

  // New: Handle final apply (add to chat + set as main)
  handleFinalApply = (resultImage) => {
    if (!resultImage) return;

    // Add to chat feed
    this.props.addServerResponse({
      content: resultImage,
      isResponse: true,
    });

    // Set as Latest Main
    this.props.setMainImage(resultImage);
  };

  // Main handler for both preview and final
  handleExecuteAlgorithm = (algorithm, params, isPreview = true) => {
    return new Promise((resolve, reject) => {
      const { mainImage } = this.props;
      const imageData = this.normalizeImage(mainImage);

      if (!imageData) {
        reject(new Error("No main image available"));
        return;
      }

      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket is not connected"));
        return;
      }

      this.setState({ isProcessing: true });

      this.pendingResolve = resolve;
      this.pendingReject = reject;

      try {
        const payload = {
          algorithm: algorithm,
          params: {
            size: params.kernelSize,
            sigma: params.sigma,
            A: params.boostFactor,
            mask: params.laplacianMask,
          },
          image: imageData,
        };

        this.socket.send(JSON.stringify(payload));
      } catch (err) {
        console.error("Error sending WebSocket message:", err);
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
                SUCCESS // COMPLETED
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

    return (
      <div 
        className={`workspace ${language === "fa" ? "rtl" : ""}`}
        style={{
          backgroundImage: `url(${BgGif})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      >
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
          <MenuItem onClick={this.handleSetMainImage}>Set as Latest Main</MenuItem>
        </Menu>

        <motion.div
          className="chat-feed-container"
          animate={{ 
            opacity: visible ? 1 : 0.35,
            y: visible ? 0 : -30 
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <AnimatePresence>
            {messages.map(this.renderMessage)}
          </AnimatePresence>

          {isProcessing && <LoadingIndicator />}

          <div ref={this.feedEndRef} />
        </motion.div>
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
  setMainImage,
})(Workspace);