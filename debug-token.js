const axios = require('axios');

const ACCESS_TOKEN = "03irv9NxfUWi5QX12QCgwJH8z7yKxCvg4mtkjHGojnJ6YvoGbMebEkNNW8h7QfkWPpgcOhFWENwxCJgNwU9SeTKEE3Awe95YiTnfj/DFRCwM7s3uIj/tg/zUJJJctHPuYtETyUhulr05FViXJrtM1wdB04t89/1O/w1cDnyilFU=";
const CHANNEL_SECRET = "5c954752bc20b1779eb2e3b3724bff65";
const CHANNEL_ID = "2007132567";

async function debugToken() {
    console.log('🔍 LINE Access Token 詳細診斷');
    console.log('=====================================\n');
    
    // 1. 檢查 Token 格式
    console.log('1. 檢查 Token 格式:');
    console.log('   - 長度:', ACCESS_TOKEN.length, '字符');
    console.log('   - 前10個字符:', ACCESS_TOKEN.substring(0, 10));
    console.log('   - 後10個字符:', ACCESS_TOKEN.substring(ACCESS_TOKEN.length - 10));
    console.log('   - 包含特殊字符:', /[^a-zA-Z0-9\/+=]/.test(ACCESS_TOKEN) ? '是' : '否');
    console.log('');
    
    // 2. 測試 Bot Profile API
    console.log('2. 測試 Bot Profile API:');
    console.log('   URL: https://api.line.me/v2/bot/profile');
    
    try {
        const response = await axios.get('https://api.line.me/v2/bot/profile', {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log('   ✅ 成功！');
        console.log('   Status:', response.status);
        console.log('   Bot 資訊:');
        console.log('     - 顯示名稱:', response.data.displayName);
        console.log('     - 用戶 ID:', response.data.userId);
        console.log('     - 狀態訊息:', response.data.statusMessage || '無');
        console.log('     - 圖片 URL:', response.data.pictureUrl || '無');
        
    } catch (error) {
        console.log('   ❌ 失敗！');
        console.log('   Status:', error.response?.status);
        console.log('   Error:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('   💡 401 錯誤：Token 無效或已過期');
        } else if (error.response?.status === 403) {
            console.log('   💡 403 錯誤：權限不足');
        } else if (error.response?.status === 404) {
            console.log('   💡 404 錯誤：端點不存在');
        }
    }
    console.log('');
    
    // 3. 檢查 Channel 資訊
    console.log('3. Channel 資訊:');
    console.log('   - Channel ID:', CHANNEL_ID);
    console.log('   - Channel Secret:', CHANNEL_SECRET);
    console.log('   - Channel Secret 長度:', CHANNEL_SECRET.length);
    console.log('   - User ID: U52843e25827bb637040b4e13f7ff2bca');
    console.log('');
    
    // 4. 測試 Webhook 連線
    console.log('4. 測試 Webhook 連線:');
    console.log('   URL: https://line-oa-reminder-system.onrender.com/webhook');
    
    try {
        const response = await axios.get('https://line-oa-reminder-system.onrender.com/webhook', {
            timeout: 10000
        });
        console.log('   ✅ Webhook 端點可訪問');
        console.log('   Status:', response.status);
    } catch (error) {
        console.log('   ❌ Webhook 端點無法訪問');
        console.log('   Error:', error.message);
    }
    console.log('');
    
    // 5. 建議
    console.log('5. 建議:');
    console.log('   - 確認 Bot 狀態為 "Active"');
    console.log('   - 確認已啟用 "Allow bot to join group chats"');
    console.log('   - 嘗試重新生成 Access Token');
    console.log('   - 檢查 Bot 權限設定');
    console.log('   - 確認 Webhook URL 設定正確');
}

debugToken().catch(console.error); 