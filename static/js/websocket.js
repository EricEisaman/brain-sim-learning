/**
 * WebSocket client for real-time communication with backend
 */

class WebSocketClient {
    constructor(simulation) {
        this.simulation = simulation;
        this.ws = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;

        this.connect();
    }

    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        try {
            this.ws = new WebSocket(wsUrl);
            this.setupEventHandlers();
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            this.scheduleReconnect();
        }
    }

    setupEventHandlers() {
        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.connected = true;
            this.reconnectAttempts = 0;
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.connected = false;
            this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onmessage = (event) => {
            this.handleMessage(JSON.parse(event.data));
        };
    }

    handleMessage(message) {
        switch (message.type) {
            case 'state_update':
                // Handle state updates from server
                // For now, we run simulation client-side
                // This can be used for server-side simulation later
                if (message.data.tick !== undefined) {
                    // Sync tick count if needed
                }
                break;

            case 'command':
                // Handle commands from server
                this.simulation.handleCommand(message);
                break;

            default:
                console.log('Unknown message type:', message.type);
        }
    }

    /**
     * Send control command to server
     */
    sendControl(action) {
        this.send({
            type: 'control',
            action: action
        });
    }

    /**
     * Send stimulation command
     */
    sendStimulate(target, id) {
        this.send({
            type: 'stimulate',
            target: target,
            id: id
        });
    }

    /**
     * Send input data
     */
    sendInput(data) {
        this.send({
            type: 'input',
            data: data
        });
    }

    /**
     * Send speed update
     */
    sendSpeed(value) {
        this.send({
            type: 'set_speed',
            value: value
        });
    }

    /**
     * Generic send method
     */
    send(data) {
        if (this.connected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`);
            setTimeout(() => this.connect(), this.reconnectDelay);
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}
