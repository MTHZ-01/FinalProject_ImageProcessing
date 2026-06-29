import React, { useState, useEffect } from 'react';
import { IconButton, Box, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Remove';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import FilterNoneIcon from '@mui/icons-material/FilterNone';
import "../Css/CustomTitleBar.css";

const CustomTitleBar = () => {
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        const handleMaximized = () => setIsMaximized(true);
        const handleUnmaximized = () => setIsMaximized(false);

        window.electronAPI?.onMaximized?.(handleMaximized);
        window.electronAPI?.onUnmaximized?.(handleUnmaximized);

        // Initial state check
        window.electronAPI?.isMaximized?.().then(setIsMaximized);

        return () => {
            // Cleanup listeners if your API supports removal
        };
    }, []);

    const minimize = () => window.electronAPI?.minimize();
    const maximize = () => window.electronAPI?.maximize();
    const close = () => window.electronAPI?.close();

    return (
        <Box className="custom-title-bar">
            {/* Left side: Icon + Title */}
            <Box className="title-section">
                <Box className="app-icon" />
                <Typography className="title-text">Image Processor</Typography>
            </Box>

            {/* Right side: Window Controls */}
            <Box className="window-controls">
                {/* Minimize */}
                <IconButton
                    onClick={minimize}
                    className="control-btn minimize-btn"
                    aria-label="Minimize"
                >
                    <MinimizeIcon />
                </IconButton>

                {/* Maximize / Restore */}
                <IconButton
                    onClick={maximize}
                    className="control-btn maximize-btn"
                    aria-label={isMaximized ? "Restore Down" : "Maximize"}
                >
                    {isMaximized ? <FilterNoneIcon /> : <CropSquareIcon />}
                </IconButton>

                {/* Close */}
                <IconButton
                    onClick={close}
                    className="control-btn close-btn"
                    aria-label="Close"
                >
                    <CloseIcon />
                </IconButton>
            </Box>
        </Box>
    );
};

export default CustomTitleBar;