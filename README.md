# Socket Client

一个 **功能完善、类型安全** 的 WebSocket 通信客户端库，用于 **浏览器端 WebSocket 连接**。

本库提供了自动重连、心跳机制、namespace 隔离等特性，让 WebSocket 通信更加简单可靠。

---

## ✨ 特性

* 🔌 **开箱即用** - 简单的 API，快速集成
* 🔄 **自动重连** - 内置智能重连机制，支持最大重连次数限制
* 💓 **心跳保活** - 自动心跳检测，保持连接活跃
* 🎯 **Namespace 隔离** - 命名空间隔离，避免不同业务消息冲突
* 🛡️ **类型安全** - 完整的 TypeScript 类型支持
* 📦 **事件订阅** - 基于事件类型的订阅机制
* ⚡ **轻量无依赖** - 仅依赖原生 WebSocket API

---

## 安装

```bash
pnpm install @giszhc/socket-client
# 或
npm install @giszhc/socket-client
yarn add @giszhc/socket-client
```

---

## 🚀 快速开始

### 基本使用

```ts
import { SocketClient } from '@giszhc/socket-client';

const client = new SocketClient({
  url: 'ws://localhost:8080',        // WebSocket 地址
  namespace: 'my-app:chat:v1',       // 命名空间（必填）
  
  // 可选配置
  reconnect: true,                   // 是否自动重连，默认 true
  maxReconnectAttempts: 5,           // 最大重连次数，默认 5
  reconnectInterval: 2000,           // 重连间隔（ms），默认 2000
  heartbeatInterval: 10000,          // 心跳间隔（ms），默认 10000
  
  // 回调函数
  onConnect: () => {
    console.log('✅ 已连接');
    // 连接成功后发送消息
    client.sendMessage('JOIN', { roomId: 123 });
  },
  onDisconnect: () => {
    console.log('❌ 已断开连接');
  },
  onError: (error) => {
    console.error('错误:', error);
  }
});

// 监听消息
client.on('MESSAGE', (data) => {
  console.log('收到消息:', data);
});

// 发送消息
client.sendMessage('CHAT', { text: 'Hello' });
```

---

## 📦 消息结构

所有消息会被统一封装为：

```ts
{
  __socket_client__: true,
  namespace: string,
  type: string,
  payload?: any
}
```

- `__socket_client__`: 内部标识，用于验证消息来源
- `namespace`: 命名空间，用于消息隔离
- `type`: 消息类型
- `payload`: 消息内容

---

## API

### 配置项

```ts
interface SocketClientConfig {
  /** WebSocket 地址 */
  url: string;

  /** 命名空间（必填） */
  namespace: string;

  /** 是否自动重连，默认 true */
  reconnect?: boolean;

  /** 最大重连次数，默认 5 */
  maxReconnectAttempts?: number;

  /** 重连间隔（ms），默认 2000 */
  reconnectInterval?: number;

  /** 心跳间隔（ms），默认 10000 */
  heartbeatInterval?: number;

  /** 连接成功回调 */
  onConnect?: () => void;

  /** 断开连接回调 */
  onDisconnect?: () => void;

  /** 错误回调 */
  onError?: (error: Event) => void;
}
```

---

### sendMessage(type, payload)

发送消息到服务器。

```ts
client.sendMessage('EVENT_TYPE', { data: 'value' });
```

**参数：**
- `type`: 消息类型（字符串）
- `payload`: 消息内容（任意类型）

**注意：** 请在 `onConnect` 回调后发送消息，确保连接已建立。

---

### on(type, handler)

监听指定类型的事件。

```ts
client.on('MESSAGE', (data, rawEvent) => {
  console.log('收到消息:', data);
});
```

**参数：**
- `type`: 事件类型（字符串）
- `handler`: 处理函数，接收 `payload` 和原始 `MessageEvent`

---

### off(type, handler)

取消监听指定事件。

```ts
const handler = (data) => {
  console.log(data);
};

// 添加监听
client.on('MESSAGE', handler);

// 移除监听
client.off('MESSAGE', handler);
```

---

### isConnected()

检查当前是否已连接。

```ts
if (client.isConnected()) {
  console.log('已连接');
} else {
  console.log('未连接');
}
```

---

### disconnect()

手动断开连接（禁用自动重连）。

```ts
client.disconnect();
```

---

### destroy()

销毁客户端实例，清理所有定时器和监听器。

```ts
client.destroy();
```

**注意：** 调用后实例不可再用，需要重新创建。

---

## 💡 使用示例

### 聊天室场景

```ts
import { SocketClient } from '@giszhc/socket-client';

const chatClient = new SocketClient({
  url: 'ws://localhost:8080/chat',
  namespace: 'chat-room:v1',
  
  onConnect: () => {
    console.log('加入聊天室');
    chatClient.sendMessage('JOIN_ROOM', { roomId: 'room-123' });
  }
});

// 监听新消息
chatClient.on('NEW_MESSAGE', (message) => {
  console.log(`${message.from}: ${message.content}`);
});

// 发送消息
function sendMessage(content: string) {
  chatClient.sendMessage('SEND_MESSAGE', { content });
}

// 监听用户加入
chatClient.on('USER_JOINED', (user) => {
  console.log(`${user.name} 加入了房间`);
});

// 监听用户离开
chatClient.on('USER_LEFT', (user) => {
  console.log(`${user.name} 离开了房间`);
});
```

---

### 多命名空间隔离

```ts
// 聊天服务
const chatClient = new SocketClient({
  url: 'ws://localhost:8080',
  namespace: 'app:chat:v1'
});

// 通知服务
const notifyClient = new SocketClient({
  url: 'ws://localhost:8080',
  namespace: 'app:notification:v1'
});

// 两个客户端独立工作，互不干扰
chatClient.on('MESSAGE', handleChat);
notifyClient.on('NOTIFICATION', handleNotify);
```

---

## ⚠️ 注意事项

### 1️⃣ 必须使用 namespace

```ts
// ❌ 错误 - 没有隔离
namespace: 'a'
namespace: 'b'

// ✅ 正确 - 使用分层命名
namespace: 'my-app:chat:v1'
namespace: 'my-app:notification:v1'
```

---

### 2️⃣ 不要在连接前发送消息

```ts
// ❌ 错误
const client = new SocketClient({ ... });
client.sendMessage('INIT'); // 可能失败

// ✅ 正确
const client = new SocketClient({
  ...
  onConnect: () => {
    client.sendMessage('INIT');
  }
});
```

---

### 3️⃣ 及时清理资源

```ts
// 组件卸载时
useEffect(() => {
  const client = new SocketClient({ ... });
  
  return () => {
    client.destroy(); // 清理定时器和连接
  };
}, []);
```

---

### 4️⃣ 生产环境配置

```ts
// ❌ 不建议 - 使用 ws://
url: 'ws://example.com'

// ✅ 推荐 - 使用 wss://
url: 'wss://your-domain.com/socket'
```

---

## 🔧 高级配置

### 自定义重连策略

```ts
const client = new SocketClient({
  url: 'wss://example.com',
  namespace: 'my-app:v1',
  
  // 禁用自动重连
  reconnect: false
});

// 手动控制重连
client.onDisconnect = () => {
  // 自定义重连逻辑
  setTimeout(() => {
    client.connect();
  }, 5000);
};
```

---

### 调整心跳间隔

```ts
const client = new SocketClient({
  url: 'wss://example.com',
  namespace: 'my-app:v1',
  
  // 30 秒发送一次心跳
  heartbeatInterval: 30000
});
```

---

## 🔐 安全建议

1. **使用 WSS 协议** - 生产环境务必使用加密连接
2. **验证 Namespace** - 确保命名空间唯一性，避免消息泄露
3. **Payload 校验** - 对接收到的数据进行验证
4. **错误处理** - 实现完善的错误处理逻辑

---

## ❌ 常见问题

### Q: onConnect 什么时候触发？

A: 在 WebSocket 连接成功后触发（`onopen` 事件）。

---

### Q: 如何处理重连？

A: 默认启用自动重连，可通过配置调整：

```ts
const client = new SocketClient({
  reconnect: true,
  maxReconnectAttempts: 5,
  reconnectInterval: 2000
});
```

---

### Q: payload 支持什么类型？

A: 支持所有 **可 JSON 序列化的数据**：

* ✅ Object / Array
* ✅ String / Number / Boolean
* ✅ null / undefined
* ❌ Function / DOM 节点

---

### Q: 如何调试？

A: 打开浏览器控制台，库会输出以下日志：

```
[SocketClient] connected
[SocketClient] reconnecting...
[SocketClient] not connected
```

---

### Q: 可以不用这个库吗？

可以，使用原生 WebSocket：

```ts
const ws = new WebSocket('ws://localhost:8080');
ws.onopen = () => { ... };
ws.onmessage = (event) => { ... };
```

但你需要自己处理：

* 重连逻辑
* 心跳保活
* 消息管理
* 类型安全

---

## 📄 License

MIT

---

❤️ Made with ❤️ by @giszhc

---
