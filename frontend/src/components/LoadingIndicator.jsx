import React from "react";
import { motion } from "framer-motion";

const LoadingIndicator = () => {
  return (
    <div className="processing-container" style={{ textAlign: "center", padding: "30px 0" }}>
      <motion.div
        style={{
          width: "64px",
          height: "64px",
          margin: "0 auto 16px",
          border: "4px solid rgba(144, 202, 249, 0.2)",
          borderTop: "4px solid #90caf9",
          borderRadius: "50%",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
      />

      <motion.p
        style={{
          color: "#90caf9",
          fontSize: "0.95rem",
          fontWeight: 500,
          letterSpacing: "1px",
        }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        PROCESSING ON ENGINE
      </motion.p>
    </div>
  );
};

export default LoadingIndicator;