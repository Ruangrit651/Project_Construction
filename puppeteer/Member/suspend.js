require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');

// 🔧 ฟังก์ชันคืนวันที่และเวลาในรูปแบบ วัน/เดือน/ปี ชั่วโมง:นาที:วินาที
function now() {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // เดือนเริ่มที่ 0
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

// ชื่อไฟล์ log (เขียนทับทุกครั้ง)
const logFilename = 'Suspend_performance_log.txt';

(async () => {
  const log = [];
  let browser;

  try {
    // เปิด browser แบบไม่ซ่อนหน้า
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--disable-features=PasswordManagerEnabled,AutomaticPasswordSaving',
        '--disable-save-password-bubble'
      ]
    });

    const page = await browser.newPage();

    // เริ่มจับเวลาการโหลดหน้าเว็บ
    const startLoad = Date.now();
    await page.goto(process.env.APP_URL, { waitUntil: 'networkidle0' });
    const pageLoadTime = Date.now() - startLoad;
    log.push(`📅 Timestamp: ${now()}`);
    log.push(`🚀 Page Load Time: ${pageLoadTime} ms`);

    // กรอกแบบฟอร์ม login
    const startLogin = Date.now();
    await page.type('#username', process.env.LOGIN_USERNAME);
    await page.type('#password', process.env.LOGIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    const loginTime = Date.now() - startLogin;
    log.push(`🔐 Login Time: ${loginTime} ms`);
    log.push(`✅ Login success: ${page.url()}`);

    // รอให้ปุ่ม Create ปรากฏแล้วคลิก
    await page.waitForSelector('button');
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent.trim(), btn);
      if (text === 'Create') {
        await btn.click();
        log.push('🟢 Clicked "Create" button');
        break;
      }
    }

    // รอกล่องกรอกข้อมูลขึ้น
    await page.waitForSelector('input[placeholder="Enter username"]');
    const username = 'testuser_' + Date.now();
    const password = 'testpassword123';

    const startCreate = Date.now();
    await page.type('input[placeholder="Enter username"]', username);
    await page.type('input[placeholder="Enter password"]', password);

    // เลือก option แรกใน combobox ทุกอัน
    const comboboxes = await page.$$('[role="combobox"]');
    for (const box of comboboxes) {
      await box.click();
      await page.waitForSelector('[role="option"]');
      const options = await page.$$('[role="option"]');
      if (options.length > 0) {
        await options[0].click();
      }
    }

    // คลิก Create ใน dialog ถ้ามี
    const dialog = await page.$('[role="dialog"], .MuiDialog-root');
    if (dialog) {
      const dialogButtons = await dialog.$$('button');
      for (const btn of dialogButtons) {
        const text = await page.evaluate(el => el.textContent.trim(), btn);
        if (text === 'Create') {
          await btn.click();
          log.push('🟢 Clicked "Create" button in dialog');
          break;
        }
      }
    }

    // รอให้ user ปรากฏในตาราง
    await page.waitForFunction(
      username => [...document.querySelectorAll('td')].some(td => td.textContent.includes(username)),
      { timeout: 5000 },
      username
    );
    const createTime = Date.now() - startCreate;
    log.push(`👤 Create User Time: ${createTime} ms`);
    log.push(`👤 New Username: ${username}`);
    log.push(`✅ User created successfully`);

    // รอให้ dialog ปิดก่อนดำเนินการต่อ
    try {
      await page.waitForSelector('.MuiDialog-root, [role="dialog"]', { hidden: true, timeout: 3000 });
    } catch {}

    await new Promise(res => setTimeout(res, 500)); // รอเล็กน้อยก่อนดำเนินการต่อ

    // =================== เริ่มการทดสอบ Suspend User ===================
    
    const startSuspend = Date.now();

    // 1. คลิกปุ่ม Suspend ของ user ที่เพิ่งสร้าง
    const suspendButtonClicked = await page.evaluate(username => {
      const rows = Array.from(document.querySelectorAll('tr'));
      for (const row of rows) {
        if ([...row.querySelectorAll('td')].some(td => td.textContent.includes(username))) {
          // หาปุ่ม Suspend (อาจจะมีข้อความว่า "Suspend" หรือสีแดง)
          const suspendButtons = Array.from(row.querySelectorAll('button')).filter(b => 
            b.textContent.trim() === 'Suspend' || 
            b.classList.contains('red') ||
            window.getComputedStyle(b).color.includes('255, 0, 0') // สีแดง
          );
          
          if (suspendButtons.length > 0) {
            suspendButtons[0].click();
            return true;
          }
        }
      }
      return false;
    }, username);

    if (!suspendButtonClicked) {
      throw new Error('ไม่พบปุ่ม Suspend ในแถวของ user');
    }
    
    const suspendButtonClickTime = Date.now() - startSuspend;
    log.push(`🔴 Suspend Button Click Time: ${suspendButtonClickTime} ms`);
    log.push('🟢 Clicked "Suspend" button for the user');

    // 2. รอให้ Dialog ยืนยันการ Suspend ปรากฏ
    await page.waitForSelector('[role="dialog"], .MuiDialog-root');
    
    // 3. ตรวจสอบข้อความใน Dialog
    const dialogContentCheck = await page.evaluate((expectedUsername) => {
      const dialog = document.querySelector('[role="dialog"], .MuiDialog-root');
      if (!dialog) return { success: false, reason: 'Dialog not found' };
      
      // // ตรวจสอบหัวข้อ Dialog
      // const title = dialog.querySelector('h2, [role="heading"]');
      // if (!title || !title.textContent.includes('Suspend')) {
      //   return { success: false, reason: 'Dialog title does not contain "Suspend"' };
      // }
      
      // ตรวจสอบข้อความที่มีชื่อผู้ใช้
      const hasUsername = Array.from(dialog.querySelectorAll('strong, p, span'))
        .some(el => el.textContent.includes(expectedUsername));
      
      if (!hasUsername) {
        return { success: false, reason: 'Dialog does not contain username' };
      }
      
      // ตรวจสอบข้อความเตือน
      const hasWarning = Array.from(dialog.querySelectorAll('p, span'))
        .some(el => el.textContent.includes('not be able to log in'));
      
      if (!hasWarning) {
        return { success: false, reason: 'Dialog does not contain warning message' };
      }
      
      return { success: true };
    }, username);
    
    if (dialogContentCheck.success) {
      log.push('✅ Suspend confirmation dialog shows correct content');
    } else {
      log.push(`⚠️ Dialog content issue: ${dialogContentCheck.reason}`);
    }

    // 4. กดปุ่ม "Suspend User" ใน Dialog
    const startConfirmSuspend = Date.now();
    
    const confirmDialogClicked = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"], .MuiDialog-root');
      if (!dialog) return false;
      
      // หาปุ่ม Suspend User
      const suspendButtons = Array.from(dialog.querySelectorAll('button')).filter(b => 
        b.textContent.includes('Suspend User')
      );
      
      if (suspendButtons.length > 0) {
        suspendButtons[0].click();
        return true;
      }
      
      return false;
    });
    
    if (!confirmDialogClicked) {
      throw new Error('ไม่พบปุ่ม "Suspend User" ใน Dialog');
    }
    
    log.push('🟢 Clicked "Suspend User" button in confirmation dialog');
    
    // 5. รอให้ Dialog ปิดหลังจากกดยืนยัน
    try {
      await page.waitForSelector('[role="dialog"], .MuiDialog-root', { hidden: true, timeout: 5000 });
      log.push('✅ Suspend confirmation dialog closed after confirmation');
    } catch {
      log.push('⚠️ Suspend confirmation dialog did not close after confirmation');
    }
    
    // // 6. ตรวจสอบการแสดง Toast notification หรือการแจ้งเตือน
    // try {
    //   const toastVisible = await page.waitForFunction(
    //     () => {
    //       const toasts = document.querySelectorAll('.Toastify__toast, [role="alert"], .MuiSnackbar-root');
    //       return toasts.length > 0;
    //     },
    //     { timeout: 3000 }
    //   );
      
    //   if (toastVisible) {
    //     const toastText = await page.evaluate(() => {
    //       const toast = document.querySelector('.Toastify__toast, [role="alert"], .MuiSnackbar-root');
    //       return toast ? toast.textContent : '';
    //     });
        
    //     log.push(`✅ Notification shown: "${toastText}"`);
    //   }
    // } catch {
    //   log.push('ℹ️ No toast notification detected (might be using alert instead)');
    // }
    
    // 7. ตรวจสอบสถานะใหม่ของผู้ใช้ (ควรจะเปลี่ยนจาก "Suspend" เป็น "Activate")
    await new Promise(res => setTimeout(res, 1000)); // รอให้ UI อัพเดต
    
    const userStatusChange = await page.evaluate(username => {
      const rows = Array.from(document.querySelectorAll('tr'));
      for (const row of rows) {
        if ([...row.querySelectorAll('td')].some(td => td.textContent.includes(username))) {
          // ตรวจสอบปุ่มว่าเปลี่ยนเป็น Activate หรือไม่
          const button = Array.from(row.querySelectorAll('button')).find(b => 
            b.textContent.includes('Activate') || 
            b.classList.contains('green') ||
            window.getComputedStyle(b).color.includes('0, 128, 0') // สีเขียว
          );
          
          // ตรวจสอบว่ามีการแสดงสถานะ Suspended หรือไม่
          const statusCell = [...row.querySelectorAll('td')].find(td => 
            td.textContent.includes('Suspended') || 
            td.textContent.includes('Inactive')
          );
          
          return {
            activateButtonFound: !!button,
            suspendedStatusFound: !!statusCell
          };
        }
      }
      return { activateButtonFound: false, suspendedStatusFound: false };
    }, username);
    
    const confirmSuspendTime = Date.now() - startConfirmSuspend;
    log.push(`⏱️ Confirm Suspend Processing Time: ${confirmSuspendTime} ms`);
    
    if (userStatusChange.activateButtonFound) {
      log.push('✅ User status changed: "Suspend" button changed to "Activate"');
    } else {
      log.push('⚠️ Could not verify button change to "Activate"');
    }
    
    if (userStatusChange.suspendedStatusFound) {
      log.push('✅ User status indicator shows "Suspended" or "Inactive"');
    }
    
    // รวมเวลาทั้งหมดของการ Suspend
    const totalSuspendTime = Date.now() - startSuspend;
    log.push(`⏱️ Total Suspend User Time: ${totalSuspendTime} ms`);
    log.push(`🌐 Final URL: ${page.url()}`);
    log.push(`📊 Suspend Success: ${userStatusChange.activateButtonFound ? 'Yes' : 'Unconfirmed'}`);

    // เขียน log ลงไฟล์แบบเขียนทับ
    fs.writeFileSync(logFilename, log.join('\n'), 'utf8');
    console.log('\n📝 Log saved to', logFilename);
    console.log(log.join('\n'));

  } catch (err) {
    const errorLog = `[${now()}] ❌ Unexpected error: ${err.message}`;
    console.error(errorLog);
    log.push(errorLog);
    fs.writeFileSync(logFilename, log.join('\n'), 'utf8');
  } finally {
    await browser?.close();
  }
})();