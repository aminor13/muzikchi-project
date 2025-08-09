const nodemailer = require('nodemailer');

async function testFullSMTP() {
  console.log('🔍 تست کامل SMTP با احراز هویت...');
  
  const config = {
    host: 'mail.muzikchi.ir',
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: 'no-reply@muzikchi.ir',
      pass: '29wz71%mC' // رمز عبور واقعی خود را وارد کنید
    },
    debug: true, // نمایش جزئیات
    logger: true // نمایش لاگ‌ها
  };

  try {
    console.log('📡 ایجاد اتصال...');
    const transporter = nodemailer.createTransport(config);
    
    console.log('🔐 تست احراز هویت...');
    await transporter.verify();
    console.log('✅ احراز هویت موفق!');
    
    console.log('📧 ارسال ایمیل تست...');
    const info = await transporter.sendMail({
      from: {
        name: 'Muzikchi Test',
        address: 'no-reply@muzikchi.ir'
      },
      to: 'mammadrjabali@gmail.com', // ایمیل تست خود را وارد کنید
      subject: 'تست SMTP - Muzikchi',
      text: 'این یک ایمیل تست است برای بررسی تنظیمات SMTP.',
      html: '<p>این یک ایمیل تست است برای بررسی تنظیمات SMTP.</p>'
    });
    
    console.log('✅ ایمیل ارسال شد!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    
  } catch (error) {
    console.error('❌ خطا:', error.message);
    console.error('کد خطا:', error.code);
    
    if (error.code === 'EAUTH') {
      console.log('💡 مشکل: نام کاربری یا رمز عبور اشتباه');
    } else if (error.code === 'ECONNECTION') {
      console.log('💡 مشکل: اتصال به سرور');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('💡 مشکل: Timeout در اتصال');
    }
  }
}

testFullSMTP(); 