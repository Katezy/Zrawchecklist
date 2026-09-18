interface Window {
  electronAPI?: {
    newProject: (
      callback: () => void
    ) => () => void

    undo: (
      callback: () => void
    ) => () => void

    redo: (
      callback: () => void
    ) => () => void
  }
}