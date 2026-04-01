# Socket Client Examples

本目录包含 Socket Client 的完整使用示例，展示 WebSocket 通信功能。

## 📁 文件说明

### 1. `server.js` - WebSocket 服务器
一个简单的 Node.js WebSocket 服务器，用于测试 Socket Client。

**功能：**
- ✅ 监听端口 8080
- ✅ 支持多个客户端连接
- ✅ 自动回复 PING（心跳）
- ✅ 消息广播
- ✅ 用户加入/离开通知

**启动方式：**
```bash
# 安装依赖
npm install ws

# 运行服务器
node example/server.js
```

---

### 2. `parent.html` - WebSocket 客户端示例
一个完整的聊天界面，演示如何使用 SocketClient 连接到 WebSocket 服务器。

**功能：**
- ✅ 连接/断开服务器
- ✅ 发送和接收消息
- ✅ 显示连接状态
- ✅ 心跳检测
- ✅ 加入房间

**使用步骤：**

1. **启动 WebSocket 服务器**
   ```bash
   node example/server.js
   ```

2. **在浏览器中打开 parent.html**
   ```bash
   # 可以使用任意 HTTP 服务器，例如：
   npx serve .
   
   # 然后在浏览器访问：
   http://localhost:3000/example/parent.html
   ```

3. **点击"连接服务器"按钮**
   - 状态栏显示"已连接"表示成功
   - 可以开始发送消息

---

### 3. `child.html` - 服务器端界面（可选）
用于演示服务器端的视角，显示当前连接的客户端。

**注意：** 
- 由于浏览器安全限制，纯前端无法创建真正的 WebSocket 服务器
- 此页面仅作为 UI 演示
- 实际服务器请使用 `server.js`

---

## 🚀 快速开始

### 步骤 1: 安装依赖

```bash
# 安装 WebSocket 库（用于服务器）
npm install ws
```

### 步骤 2: 启动服务器

```bash
node example/server.js
```

你会看到：
```
🚀 WebSocket server started on ws://localhost:8080
📌 Namespace: chat-demo:v1
⏹️  Press Ctrl+C to stop
```

### 步骤 3: 打开客户端

使用任意 HTTP 服务器运行项目：

```bash
# 方法 1: 使用 serve
npx serve .

# 方法 2: 使用 http-server
npx http-server .

# 方法 3: 使用 Vite
npx vite
```

然后在浏览器访问：
```
http://localhost:3000/example/parent.html
```

### 步骤 4: 测试功能

1. **连接服务器** - 点击"🔌 连接服务器"按钮
2. **发送消息** - 在输入框输入消息并发送
3. **加入房间** - 点击"🏠 加入房间"按钮
4. **心跳检测** - 点击"📡 Ping"按钮
5. **广播消息** - 在服务器控制台可以看到所有消息

---

## 💡 代码示例

### 基本使用

```javascript
import { SocketClient } from '../src/index.ts';

const client = new SocketClient({
  url: 'ws://localhost:8080',
  namespace: 'chat-demo:v1',
  
  onConnect: () => {
    console.log('✅ 已连接');
    client.sendMessage('JOIN_ROOM', { roomId: 'room-1' });
  },
  
  onDisconnect: () => {
    console.log('❌ 已断开');
  }
});

// 监听消息
client.on('WELCOME', (data) => {
  console.log('欢迎:', data.message);
});

client.on('CHAT_MESSAGE', (data) => {
  console.log('收到消息:', data.text);
});
```

---

## 🎯 测试场景

### 场景 1: 单客户端通信

1. 启动服务器
2. 打开一个浏览器窗口
3. 连接服务器
4. 发送消息
5. 观察服务器日志

### 场景 2: 多客户端通信

1. 启动服务器
2. 打开多个浏览器窗口
3. 每个窗口都连接服务器
4. 在一个窗口发送消息
5. 观察其他窗口是否收到

### 场景 3: 重连测试

1. 启动服务器
2. 连接客户端
3. 停止服务器（Ctrl+C）
4. 观察客户端自动重连
5. 重新启动服务器
6. 客户端应该自动重新连接

---

## 📊 消息类型

### 客户端 → 服务器

| 类型 | 说明 | Payload |
|------|------|---------|
| `__PING__` | 心跳请求 | 无 |
| `JOIN_ROOM` | 加入房间 | `{ roomId, username }` |
| `CHAT_MESSAGE` | 聊天消息 | `{ text }` |

### 服务器 → 客户端

| 类型 | 说明 | Payload |
|------|------|---------|
| `WELCOME` | 欢迎消息 | `{ message, clientId }` |
| `__PONG__` | 心跳响应 | 无 |
| `USER_JOINED` | 用户加入 | `{ username, timestamp }` |
| `USER_LEFT` | 用户离开 | `{ username, timestamp }` |
| `CHAT_MESSAGE` | 聊天消息 | `{ text, from, timestamp }` |
| `ROOM_JOINED` | 房间加入确认 | `{ roomId, joinedAt }` |

---

## ⚠️ 注意事项

### 1. 命名空间一致性

确保客户端和服务器使用相同的命名空间：

```javascript
// 客户端
namespace: 'chat-demo:v1'

// 服务器
const NAMESPACE = 'chat-demo:v1'
```

### 2. 连接时机

在 `onConnect` 回调后再发送消息：

```javascript
// ❌ 错误
const client = new SocketClient({ ... });
client.sendMessage('JOIN_ROOM', { roomId: '1' });

// ✅ 正确
const client = new SocketClient({
  ...
  onConnect: () => {
    client.sendMessage('JOIN_ROOM', { roomId: '1' });
  }
});
```

### 3. 消息格式

所有消息必须包含 `__socket_client__` 标识：

```javascript
{
  __socket_client__: true,
  namespace: 'chat-demo:v1',
  type: 'CHAT_MESSAGE',
  payload: { text: 'Hello' }
}
```

---

## 🔧 故障排查

### 问题 1: 无法连接服务器

**检查：**
- 服务器是否已启动（`node example/server.js`）
- 端口 8080 是否被占用
- 浏览器控制台是否有错误

### 问题 2: 消息发送失败

**检查：**
- 连接状态（`client.isConnected()`）
- 命名空间是否一致
- 消息格式是否正确

### 问题 3: 自动重连失败

**检查：**
- 服务器是否在线
- 重连配置是否正确
- 查看浏览器控制台日志

---

## 📝 扩展建议

### 添加认证功能

```javascript
const client = new SocketClient({
  url: 'ws://localhost:8080?token=xxx',
  namespace: 'chat-demo:v1'
});
```

### 添加更多事件类型

```javascript
// 客户端
client.on('TYPING_START', (data) => { ... });
client.on('TYPING_STOP', (data) => { ... });

// 服务器
ws.send(JSON.stringify({
  __socket_client__: true,
  namespace: NAMESPACE,
  type: 'TYPING_START',
  payload: { userId: '123' }
}));
```

---

## 🎨 UI 定制

示例中的 UI 使用了 MacOS 风格设计，你可以根据需要修改：

- 渐变背景色
- 毛玻璃效果
- 圆角卡片
- 动画效果

---

## 📚 相关资源

- [Socket Client README](../README.md)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [ws Library](https://www.npmjs.com/package/ws)

---

Made with ❤️ for learning WebSocket communication
