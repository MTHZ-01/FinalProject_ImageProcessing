import React, { Component, createRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../Css/ImageModal.css";

class ImageModal extends Component {
  constructor(props) {
    super(props);
    this.overlayRef = createRef();
  }

  render() {
    const { src, onClose } = this.props;

    return (
      <AnimatePresence>
        {src && (
          <motion.div
            className="img-modal-overlay"
            ref={this.overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClose}
          >
            <motion.div
              className="img-modal-content"
              initial={{ scale: 0.75, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 40 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                src={src}
                alt="fullscreen"
                initial={{ filter: "blur(10px) brightness(0.8)" }}
                animate={{ filter: "blur(0px) brightness(1)" }}
                transition={{ delay: 0.15 }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
}

export default ImageModal;