import React from "react";
import MuiButton from "@mui/material/Button";

// Reusable Button component for your project
// Props: label (string), onClick (function), variant, color, size, className, ...rest
export interface ButtonProps {
  label: string;
  onClick?: () => void;
  variant?: "contained" | "outlined" | "text";
  color?: "primary" | "secondary" | "inherit" | "success" | "error" | "info" | "warning";
  size?: "small" | "medium" | "large";
  className?: string;
  [key: string]: any;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = "contained",
  color = "primary",
  size = "medium",
  className = "",
  ...rest
}) => (
  <MuiButton
    variant={variant}
    color={color}
    size={size}
    onClick={onClick}
    className={className}
    {...rest}
  >
    {label}
  </MuiButton>
);