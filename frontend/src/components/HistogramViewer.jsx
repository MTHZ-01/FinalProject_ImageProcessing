// HistogramViewer.jsx
import React, { Component } from "react";
import { motion } from "framer-motion";

class HistogramViewer extends Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.state = {
      channel: 'all',
    };
  }

  componentDidMount() {
    this.drawHistogram();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.image !== this.props.image ||
      prevState.channel !== this.state.channel ||
      prevProps.imageData !== this.props.imageData
    ) {
      this.drawHistogram();
    }
  }

  drawHistogram = () => {
    const canvas = this.canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const { image, imageData, showRgb } = this.props;

    ctx.clearRect(0, 0, width, height);

    let histData = null;

    if (imageData) {
      histData = imageData;
    } else if (image) {
      histData = this.computeHistogramFromImage(image);
    } else {
      this.drawEmptyHistogram(ctx, width, height);
      return;
    }

    if (showRgb && histData.rgb) {
      this.drawRgbHistogram(ctx, histData.rgb, width, height);
    } else {
      this.drawGrayscaleHistogram(ctx, histData, width, height);
    }
  };

  computeHistogramFromImage = (imageSrc) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const hist = new Array(256).fill(0);
        const histR = new Array(256).fill(0);
        const histG = new Array(256).fill(0);
        const histB = new Array(256).fill(0);
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          hist[gray]++;
          histR[r]++;
          histG[g]++;
          histB[b]++;
        }
        
        resolve({ hist, rgb: { r: histR, g: histG, b: histB } });
      };
      img.src = imageSrc;
    });
  };

  drawGrayscaleHistogram = (ctx, histData, width, height) => {
    const hist = histData.hist || histData;
    const maxVal = Math.max(...hist, 1);
    const barWidth = width / 256;

    ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#4fc3f7');
    gradient.addColorStop(0.5, '#81c784');
    gradient.addColorStop(1, '#ffb74d');

    for (let i = 0; i < 256; i++) {
      const barHeight = (hist[i] / maxVal) * (height - 20);
      const x = i * barWidth;
      const y = height - barHeight - 10;

      ctx.fillStyle = gradient;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(x, y, Math.max(barWidth - 0.5, 0.5), barHeight);
      
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.3;
      ctx.strokeRect(x, y, Math.max(barWidth - 0.5, 0.5), barHeight);
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px monospace';
    ctx.fillText('0', 2, height - 2);
    ctx.fillText('128', width / 2 - 10, height - 2);
    ctx.fillText('255', width - 25, height - 2);

    const mean = this.calculateMean(hist);
    const std = this.calculateStd(hist, mean);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '9px monospace';
    ctx.fillText(`Mean: ${mean.toFixed(1)}`, 8, 16);
    ctx.fillText(`Std: ${std.toFixed(1)}`, 8, 28);
    ctx.fillText(`Peak: ${maxVal}`, 8, 40);

    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const meanX = (mean / 255) * width;
    ctx.moveTo(meanX, 10);
    ctx.lineTo(meanX, height - 10);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  drawRgbHistogram = (ctx, rgbData, width, height) => {
    const { r, g, b } = rgbData;
    const maxVal = Math.max(...r, ...g, ...b, 1);
    const barWidth = width / 256;

    ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
    ctx.fillRect(0, 0, width, height);

    const colors = [
      { data: r, color: '#ff4444', label: 'R' },
      { data: g, color: '#44ff44', label: 'G' },
      { data: b, color: '#4444ff', label: 'B' },
    ];

    ctx.globalAlpha = 0.6;
    colors.forEach(({ data, color }) => {
      ctx.fillStyle = color;
      for (let i = 0; i < 256; i++) {
        const barHeight = (data[i] / maxVal) * (height - 20);
        const x = i * barWidth;
        const y = height - barHeight - 10;
        ctx.fillRect(x, y, Math.max(barWidth - 0.5, 0.5), barHeight);
      }
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '10px monospace';
    ctx.fillText('0', 2, height - 2);
    ctx.fillText('128', width / 2 - 10, height - 2);
    ctx.fillText('255', width - 25, height - 2);

    const legendY = 16;
    colors.forEach(({ color, label }, index) => {
      const x = 8 + index * 60;
      ctx.fillStyle = color;
      ctx.fillRect(x, legendY - 8, 12, 3);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '9px monospace';
      ctx.fillText(label, x + 16, legendY + 1);
    });
  };

  drawEmptyHistogram = (ctx, width, height) => {
    ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No image loaded', width / 2, height / 2);
  };

  calculateMean = (hist) => {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < hist.length; i++) {
      sum += i * hist[i];
      count += hist[i];
    }
    return count > 0 ? sum / count : 0;
  };

  calculateStd = (hist, mean) => {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < hist.length; i++) {
      sum += Math.pow(i - mean, 2) * hist[i];
      count += hist[i];
    }
    return count > 0 ? Math.sqrt(sum / count) : 0;
  };

  handleChannelChange = (channel) => {
    this.setState({ channel });
  };

  render() {
    const { width = 400, height = 200, title = 'Histogram', showRgb = false } = this.props;
    const { channel } = this.state;

    return (
      <motion.div
        className="histogram-viewer"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        style={{
          background: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '12px',
          padding: '12px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'inline-block',
        }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px',
        }}>
          <span style={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.5px',
          }}>
            {title}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {showRgb && (
              <>
                <button
                  onClick={() => this.handleChannelChange('all')}
                  style={{
                    background: channel === 'all' ? 'rgba(144, 202, 249, 0.3)' : 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    color: 'rgba(255,255,255,0.7)',
                    padding: '2px 8px',
                    fontSize: '10px',
                    cursor: 'pointer',
                  }}
                >
                  RGB
                </button>
                <button
                  onClick={() => this.handleChannelChange('red')}
                  style={{
                    background: channel === 'red' ? 'rgba(255, 68, 68, 0.3)' : 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    color: 'rgba(255,255,255,0.7)',
                    padding: '2px 8px',
                    fontSize: '10px',
                    cursor: 'pointer',
                  }}
                >
                  R
                </button>
                <button
                  onClick={() => this.handleChannelChange('green')}
                  style={{
                    background: channel === 'green' ? 'rgba(68, 255, 68, 0.3)' : 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    color: 'rgba(255,255,255,0.7)',
                    padding: '2px 8px',
                    fontSize: '10px',
                    cursor: 'pointer',
                  }}
                >
                  G
                </button>
                <button
                  onClick={() => this.handleChannelChange('blue')}
                  style={{
                    background: channel === 'blue' ? 'rgba(68, 68, 255, 0.3)' : 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    color: 'rgba(255,255,255,0.7)',
                    padding: '2px 8px',
                    fontSize: '10px',
                    cursor: 'pointer',
                  }}
                >
                  B
                </button>
              </>
            )}
          </div>
        </div>
        <canvas
          ref={this.canvasRef}
          width={width}
          height={height}
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: '8px',
            background: 'rgba(0, 0, 0, 0.5)',
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '4px',
          color: 'rgba(255, 255, 255, 0.3)',
          fontSize: '8px',
          fontFamily: 'monospace',
        }}>
          <span>Pixel Intensity</span>
          <span>Frequency</span>
        </div>
      </motion.div>
    );
  }
}

export default HistogramViewer;