/**
 * WebSocket Server Example
 * 
 * 这是一个简单的 WebSocket 服务器，用于测试 Socket Client
 * 
 * 使用方法:
 * node example/server.js
 */

const WebSocket = require('ws');

const PORT = 8080;
const NAMESPACE = 'chat-demo:v1';

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ port: PORT });

console.log(`🚀 WebSocket server started on ws://localhost:${PORT}`);
console.log(`📌 Namespace: ${NAMESPACE}`);
console.log('⏹️  Press Ctrl+C to stop\n');

// 存储所有客户端连接
const clients = new Set();

wss.on('connection', (ws) => {
  console.log(`✅ New client connected. Total clients: ${clients.size + 1}`);
  clients.add(ws);

  // 发送欢迎消息
  sendToClient(ws, {
    __socket_client__: true,
    namespace: NAMESPACE,
    type: 'WELCOME',
    payload: {
      message: '欢迎使用 Socket Client!',
      timestamp: new Date().toISOString(),
      clientId: generateClientId()
    }
  });

  // 广播用户加入
  broadcast({
    __socket_client__: true,
    namespace: NAMESPACE,
    type: 'USER_JOINED',
    payload: {
      username: `User-${generateClientId()}`,
      timestamp: new Date().toISOString()
    }
  }, ws);

  // 处理接收到的消息
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // 验证消息格式
      if (!data.__socket_client__) {
        console.log('⚠️  Invalid message format (missing __socket_client__)');
        return;
      }

      // 验证命名空间
      if (data.namespace !== NAMESPACE) {
        console.log(`⚠️  Namespace mismatch: expected ${NAMESPACE}, got ${data.namespace}`);
        return;
      }

      console.log(`📩 Received [${data.type}]:`, data.payload);

      // 处理 PING
      if (data.type === '__PING__') {
        sendToClient(ws, {
          __socket_client__: true,
          namespace: NAMESPACE,
          type: '__PONG__'
        });
        return;
      }

      // 处理 JOIN_ROOM
      if (data.type === 'JOIN_ROOM') {
        sendToClient(ws, {
          __socket_client__: true,
          namespace: NAMESPACE,
          type: 'ROOM_JOINED',
          payload: {
            roomId: data.payload?.roomId || 'default',
            joinedAt: new Date().toISOString()
          }
        });
        
        // 通知其他用户
        broadcast({
          __socket_client__: true,
          namespace: NAMESPACE,
          type: 'USER_JOINED',
          payload: {
            username: data.payload?.username || 'Anonymous',
            roomId: data.payload?.roomId,
            timestamp: new Date().toISOString()
          }
        }, ws);
        return;
      }

      // 处理 CHAT_MESSAGE - 广播给所有其他客户端
      if (data.type === 'CHAT_MESSAGE') {
        broadcast({
          __socket_client__: true,
          namespace: NAMESPACE,
          type: 'CHAT_MESSAGE',
          payload: {
            text: data.payload?.text,
            from: 'Client-' + generateClientId(),
            timestamp: new Date().toISOString()
          }
        }, ws);
        
        // 也发送给发送者确认
        sendToClient(ws, {
          __socket_client__: true,
          namespace: NAMESPACE,
          type: 'MESSAGE_SENT',
          payload: {
            success: true,
            messageId: generateClientId()
          }
        });
        return;
      }

      // 默认：回显消息
      sendToClient(ws, {
        __socket_client__: true,
        namespace: NAMESPACE,
        type: 'ECHO',
        payload: {
          originalType: data.type,
          originalPayload: data.payload,
          echoedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error processing message:', error.message);
    }
  });

  // 处理断开连接
  ws.on('close', () => {
    console.log(`❌ Client disconnected. Total clients: ${clients.size - 1}`);
    clients.delete(ws);

    // 广播用户离开
    broadcast({
      __socket_client__: true,
      namespace: NAMESPACE,
      type: 'USER_LEFT',
      payload: {
        username: 'Unknown User',
        timestamp: new Date().toISOString()
      }
    });
  });

  // 处理错误
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
  });
});

/**
 * 发送消息到指定客户端
 */
function sendToClient(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

/**
 * 广播消息给所有客户端（或排除某个客户端）
 */
function broadcast(data, excludeWs = null) {
  clients.forEach((client) => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

/**
 * 生成随机客户端 ID
 */
function generateClientId() {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * 优雅关闭
 */
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  
  // 通知所有客户端
  broadcast({
    __socket_client__: true,
    namespace: NAMESPACE,
    type: 'SERVER_SHUTDOWN',
    payload: {
      reason: 'Server is shutting down',
      timestamp: new Date().toISOString()
    }
  });

  // 关闭所有连接
  clients.forEach((client) => {
    client.close();
  });

  wss.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
