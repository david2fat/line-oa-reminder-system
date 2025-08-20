const axios = require('axios');
const readline = require('readline');

// 建立讀取輸入的介面
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// 測試 Access Token 的函數
async function testAccessToken(token) {
    try {
        console.log('🔍 正在測試 Access Token...');
        console.log('Token 前10個字符:', token.substring(0, 10) + '...');
        
        const response = await axios.get('https://api.line.me/v2/bot/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            timeout: 10000
        });
        
        console.log('\n✅ Access Token 有效！');
        console.log('📱 Bot 資訊:');
        console.log('   - 顯示名稱:', response.data.displayName);
        console.log('   - 用戶 ID:', response.data.userId);
        console.log('   - 狀態訊息:', response.data.statusMessage || '無');
        console.log('   - 圖片 URL:', response.data.pictureUrl || '無');
        
        return true;
        
    } catch (error) {
        console.log('\n❌ Access Token 無效！');
        
        if (error.response?.status === 401) {
            console.log('錯誤：Access Token 無效或已過期');
            console.log('💡 解決方案：請在 LINE Developers Console 重新生成 Access Token');
        } else if (error.response?.status === 403) {
            console.log('錯誤：Access Token 權限不足');
            console.log('💡 解決方案：確認 Bot 權限設定正確');
        } else if (error.code === 'ECONNABORTED') {
            console.log('錯誤：連線超時');
            console.log('💡 解決方案：檢查網路連線');
        } else if (error.code === 'ENOTFOUND') {
            console.log('錯誤：無法連接到 LINE 伺服器');
            console.log('💡 解決方案：檢查網路連線');
        } else {
            console.log('錯誤：', error.response?.data || error.message);
        }
        
        return false;
    }
}

// 測試群組權限的函數
async function testGroupAccess(token, groupId) {
    try {
        console.log(`\n🔍 正在測試群組 ${groupId} 的權限...`);
        
        const response = await axios.get(`https://api.line.me/v2/bot/group/${groupId}/summary`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            timeout: 10000
        });
        
        console.log('✅ 群組權限正常！');
        console.log('👥 群組資訊:');
        console.log('   - 群組名稱:', response.data.groupName);
        console.log('   - 群組 ID:', response.data.groupId);
        console.log('   - 成員數量:', response.data.count);
        
        return true;
        
    } catch (error) {
        console.log('❌ 群組權限測試失敗！');
        
        if (error.response?.status === 404) {
            console.log('錯誤：群組不存在或 Bot 未加入該群組');
        } else if (error.response?.status === 403) {
            console.log('錯誤：Bot 沒有該群組的權限');
        } else {
            console.log('錯誤：', error.response?.data || error.message);
        }
        
        return false;
    }
}

// 主程式
async function main() {
    console.log('🚀 LINE OA Access Token 測試工具');
    console.log('=====================================\n');
    
    // 方法1：從環境變數讀取
    let token = process.env.LINE_ACCESS_TOKEN;
    
    if (!token) {
        // 方法2：從檔案讀取（如果存在）
        try {
            const fs = require('fs');
            if (fs.existsSync('.env')) {
                const envContent = fs.readFileSync('.env', 'utf8');
                const match = envContent.match(/LINE_ACCESS_TOKEN=(.+)/);
                if (match) {
                    token = match[1].trim();
                }
            }
        } catch (error) {
            // 忽略檔案讀取錯誤
        }
    }
    
    if (!token) {
        // 方法3：手動輸入
        token = await new Promise((resolve) => {
            rl.question('請輸入您的 LINE Access Token: ', (answer) => {
                resolve(answer.trim());
            });
        });
    }
    
    if (!token || token === 'YOUR_ACCESS_TOKEN_HERE') {
        console.log('\n❌ 請提供有效的 Access Token！');
        console.log('💡 取得方式：');
        console.log('   1. 前往 LINE Developers Console');
        console.log('   2. 選擇您的 LINE Official Account');
        console.log('   3. 點擊 "Messaging API"');
        console.log('   4. 在 "Channel access token" 區塊點擊 "Issue"');
        rl.close();
        return;
    }
    
    // 測試 Access Token
    const tokenValid = await testAccessToken(token);
    
    if (tokenValid) {
        // 詢問是否要測試群組權限
        const testGroup = await new Promise((resolve) => {
            rl.question('\n是否要測試群組權限？(y/n): ', (answer) => {
                resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
            });
        });
        
        if (testGroup) {
            const groupId = await new Promise((resolve) => {
                rl.question('請輸入群組 ID: ', (answer) => {
                    resolve(answer.trim());
                });
            });
            
            if (groupId) {
                await testGroupAccess(token, groupId);
            }
        }
    }
    
    rl.close();
}

// 執行主程式
main().catch(console.error); 