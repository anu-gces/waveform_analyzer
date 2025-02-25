import React, { useRef, useState } from "react";
import { Stage, Layer, Rect } from "react-konva";

const RubberBand = () => {
  const stageRef = useRef(null);
  const [selection, setSelection] = useState(null);

  const mouseDown = (e) => {
    if (e.evt.button !== 0) return; // Left click only
    const stage = stageRef.current;
    const pos = stage.getPointerPosition();
    setSelection({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
  };

  const mouseMove = (e) => {
    if (!selection) return;
    const stage = stageRef.current;
    const pos = stage.getPointerPosition();
    setSelection((prev) => ({ ...prev, x2: pos.x, y2: pos.y }));
  };

  const mouseUp = () => {
    setSelection(null);
  };

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={mouseDown}
      onMouseMove={mouseMove}
      onMouseUp={mouseUp}
      ref={stageRef}
      style={{ backgroundColor: "#e5e5f7" }}
    >
      <Layer></Layer>
    </Stage>
  );
};

export default RubberBand;
