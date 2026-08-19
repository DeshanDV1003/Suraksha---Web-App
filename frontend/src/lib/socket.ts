import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  reconnectionAttempts: 5,
  timeout: 10000,
})

export const connectSocket = (token?: string) => {
  if (token) {
    socket.auth = { token }
  }
  socket.connect()
}

export const disconnectSocket = () => {
  socket.disconnect()
}
