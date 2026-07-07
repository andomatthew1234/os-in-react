import React from 'react';
import WindowInstance from './WindowInstance';

export default function WindowContainer({ windows, focusedWindowId, bringToFront, closeWindow, updateWindowPosition }) {
  return (
    <>
      {windows.map(w => (
        <WindowInstance
          key={w.id}
          windowData={w}
          isFocused={w.id === focusedWindowId}
          bringToFront={() => bringToFront(w.id)}
          closeWindow={() => closeWindow(w.id)}
          updatePosition={(x, y) => updateWindowPosition(w.id, x, y)}
        />
      ))}
    </>
  );
}