// 引入 HTTPS 模組
const https = require('https');
// 引入 WebSocket 模組
const WebSocket = require('ws');
// 引入文件系統模組
const fs = require('fs');
// 引入 Express 框架
const express = require('express');

// 創建一個 Express 應用程式實例
const app = express();
// 指定伺服器監聽的 Port
const port = 8080;

// 設定關於伺服器的選項。以下提供證明文件，以確保安全的 https 通訊。
var options = {
  key: fs.readFileSync('./ssl/server-key.pem'),
  ca: [fs.readFileSync('./ssl/cert.pem')],
  cert: fs.readFileSync('./ssl/server-cert.pem')
};

// other properties
let sensor;

// 建立 HTTPS 伺服器
// 第一個引數:伺服器的設定；第二個引數: Callback function，當有 req 進來就執行。在此我們是用 express處理這些 req。
const server = https.createServer(options, app);

/** Express 處理 HTTP Request **/
// 設置樣板引擎（Template Engines） 為 EJS 
// 補充: Template Engine（或稱 View Engine） 可以透過 JS 動態產生 HTML
app.set('view engine', 'ejs');

// 處理根路徑 '/' 的 GET 請求，並返回在 views 資料夾底下 'index.ejs' 的視圖（即 template + data 生成後的結果）
app.get('/', (req, res) => {
    res.render('index');  // 不用 .ejs 副檔名
    console.log(`/ get client req`);
})

// 處理 '/user' 路徑的 GET 請求，並返回在 views 資料夾底下 'user.ejs' 的視圖
app.get('/user', (req, res) => {
    res.render('user');
    console.log(`/user get client req`);
})

// 處理 '/api/data' 路徑的 GET 請求，並返回 JSON 格式的資料
app.get('/api/data', (req, res) => {
    // sensor 是 null 或 undefined 就忽略
    if(!sensor) return;

    // 使用 res.json() 方法將 JS 物件轉換為 JSON 格式，並返回給客戶端
    res.json(sensor);
    console.log(`/api/data get client req`);
});

/** WebSocket 處理雙向數據傳輸**/
// 建立 WebSocket Server，並與 HTTP server 連結在一起。意味著兩者將共享相同的 Port
const wss = new WebSocket.Server({ server });
let wsClients = [];

//當有 client 連線成功時
wss.on('connection', ws => {
    wsClients.push(ws);
    console.log(`Client connected! Total ${wsClients.length}`)
    
    // 當收到client消息時
    ws.on('message', data => {
        // 只處理第一順位的 clinet
        if(wsClients.indexOf(ws) !== 0)
            return;

        // JSON 資料格式 to JS object
        sensor = JSON.parse(data);  
        // console.log(`from client${wsClients.indexOf(ws)}: ${sensor}`); // 可在 terminal 看收到的訊息
        console.log(sensor);
    })

    // 當連線關閉
    ws.on('close', () => {
      let index = wsClients.indexOf(ws);
      wsClients.splice(index, 1);
      console.log(`Close connected! Total ${wsClients.length}`)
    })
  })


// 啟動 HTTPS 伺服器，並開始監聽指定的 Port
server.listen(port, () => {
    console.log(`PuppetLink HTTPS server running on port ${port}!`);
});