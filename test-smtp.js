const nodemailer = require('nodemailer');

// تست اتصال SMTP
async function testSMTP() {
  console.log('🔍 تست اتصال SMTP...');
  
  // تنظیمات SMTP شما
  const config = {
    host: 'mail.muzikchi.ir',
    port: 587, // تغییر به پورت 587
    secure: false, // true برای پورت 465، false برای پورت 587
    auth: {
      user: 'no-reply@muzikchi.ir', // ایمیل SMTP شما
      pass: 'YOUR_SMTP_PASSWORD' // رمز عبور SMTP شما
    }
  };

  try {
    // ایجاد transporter
    const transporter = nodemailer.createTransporter(config);
    
    // تست اتصال
    console.log('📡 در حال تست اتصال...');
    await transporter.verify();
    console.log('✅ اتصال SMTP موفق!');
    
    // تست ارسال ایمیل
    console.log('📧 در حال تست ارسال ایمیل...');
    const info = await transporter.sendMail({
      from: 'no-reply@muzikchi.ir',
      to: 'test@example.com', // ایمیل تست
      subject: 'تست SMTP - Muzikchi',
      text: 'این یک ایمیل تست است برای بررسی تنظیمات SMTP.',
      html: '<p>این یک ایمیل تست است برای بررسی تنظیمات SMTP.</p>'
    });
    
    console.log('✅ ایمیل تست ارسال شد!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ خطا در تست SMTP:', error.message);
    
    if (error.code === 'ECONNECTION') {
      console.log('💡 راهنمایی: پورت یا host اشتباه است');
    } else if (error.code === 'EAUTH') {
      console.log('💡 راهنمایی: نام کاربری یا رمز عبور اشتباه است');
    }
  }
}

testSMTP(); 