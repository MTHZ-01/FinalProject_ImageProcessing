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
        window.electronAPI?.isMaximized?.().then((value) => {
            if (typeof value === 'boolean') {
                setIsMaximized(value);
            }
        });

        return () => {
            window.electronAPI?.removeMaximizedListener?.(handleMaximized);
            window.electronAPI?.removeUnmaximizedListener?.(handleUnmaximized);
        };
    }, []);

    const minimize = () => window.electronAPI?.minimize();
    const maximize = () => window.electronAPI?.maximize();
    const close = () => window.electronAPI?.close();

    return (
        <Box className="custom-title-bar" data-drag-region>
            {/* Left side: Icon + Title */}
            <Box className="title-section" data-drag-region>
                <Box className="app-icon" />
                <Typography className="title-text">Image Processor</Typography>
            </Box>

            {/* Right side: Window Controls */}
            <Box className="window-controls" data-no-drag>
                {/* Minimize */}
                <IconButton
                    onClick={minimize}
                    className="control-btn minimize-btn"
                    aria-label="Minimize"
                    data-no-drag
                >
                    <MinimizeIcon />
                </IconButton>

                {/* Maximize / Restore */}
                <IconButton
                    onClick={maximize}
                    className="control-btn maximize-btn"
                    aria-label={isMaximized ? "Restore Down" : "Maximize"}
                    data-no-drag
                >
                    {isMaximized ? <FilterNoneIcon /> : <CropSquareIcon />}
                </IconButton>

                {/* Close */}
                <IconButton
                    onClick={close}
                    className="control-btn close-btn"
                    aria-label="Close"
                    data-no-drag
                >
                    <CloseIcon />
                </IconButton>
            </Box>
        </Box>
    );
};

export default CustomTitleBar;