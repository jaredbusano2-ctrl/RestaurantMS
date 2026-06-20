import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';

export const useSignalR = (hubUrl, eventHandlers = {}) => {
  const connectionRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping SignalR connection');
      return;
    }

    // Make sure hubUrl starts with / if not already
    const normalizedHubUrl = hubUrl.startsWith('/') ? hubUrl : `/${hubUrl}`;
    
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`http://localhost:5000${normalizedHubUrl}`, {
        accessTokenFactory: () => localStorage.getItem('token'),
        transport: signalR.HttpTransportType.WebSocket | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Register event handlers
    Object.entries(eventHandlers).forEach(([eventName, handler]) => {
      connection.on(eventName, handler);
    });

    // Start connection
    connection.start()
      .then(() => {
        console.log('✅ SignalR connected successfully!');
        setIsConnected(true);
      })
      .catch(err => {
        console.error('❌ SignalR connection error:', err);
        setIsConnected(false);
      });

    // Reconnection handlers
    connection.onreconnecting((error) => {
      console.log('SignalR reconnecting...', error);
      setIsConnected(false);
    });

    connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected with ID:', connectionId);
      setIsConnected(true);
    });

    connection.onclose((error) => {
      console.log('SignalR connection closed:', error);
      setIsConnected(false);
    });

    connectionRef.current = connection;

    // Cleanup
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, [hubUrl]); // Add eventHandlers as dependency if they change

  return { connection: connectionRef.current, isConnected };
};