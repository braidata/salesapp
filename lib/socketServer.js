// // socketServer.js
// import { Server } from 'socket.io';

// export default function SocketHandler(req, res) {
//   if (res.socket.server.io) {
    
//     console.log('Socket is already running');
//   } else {
//     console.log('Socket is initializing');
//     const io = new Server(res.socket.server);
//     res.socket.server.io = io;

//     io.on('connection', (socket) => {
//       console.log('A user connected');
  
//       socket.on('disconnect', () => {
//         console.log('A user disconnected');
//       });
  
//       socket.on('ping', () => {
//         console.log('Received ping from client');
//       });
  
//       socket.on('sendNotification', (notification) => {
//         io.emit('newNotification', notification);
//       });
//     });
  
//     res.end();
//   }}
