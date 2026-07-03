import React, { Component } from "react";
import ReactDOM from "react-dom";
import { translations } from "../app/locales";

class ActionPromptCard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            // Filter state
            selectedAlgorithm: "histogram_eq",
            params: {
                kernelSize: 3,
                sigma: 1.0,
                boostFactor: 1.5,
                laplacianMask: "4",
                gamma: 1.0,
            },
            baseImage: props.mainImage || null,
            previewImage: null,
            isCompleted: false,
            isProcessing: false,

            // UI state
            aspectRatio: null,
            sliderPosition: 50,
            isFullscreen: false,

            // Fullscreen zoom / pan
            fsScale: 1,
            fsTranslateX: 0,
            fsTranslateY: 0,
            isPanning: false,
            panStart: { x: 0, y: 0 },
        };

        this.updateTimeout = null;
        this.containerRef = React.createRef();          // normal preview container
        this.fsImageContainerRef = React.createRef();   // fullscreen comparison div (for slider hit testing)
        this.fsViewerRef = React.createRef();           // fullscreen viewer wrapper (for wheel/pan)
        this.isSliderDragging = false;
        this.latestExecutionId = 0;
    }

    componentDidMount() {
        setTimeout(() => {
            this.debouncedExecute(this.state.selectedAlgorithm, this.state.params);
        }, 400);
    }

    componentWillUnmount() {
        if (this.updateTimeout) clearTimeout(this.updateTimeout);
        this.removeGlobalListeners();
        document.body.style.overflow = "";
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.mainImage !== this.props.mainImage && !this.state.isCompleted) {
            this.setState({
                baseImage: this.props.mainImage,
                previewImage: null,
                sliderPosition: 50,
            });
        }

        if (this.state.isFullscreen !== prevState.isFullscreen) {
            document.body.style.overflow = this.state.isFullscreen ? "hidden" : "";
            if (this.state.isFullscreen) {
                // Reset zoom when entering fullscreen
                this.setState({ fsScale: 1, fsTranslateX: 0, fsTranslateY: 0 });
            }
        }
    }

    /* ---------- Filter execution ---------- */
    debouncedExecute = (algorithm, params) => {
        if (this.updateTimeout) clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
            this.executeFilter(algorithm, params, true);
        }, 50);
    };

    executeFilter = (algorithm, params, isPreview = true) => {
        if (this.state.isCompleted) return Promise.resolve();
        const executionId = ++this.latestExecutionId;
        this.setState({ isProcessing: true });

        return this.props.onExecute(algorithm, params, isPreview)
            .then((resultImage) => {
                if (executionId !== this.latestExecutionId) return null;
                if (isPreview) {
                    this.setState({ previewImage: resultImage, isProcessing: false });
                } else {
                    this.setState({
                        previewImage: resultImage,
                        isCompleted: true,
                        isProcessing: false,
                    });
                    if (this.props.onFinalApply) {
                        this.props.onFinalApply(resultImage);
                    }
                }
                return resultImage;
            })
            .catch((err) => {
                if (executionId === this.latestExecutionId) {
                    console.error("Filter Execution Failure:", err);
                    this.setState({ isProcessing: false });
                }
                throw err;
            });
    };

    /* ---------- Parameter handling ---------- */
    handleAlgorithmChange = (e) => {
        const selectedAlgorithm = e.target.value;
        this.setState({
            selectedAlgorithm,
            params: {
                kernelSize: 3,
                sigma: 1.0,
                boostFactor: 1.5,
                laplacianMask: "4",
                gamma: 1.0,
            },
        }, () => this.debouncedExecute(selectedAlgorithm, this.state.params));
    };

    updateParam = (key, value) => {
        this.setState((prevState) => ({
            params: { ...prevState.params, [key]: value },
        }), () => this.debouncedExecute(this.state.selectedAlgorithm, this.state.params));
    };

    handleApplyFilter = () => {
        if (this.updateTimeout) clearTimeout(this.updateTimeout);
        this.executeFilter(this.state.selectedAlgorithm, this.state.params, false)
            .then(() => this.setState({ isFullscreen: false }));
    };

    handleImageLoad = (e) => {
        const { naturalWidth, naturalHeight } = e.target;
        if (naturalWidth && naturalHeight) {
            this.setState({ aspectRatio: naturalWidth / naturalHeight });
        }
    };

    /* ---------- Fullscreen toggle ---------- */
    toggleFullscreen = () => {
        this.setState((prev) => ({ isFullscreen: !prev.isFullscreen }));
    };

    /* ---------- Slider / pan / zoom event management ---------- */
    handleSliderMove = (clientX) => {
        // Determine which container ref to use depending on fullscreen state
        const containerRef = this.state.isFullscreen
            ? this.fsImageContainerRef
            : this.containerRef;
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        let percentage = (x / rect.width) * 100;
        percentage = Math.max(0, Math.min(100, percentage));
        this.setState({ sliderPosition: percentage });
    };

    onMouseMove = (e) => {
        if (this.isSliderDragging) {
            this.handleSliderMove(e.clientX);
        } else if (this.state.isFullscreen && this.state.isPanning) {
            const dx = e.clientX - this.state.panStart.x;
            const dy = e.clientY - this.state.panStart.y;
            this.setState((prev) => ({
                fsTranslateX: prev.fsTranslateX + dx,
                fsTranslateY: prev.fsTranslateY + dy,
                panStart: { x: e.clientX, y: e.clientY },
            }));
        }
    };

    onMouseUp = () => {
        if (this.isSliderDragging) {
            this.isSliderDragging = false;
        }
        if (this.state.isPanning) {
            this.setState({ isPanning: false });
        }
        this.removeGlobalListeners();
    };

    addGlobalListeners = () => {
        window.addEventListener("mousemove", this.onMouseMove);
        window.addEventListener("mouseup", this.onMouseUp);
    };

    removeGlobalListeners = () => {
        window.removeEventListener("mousemove", this.onMouseMove);
        window.removeEventListener("mouseup", this.onMouseUp);
    };

    handleSliderInit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.isSliderDragging = true;
        this.setState({ isPanning: false });
        this.addGlobalListeners();
    };

    // Pan start (only in fullscreen)
    handlePanStart = (e) => {
        if (this.isSliderDragging) return; // slider takes precedence
        if (!this.state.isFullscreen) return;
        // Only left mouse button (button 0)
        if (e.button !== 0) return;
        e.preventDefault();
        this.setState({
            isPanning: true,
            panStart: { x: e.clientX, y: e.clientY },
        });
        this.addGlobalListeners();
    };

    // Zoom with Ctrl + wheel (Windows standard)
    handleWheel = (e) => {
        if (!this.state.isFullscreen) return;
        if (e.ctrlKey) {
            e.preventDefault();
            const container = this.fsViewerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;

            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const newScale = Math.min(5, Math.max(0.2, this.state.fsScale + delta));

            // Zoom toward cursor point
            const scaleChange = newScale / this.state.fsScale;
            const newTranslateX = offsetX - (offsetX - this.state.fsTranslateX) * scaleChange;
            const newTranslateY = offsetY - (offsetY - this.state.fsTranslateY) * scaleChange;

            this.setState({
                fsScale: newScale,
                fsTranslateX: newTranslateX,
                fsTranslateY: newTranslateY,
            });
        }
    };

    zoomIn = () => {
        this.setState((prev) => ({ fsScale: Math.min(5, prev.fsScale + 0.2) }));
    };

    zoomOut = () => {
        this.setState((prev) => ({ fsScale: Math.max(0.2, prev.fsScale - 0.2) }));
    };

    resetZoom = () => {
        this.setState({ fsScale: 1, fsTranslateX: 0, fsTranslateY: 0 });
    };

    /* ---------- Render helpers ---------- */
    renderComparison = (containerStyle = {}, containerRef = null) => {
        const { previewImage, sliderPosition, isProcessing, baseImage } = this.state;
        const t = translations[this.props.language] || translations.en;
        const mainImage = baseImage || this.props.mainImage || null;

        return (
            <div
                ref={containerRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    background: "#121212",
                    ...containerStyle,
                }}
            >
                <img
                    src={mainImage || previewImage}
                    alt="Original"
                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                />

                {previewImage && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
                            pointerEvents: "none",
                        }}
                    >
                        <img
                            src={previewImage}
                            alt="Processed"
                            onLoad={this.handleImageLoad}
                            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                        />
                    </div>
                )}

                {previewImage && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: `${sliderPosition}%`,
                            width: "2px",
                            backgroundColor: "#90caf9",
                            cursor: "ew-resize",
                            transform: "translateX(-50%)",
                            zIndex: 10,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        onMouseDown={this.handleSliderInit}
                    >
                        <div style={{
                            width: 28, height: 28, background: "#90caf9", borderRadius: "50%",
                            border: "2px solid #121212", display: "flex", alignItems: "center",
                            justifyContent: "center", fontSize: 12, color: "#000", fontWeight: "bold",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
                        }}>
                            ⇄
                        </div>
                    </div>
                )}

                {isProcessing && (
                    <div style={{
                        position: "absolute", bottom: 12, right: 12,
                        background: "rgba(18,18,18,0.85)", padding: "4px 8px",
                        borderRadius: 4, border: "1px solid #90caf9", fontSize: "0.7rem",
                        color: "#90caf9", zIndex: 12, letterSpacing: 1, fontWeight: "bold",
                    }}>
                        {t.syncingRender}
                    </div>
                )}
            </div>
        );
    };

    renderControlSidebar = () => {
        const { selectedAlgorithm, params, isCompleted, isProcessing } = this.state;
        const t = translations[this.props.language] || translations.en;
        const showKernel = ["average", "gaussian", "median", "maximum", "minimum", "midpoint"].includes(selectedAlgorithm);
        const showSigma = selectedAlgorithm === "gaussian";
        const showBoost = selectedAlgorithm === "highboost";
        const showLaplacianMask = selectedAlgorithm === "laplacian";
        const showGamma = selectedAlgorithm === "power_law";

        return (
            <div style={{
                width: 340,
                height: "100%",
                background: "rgba(10, 10, 15, 0.92)",
                backdropFilter: "blur(24px)",
                borderLeft: "1px solid #2a2a3a",
                display: "flex",
                flexDirection: "column",
                color: "#ccc",
                fontFamily: "'Inter', system-ui, sans-serif",
                overflow: "hidden",
            }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #2a2a3a" }}>
                    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, letterSpacing: 1, color: "#90caf9" }}>
                        {t.fullscreenControls}
                    </h3>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
                    {/* Algorithm */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: "0.7rem", letterSpacing: 1, color: "#888", marginBottom: 4 }}>{t.algorithm}</label>
                        <select
                            value={selectedAlgorithm}
                            onChange={this.handleAlgorithmChange}
                            disabled={isCompleted}
                            style={{
                                width: "100%", background: "#1a1a24", border: "1px solid #3a3a4a", color: "#ddd",
                                padding: "8px 10px", borderRadius: 4, fontSize: "0.85rem", outline: "none",
                            }}
                        >
                            <optgroup label={t.intensityTransformations}>
                                <option value="negative">{t.negative}</option>
                                <option value="log">{t.logTransformation}</option>
                                <option value="power_law">{t.powerLaw}</option>
                                <option value="histogram_eq">{t.histogramEqualization}</option>
                            </optgroup>
                            <optgroup label={t.smoothingFilters}>
                                <option value="average">{t.averageFilter}</option>
                                <option value="gaussian">{t.gaussianFilter}</option>
                            </optgroup>
                            <optgroup label={t.orderStatisticFilters}>
                                <option value="median">{t.medianFilter}</option>
                                <option value="maximum">{t.maximumFilter}</option>
                                <option value="minimum">{t.minimumFilter}</option>
                                <option value="midpoint">{t.midpointFilter}</option>
                            </optgroup>
                            <optgroup label={t.edgeDetectionGroup}>
                                <option value="sobel">{t.sobel}</option>
                                <option value="prewitt">{t.prewitt}</option>
                                <option value="roberts">{t.roberts}</option>
                                <option value="laplacian">{t.laplacian}</option>
                            </optgroup>
                            <optgroup label={t.sharpeningGroup}>
                                <option value="highboost">{t.highboostFiltering}</option>
                            </optgroup>
                        </select>
                    </div>

                    {/* Dynamic sliders */}
                    {showKernel && (
                        <SliderControl label={t.kernelSize} min={3} max={11} step={2} value={params.kernelSize}
                            onChange={(v) => this.updateParam("kernelSize", parseInt(v))} disabled={isCompleted} />
                    )}
                    {showSigma && (
                        <SliderControl label={t.sigma} min={0.5} max={5} step={0.1} value={params.sigma}
                            onChange={(v) => this.updateParam("sigma", parseFloat(v))} disabled={isCompleted} />
                    )}
                    {showBoost && (
                        <SliderControl label={t.boostFactor} min={1} max={5} step={0.1} value={params.boostFactor}
                            onChange={(v) => this.updateParam("boostFactor", parseFloat(v))} disabled={isCompleted} />
                    )}
                    {showLaplacianMask && (
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: "block", fontSize: "0.7rem", letterSpacing: 1, color: "#888", marginBottom: 4 }}>{t.laplacianMask}</label>
                            <select
                                value={params.laplacianMask}
                                onChange={(e) => this.updateParam("laplacianMask", e.target.value)}
                                disabled={isCompleted}
                                style={{
                                    width: "100%", background: "#1a1a24", border: "1px solid #3a3a4a", color: "#ddd",
                                    padding: "8px 10px", borderRadius: 4, fontSize: "0.85rem", outline: "none",
                                }}
                            >
                                <option value="4">{t.fourNeighbour}</option>
                                <option value="8">{t.eightNeighbour}</option>
                            </select>
                        </div>
                    )}
                    {showGamma && (
                        <SliderControl label={t.gamma} min={0.1} max={5} step={0.1} value={params.gamma}
                            onChange={(v) => this.updateParam("gamma", parseFloat(v))} disabled={isCompleted} />
                    )}

                    {/* Zoom controls */}
                    <div style={{ marginTop: 24, borderTop: "1px solid #2a2a3a", paddingTop: 16 }}>
                        <label style={{ display: "block", fontSize: "0.7rem", letterSpacing: 1, color: "#888", marginBottom: 8 }}>{t.viewport}</label>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button onClick={this.zoomOut} style={zoomBtnStyle}>−</button>
                            <span style={{ fontSize: "0.85rem", fontWeight: 500, minWidth: 50, textAlign: "center" }}>
                                {Math.round(this.state.fsScale * 100)}%
                            </span>
                            <button onClick={this.zoomIn} style={zoomBtnStyle}>+</button>
                            <button onClick={this.resetZoom} style={{ ...zoomBtnStyle, marginLeft: "auto", fontSize: "0.8rem" }}>
                                ↺ Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom actions */}
                <div style={{ padding: "16px 20px", borderTop: "1px solid #2a2a3a", display: "flex", gap: 10 }}>
                    <button
                        onClick={this.toggleFullscreen}
                        style={{
                            flex: 1, padding: "10px 0", background: "transparent", border: "1px solid #3a3a4a",
                            color: "#ccc", borderRadius: 6, fontWeight: 600, cursor: "pointer",
                        }}
                    >
                        {t.exitFullscreen}
                    </button>
                    <button
                        onClick={this.handleApplyFilter}
                        disabled={isCompleted || isProcessing}
                        style={{
                            flex: 1, padding: "10px 0", background: isCompleted ? "#4ade80" : "#90caf9",
                            color: "#000", border: "none", borderRadius: 6, fontWeight: 700, cursor: isCompleted ? "default" : "pointer",
                            letterSpacing: 1,
                        }}
                    >
                        {isCompleted ? t.applied : t.applyFilter}
                    </button>
                </div>
            </div>
        );
    };

    render() {
        const { isFullscreen, aspectRatio } = this.state;
        const t = translations[this.props.language] || translations.en;

        // Normal card container style
        const containerStyle = {
            position: "relative",
            width: "100%",
            borderRadius: 8,
            border: "1px solid #333",
            overflow: "hidden",
            background: "#121212",
            margin: "12px 0",
            ...(aspectRatio ? { aspectRatio: `${aspectRatio}` } : { height: 240 }),
        };

        // Fullscreen portal
        const fullscreenPortal = isFullscreen
            ? ReactDOM.createPortal(
                  <div
                      style={{
                          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                          zIndex: 9999, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)",
                          display: "flex", alignItems: "stretch", justifyContent: "center",
                      }}
                  >
                      {/* Main image viewer */}
                      <div
                          ref={this.fsViewerRef}
                          onWheel={this.handleWheel}
                          onMouseDown={this.handlePanStart}
                          style={{
                              flex: 1,
                              position: "relative",
                              overflow: "hidden",
                              cursor: this.state.isPanning ? "grabbing" : "grab",
                          }}
                      >
                          <div
                              style={{
                                  transform: `translate(${this.state.fsTranslateX}px, ${this.state.fsTranslateY}px) scale(${this.state.fsScale})`,
                                  transformOrigin: "0 0",
                                  transition: this.state.isPanning || this.isSliderDragging ? "none" : "transform 0.15s ease",
                                  width: "100%",
                                  height: "100%",
                              }}
                          >
                              {this.renderComparison(
                                  { width: "100%", height: "100%" },
                                  this.fsImageContainerRef
                              )}
                          </div>

                          {/* Exit fullscreen button (top-right) */}
                          <button
                              onClick={this.toggleFullscreen}
                              style={{
                                  position: "absolute", top: 16, right: 16, width: 40, height: 40,
                                  borderRadius: "50%", background: "rgba(18,18,18,0.8)", border: "1px solid #90caf9",
                                  color: "#90caf9", fontSize: 20, display: "flex", alignItems: "center",
                                  justifyContent: "center", cursor: "pointer", zIndex: 20,
                              }}
                              title={t.exitFullscreen}
                          >
                              ✕
                          </button>
                      </div>

                      {/* Sidebar */}
                      {this.renderControlSidebar()}
                  </div>,
                  document.body
              )
            : null;

        return (
            <>
                {/* Main Card */}
                <div className="spacex-action-card-clean full-width-layout">
                    <div className="card-header-telemetry-clean anim-fade-in-1">
                        <span className="status-dot-clean pulsing-clean" />
                        <span className="telemetry-title-clean">{t.liveSpatialFiltering}</span>
                    </div>

                    <div className="preview-container" ref={this.containerRef} style={containerStyle}>
                        {(this.state.previewImage || this.props.mainImage) ? (
                            <div style={{ width: "100%", height: "100%", position: "relative" }}>
                                {this.renderComparison({ width: "100%", height: "100%" }, this.containerRef)}
                                <button
                                    onClick={this.toggleFullscreen}
                                    style={{
                                        position: "absolute", top: 10, right: 10, width: 32, height: 32,
                                        borderRadius: 6, background: "rgba(18,18,18,0.75)", border: "1px solid #555",
                                        color: "#ccc", fontSize: 18, display: "flex", alignItems: "center",
                                        justifyContent: "center", cursor: "pointer", zIndex: 11, transition: "0.2s",
                                    }}
                                    title={t.enterFullscreen}
                                >
                                    ⛶
                                </button>
                            </div>
                        ) : (
                            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#555", fontSize: "0.9rem" }}>
                                {this.state.isProcessing ? t.processingBaseline : t.waitingForMainImage}
                            </div>
                        )}
                    </div>

                    {/* Card controls (hidden when fullscreen? Better keep for consistency) */}
                    <div className="card-body-container-clean">
                        <div className="spacex-input-field-clean input-surface-clean anim-fade-in-2">
                                <label className="field-label-clean">{t.algorithm}</label>
                                <div className="select-wrapper-clean">
                                    <select
                                        value={this.state.selectedAlgorithm}
                                        onChange={this.handleAlgorithmChange}
                                        className="spacex-dropdown-clean"
                                        disabled={this.state.isCompleted}
                                    >
                                        <optgroup label={t.intensityTransformations}>
                                            <option value="negative">{t.negative}</option>
                                            <option value="log">{t.logTransformation}</option>
                                            <option value="power_law">{t.powerLaw}</option>
                                            <option value="histogram_eq">{t.histogramEqualization}</option>
                                        </optgroup>
                                        <optgroup label={t.smoothingFilters}>
                                            <option value="average">{t.averageFilter}</option>
                                            <option value="gaussian">{t.gaussianFilter}</option>
                                        </optgroup>
                                        <optgroup label={t.orderStatisticFilters}>
                                            <option value="median">{t.medianFilter}</option>
                                            <option value="maximum">{t.maximumFilter}</option>
                                            <option value="minimum">{t.minimumFilter}</option>
                                            <option value="midpoint">{t.midpointFilter}</option>
                                        </optgroup>
                                        <optgroup label={t.edgeDetectionGroup}>
                                            <option value="sobel">{t.sobel}</option>
                                            <option value="prewitt">{t.prewitt}</option>
                                            <option value="roberts">{t.roberts}</option>
                                            <option value="laplacian">{t.laplacian}</option>
                                        </optgroup>
                                        <optgroup label={t.sharpeningGroup}>
                                            <option value="highboost">{t.highboostFiltering}</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>

                        {/* … rest of the card sliders exactly as before, but they still exist */}
                        {["average", "gaussian", "median", "maximum", "minimum", "midpoint"].includes(this.state.selectedAlgorithm) && (
                            <SliderControl
                                label={t.kernelSize} min={3} max={11} step={2}
                                value={this.state.params.kernelSize}
                                onChange={(v) => this.updateParam("kernelSize", parseInt(v))}
                                disabled={this.state.isCompleted}
                            />
                        )}
                        {this.state.selectedAlgorithm === "gaussian" && (
                            <SliderControl
                                label={t.sigma} min={0.5} max={5} step={0.1}
                                value={this.state.params.sigma}
                                onChange={(v) => this.updateParam("sigma", parseFloat(v))}
                                disabled={this.state.isCompleted}
                            />
                        )}
                        {this.state.selectedAlgorithm === "highboost" && (
                            <SliderControl
                                label={t.boostFactor} min={1} max={5} step={0.1}
                                value={this.state.params.boostFactor}
                                onChange={(v) => this.updateParam("boostFactor", parseFloat(v))}
                                disabled={this.state.isCompleted}
                            />
                        )}
                        {this.state.selectedAlgorithm === "laplacian" && (
                            <div className="spacex-input-field-clean input-surface-clean anim-fade-in-3">
                                <label className="field-label-clean">{t.laplacianMask}</label>
                                <select
                                    value={this.state.params.laplacianMask}
                                    onChange={(e) => this.updateParam("laplacianMask", e.target.value)}
                                    className="spacex-dropdown-clean"
                                    disabled={this.state.isCompleted}
                                >
                                    <option value="4">{t.fourNeighbour}</option>
                                    <option value="8">{t.eightNeighbour}</option>
                                </select>
                            </div>
                        )}
                        {this.state.selectedAlgorithm === "power_law" && (
                            <SliderControl
                                label={t.gamma} min={0.1} max={5} step={0.1}
                                value={this.state.params.gamma}
                                onChange={(v) => this.updateParam("gamma", parseFloat(v))}
                                disabled={this.state.isCompleted}
                            />
                        )}
                    </div>

                    <button
                        className="spacex-execute-btn-clean anim-fade-in-4"
                        onClick={this.handleApplyFilter}
                        disabled={this.state.isCompleted || this.state.isProcessing}
                        style={this.state.isCompleted ? { background: "#4ade80", color: "#000", fontWeight: "bold" } : {}}
                    >
                        {this.state.isCompleted ? t.appliedSuccessfully : t.applyFilterFinal}
                    </button>
                </div>

                {fullscreenPortal}
            </>
        );
    }
}

/* ---------- Reusable slider control (used inside both card and sidebar) ---------- */
const SliderControl = ({ label, min, max, step, value, onChange, disabled }) => (
    <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <label style={{ fontSize: "0.7rem", letterSpacing: 1, color: "#888" }}>{label}</label>
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#ddd" }}>{typeof value === "number" ? value.toFixed(step < 1 ? 1 : 0) : value}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            style={{
                width: "100%", height: 4, background: "#2a2a3a", borderRadius: 2,
                outline: "none", WebkitAppearance: "none", appearance: "none",
                accentColor: "#90caf9",
            }}
        />
    </div>
);

const zoomBtnStyle = {
    background: "rgba(26,26,36,0.9)", border: "1px solid #3a3a4a", color: "#ccc",
    padding: "4px 10px", borderRadius: 4, fontSize: "1rem", cursor: "pointer",
    fontWeight: 600, minWidth: 36, display: "flex", alignItems: "center", justifyContent: "center",
};

export default ActionPromptCard;