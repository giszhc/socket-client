/**
 * SocketClient - WebSocket 通信客户端
 *
 * 特性：
 * ✅ 自动重连
 * ✅ 心跳机制
 * ✅ namespace 隔离
 * ✅ 事件订阅机制
 * ✅ 类型安全
 */

export interface SocketMessage {
    __socket_client__: true;
    namespace: string;
    type: string;
    payload?: any;
}

export interface SocketClientConfig {
    /** WebSocket 地址 */
    url: string;

    /** 命名空间（必填） */
    namespace: string;

    /** 是否自动重连 */
    reconnect?: boolean;

    /** 最大重连次数 */
    maxReconnectAttempts?: number;

    /** 重连间隔（ms） */
    reconnectInterval?: number;

    /** 心跳间隔（ms） */
    heartbeatInterval?: number;

    /** 连接成功 */
    onConnect?: () => void;

    /** 断开连接 */
    onDisconnect?: () => void;

    /** 错误 */
    onError?: (error: Event) => void;
}

export type MessageHandler<T = any> = (payload: T, raw: MessageEvent) => void;

const INTERNAL_TYPE = {
    PING: '__PING__',
    PONG: '__PONG__'
};

export class SocketClient {
    private ws: WebSocket | null = null;
    private config: Required<SocketClientConfig>;
    private messageHandlers = new Map<string, MessageHandler[]>();

    private connected = false;
    private reconnectAttempts = 0;
    private heartbeatTimer?: number;
    private reconnectTimer?: number;

    constructor(config: SocketClientConfig) {
        if (!config.url) throw new Error('url is required');
        if (!config.namespace) throw new Error('namespace is required');

        this.config = {
            reconnect: true,
            maxReconnectAttempts: 5,
            reconnectInterval: 2000,
            heartbeatInterval: 10000,
            onConnect: () => {},
            onDisconnect: () => {},
            onError: () => {},
            ...config
        };

        this.connect();
    }

    /**
     * 建立连接
     */
    private connect() {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
            this.connected = true;
            this.reconnectAttempts = 0;

            this.startHeartbeat();
            this.config.onConnect();

            console.log('[SocketClient] connected');
        };

        this.ws.onmessage = (event) => {
            this.handleMessage(event);
        };

        this.ws.onclose = () => {
            this.connected = false;
            this.stopHeartbeat();

            this.config.onDisconnect();

            if (this.config.reconnect) {
                this.tryReconnect();
            }
        };

        this.ws.onerror = (err) => {
            this.config.onError(err);
        };
    }

    /**
     * 重连机制
     */
    private tryReconnect() {
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            console.warn('[SocketClient] max reconnect reached');
            return;
        }

        this.reconnectAttempts++;

        this.reconnectTimer = window.setTimeout(() => {
            console.log('[SocketClient] reconnecting...');
            this.connect();
        }, this.config.reconnectInterval);
    }

    /**
     * 心跳
     */
    private startHeartbeat() {
        this.heartbeatTimer = window.setInterval(() => {
            this.sendRaw(INTERNAL_TYPE.PING);
        }, this.config.heartbeatInterval);
    }

    private stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }
    }

    /**
     * 构造消息
     */
    private createMessage(type: string, payload?: any): SocketMessage {
        return {
            __socket_client__: true,
            namespace: this.config.namespace,
            type,
            payload
        };
    }

    /**
     * 处理消息
     */
    private handleMessage(event: MessageEvent) {
        let data: SocketMessage;

        try {
            data = JSON.parse(event.data);
        } catch {
            return;
        }

        // 校验
        if (!data.__socket_client__) return;
        if (data.namespace !== this.config.namespace) return;

        // 心跳
        if (data.type === INTERNAL_TYPE.PING) {
            this.sendRaw(INTERNAL_TYPE.PONG);
            return;
        }

        if (data.type === INTERNAL_TYPE.PONG) {
            return;
        }

        // 业务消息
        const handlers = this.messageHandlers.get(data.type);
        handlers?.forEach(h => h(data.payload, event));
    }

    /**
     * 发送消息
     */
    public sendMessage(type: string, payload?: any) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('[SocketClient] not connected');
            return;
        }

        const msg = this.createMessage(type, payload);
        this.ws.send(JSON.stringify(msg));
    }

    /**
     * 发送内部消息
     */
    private sendRaw(type: string) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        this.ws.send(JSON.stringify(this.createMessage(type)));
    }

    /**
     * 监听
     */
    public on<T = any>(type: string, handler: MessageHandler<T>) {
        const list = this.messageHandlers.get(type) || [];
        list.push(handler);
        this.messageHandlers.set(type, list);
    }

    /**
     * 取消监听
     */
    public off(type: string, handler: MessageHandler) {
        const list = this.messageHandlers.get(type);
        if (!list) return;

        this.messageHandlers.set(
            type,
            list.filter(h => h !== handler)
        );
    }

    /**
     * 是否连接
     */
    public isConnected() {
        return this.connected;
    }

    /**
     * 手动关闭
     */
    public disconnect() {
        this.config.reconnect = false;
        this.ws?.close();
    }

    /**
     * 销毁
     */
    public destroy() {
        this.stopHeartbeat();

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        this.ws?.close();
        this.ws = null;
        this.messageHandlers.clear();
        this.connected = false;
    }
}