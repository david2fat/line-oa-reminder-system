const axios = require('axios');

const ACCESS_TOKEN = "8fmRUPTlltik+q+"; // 請填入完整的 Access Token

async function checkTokenType() {
    console.log('🔍 LINE Access Token 型別檢測');
    console.log('=====================================\n');
    
    // 1. 檢查 Token 格式
    console.log('1. Token 格式分析:');
    console.log('   - 長度:', ACCESS_TOKEN.length, '字符');
    console.log('   - 前10個字符:', ACCESS_TOKEN.substring(0, 10));
    console.log('   - 後10個字符:', ACCESS_TOKEN.substring(ACCESS_TOKEN.length - 10));
    
    // 檢查是否為 Base64 格式
    const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(ACCESS_TOKEN);
    console.log('   - Base64 格式:', isBase64 ? '是' : '否');
    
    // 檢查是否包含特殊字符
    const hasSpecialChars = /[^A-Za-z0-9+/=]/.test(ACCESS_TOKEN);
    console.log('   - 包含特殊字符:', hasSpecialChars ? '是' : '否');
    
    // 推測 Token 型別
    if (ACCESS_TOKEN.length > 100) {
        console.log('   - 推測型別: 可能是 long-lived token');
    } else if (ACCESS_TOKEN.length > 50) {
        console.log('   - 推測型別: 可能是 short-lived token');
    } else {
        console.log('   - 推測型別: 可能是 JWT token 或 token 不完整');
    }
    console.log('');
    
    // 2. 測試 API 回應
    console.log('2. API 測試:');
    
    try {
        const response = await axios.get('https://api.line.me/v2/bot/profile', {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log('   ✅ API 測試成功！');
        console.log('   - Status:', response.status);
        console.log('   - Bot 名稱:', response.data.displayName);
        console.log('   - 結論: Token 型別正確且有效');
        
    } catch (error) {
        console.log('   ❌ API 測試失敗！');
        console.log('   - Status:', error.response?.status);
        console.log('   - Error:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('   - 問題: Token 無效或已過期');
            console.log('   - 建議: 重新生成 long-lived token');
        } else if (error.response?.status === 403) {
            console.log('   - 問題: 權限不足');
            console.log('   - 建議: 檢查 Bot 權限設定');
        } else if (error.response?.status === 404) {
            console.log('   - 問題: 端點不存在');
            console.log('   - 建議: 檢查 Bot 狀態是否為 Active');
        }
    }
    console.log('');
    
    // 3. 建議
    console.log('3. 建議:');
    console.log('   - 確認在 LINE Developers Console 中選擇 "Channel access token (long-lived)"');
    console.log('   - 確認 Bot 狀態為 "Active"');
    console.log('   - 確認已啟用 "Allow bot to join group chats"');
    console.log('   - 如果問題持續，嘗試重新生成 Token');
    console.log('   - 注意: 請確保填入完整的 Access Token');
}

checkTokenType().catch(console.error); 