import React, { Component } from "react";

class ActionPromptCard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedAlgorithm: "sobel",
            paramValue: 3,
        };
    }

    handleAlgorithmChange = (e) => {
        const algo = e.target.value;
        const defaultVal = algo === "highboost" ? 1.5 : 3;
        this.setState({ selectedAlgorithm: algo, paramValue: defaultVal });
    };

    render() {
        const { selectedAlgorithm, paramValue } = this.state;
        const { onExecute } = this.props;
        const isHighboost = selectedAlgorithm === "highboost";

        return (
            <div className="spacex-action-card-clean full-width-layout">
                {/* Telemetry Status Line */}
                <div className="card-header-telemetry-clean anim-fade-in-1">
                    <span className="status-dot-clean pulsing-clean" />
                    <span className="telemetry-title-clean">SYS // ENGINE_ROTATION_READY</span>
                </div>

                <div className="card-body-container-clean">
                    {/* Transform Operator Dropdown */}
                    <div className="spacex-input-field-clean input-surface-clean anim-fade-in-2">
                        <label className="field-label-clean">TRANSFORM_OPERATOR</label>
                        <div className="select-wrapper-clean">
                            <select 
                                value={selectedAlgorithm} 
                                onChange={this.handleAlgorithmChange}
                                className="spacex-dropdown-clean"
                            >
                                <option value="sobel">Sobel Operator</option>
                                <option value="prewitt">Prewitt Edge</option>
                                <option value="roberts">Roberts Cross</option>
                                <option value="laplacian">Laplacian Edge</option>
                                <option value="laplacian_sharpen">Laplacian Sharpen</option>
                                <option value="highboost">Highboost Filter</option>
                                <option value="median">Median Filter</option>
                                <option value="weighted_average">Gaussian Smooth</option>
                            </select>
                        </div>
                    </div>

                    {/* Parameter Slider */}
                    <div className="spacex-input-field-clean input-surface-clean anim-fade-in-3">
                        <div className="label-metrics-row-clean">
                            <label className="field-label-clean">
                                {isHighboost ? "BOOST_FACTOR_A" : "KERNEL_WINDOW_SIZE"}
                            </label>
                            <span className="metric-value-clean">{paramValue}</span>
                        </div>
                        <input 
                            type="range"
                            min={isHighboost ? "1" : "3"}
                            max={isHighboost ? "5" : "9"}
                            step={isHighboost ? "0.1" : "2"}
                            value={paramValue}
                            onChange={(e) => this.setState({ paramValue: parseFloat(e.target.value) })}
                            className="spacex-slider-clean"
                        />
                    </div>
                </div>

                {/* Initialization Button */}
                <button 
                    className="spacex-execute-btn-clean anim-fade-in-4" 
                    onClick={() => onExecute(selectedAlgorithm, paramValue)}
                >
                    INITIALIZE SEQUENCE
                </button>
            </div>
        );
    }
}

export default ActionPromptCard;