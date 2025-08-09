const net = require('net');

async function testSMTPServer() {
  console.log('🔍 تست مستقیم سرور SMTP...');
  
  const host = 'mail.muzikchi.ir';
  const port = 587;
  
  return new Promise((resolve) => {
    const socket = net.createConnection(port, host, () => {
      console.log(`✅ اتصال به ${host}:${port} موفق`);
      
      // ارسال EHLO
      socket.write('EHLO test.com\r\n');
    });
    
    socket.on('data', (data) => {
      const response = data.toString();
      console.log('📨 پاسخ سرور:', response.trim());
      
      if (response.includes('250')) {
        console.log('✅ سرور SMTP پاسخ می‌دهد');
        socket.end();
        resolve(true);
      }
    });
    
    socket.on('error', (error) => {
      console.error('❌ خطا در اتصال:', error.message);
      resolve(false);
    });
    
    socket.on('close', () => {
      console.log('🔌 اتصال بسته شد');
    });
    
    // Timeout بعد از 10 ثانیه
    setTimeout(() => {
      console.log('⏰ Timeout - سرور پاسخ نمی‌دهد');
      socket.destroy();
      resolve(false);
    }, 10000);
  });
}

// تست پورت‌های مختلف
async function testAllPorts() {
  const ports = [25, 465, 587];
  
  for (const port of ports) {
    console.log(`\n🔍 تست پورت ${port}...`);
    const result = await testSMTPServer();
    if (result) {
      console.log(`✅ پورت ${port} کار می‌کند`);
    } else {
      console.log(`❌ پورت ${port} کار نمی‌کند`);
    }
  }
}

testAllPorts(); 