import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';

export const useSignalR = (hubUrl, eventHandlers = {}) => {
  const connectionRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`http://localhost:5000${hubUrl}?access_token=${token}`)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    Object.entries(eventHandlers).forEach(([eventName, handler]) => {
      connection.on(eventName, handler);
    });

    connection.start()
      .then(() => setIsConnected(true))
      .catch(err => console.error('SignalR connection error:', err));

    connection.onreconnected(() => setIsConnected(true));
    connection.onclose(() => setIsConnected(false));

    connectionRef.current = connection;

    return () => {
      connection.stop();
    };
  }, [hubUrl]);

  return { connection: connectionRef.current, isConnected };
};