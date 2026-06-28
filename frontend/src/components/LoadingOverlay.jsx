import React from "react";
import {
  Backdrop,
  Box,
  Typography,
  CircularProgress,
  Fade
} from "@mui/material";

export default function LoadingOverlay({ open }) {
  return (
    <Backdrop
      open={open}
      sx={{
        zIndex: 9999,
        backgroundColor: "rgba(10, 15, 25, 0.82)",
        backdropFilter: "blur(8px)",
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            width: 340,
            p: 5,
            borderRadius: 4,
            textAlign: "center",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            boxShadow:
              "0 0 30px rgba(0,255,200,0.12), 0 0 80px rgba(0,255,200,0.04)",
          }}
        >
          {/* Spinner wrapper */}
          <Box
            sx={{
              position: "relative",
              display: "inline-flex",
              mb: 3,

              "@keyframes pulse": {
                "0%": {
                  boxShadow: "0 0 0 0 rgba(0,255,200,0.4)",
                },
                "70%": {
                  boxShadow: "0 0 0 20px rgba(0,255,200,0)",
                },
                "100%": {
                  boxShadow: "0 0 0 0 rgba(0,255,200,0)",
                },
              },

              animation: "pulse 2s infinite",
              borderRadius: "50%",
            }}
          >
            <CircularProgress
              size={82}
              thickness={4}
              sx={{
                color: "#00ffc8",
              }}
            />
          </Box>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              letterSpacing: "0.12em",
              color: "#ffffff",
            }}
          >
            PROCESSING IMAGE
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mt: 1.5,
              color: "rgba(255,255,255,0.55)",
              fontSize: "0.9rem",
            }}
          >
            Running enhancement pipeline...
          </Typography>
        </Box>
      </Fade>
    </Backdrop>
  );
}