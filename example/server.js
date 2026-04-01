/**
 * WebSocket Server Example
 * 
 * 这是一个简单的 WebSocket 服务器，用于测试 Socket Client
 * 
 * 使用方法:
 * node example/server.js
 */

import { WebSocketServer, WebSocket } from 'ws';

const PORT = 8080;
const NAMESPACE = 'chat-demo:v1';

// 创建 WebSocket 服务器
const wss = new WebSocketServer({ port: PORT });

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

      // 处理 CHAT_MESSAGE - 广播并自动回复
      if (data.type === 'CHAT_MESSAGE') {
        const userMessage = data.payload?.text || '';
        
        // 广播给其他用户
        broadcast({
          __socket_client__: true,
          namespace: NAMESPACE,
          type: 'CHAT_MESSAGE',
          payload: {
            text: userMessage,
            from: data.payload?.username || 'User-' + generateClientId().substr(0, 4),
            timestamp: new Date().toISOString()
          }
        }, ws);
        
        // 发送确认给发送者
        sendToClient(ws, {
          __socket_client__: true,
          namespace: NAMESPACE,
          type: 'MESSAGE_SENT',
          payload: {
            success: true,
            messageId: generateClientId()
          }
        });
        
        // 智能自动回复
        setTimeout(() => {
          const reply = generateAutoReply(userMessage);
          sendToClient(ws, {
            __socket_client__: true,
            namespace: NAMESPACE,
            type: 'CHAT_MESSAGE',
            payload: {
              text: reply.text,
              from: '🤖 智能助手',
              timestamp: new Date().toISOString(),
              isAutoReply: true
            }
          });
        }, 1000 + Math.random() * 2000); // 1-3 秒延迟，模拟真实对话
        
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
 * 智能自动回复生成器
 */
function generateAutoReply(message) {
  const msg = message.toLowerCase().trim();
  
  // 问候语
  if (/^(你好|hello|hi|hey|早上好 | 下午好 | 晚上好)/i.test(msg)) {
    return {
      text: `👋 你好！很高兴见到你！有什么我可以帮助你的吗？`
    };
  }
  
  // 询问状态
  if (/^(你好吗 | 怎么样 | how are you)/i.test(msg)) {
    return {
      text: `😊 我很好，谢谢你的关心！你呢？今天过得怎么样？`
    };
  }
  
  // 感谢
  if (/^(谢谢|thank|thanks|感谢你)/i.test(msg)) {
    return {
      text: `🙏 不客气！随时为你服务！`
    };
  }
  
  // 再见
  if (/^(再见|bye|goodbye|拜拜)/i.test(msg)) {
    return {
      text: `👋 再见！祝你有个美好的一天！期待下次与你聊天！`
    };
  }
  
  // 帮助
  if (/^(帮助|help|怎么用|如何使用)/i.test(msg)) {
    return {
      text: `💡 我是一个智能助手，可以和你聊天。你可以发送任何消息，我都会尽力回复你！试试问我问题或者随便聊聊吧~`
    };
  }
  
  // 时间查询
  if (/^(几点了 | 什么时间 | now|time)/i.test(msg)) {
    return {
      text: `⏰ 现在是 ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`
    };
  }
  
  // 日期查询
  if (/^(今天几号 | 日期|date|today)/i.test(msg)) {
    const now = new Date();
    return {
      text: `📅 今天是 ${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日，星期${['日', '一', '二', '三', '四', '五', '六'][now.getDay()]}`
    };
  }
  
  // 天气相关
  if (/^(天气|weather|下雨 | 晴天)/i.test(msg)) {
    return {
      text: `🌤️ 我只是个虚拟助手，无法获取实时天气信息。不过你可以查看天气预报来了解当地天气哦！`
    };
  }
  
  // 名字查询
  if (/^(你叫什么 | 你的名字|who are you)/i.test(msg)) {
    return {
      text: `🤖 我是 Socket Client 的智能助手，一个基于 WebSocket 的自动回复系统！`
    };
  }
  
  // 肯定回答
  if (/^(好的|ok|好的|没问题|yes|sure)/i.test(msg)) {
    return {
      text: `👍 太好了！那我们继续聊天吧~`
    };
  }
  
  // 否定回答
  if (/^(不好|no|not really)/i.test(msg)) {
    return {
      text: `😟 很抱歉听到这个。有什么我可以帮你的吗？`
    };
  }
  
  // 默认回复
  const defaultReplies = [
    `嗯嗯，我明白了！请继续说~`,
    `这很有趣！能再多说说吗？`,
    `我听着呢，请继续！`,
    `收到你的消息了！还有什么想聊的吗？`,
    `😊 和你聊天真愉快！还有其他话题吗？`
  ];
  
  return {
    text: defaultReplies[Math.floor(Math.random() * defaultReplies.length)]
  };
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
