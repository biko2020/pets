class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;
  private messageHandlers: Map<string, Set<(data: any) => void>> = new Map();
  private connectionHandlers: Set<(connected: boolean) => void> = new Set();

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public connect(token: string): void {
    const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:5000'}/ws?token=${token}`;
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.notifyConnectionChange(true);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.notifyConnectionChange(false);
      this.attemptReconnect(token);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }

  private attemptReconnect(token: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const timeout = this.reconnectTimeout * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${timeout}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(token);
      }, timeout);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  public onMessage(type: string, handler: (data: any) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    
    this.messageHandlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(type);
        }
      }
    };
  }

  public onConnectionChange(handler: (connected: boolean) => void): () => void {
    this.connectionHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  private notifyConnectionChange(connected: boolean): void {
    this.connectionHandlers.forEach(handler => handler(connected));
  }

  private handleMessage(data: any): void {
    if (data.type) {
      const handlers = this.messageHandlers.get(data.type);
      if (handlers) {
        handlers.forEach(handler => handler(data));
      }
    }
  }

  // Typing indicator methods
  public sendTyping(recipientId: string, isTyping: boolean): void {
    this.send({
      type: 'typing',
      recipientId,
      isTyping
    });
  }

  // Message read status methods
  public markMessagesAsRead(senderId: string): void {
    this.send({
      type: 'read_messages',
      senderId
    });
  }
}

export default WebSocketService;
