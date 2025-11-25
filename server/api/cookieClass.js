// 生成32位十六进制字符串 (模拟MD5)
function generateHashId() {
    return Array.from({length: 32}, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
  
  // 生成随机Base64-like字符串
  function generateRandomString(length = 24) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({length}, () => 
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }
  
  // 生成数字ID
  function generateNumberId(length = 14) {
    return Math.random().toString().slice(2, 2 + length);
  }
  
  // 生成时间戳
  function generateTimestamp() {
    return Date.now().toString();
  }
  
  // URL编码时间
  function encodeTime() {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    return encodeURIComponent(timeStr);
  }
  
  // 生成页面会话ID
  function generatePSI() {
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 17);
    const random = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
    return `${timestamp}-113200301321-${random}`;
  }
  
  // 生成完整的cookie字符串
  export function generateEastMoneyCookies() {
    const baseTime = Date.now();
    
    const cookies = {
      qgqp_b_id: generateHashId(),
      st_nvi: generateRandomString(),
      st_si: generateNumberId(13),
      st_asi: 'delete',
      nid: generateHashId(),
      nid_create_time: baseTime.toString(),
      gvi: generateRandomString(),
      gvi_create_time: baseTime.toString(),
      fullscreengg: '1',
      fullscreengg2: '1',
      wsc_checkuser_ok: '1',
      st_pvi: generateNumberId(14),
      st_sp: encodeTime(),
      st_inirUrl: encodeURIComponent('https://option.eastmoney.com/'),
      st_sn: Math.floor(Math.random() * 20 + 1).toString(),
      st_psi: generatePSI()
    };
    
    return Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }
  
//   // 使用示例
//   const cookieString = generateEastMoneyCookies();
//   console.log(cookieString);