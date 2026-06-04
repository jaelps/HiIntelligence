import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { store } from '../store';
import { addNotification } from '../store/notificationSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class SignalRService {
  private connection: HubConnection | null = null;
  private listeners: Array<(data: any) => void> = [];

  public startConnection(): void {
    if (this.connection && this.connection.state !== HubConnectionState.Disconnected) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    this.connection = new HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/analytics`, {
        accessTokenFactory: () => token,
      })
      .configureLogging(LogLevel.Warning)
      .withAutomaticReconnect()
      .build();

    // Event listener: Real-time transactional ticks
    this.connection.on('ReceiveLiveUpdates', (data) => {
      this.listeners.forEach((listener) => listener(data));
    });

    // Event listener: Instant Notifications / Alert Toasts
    this.connection.on('ReceiveNotification', (notification) => {
      // Dispatches directly to Redux store so that user sees a notification popup immediately
      store.dispatch(addNotification({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        severity: notification.severity,
        storeId: notification.storeId,
        recommendedAction: notification.recommendedAction,
        timestamp: notification.timestamp,
      }));
    });

    this.connection.start()
      .then(() => {
        console.log('SignalR connection established successfully.');
      })
      .catch((err) => {
        console.error('SignalR connection failed to start: ', err);
      });
  }

  public stopConnection(): void {
    if (this.connection) {
      this.connection.stop()
        .then(() => {
          this.connection = null;
          console.log('SignalR connection stopped.');
        });
    }
  }

  public subscribeToUpdates(callback: (data: any) => void): () => void {
    this.listeners.push(callback);
    // Return unsubscribe callback
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }
}

export const signalRService = new SignalRService();
export default signalRService;
