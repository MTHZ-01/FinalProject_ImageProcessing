// ComparisonSlider.jsx
import React, { Component } from "react";
import { motion, AnimatePresence } from "framer-motion";

class ComparisonSlider extends Component {
  constructor(props) {
    super(props);
    this.containerRef = React.createRef();
    this.canvasRef = React.createRef();
    this.state = {
      sliderPosition: 50,
      isDragging: false,
      zoom: 1,
      panX: 0,
      panY: 0,
      isPanning: false,
      startX: 0,
      startY: 0,
      mode: 'horizontal',
    };
  }

  componentDidMount() {
    this.loadImages();
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.original !== this.props.original || 
        prevProps.processed !== this.props.processed) {
      this.loadImages();
    }
    if (prevState.mode !== this.state.mode) {
      this.drawComparison();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      this.setState(prev => ({
        sliderPosition: Math.max(0, prev.sliderPosition - 2)
      }), this.drawComparison);
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      this.setState(prev => ({
        sliderPosition: Math.min(100, prev.sliderPosition + 2)
      }), this.drawComparison);
    }
    if (e.key === 'Escape') {
      this.props.onClose?.();
    }
  };

  handleResize = () => {
    this.loadImages();
  };

  loadImages = () => {
    const { original, processed } = this.props;
    if (!original || !processed) return;

    this.originalImg = new Image();
    this.processedImg = new Image();
    
    let loadedCount = 0;
    const onLoad = () => {
      loadedCount++;
      if (loadedCount === 2) {
        this.drawComparison();
      }
    };

    this.originalImg.onload = onLoad;
    this.processedImg.onload = onLoad;
    
    this.originalImg.src = original;
    this.processedImg.src = processed;
  };

  drawComparison = () => {
    const canvas = this.canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const { sliderPosition, mode, zoom, panX, panY } = this.state;
    
    ctx.clearRect(0, 0, width, height);

    if (!this.originalImg || !this.processedImg) {
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Loading images...', width / 2, height / 2);
      return;
    }

    const imgWidth = this.originalImg.width * zoom;
    const imgHeight = this.originalImg.height * zoom;
    const offsetX = (width - imgWidth) / 2 + panX;
    const offsetY = (height - imgHeight) / 2 + panY;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.clip();

    if (mode === 'horizontal') {
      const splitX = (sliderPosition / 100) * width;
      
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, height);
      ctx.clip();
      ctx.drawImage(this.processedImg, offsetX, offsetY, imgWidth, imgHeight);
      ctx.restore();
      
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, width - splitX, height);
      ctx.clip();
      ctx.drawImage(this.originalImg, offsetX, offsetY, imgWidth, imgHeight);
      ctx.restore();
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      const handleSize = 30;
      const gradient = ctx.createRadialGradient(
        splitX, height / 2, 0,
        splitX, height / 2, handleSize
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.beginPath();
      ctx.arc(splitX, height / 2, handleSize, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(splitX, height / 2, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('◄', splitX - 18, height / 2 + 4);
      ctx.fillText('►', splitX + 18, height / 2 + 4);

    } else {
      const splitY = (sliderPosition / 100) * height;
      
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width, splitY);
      ctx.clip();
      ctx.drawImage(this.processedImg, offsetX, offsetY, imgWidth, imgHeight);
      ctx.restore();
      
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, splitY, width, height - splitY);
      ctx.clip();
      ctx.drawImage(this.originalImg, offsetX, offsetY, imgWidth, imgHeight);
      ctx.restore();
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(0, splitY);
      ctx.lineTo(width, splitY);
      ctx.stroke();
      ctx.setLineDash([]);

      const handleSize = 30;
      const gradient = ctx.createRadialGradient(
        width / 2, splitY, 0,
        width / 2, splitY, handleSize
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.beginPath();
      ctx.arc(width / 2, splitY, handleSize, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(width / 2, splitY, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('▲', width / 2, splitY - 18);
      ctx.fillText('▼', width / 2, splitY + 24);
    }

    ctx.restore();

    this.drawLabels(ctx, width, height);
  };

  drawLabels = (ctx, width, height) => {
    const { mode, sliderPosition } = this.state;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.roundRect?.(10, 10, 90, 24, 12) || ctx.fillRect(10, 10, 90, 24);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Original', 18, 27);

    const labelX = mode === 'horizontal' ? width - 100 : 10;
    const labelY = mode === 'horizontal' ? 10 : height - 30;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.roundRect?.(labelX, labelY, 90, 24, 12) || ctx.fillRect(labelX, labelY, 90, 24);
    ctx.fill();
    ctx.fillStyle = 'rgba(144, 202, 249, 0.9)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Processed', labelX + 8, labelY + 17);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(sliderPosition)}%`, width - 10, height - 10);
  };

  handleMouseDown = (e) => {
    const rect = this.canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (e.clientX - rect.left) / rect.width * this.canvasRef.current.width;
    const y = (e.clientY - rect.top) / rect.height * this.canvasRef.current.height;
    
    const { mode } = this.state;
    const handleSize = 30;
    const centerX = (this.state.sliderPosition / 100) * this.canvasRef.current.width;
    const centerY = (this.state.sliderPosition / 100) * this.canvasRef.current.height;
    
    const distance = mode === 'horizontal' 
      ? Math.abs(x - centerX) 
      : Math.abs(y - centerY);
    
    if (distance < handleSize) {
      this.setState({ isDragging: true });
    } else {
      this.setState({ isPanning: true, startX: e.clientX, startY: e.clientY });
    }
  };

  handleMouseMove = (e) => {
    const canvas = this.canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * canvas.width;
    const y = (e.clientY - rect.top) / rect.height * canvas.height;
    
    if (this.state.isDragging) {
      const { mode } = this.state;
      const pos = mode === 'horizontal' 
        ? Math.max(0, Math.min(100, (x / canvas.width) * 100))
        : Math.max(0, Math.min(100, (y / canvas.height) * 100));
      
      this.setState({ sliderPosition: pos }, this.drawComparison);
    }
    
    if (this.state.isPanning) {
      const dx = e.clientX - this.state.startX;
      const dy = e.clientY - this.state.startY;
      this.setState(prev => ({
        panX: prev.panX + dx,
        panY: prev.panY + dy,
        startX: e.clientX,
        startY: e.clientY,
      }), this.drawComparison);
    }
  };

  handleMouseUp = () => {
    this.setState({ isDragging: false, isPanning: false });
  };

  handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    this.setState(prev => ({
      zoom: Math.max(0.2, Math.min(5, prev.zoom + delta))
    }), this.drawComparison);
  };

  toggleMode = () => {
    this.setState(prev => ({
      mode: prev.mode === 'horizontal' ? 'vertical' : 'horizontal'
    }));
  };

  resetView = () => {
    this.setState({
      zoom: 1,
      panX: 0,
      panY: 0,
      sliderPosition: 50,
    }, this.drawComparison);
  };

  render() {
    const { onClose } = this.props;
    const { sliderPosition, mode, zoom, isDragging, isPanning } = this.state;

    return (
      <AnimatePresence>
        <motion.div
          className="comparison-slider-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.92)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(12px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose?.();
          }}
        >
          <motion.div
            className="comparison-slider-container"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'relative',
              width: '90%',
              maxWidth: '1200px',
              height: '85vh',
              maxHeight: '800px',
              background: 'rgba(10, 10, 20, 0.95)',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 24px 80px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: '12px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
                pointerEvents: 'none',
              }}
            >
              <div style={{ display: 'flex', gap: '8px', pointerEvents: 'auto' }}>
                <button
                  onClick={this.toggleMode}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    color: 'rgba(255,255,255,0.8)',
                    padding: '4px 12px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                  }}
                >
                  {mode === 'horizontal' ? '↕ Vertical' : '↔ Horizontal'}
                </button>
                <button
                  onClick={this.resetView}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    color: 'rgba(255,255,255,0.8)',
                    padding: '4px 12px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                  }}
                >
                  Reset View
                </button>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', pointerEvents: 'auto' }}>
                <span style={{ 
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}>
                  Zoom: {(zoom * 100).toFixed(0)}%
                </span>
                <button
                  onClick={onClose}
                  style={{
                    background: 'rgba(239, 68, 68, 0.3)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '4px 16px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.6)',
                padding: '8px 20px',
                borderRadius: '20px',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.05)',
                pointerEvents: 'auto',
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontFamily: 'monospace' }}>
                {mode === 'horizontal' ? '←' : '↑'} Original
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => {
                  this.setState({ sliderPosition: parseInt(e.target.value) }, this.drawComparison);
                }}
                style={{
                  width: '200px',
                  height: '4px',
                  background: `linear-gradient(to right, rgba(144, 202, 249, 0.5) 0%, rgba(144, 202, 249, 0.5) ${sliderPosition}%, rgba(255,255,255,0.2) ${sliderPosition}%, rgba(255,255,255,0.2) 100%)`,
                  borderRadius: '2px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontFamily: 'monospace' }}>
                Processed {mode === 'horizontal' ? '→' : '↓'}
              </span>
              <span style={{ 
                color: 'rgba(255,255,255,0.6)',
                fontSize: '11px',
                fontFamily: 'monospace',
                minWidth: '36px',
                textAlign: 'center',
              }}>
                {Math.round(sliderPosition)}%
              </span>
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: '70px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                color: 'rgba(255,255,255,0.2)',
                fontSize: '10px',
                fontFamily: 'monospace',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              Drag slider • Scroll to zoom • Drag image to pan • Arrow keys • ESC to close
            </div>

            <canvas
              ref={this.canvasRef}
              width={1200}
              height={800}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                cursor: isDragging ? 'ew-resize' : isPanning ? 'grabbing' : 'grab',
              }}
              onMouseDown={this.handleMouseDown}
              onMouseMove={this.handleMouseMove}
              onMouseUp={this.handleMouseUp}
              onMouseLeave={this.handleMouseUp}
              onWheel={this.handleWheel}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }
}

export default ComparisonSlider;