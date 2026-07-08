import WindowInstance from './WindowInstance';

export default function WindowContainer({ windows, focusedWindowId, bringToFront, closeWindow, updateWindowPosition, updateWindowBounds, applySnapTarget, showSnapPreview, clearSnapPreview, minimizeWindow, maximizeWindow, openWindow, backgroundSelection, updateBackgroundSelection, themeMode, updateThemeMode, dockSettings, updateDockSettings, requestedSettingsPane, notesCommand }) {
  return (
    <>
      {windows
        .filter(w => !w.minimized)
        .map(w => (
          <WindowInstance
            key={w.id}
            windowData={w}
            isFocused={w.id === focusedWindowId}
            bringToFront={() => bringToFront(w.id)}
            closeWindow={() => closeWindow(w.id)}
            updatePosition={(x, y) => updateWindowPosition(w.id, x, y)}
            updateBounds={(bounds, direction) => updateWindowBounds(w.id, bounds, direction)}
            applySnapTarget={(target) => applySnapTarget(w.id, target)}
            showSnapPreview={(target) => showSnapPreview(w.id, target)}
            clearSnapPreview={clearSnapPreview}
            minimizeWindow={() => minimizeWindow(w.id)}
            maximizeWindow={() => maximizeWindow(w.id)}
            openWindow={openWindow}
            backgroundSelection={backgroundSelection}
            updateBackgroundSelection={updateBackgroundSelection}
            themeMode={themeMode}
            updateThemeMode={updateThemeMode}
            dockSettings={dockSettings}
            updateDockSettings={updateDockSettings}
            requestedSettingsPane={requestedSettingsPane}
            notesCommand={notesCommand}
          />
        ))}
    </>
  );
}