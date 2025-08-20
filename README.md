# 📱 LINE OA 客戶提醒系統

整合 LINE Official Account 與群組管理，自動抓取 @ 提醒的完整解決方案。

## ✨ 功能特色

- 🔧 **LINE OA 整合**：完整的 LINE Messaging API 整合
- 👥 **群組管理**：取得群組資訊和成員列表
- 🔔 **@ 提醒監控**：自動偵測並記錄群組中的 @ 提醒
- 📧 **多種通知方式**：Email 和 Webhook 通知
- 🎨 **現代化介面**：美觀且易用的 Web 介面
- 🔒 **安全驗證**：LINE Webhook 簽名驗證
- 💾 **本地儲存**：設定和資料本地儲存

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

複製 `env.example` 為 `.env` 並填入您的 LINE API 資訊：

```bash
cp env.example .env
```

編輯 `.env` 檔案：

```env
# LINE Messaging API 設定
LINE_CHANNEL_ID=your_channel_id_here
LINE_CHANNEL_SECRET=your_channel_secret_here
LINE_ACCESS_TOKEN=your_access_token_here

# 伺服器設定
PORT=3000
```

### 3. 啟動伺服器

```bash
# 開發模式
npm run dev

# 生產模式
npm start
```

### 4. 開啟前端介面

瀏覽器開啟：`http://localhost:3000/提醒系統.html`

## 📋 LINE API 設定步驟

### 1. 建立 LINE Official Account

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 建立新的 Provider
3. 建立新的 Channel (Messaging API)
4. 記錄以下資訊：
   - Channel ID
   - Channel Secret
   - Access Token

### 2. 設定 Webhook URL

在 LINE Developers Console 中設定 Webhook URL：
```
http://your-domain.com/webhook
```

### 3. 取得群組 ID

將您的 LINE Bot 加入群組，然後：
1. 在群組中發送訊息
2. 查看 Webhook 日誌中的 `source.groupId`

## 🔧 API 端點說明

### 測試連線
```
POST /api/line/test-connection
```

### 取得群組資訊
```
GET /api/line/group/:groupId?accessToken=xxx
```

### 取得群組成員
```
GET /api/line/group/:groupId/members?accessToken=xxx
```

### 取得 @ 提醒
```
GET /api/mentions?groupId=xxx&limit=20
```

### Webhook 接收
```
POST /webhook
```

## 📧 通知設定

### Email 通知

在 `.env` 中設定 SMTP 資訊：

```env
ENABLE_EMAIL_NOTIFICATION=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
NOTIFICATION_EMAIL=notifications@yourcompany.com
```

### Webhook 通知

設定外部 Webhook URL：

```env
WEBHOOK_URL=https://your-webhook-endpoint.com/webhook
```

## 🎯 使用流程

1. **設定 LINE OA**：填入 Channel ID、Secret 和 Access Token
2. **測試連線**：確認與 LINE API 的連線正常
3. **設定群組**：填入要監控的群組 ID
4. **開始監控**：啟動 @ 提醒監控功能
5. **設定通知**：選擇 Email 或 Webhook 通知方式

## 🔍 @ 提醒偵測邏輯

系統會自動偵測以下格式的 @ 提醒：

- `@用戶名`
- `@用戶名 訊息內容`
- 多個 `@用戶名1 @用戶名2`

## 📊 資料儲存

目前系統使用記憶體儲存，重啟後資料會清空。如需持久化儲存，可以：

1. 整合資料庫 (MySQL, PostgreSQL, MongoDB)
2. 使用檔案系統儲存
3. 整合雲端儲存服務

## 🛠️ 開發指南

### 專案結構

```
客戶提醒系統/
├── 提醒系統.html      # 前端介面
├── server.js          # 後端伺服器
├── package.json       # 專案依賴
├── env.example        # 環境變數範例
└── README.md          # 說明文件
```

### 自訂功能

1. **新增通知方式**：在 `server.js` 中新增通知函數
2. **修改偵測邏輯**：調整 `processMessage` 函數中的正則表達式
3. **整合資料庫**：替換 `saveMention` 函數的儲存邏輯

## 🔒 安全性考量

- ✅ LINE Webhook 簽名驗證
- ✅ 環境變數保護敏感資訊
- ✅ CORS 設定
- ⚠️ 建議使用 HTTPS 生產環境
- ⚠️ 建議整合資料庫進行資料持久化

## 🐛 常見問題

### Q: 無法接收 Webhook 訊息
A: 確認 Webhook URL 設定正確且伺服器可從外網存取

### Q: 群組訊息無法取得
A: LINE API 限制，只能透過 Webhook 接收即時訊息

### Q: Email 通知無法發送
A: 檢查 SMTP 設定，Gmail 需要使用應用程式密碼

### Q: 群組 ID 不知道
A: 將 Bot 加入群組後發送訊息，查看 Webhook 日誌

## 📞 支援

如有問題或建議，請聯繫開發團隊。

## 📄 授權

MIT License 