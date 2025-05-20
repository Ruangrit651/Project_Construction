require('dotenv').config(); // โหลดไฟล์ .env เพื่อใช้ค่าตัวแปรสภาพแวดล้อม
const puppeteer = require('puppeteer'); // เรียกใช้ Puppeteer สำหรับควบคุม browser
const fs = require('fs'); // ใช้สำหรับเขียนไฟล์ log

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

const logFilename = 'Edit_performance_log.txt'; // ชื่อไฟล์ log ที่จะบันทึกข้อมูล

(async () => {
  const log = []; // ตัวแปรเก็บข้อความ log
  let browser;

  try {
    // เปิด browser แบบไม่เป็น headless (เห็นหน้าจอ)
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--disable-features=PasswordManagerEnabled,AutomaticPasswordSaving',
        '--disable-save-password-bubble'
      ]
    });

    const page = await browser.newPage();

    // โหลดหน้าเว็บหลัก
    const startLoad = Date.now();
    await page.goto(process.env.APP_URL, { waitUntil: 'networkidle0' });
    const pageLoadTime = Date.now() - startLoad;
    log.push(`📅 Timestamp: ${now()}`);
    log.push(`🚀 Page Load Time: ${pageLoadTime} ms`);

    // กรอกฟอร์ม Login
    const startLogin = Date.now();
    await page.type('#username', process.env.LOGIN_USERNAME);
    await page.type('#password', process.env.LOGIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    const loginTime = Date.now() - startLogin;
    log.push(`🔐 Login Time: ${loginTime} ms`);
    log.push(`✅ Login success: ${page.url()}`);

    // ค้นหาและคลิกปุ่ม "Create"
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

    // กรอกข้อมูลสำหรับสร้าง user ใหม่
    await page.waitForSelector('input[placeholder="Enter username"]');
    const username = 'testuser_' + Date.now(); // ตั้งชื่อ username ให้ไม่ซ้ำ
    const password = 'testpassword123';

    const startCreate = Date.now();
    await page.type('input[placeholder="Enter username"]', username);
    await page.type('input[placeholder="Enter password"]', password);

    // เลือก role และ project ใน combobox
    const comboboxes = await page.$$('[role="combobox"]');
    for (const box of comboboxes) {
      await box.click();
      await page.waitForSelector('[role="option"]');
      const options = await page.$$('[role="option"]');
      if (options.length > 0) {
        await options[0].click();
      }
    }

    // คลิกปุ่ม Create ใน dialog
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

    // ตรวจสอบว่า user ถูกสร้างแล้ว (หา username ในตาราง)
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
    await new Promise(res => setTimeout(res, 500)); // หน่วงรอเล็กน้อย

    // =================== เริ่มทดสอบการ Edit User ===================

    const startEdit = Date.now();

    // หาปุ่ม Edit ในตารางของ user ที่สร้าง และคลิก
    const editButtonClicked = await page.evaluate(username => {
      const rows = Array.from(document.querySelectorAll('tr'));
      for (const row of rows) {
        if ([...row.querySelectorAll('td')].some(td => td.textContent.includes(username))) {
          const btn = Array.from(row.querySelectorAll('button')).find(b => b.textContent.trim() === 'Edit');
          if (btn) {
            btn.click();
            return true;
          }
        }
      }
      return false;
    }, username);

    if (!editButtonClicked) throw new Error('ไม่พบปุ่ม Edit ในแถวของ user');

    const editButtonClickTime = Date.now() - startEdit;
    log.push(`🖊️ Edit Button Click Time: ${editButtonClickTime} ms`);
    log.push('🟢 Clicked "Edit" button for the user');

    // ตรวจสอบว่า dialog แสดง username เดิมถูกต้องหรือไม่
    await page.waitForSelector('[role="dialog"], .MuiDialog-root');
    const initialDataCorrect = await page.evaluate((expectedUsername) => {
      const currentUsernameElement = Array.from(document.querySelectorAll('label'))
        .find(el => el.textContent.includes('Current Username:'));
      return currentUsernameElement && currentUsernameElement.textContent.includes(expectedUsername);
    }, username);

    if (initialDataCorrect) {
      log.push('✅ Edit dialog shows correct initial data');
    } else {
      log.push('⚠️ Edit dialog may not show correct initial data');
    }

    // เปลี่ยนชื่อ username ใหม่
    const newUsername = `edited_${username}`;
    await page.evaluate(() => {
      const usernameInput = document.querySelector('input[placeholder="Enter new username"]');
      if (usernameInput) usernameInput.value = '';
    });

    const startFormEdit = Date.now();
    await page.type('input[placeholder="Enter new username"]', newUsername);
    log.push(`👤 Changed username to: ${newUsername}`);

    // ลองเปลี่ยน role อีกครั้ง (หากมีให้เปลี่ยน)
    const editComboboxes = await page.$$('[role="combobox"]');
    if (editComboboxes.length > 0) {
      try {
        await editComboboxes[0].click();
        await page.waitForSelector('[role="option"]');
        const options = await page.$$('[role="option"]');
        if (options.length > 1) {
          await options[1].click();
          log.push('✅ Changed role selection');
        }
      } catch (e) {
        log.push(`⚠️ Could not change role: ${e.message}`);
      }
    }

    const formEditTime = Date.now() - startFormEdit;
    log.push(`⌨️ Form Edit Time: ${formEditTime} ms`);

    const startSave = Date.now();

    // คลิกปุ่ม Update เพื่อบันทึกการเปลี่ยนแปลง
    const editDialog = await page.$('[role="dialog"], .MuiDialog-root');
    const saveButtons = await editDialog.$$('button');
    let saveClicked = false;

    for (const btn of saveButtons) {
      const text = await page.evaluate(el => el.textContent.trim(), btn);
      if (text === 'Update') {
        await btn.click();
        saveClicked = true;
        log.push('🟢 Clicked "Update" button to save changes');

        // ตรวจสอบว่ามี error ข้อความ username ซ้ำหรือไม่
        try {
          const duplicateErrorAppeared = await page.waitForFunction(() => {
            const errorTexts = Array.from(document.querySelectorAll('*')).map(el => el.textContent);
            return errorTexts.some(text =>
              text.includes('username already exists') || 
              text.includes('Username already in use') || 
              text.includes('ชื่อผู้ใช้นี้ถูกใช้แล้ว')
            );
          }, { timeout: 3000 });

          if (duplicateErrorAppeared) {
            log.push('❌ Cannot update: Username already exists');
            fs.writeFileSync(logFilename, log.join('\n'), 'utf8');
            console.log('\n📝 Log saved to', logFilename);
            console.log(log.join('\n'));
            await browser.close();
            return;
          }
        } catch {
          // ไม่พบ error ข้อความ
        }

        break;
      }
    }

    if (!saveClicked) throw new Error('ไม่พบปุ่ม Update ในฟอร์ม Edit');

    // รอให้ dialog ปิด
    try {
      await page.waitForSelector('.MuiDialog-root, [role="dialog"]', { hidden: true, timeout: 5000 });
      log.push('✅ Edit dialog closed after update');
    } catch {
      log.push('⚠️ Edit dialog did not close after update');
    }

    // ตรวจสอบว่าข้อมูลในตารางถูกอัปเดตจริง
    let updateSuccessful = false;
    try {
      await page.waitForFunction(
        newUsername => [...document.querySelectorAll('td')].some(td => td.textContent.includes(newUsername)),
        { timeout: 5000 },
        newUsername
      );
      updateSuccessful = true;
      log.push('✅ User updated successfully in table');
    } catch (e) {
      log.push(`⚠️ Could not verify user update in table: ${e.message}`);
    }

    const saveTime = Date.now() - startSave;
    log.push(`💾 Save and Update Time: ${saveTime} ms`);

    const totalEditTime = Date.now() - startEdit;
    log.push(`⏱️ Total Edit User Time: ${totalEditTime} ms`);
    log.push(`🌐 Final URL: ${page.url()}`);
    log.push(`📊 Update Success: ${updateSuccessful ? 'Yes' : 'No'}`);

    // บันทึก log ลงไฟล์
    fs.writeFileSync(logFilename, log.join('\n'), 'utf8');
    console.log('\n📝 Log saved to', logFilename);
    console.log(log.join('\n'));

  } catch (err) {
    // กรณีเกิด error ไม่คาดคิด
    const errorLog = `[${now()}] ❌ Unexpected error: ${err.message}`;
    console.error(errorLog);
    log.push(errorLog);
    fs.writeFileSync(logFilename, log.join('\n'), 'utf8');
  } finally {
    await browser?.close(); // ปิด browser เมื่อเสร็จสิ้น
  }
})();
