export const isElectron = (): boolean => {
  return typeof window.electron === 'object' && typeof window.electron.ipcRenderer === 'object'
}
