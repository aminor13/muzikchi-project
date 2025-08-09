const nodemailer = require('nodemailer');

async function testEmailDelivery() {
  console.log('🔍 تست تحویل ایمیل...');
  
  const config = {
    host: 'mail.muzikchi.ir',
    port: 587,
    secure: false,
    auth: {
      user: 'no-reply@muzikchi.ir',
      pass: 'YOUR_SMTP_PASSWORD' // رمز عبور واقعی خود را وارد کنید
    }
  };

  // لیست ایمیل‌های تست مختلف
  const testEmails = [
    'test@gmail.com',
    'test@yahoo.com', 
    'test@outlook.com',
    'test@hotmail.com',
    'test@muzikchi.ir' // ایمیل در همان دامنه
  ];

  const transporter = nodemailer.createTransporter(config);

  for (const email of testEmails) {
    try {
      console.log(`📧 ارسال به: ${email}`);
      
      const info = await transporter.sendMail({
        from: {
          name: 'Muzikchi',
          address: 'no-reply@muzikchi.ir'
        },
        to: email,
        subject: `تست تحویل ایمیل - ${new Date().toLocaleString('fa-IR')}`,
        text: `این یک ایمیل تست است برای بررسی تحویل ایمیل.
        
زمان ارسال: ${new Date().toLocaleString('fa-IR')}
فرستنده: no-reply@muzikchi.ir
گیرنده: ${email}

اگر این ایمیل را دریافت کردید، تنظیمات SMTP درست کار می‌کند.`,
        html: `
        <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif;">
          <h2>تست تحویل ایمیل</h2>
          <p>این یک ایمیل تست است برای بررسی تحویل ایمیل.</p>
          <hr>
          <p><strong>زمان ارسال:</strong> ${new Date().toLocaleString('fa-IR')}</p>
          <p><strong>فرستنده:</strong> no-reply@muzikchi.ir</p>
          <p><strong>گیرنده:</strong> ${email}</p>
          <hr>
          <p>اگر این ایمیل را دریافت کردید، تنظیمات SMTP درست کار می‌کند.</p>
        </div>
        `
      });
      
      console.log(`✅ ارسال موفق به ${email}`);
      console.log(`   Message ID: ${info.messageId}`);
      
    } catch (error) {
      console.error(`❌ خطا در ارسال به ${email}:`, error.message);
    }
    
    // کمی صبر بین ارسال‌ها
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

testEmailDelivery(); 