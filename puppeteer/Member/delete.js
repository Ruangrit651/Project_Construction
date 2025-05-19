require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');

// ฟังก์ชันคืนเวลาปัจจุบันในรูปแบบ ISO string
function now() {
  return new Date().toISOString();
}

// ชื่อไฟล์ log (เขียนทับทุกครั้ง)
const logFilename = 'Delete_performance_log.txt';

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

    // หา user_id ของ user ที่เพิ่งสร้าง
    const userId = await page.evaluate(username => {
      const rows = Array.from(document.querySelectorAll('tr'));
      for (const row of rows) {
        if ([...row.querySelectorAll('td')].some(td => td.textContent.includes(username))) {
          // หา column ที่น่าจะเป็น user_id (อาจเป็น column แรก)
          const cells = [...row.querySelectorAll('td')];
          if (cells.length > 0) {
            // ถ้ามี cell แรกที่มี ID format
            const firstCellText = cells[0].textContent.trim();
            if (firstCellText.match(/^[a-zA-Z0-9-]+$/)) {
              return firstCellText;
            }
          }
        }
      }
      return "unknown-id"; // กรณีไม่พบ ID
    }, username);
    
    log.push(`👤 User ID: ${userId}`);

    // =================== เริ่มการทดสอบ Delete User ===================
    
    const startDelete = Date.now();

    // 1. คลิกปุ่ม Delete ของ user ที่เพิ่งสร้าง
    const deleteButtonClicked = await page.evaluate(username => {
      const rows = Array.from(document.querySelectorAll('tr'));
      for (const row of rows) {
        if ([...row.querySelectorAll('td')].some(td => td.textContent.includes(username))) {
          // หาปุ่ม Delete (อาจจะมีข้อความว่า "Delete" หรือ icon ถังขยะ)
          const deleteButtons = Array.from(row.querySelectorAll('button')).filter(b => 
            b.textContent.trim() === 'Delete' || 
            b.querySelector('svg[data-testid="DeleteIcon"]') ||
            b.classList.contains('delete-button') ||
            b.title?.includes('Delete')
          );
          
          if (deleteButtons.length > 0) {
            deleteButtons[0].click();
            return true;
          }
        }
      }
      return false;
    }, username);

    if (!deleteButtonClicked) {
      throw new Error('ไม่พบปุ่ม Delete ในแถวของ user');
    }
    
    const deleteButtonClickTime = Date.now() - startDelete;
    log.push(`🔴 Delete Button Click Time: ${deleteButtonClickTime} ms`);
    log.push('🟢 Clicked "Delete" button for the user');

    // 2. รอให้ Dialog ยืนยันการ Delete ปรากฏ
    await page.waitForSelector('[role="dialog"], .MuiDialog-root');
    
    // 3. ตรวจสอบข้อความใน Dialog ให้ตรงกับ component จริง
    const dialogContentCheck = await page.evaluate((expectedUsername, expectedUserId) => {
      const dialog = document.querySelector('[role="dialog"], .MuiDialog-root');
      if (!dialog) return { success: false, reason: 'Dialog not found' };
      
      // ตรวจสอบหัวข้อ Dialog
      const title = dialog.querySelector('h2, [role="heading"]');
      if (!title || title.textContent.trim() !== 'Delete User') {
        return { success: false, reason: 'Dialog title is not exactly "Delete User"' };
      }
      
      // ตรวจสอบการแสดง User ID
      const hasUserId = Array.from(dialog.querySelectorAll('label, strong, span'))
        .some(el => el.textContent.includes('Id:') && el.textContent.includes(expectedUserId));
      
      if (!hasUserId) {
        return { success: false, reason: 'Dialog does not display user ID correctly' };
      }
      
      // ตรวจสอบการแสดง Username
      const hasUsername = Array.from(dialog.querySelectorAll('label, strong, span'))
        .some(el => el.textContent.includes('Username:') && el.textContent.includes(expectedUsername));
      
      if (!hasUsername) {
        return { success: false, reason: 'Dialog does not display username correctly' };
      }
      
      // ตรวจสอบปุ่ม Cancel และ Delete
      const buttons = Array.from(dialog.querySelectorAll('button'));
      const hasCancel = buttons.some(b => b.textContent.includes('Cancel'));
      const hasDelete = buttons.some(b => b.textContent.includes('Delete'));
      
      if (!hasCancel || !hasDelete) {
        return { success: false, reason: `Missing buttons: ${!hasCancel ? 'Cancel ' : ''}${!hasDelete ? 'Delete' : ''}` };
      }
      
      return { success: true };
    }, username, userId);
    
    if (dialogContentCheck.success) {
      log.push('✅ Delete confirmation dialog shows correct content');
    } else {
      log.push(`⚠️ Dialog content issue: ${dialogContentCheck.reason}`);
    }

        // 4. กดปุ่ม "Delete" ใน Dialog
    const startConfirmDelete = Date.now();
    
    const confirmDialogClicked = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"], .MuiDialog-root');
      if (!dialog) return false;
      
      // วิธีค้นหาปุ่ม Delete ที่มีความยืดหยุ่นมากขึ้น
      let deleteButtons = [];
      
      // วิธีที่ 1: หาปุ่มที่มีข้อความว่า Delete
      deleteButtons = Array.from(dialog.querySelectorAll('button')).filter(b => 
        b.textContent.includes('Delete')
      );
      
      // วิธีที่ 2: ถ้าไม่พบ ให้หาปุ่มที่มีสีแดงหรือตำแหน่งขวาสุด (มักเป็นปุ่ม action หลัก)
      if (deleteButtons.length === 0) {
        const allButtons = Array.from(dialog.querySelectorAll('button'));
        // หาปุ่มที่มีสีแดงหรืออยู่ขวาสุด
        deleteButtons = allButtons.filter(b => 
          b.getAttribute('color') === 'red' || 
          window.getComputedStyle(b).color.includes('255')
        );
        
        // ถ้ายังไม่พบ ให้เลือกปุ่มสุดท้าย (มักเป็นปุ่ม action หลัก)
        if (deleteButtons.length === 0 && allButtons.length > 0) {
          deleteButtons = [allButtons[allButtons.length - 1]];
        }
      }
      
      // วิธีที่ 3: ค้นหาตาม DOM structure ของ Radix UI
      if (deleteButtons.length === 0) {
        // Radix อาจซ่อนปุ่มในโครงสร้างซับซ้อน
        const dialogFooter = dialog.querySelector('[mt="4"], [justify="end"]');
        if (dialogFooter) {
          const footerButtons = Array.from(dialogFooter.querySelectorAll('button'));
          // ปุ่มที่อยู่ด้านขวาของ footer มักเป็นปุ่ม action หลัก
          if (footerButtons.length > 0) {
            deleteButtons = [footerButtons[footerButtons.length - 1]];
          }
        }
      }
      
      // วิธีที่ 4: Debug โครงสร้าง
      console.log('Available buttons in dialog:', 
        Array.from(dialog.querySelectorAll('button')).map(b => ({
          text: b.textContent.trim(),
          color: b.getAttribute('color'),
          classes: Array.from(b.classList)
        }))
      );
      
      if (deleteButtons.length > 0) {
        deleteButtons[0].click();
        return true;
      }
      
      return false;
    });
    
    if (!confirmDialogClicked) {
      throw new Error('ไม่พบปุ่ม "Delete" ใน Dialog');
    }
    
    // 5. รอให้ Dialog ปิดหลังจากกดยืนยัน
    try {
      await page.waitForSelector('[role="dialog"], .MuiDialog-root', { hidden: true, timeout: 5000 });
      log.push('✅ Delete confirmation dialog closed after confirmation');
    } catch {
      log.push('⚠️ Delete confirmation dialog did not close after confirmation');
    }
    
    // 6. ตรวจสอบการแสดง Toast notification ให้ตรงกับข้อความที่ส่งมาจาก component
    try {
      const toastVisible = await page.waitForFunction(
        (expectedUsername) => {
          const toasts = document.querySelectorAll('.Toastify__toast, [role="alert"], .MuiSnackbar-root');
          if (toasts.length === 0) return false;
          
          // ตรวจสอบข้อความใน toast ว่าตรงกับรูปแบบที่ expected หรือไม่
          const expectedMessage = `User "${expectedUsername}" deleted successfully`;
          return Array.from(toasts).some(toast => toast.textContent.includes(expectedMessage));
        },
        { timeout: 3000 },
        username
      );
      
      if (toastVisible) {
        const toastText = await page.evaluate(() => {
          const toast = document.querySelector('.Toastify__toast, [role="alert"], .MuiSnackbar-root');
          return toast ? toast.textContent : '';
        });
        
        log.push(`✅ Success notification shown: "${toastText}"`);
        
        // Check if toast has success styling
        const isSuccessToast = await page.evaluate(() => {
          const toast = document.querySelector('.Toastify__toast, [role="alert"], .MuiSnackbar-root');
          return toast && (
            toast.classList.contains('Toastify__toast--success') || 
            toast.classList.contains('success') ||
            toast.style.backgroundColor.includes('green')
          );
        });
        
        if (isSuccessToast) {
          log.push('✅ Toast has success styling');
        }
      }
    } catch {
      log.push('ℹ️ No toast notification detected (might be using alert instead)');
      
      // ตรวจสอบ alert ถ้าไม่มี toast
      const alertMessage = await page.evaluate(() => {
        return window.alert ? window._lastAlertMessage || '' : '';
      });
      
      if (alertMessage) {
        log.push(`ℹ️ Alert message shown instead: "${alertMessage}"`);
      }
    }
    
    // 7. ตรวจสอบว่า user ถูกลบไปแล้ว (ไม่ปรากฏในตาราง)
    await new Promise(res => setTimeout(res, 1000)); // รอให้ UI อัพเดต
    
    const userDeleted = await page.evaluate(username => {
      const rows = Array.from(document.querySelectorAll('tr'));
      return !rows.some(row => 
        [...row.querySelectorAll('td')].some(td => td.textContent.includes(username))
      );
    }, username);
    
    const confirmDeleteTime = Date.now() - startConfirmDelete;
    log.push(`⏱️ Confirm Delete Processing Time: ${confirmDeleteTime} ms`);
    
    if (userDeleted) {
      log.push('✅ User was successfully deleted and removed from the table');
    } else {
      log.push('⚠️ User still appears in the table after deletion attempt');
    }
    
    // รวมเวลาทั้งหมดของการ Delete
    const totalDeleteTime = Date.now() - startDelete;
    log.push(`⏱️ Total Delete User Time: ${totalDeleteTime} ms`);
    log.push(`🌐 Final URL: ${page.url()}`);
    log.push(`📊 Delete Success: ${userDeleted ? 'Yes' : 'No'}`);

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