import React, { Component } from "react";

class ImageModal extends Component {
    render() {
        const { src, onClose } = this.props;

        if (!src) return null;

        return (
            <div className="img-modal-overlay" onClick={onClose}>
                <div
                    className="img-modal-content"
                    onClick={(e) => e.stopPropagation()}
                >
                    <img src={src} alt="fullscreen" />
                </div>
            </div>
        );
    }
}

export default ImageModal;