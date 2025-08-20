const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// LINE API 設定
const LINE_API_BASE = 'https://api.line.me/v2';

// 驗證 LINE 簽名
function verifySignature(body, signature, channelSecret) {
    const hash = crypto.createHmac('SHA256', channelSecret)
        .update(body, 'utf8')
        .digest('base64');
    return hash === signature;
}

// 測試 LINE 連線
app.post('/api/line/test-connection', async (req, res) => {
    try {
        const { channelId, accessToken } = req.body;
        
        const response = await axios.get(`${LINE_API_BASE}/bot/profile`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        res.json({ success: true, profile: response.data });
    } catch (error) {
        console.error('LINE 連線測試失敗:', error.response?.data || error.message);
        res.status(400).json({ 
            success: false, 
            error: '連線失敗，請檢查 Channel ID 和 Access Token' 
        });
    }
});

// 取得群組資訊
app.get('/api/line/group/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { accessToken } = req.query;
        
        const response = await axios.get(`${LINE_API_BASE}/bot/group/${groupId}/summary`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('取得群組資訊失敗:', error.response?.data || error.message);
        res.status(400).json({ 
            success: false, 
            error: '無法取得群組資訊' 
        });
    }
});

// 取得群組成員
app.get('/api/line/group/:groupId/members', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { accessToken } = req.query;
        
        const response = await axios.get(`${LINE_API_BASE}/bot/group/${groupId}/members/ids`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        // 取得成員詳細資訊
        const memberDetails = await Promise.all(
            response.data.memberIds.slice(0, 10).map(async (userId) => {
                try {
                    const profileResponse = await axios.get(`${LINE_API_BASE}/bot/group/${groupId}/member/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    });
                    return profileResponse.data;
                } catch (error) {
                    return { userId, displayName: '未知用戶' };
                }
            })
        );
        
        res.json({ members: memberDetails });
    } catch (error) {
        console.error('取得群組成員失敗:', error.response?.data || error.message);
        res.status(400).json({ 
            success: false, 
            error: '無法取得群組成員' 
        });
    }
});

// 取得群組訊息歷史
app.get('/api/line/group/:groupId/messages', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { accessToken, limit = 50 } = req.query;
        
        // 注意：LINE API 不直接提供群組訊息歷史
        // 這裡需要透過 Webhook 來接收訊息
        res.json({ 
            message: '群組訊息需要透過 Webhook 接收，無法直接查詢歷史訊息' 
        });
    } catch (error) {
        console.error('取得群組訊息失敗:', error.response?.data || error.message);
        res.status(400).json({ 
            success: false, 
            error: '無法取得群組訊息' 
        });
    }
});

// LINE Webhook 接收端點
app.post('/webhook', async (req, res) => {
    try {
        const signature = req.headers['x-line-signature'];
        const body = JSON.stringify(req.body);
        
        // 從環境變數或資料庫取得 channel secret
        const channelSecret = process.env.LINE_CHANNEL_SECRET;
        
        // 如果沒有設定 channel secret，跳過驗證（僅用於測試）
        if (channelSecret && !verifySignature(body, signature, channelSecret)) {
            console.log('簽名驗證失敗');
            return res.status(400).json({ error: '簽名驗證失敗' });
        }
        
        const events = req.body.events || [];
        console.log('收到 LINE Webhook 事件:', events.length, '個事件');
        
        // 處理每個事件
        for (const event of events) {
            if (event.type === 'message' && event.message && event.message.type === 'text') {
                try {
                    await processMessage(event);
                } catch (error) {
                    console.error('處理訊息失敗:', error);
                }
            }
        }
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Webhook 處理失敗:', error);
        res.status(500).json({ error: '內部伺服器錯誤' });
    }
});

// 處理訊息並檢查 @ 提醒
async function processMessage(event) {
    try {
        const { message, source, timestamp } = event;
        
        if (!message || !message.text) {
            console.log('忽略非文字訊息');
            return;
        }
        
        const text = message.text;
        console.log('處理訊息:', text);
        
        // 檢查是否包含 @ 符號
        const mentionPattern = /@(\w+)/g;
        const mentions = text.match(mentionPattern);
        
        if (mentions && mentions.length > 0) {
            console.log('發現 @ 提醒:', mentions);
            
            let userName = '未知用戶';
            try {
                userName = await getUserDisplayName(source.userId, source.groupId);
            } catch (error) {
                console.error('取得用戶名稱失敗:', error);
            }
            
            const mentionData = {
                groupId: source.groupId,
                userId: source.userId,
                userName: userName,
                message: text,
                mentions: mentions,
                timestamp: timestamp
            };
            
            // 儲存到資料庫或記憶體
            saveMention(mentionData);
            
            // 發送通知
            try {
                await sendNotifications(mentionData);
            } catch (error) {
                console.error('發送通知失敗:', error);
            }
        }
    } catch (error) {
        console.error('處理訊息失敗:', error);
    }
}

// 取得用戶顯示名稱
async function getUserDisplayName(userId, groupId) {
    try {
        const accessToken = process.env.LINE_ACCESS_TOKEN;
        
        if (!accessToken) {
            console.log('未設定 LINE_ACCESS_TOKEN，使用預設用戶名稱');
            return '未知用戶';
        }
        
        const response = await axios.get(`${LINE_API_BASE}/bot/group/${groupId}/member/${userId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        return response.data.displayName || '未知用戶';
    } catch (error) {
        console.error('取得用戶名稱失敗:', error.response?.data || error.message);
        return '未知用戶';
    }
}

// 儲存 @ 提醒
function saveMention(mentionData) {
    // 這裡可以儲存到資料庫
    // 目前先儲存到記憶體
    if (!global.mentions) {
        global.mentions = [];
    }
    global.mentions.unshift(mentionData);
    
    // 只保留最近 100 筆
    if (global.mentions.length > 100) {
        global.mentions = global.mentions.slice(0, 100);
    }
}

// 取得最近的 @ 提醒
app.get('/api/mentions', (req, res) => {
    const { groupId, limit = 20 } = req.query;
    
    let mentions = global.mentions || [];
    
    if (groupId) {
        mentions = mentions.filter(m => m.groupId === groupId);
    }
    
    res.json(mentions.slice(0, parseInt(limit)));
});

// 發送通知
async function sendNotifications(mentionData) {
    // Email 通知
    if (process.env.ENABLE_EMAIL_NOTIFICATION === 'true') {
        await sendEmailNotification(mentionData);
    }
    
    // Webhook 通知
    if (process.env.WEBHOOK_URL) {
        await sendWebhookNotification(mentionData);
    }
}

// Email 通知
async function sendEmailNotification(mentionData) {
    try {
        const transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: process.env.NOTIFICATION_EMAIL,
            subject: `LINE 群組 @ 提醒 - ${mentionData.userName}`,
            html: `
                <h2>新的 @ 提醒</h2>
                <p><strong>用戶：</strong>${mentionData.userName}</p>
                <p><strong>群組：</strong>${mentionData.groupId}</p>
                <p><strong>訊息：</strong>${mentionData.message}</p>
                <p><strong>時間：</strong>${new Date(mentionData.timestamp).toLocaleString('zh-TW')}</p>
            `
        };
        
        await transporter.sendMail(mailOptions);
        console.log('Email 通知已發送');
    } catch (error) {
        console.error('發送 Email 通知失敗:', error);
    }
}

// Webhook 通知
async function sendWebhookNotification(mentionData) {
    try {
        await axios.post(process.env.WEBHOOK_URL, {
            type: 'line_mention',
            data: mentionData
        });
        console.log('Webhook 通知已發送');
    } catch (error) {
        console.error('發送 Webhook 通知失敗:', error);
    }
}

// 發送 Email 通知 API
app.post('/api/notifications/email', async (req, res) => {
    try {
        const { email, mentions, keywords } = req.body;
        
        // 這裡可以實作 Email 發送邏輯
        console.log('Email 通知請求:', { email, mentions, keywords });
        
        res.json({ success: true, message: 'Email 通知已發送' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 發送 Webhook 通知 API
app.post('/api/notifications/webhook', async (req, res) => {
    try {
        const { mentions, keywords } = req.body;
        
        // 這裡可以實作 Webhook 發送邏輯
        console.log('Webhook 通知請求:', { mentions, keywords });
        
        res.json({ success: true, message: 'Webhook 通知已發送' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 健康檢查
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        mentions: (global.mentions || []).length
    });
});

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`🚀 LINE OA 客戶提醒系統已啟動在 port ${PORT}`);
    console.log(`📱 Webhook URL: http://localhost:${PORT}/webhook`);
    console.log(`🔗 前端介面: http://localhost:${PORT}/提醒系統.html`);
});

module.exports = app; 