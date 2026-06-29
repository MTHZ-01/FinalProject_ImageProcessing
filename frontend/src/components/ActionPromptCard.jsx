import React, { Component } from "react";

class ActionPromptCard extends Component {
    constructor(props) {
        super(props);

        this.state = {
            selectedAlgorithm: "sobel",
            params: {
                kernelSize: 3,
                sigma: 1.0,
                boostFactor: 1.5,
                laplacianMask: "4",
            },
            previewImage: null,
            isCompleted: false,
            isProcessing: false,
        };

        this.updateTimeout = null;
    }

    componentDidMount() {
        // Auto preview when card loads
        setTimeout(() => {
            this.debouncedExecute(this.state.selectedAlgorithm, this.state.params);
        }, 400);
    }

    debouncedExecute = (algorithm, params) => {
        if (this.updateTimeout) clearTimeout(this.updateTimeout);

        this.updateTimeout = setTimeout(() => {
            this.executeFilter(algorithm, params, true); // preview
        }, 180);
    };

    executeFilter = (algorithm, params, isPreview = true) => {
        if (this.state.isCompleted) return Promise.resolve();

        this.setState({ isProcessing: true });

        return this.props.onExecute(algorithm, params, isPreview)
            .then((resultImage) => {
                if (isPreview) {
                    this.setState({
                        previewImage: resultImage,
                        isProcessing: false,
                    });
                } else {
                    // Final Apply
                    this.setState({
                        isCompleted: true,
                        isProcessing: false,
                    });

                    // Notify parent to add to chat + set as main
                    if (this.props.onFinalApply) {
                        this.props.onFinalApply(resultImage);
                    }
                }
                return resultImage;
            })
            .catch((err) => {
                console.error(err);
                this.setState({ isProcessing: false });
                throw err;
            });
    };

    handleAlgorithmChange = (e) => {
        const selectedAlgorithm = e.target.value;
        this.setState({
            selectedAlgorithm,
            params: {
                kernelSize: 3,
                sigma: 1.0,
                boostFactor: 1.5,
                laplacianMask: "4",
            },
            previewImage: null,
        }, () => {
            this.debouncedExecute(selectedAlgorithm, this.state.params);
        });
    };

    updateParam = (key, value) => {
        this.setState((prevState) => ({
            params: { ...prevState.params, [key]: value },
            previewImage: null,
        }), () => {
            this.debouncedExecute(this.state.selectedAlgorithm, this.state.params);
        });
    };

    handleApplyFilter = () => {
        if (this.updateTimeout) clearTimeout(this.updateTimeout);
        this.executeFilter(this.state.selectedAlgorithm, this.state.params, false);
    };

    render() {
        const { selectedAlgorithm, params, previewImage, isCompleted, isProcessing } = this.state;

        const showKernel = ["average", "weighted_average", "gaussian", "median", "maximum", "minimum", "midpoint", "highboost"]
            .includes(selectedAlgorithm);
        const showSigma = selectedAlgorithm === "gaussian";
        const showBoost = selectedAlgorithm === "highboost";
        const showLaplacianMask = ["laplacian", "laplacian_sharpen"].includes(selectedAlgorithm);

        return (
            <div className="spacex-action-card-clean full-width-layout">

                <div className="card-header-telemetry-clean anim-fade-in-1">
                    <span className="status-dot-clean pulsing-clean" />
                    <span className="telemetry-title-clean">LIVE SPATIAL FILTERING</span>
                </div>

                {/* Live Preview */}
                <div className="preview-container" style={{ margin: "12px 0", textAlign: "center", minHeight: "200px" }}>
                    {previewImage ? (
                        <img
                            src={previewImage}
                            alt="Live Preview"
                            style={{ maxWidth: "100%", borderRadius: "8px", border: "1px solid #444" }}
                        />
                    ) : (
                        <div style={{
                            height: "200px",
                            background: "#1e1e1e",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#666",
                            fontSize: "0.95rem"
                        }}>
                            {isProcessing ? "Processing preview..." : "Change parameters to see live preview"}
                        </div>
                    )}
                </div>

                <div className="card-body-container-clean">

                    <div className="spacex-input-field-clean input-surface-clean anim-fade-in-2">
                        <label className="field-label-clean">ALGORITHM</label>
                        <div className="select-wrapper-clean">
                            <select
                                value={selectedAlgorithm}
                                onChange={this.handleAlgorithmChange}
                                className="spacex-dropdown-clean"
                                disabled={isCompleted}
                            >
                                <optgroup label="Smoothing (Linear)">
                                    <option value="average">Average Filter</option>
                                    <option value="weighted_average">Weighted Average</option>
                                    <option value="gaussian">Gaussian Filter</option>
                                </optgroup>
                                <optgroup label="Order-Statistic Filters">
                                    <option value="median">Median Filter</option>
                                    <option value="maximum">Maximum Filter</option>
                                    <option value="minimum">Minimum Filter</option>
                                    <option value="midpoint">Midpoint Filter</option>
                                </optgroup>
                                <optgroup label="Edge Detection">
                                    <option value="sobel">Sobel</option>
                                    <option value="prewitt">Prewitt</option>
                                    <option value="roberts">Roberts Cross</option>
                                    <option value="laplacian">Laplacian</option>
                                </optgroup>
                                <optgroup label="Sharpening">
                                    <option value="laplacian_sharpen">Laplacian Sharpening</option>
                                    <option value="highboost">Highboost Filtering</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>

                    {showKernel && (
                        <div className="spacex-input-field-clean input-surface-clean anim-fade-in-3">
                            <div className="label-metrics-row-clean">
                                <label className="field-label-clean">KERNEL SIZE</label>
                                <span className="metric-value-clean">{params.kernelSize}</span>
                            </div>
                            <input
                                type="range"
                                min="3" max="11" step="2"
                                value={params.kernelSize}
                                onChange={(e) => this.updateParam("kernelSize", parseInt(e.target.value))}
                                className="spacex-slider-clean"
                                disabled={isCompleted}
                            />
                        </div>
                    )}

                    {showSigma && (
                        <div className="spacex-input-field-clean input-surface-clean anim-fade-in-3">
                            <div className="label-metrics-row-clean">
                                <label className="field-label-clean">SIGMA</label>
                                <span className="metric-value-clean">{params.sigma.toFixed(1)}</span>
                            </div>
                            <input
                                type="range"
                                min="0.5" max="5" step="0.1"
                                value={params.sigma}
                                onChange={(e) => this.updateParam("sigma", parseFloat(e.target.value))}
                                className="spacex-slider-clean"
                                disabled={isCompleted}
                            />
                        </div>
                    )}

                    {showBoost && (
                        <div className="spacex-input-field-clean input-surface-clean anim-fade-in-3">
                            <div className="label-metrics-row-clean">
                                <label className="field-label-clean">BOOST FACTOR (A)</label>
                                <span className="metric-value-clean">{params.boostFactor.toFixed(1)}</span>
                            </div>
                            <input
                                type="range"
                                min="1" max="5" step="0.1"
                                value={params.boostFactor}
                                onChange={(e) => this.updateParam("boostFactor", parseFloat(e.target.value))}
                                className="spacex-slider-clean"
                                disabled={isCompleted}
                            />
                        </div>
                    )}

                    {showLaplacianMask && (
                        <div className="spacex-input-field-clean input-surface-clean anim-fade-in-3">
                            <label className="field-label-clean">LAPLACIAN MASK</label>
                            <div className="select-wrapper-clean">
                                <select
                                    value={params.laplacianMask}
                                    onChange={(e) => this.updateParam("laplacianMask", e.target.value)}
                                    className="spacex-dropdown-clean"
                                    disabled={isCompleted}
                                >
                                    <option value="4">4-Neighbour</option>
                                    <option value="8">8-Neighbour</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    className="spacex-execute-btn-clean anim-fade-in-4"
                    onClick={this.handleApplyFilter}
                    disabled={isCompleted || isProcessing}
                    style={isCompleted ? { background: "#4ade80", color: "#000", fontWeight: "bold" } : {}}
                >
                    {isCompleted ? "✓ APPLIED SUCCESSFULLY" : "APPLY FILTER (Final)"}
                </button>
            </div>
        );
    }
}

export default ActionPromptCard;