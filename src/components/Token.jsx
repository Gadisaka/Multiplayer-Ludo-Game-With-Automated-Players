import React, { useState, useEffect, useRef } from "react";
import "../../public/style.css";
import { ludoBoxCoordinates } from "../constants/constants";
import { paths } from "../logic/ludoPaths";
function Token({
  position,
  color,
  onClick,
  animate,
  samePosition,
  isMovable,
  isBackwardsAnimating,
}) {
  const [currentPosition, setCurrentPosition] = useState(position);
  const [lightPosition, setLightPosition] = useState(null); // Position key for the light
  const lightTimeoutRef = useRef(null);

  // Helper: get the path array for this token's color
  const getPathArray = () => paths[color] || [];

  // Update current position when position prop changes
  useEffect(() => {
    if (position && position !== currentPosition) {
      setCurrentPosition(position);
    }
  }, [position, currentPosition]);

  // When the token moves, animate the light along the path with a delay
  useEffect(() => {
    if (!position) return;
    const pathArr = getPathArray();
    const tokenIdx = pathArr.indexOf(position);
    if (tokenIdx === -1) {
      setLightPosition(null);
      return;
    }

    // If the light is already at the token, don't animate
    if (lightPosition === position) return;

    // For backwards movement, disable the light trail
    if (isBackwardsAnimating) {
      setLightPosition(null);
      return;
    } else {
      // Normal forward movement - light appears behind the token
      let startIdx = tokenIdx - 1;
      if (startIdx < 0) {
        setLightPosition(null);
        return;
      }
      setLightPosition(pathArr[startIdx]);

      // Animate the light to follow the token with a delay
      function animateLight(idx) {
        if (idx > tokenIdx) return;
        setLightPosition(pathArr[idx]);
        if (idx < tokenIdx) {
          lightTimeoutRef.current = setTimeout(
            () => animateLight(idx + 1),
            300
          );
        } else {
          // Remove the light after a short time at the final position
          lightTimeoutRef.current = setTimeout(
            () => setLightPosition(null),
            200
          );
        }
      }
      lightTimeoutRef.current = setTimeout(
        () => animateLight(startIdx + 1),
        300
      );
    }

    return () => {
      if (lightTimeoutRef.current) clearTimeout(lightTimeoutRef.current);
    };
    // eslint-disable-next-line
  }, [position, color, isBackwardsAnimating]);

  // Animate the token itself (existing logic)
  const animationFrameRef = useRef(null);
  useEffect(() => {
    const startAnimation = (path) => {
      const duration = 500; // Animation duration in milliseconds
      let startTime = null;
      const animateStep = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / duration;
        if (progress < 1) {
          const x = currentPosition.x + (path.x - currentPosition.x) * progress;
          const y = currentPosition.y + (path.y - currentPosition.y) * progress;
          setCurrentPosition({ x, y });
          animationFrameRef.current = requestAnimationFrame(animateStep);
        } else {
          setCurrentPosition(path);
        }
      };
      animationFrameRef.current = requestAnimationFrame(animateStep);
    };
    if (animate) {
      startAnimation(animate);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate, currentPosition]);

  // Get coordinates for the token's current position
  const top = parseFloat(ludoBoxCoordinates[position]?.y || "0%");
  const left = parseFloat(ludoBoxCoordinates[position]?.x || "0%");
  const addedPosition = samePosition ? 2.3 : 0; // Convert 8px to percentage (8/350 ≈ 2.3%)

  // Light style
  const lightStyle = () => {
    if (!lightPosition) return { display: "none" };
    const coord = ludoBoxCoordinates[lightPosition] || { x: "0%", y: "0%" };
    const coordX = parseFloat(coord.x);
    const coordY = parseFloat(coord.y);
    return {
      position: "absolute",
      left: `${coordX + 1.4}%`, // Convert 5px to percentage (5/350 ≈ 1.4%)
      top: `${coordY + 1.4}%`, // Convert 5px to percentage (5/350 ≈ 1.4%)
      width: "2.9%", // Convert 10px to percentage (10/350 ≈ 2.9%)
      height: "2.9%", // Convert 10px to percentage (10/350 ≈ 2.9%)
      borderRadius: "50%",
      background:
        color === "red"
          ? "rgba(250,0,0)"
          : color === "green"
          ? "rgba(0,154,42)"
          : color === "blue"
          ? "rgba(0,172,255)"
          : "rgba(254,232,0)",
      filter: "blur(4px)",
      pointerEvents: "none",
      zIndex: 1,
      transition: "left 0.2s linear, top 0.2s linear, opacity 0.2s linear",
    };
  };

  // Enhanced token style with smooth transitions for bot movement
  const tokenStyle = {
    position: "absolute",
    left: `${left + 2.9 + addedPosition}%`, // Convert 10px to percentage (10/350 ≈ 2.9%)
    top: `${top + 2.9}%`, // Convert 10px to percentage (10/350 ≈ 2.9%)
    transition: "left 0.15s ease-out, top 0.15s ease-out", // Smooth transition for step-by-step movement
    zIndex: 2,
  };

  return (
    <>
      {/* Trailing light */}
      <div style={lightStyle()} />
      <div style={tokenStyle}>
        <div
          className={`fa-solid text-[25px] fa-location-pin piece ${color}-piece ${
            isMovable ? "token-movable" : ""
          }`}
          onClick={() => onClick(position)}
          style={{
            filter: isMovable
              ? "drop-shadow(0 0 6px rgba(240,193,75,0.85))"
              : "drop-shadow(0 2px 3px rgba(0,0,0,0.35))",
          }}
        ></div>
        <div className="w-5 h-5 rounded-full absolute left-1/2 top-[-7px] transform -translate-x-1/2">
          <div
            className={`w-full h-full rounded-full border-dashed ${
              isMovable
                ? "animate-spin border-2 border-[#f0c14b]"
                : "border-gray-800"
            }`}
          ></div>
          <div className="w-4 h-4 rounded-full border-3 border-[#061410] absolute left-1/2 top-[2px] transform -translate-x-1/2"></div>
        </div>
      </div>
    </>
  );
}

export default Token;
