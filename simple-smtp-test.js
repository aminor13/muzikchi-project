const nodemailer = require('nodemailer');

async function simpleSMTPTest() {
  console.log('🔍 تست ساده SMTP...');
  
  const config = {
    host: 'mail.muzikchi.ir',
    port: 587,
    secure: false,
    auth: {
      user: 'no-reply@muzikchi.ir',
      pass: '29wz71%mC'
    }
  };

  try {
    console.log('📡 ایجاد اتصال...');
    const transporter = nodemailer.createTransport(config);
    
    console.log('🔐 تست احراز هویت...');
    await transporter.verify();
    console.log('✅ احراز هویت موفق!');
    
    console.log('📧 ارسال ایمیل تست...');
    const info = await transporter.sendMail({
      from: 'no-reply@muzikchi.ir',
      to: 'mammadrjabali@gmail.com',
      subject: 'تست SMTP - Muzikchi',
      text: 'این یک ایمیل تست است برای بررسی تنظیمات SMTP.',
      html: '<p>این یک ایمیل تست است برای بررسی تنظیمات SMTP.</p>'
    });
    
    console.log('✅ ایمیل ارسال شد!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ خطا:', error.message);
    console.error('کد خطا:', error.code);
  }
}

simpleSMTPTest(); 