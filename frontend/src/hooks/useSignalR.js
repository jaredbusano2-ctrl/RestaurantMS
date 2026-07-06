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

    const baseUrl = 'http://localhost:5000';
    const normalizedHubUrl = hubUrl.startsWith('/') ? hubUrl : `/${hubUrl}`;
    const fullUrl = `${baseUrl}${normalizedHubUrl}`;
    
    console.log(`🟡 Connecting to SignalR hub: ${fullUrl}`);

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(fullUrl, {
        accessTokenFactory: () => localStorage.getItem('token') || '',
        transport: signalR.HttpTransportType.WebSocket | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // ✅ Register event handlers - match the hub event names
    const defaultHandlers = {
      'NewOrder': (order) => {
        console.log('📦 New order received:', order);
      },
      'OrderStatusUpdated': (data) => {
        console.log('🔄 Order status updated:', data);
      },
      'LowStockAlert': (items) => {
        console.log('⚠️ Low stock alert:', items);
      },
      'OrderReady': (orderId) => {
        console.log('🔔 Order ready:', orderId);
      },
      'Notification': (notification) => {
        console.log('📢 Notification:', notification);
      }
    };

    // Merge default handlers with provided handlers
    const allHandlers = { ...defaultHandlers, ...eventHandlers };

    // Register all event handlers
    Object.entries(allHandlers).forEach(([eventName, handler]) => {
      connection.on(eventName, handler);
      console.log(`🟡 Registered handler for event: ${eventName}`);
    });

    // Start connection
    const startConnection = async () => {
      try {
        await connection.start();
        console.log('✅ SignalR connected successfully!');
        setIsConnected(true);
      } catch (err) {
        console.error('❌ SignalR connection error:', err);
        setIsConnected(false);
        // Try to reconnect after 5 seconds
        setTimeout(startConnection, 5000);
      }
    };

    startConnection();

    // Reconnection handlers
    connection.onreconnecting((error) => {
      console.log('🔄 SignalR reconnecting...', error);
      setIsConnected(false);
    });

    connection.onreconnected((connectionId) => {
      console.log('✅ SignalR reconnected with ID:', connectionId);
      setIsConnected(true);
    });

    connection.onclose((error) => {
      console.log('❌ SignalR connection closed:', error);
      setIsConnected(false);
    });

    connectionRef.current = connection;

    // Cleanup
    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, [hubUrl]);

  return { connection: connectionRef.current, isConnected };
};