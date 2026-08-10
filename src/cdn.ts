/**
 * CDN 专用入口
 *
 * 仅作为 UMD/IIFE 的默认导出，使浏览器中通过 <script> 引入后
 * 全局变量 `SocketClient` 直接指向 SocketClient 类，无需再解包：
 *
 *   <script src=".../socket-client.min.js"></script>
 *   <script>
 *     const client = new SocketClient({ url, namespace });
 *   </script>
 */
import { SocketClient } from './index';

export default SocketClient;
