require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');

// 🔧 ฟังก์ชันคืนวันที่และเวลาในรูปแบบ วัน/เดือน/ปี ชั่วโมง:นาที:วินาที
function now() {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

const logFilename = 'Edit_performance_log.txt';

(async () => {
  const log = [];
  let browser;

  try {
    // =================== ขั้นตอนที่ 0: เตรียมระบบและล็อกอิน ===================
    const startFullTest = Date.now();
    log.push(`📅 เวลาเริ่มทดสอบทั้งหมด: ${now()}`);
    log.push(`🧪 เริ่มการทดสอบการแก้ไขข้อมูลสมาชิก (Create → Edit → Validate)`);
    
    // เปิด browser แบบไม่เป็น headless
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

    // =================== ขั้นตอนที่ 1: สร้างสมาชิกใหม่ ===================
    log.push(`📅 เวลา: ${now()}`);
    log.push('🔄 เริ่มสร้างสมาชิกใหม่สำหรับทดสอบการแก้ไข...');

    // ค้นหาและคลิกปุ่ม "Create"
    await page.waitForSelector('button');
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent.trim(), btn);
      if (text === 'Create') {
        await btn.click();
        log.push('🟢 คลิกปุ่ม "Create" สำเร็จ');
        break;
      }
    }

    // กรอกข้อมูลสำหรับสร้าง user ใหม่
    await page.waitForSelector('input[placeholder="Enter username"]');
    const username = 'testuser_' + Date.now();
    const password = 'testpassword123';

    const startCreate = Date.now();
    await page.type('input[placeholder="Enter username"]', username);
    log.push(`📝 กรอก Username: ${username}`);
    await page.type('input[placeholder="Enter password"]', password);
    log.push('📝 กรอกรหัสผ่าน');

    // เลือก role และ project ใน combobox
    log.push('🔄 กำลังเลือกบทบาทและโปรเจกต์...');
    const comboboxes = await page.$$('[role="combobox"]');
    for (const box of comboboxes) {
      await box.click();
      await page.waitForSelector('[role="option"]');
      const options = await page.$$('[role="option"]');
      if (options.length > 0) {
        await options[0].click();
      }
    }
    log.push('✅ เลือกบทบาทและโปรเจกต์สำเร็จ');

    // คลิกปุ่ม Create ใน dialog
    const dialog = await page.$('[role="dialog"], .MuiDialog-root');
    if (dialog) {
      const dialogButtons = await dialog.$$('button');
      for (const btn of dialogButtons) {
        const text = await page.evaluate(el => el.textContent.trim(), btn);
        if (text === 'Create') {
          await btn.click();
          log.push('🟢 คลิกปุ่ม "Create" ในไดอะล็อกเพื่อบันทึก');
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
    log.push(`✅ สร้างสมาชิกสำเร็จ`);

    // รอให้ dialog ปิดก่อนดำเนินการต่อ
    try {
      await page.waitForSelector('.MuiDialog-root, [role="dialog"]', { hidden: true, timeout: 3000 });
    } catch {}
    await new Promise(res => setTimeout(res, 500)); // หน่วงรอเล็กน้อย
    log.push(`✅ ขั้นตอนที่ 1 เสร็จสิ้น: สร้างสมาชิกสำเร็จ`);

    // =================== ขั้นตอนที่ 2: ค้นหาและเปิดฟอร์มแก้ไขสมาชิก ===================
    log.push(`📅 เวลา: ${now()}`);
    log.push('🔄 กำลังค้นหาและเปิดฟอร์มแก้ไขสมาชิก...');
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
    log.push(`🖊️ เวลาการคลิกปุ่ม Edit: ${editButtonClickTime} ms`);
    log.push('🟢 คลิกปุ่ม "Edit" สำหรับสมาชิกที่เลือกสำเร็จ');

    // ตรวจสอบว่า dialog แสดง username เดิมถูกต้องหรือไม่
    await page.waitForSelector('[role="dialog"], .MuiDialog-root');
    const initialDataCorrect = await page.evaluate((expectedUsername) => {
      const currentUsernameElement = Array.from(document.querySelectorAll('label'))
        .find(el => el.textContent.includes('Current Username:'));
      return currentUsernameElement && currentUsernameElement.textContent.includes(expectedUsername);
    }, username);

    if (initialDataCorrect) {
      log.push('✅ ฟอร์มแก้ไขแสดงข้อมูลเริ่มต้นถูกต้อง');
    } else {
      log.push('⚠️ ฟอร์มแก้ไขอาจแสดงข้อมูลเริ่มต้นไม่ถูกต้อง');
    }
    log.push(`✅ ขั้นตอนที่ 2 เสร็จสิ้น: เปิดฟอร์มแก้ไขสำเร็จ`);

    // =================== ขั้นตอนที่ 3: แก้ไขข้อมูลสมาชิก ===================
    log.push(`📅 เวลา: ${now()}`);
    log.push('🔄 กำลังแก้ไขข้อมูลสมาชิก...');

    // เปลี่ยนชื่อ username ใหม่
    const newUsername = `edited_${username}`;
    await page.evaluate(() => {
      const usernameInput = document.querySelector('input[placeholder="Enter new username"]');
      if (usernameInput) usernameInput.value = '';
    });

    const startFormEdit = Date.now();
    await page.type('input[placeholder="Enter new username"]', newUsername);
    log.push(`📝 เปลี่ยน username เป็น: ${newUsername}`);

    // ลองเปลี่ยน role อีกครั้ง (หากมีให้เปลี่ยน)
    const editComboboxes = await page.$$('[role="combobox"]');
    if (editComboboxes.length > 0) {
      try {
        await editComboboxes[0].click();
        await page.waitForSelector('[role="option"]');
        const options = await page.$$('[role="option"]');
        if (options.length > 1) {
          await options[1].click();
          log.push('✅ เปลี่ยนการเลือกบทบาทสำเร็จ');
        }
      } catch (e) {
        log.push(`⚠️ ไม่สามารถเปลี่ยนบทบาทได้: ${e.message}`);
      }
    }

    const formEditTime = Date.now() - startFormEdit;
    log.push(`⌨️ เวลาการแก้ไขข้อมูลในฟอร์ม: ${formEditTime} ms`);
    log.push(`✅ ขั้นตอนที่ 3 เสร็จสิ้น: แก้ไขข้อมูลเรียบร้อย`);

    // =================== ขั้นตอนที่ 4: บันทึกการเปลี่ยนแปลง ===================
    log.push(`📅 เวลา: ${now()}`);
    log.push('🔄 กำลังบันทึกการเปลี่ยนแปลงข้อมูล...');
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
        log.push('🟢 คลิกปุ่ม "Update" เพื่อบันทึกการเปลี่ยนแปลง');

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
            log.push('❌ ไม่สามารถอัปเดทได้: ชื่อผู้ใช้มีอยู่แล้ว');
            fs.writeFileSync(logFilename, log.join('\n'), 'utf8');
            console.log('\n📝 บันทึก Log ไปยัง', logFilename);
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
      log.push('✅ ปิดฟอร์มแก้ไขหลังจากอัปเดทสำเร็จ');
    } catch {
      log.push('⚠️ ฟอร์มแก้ไขไม่ปิดหลังจากการอัปเดท');
    }
    log.push(`✅ ขั้นตอนที่ 4 เสร็จสิ้น: บันทึกการเปลี่ยนแปลงสำเร็จ`);

    // =================== ขั้นตอนที่ 5: ตรวจสอบการอัปเดท ===================
    log.push(`📅 เวลา: ${now()}`);
    log.push('🔄 กำลังตรวจสอบข้อมูลที่อัปเดท...');

    // ตรวจสอบว่าข้อมูลในตารางถูกอัปเดตจริง
    let updateSuccessful = false;
    try {
      await page.waitForFunction(
        newUsername => [...document.querySelectorAll('td')].some(td => td.textContent.includes(newUsername)),
        { timeout: 5000 },
        newUsername
      );
      updateSuccessful = true;
      log.push('✅ สมาชิกถูกอัปเดทในตารางสำเร็จ');
    } catch (e) {
      log.push(`⚠️ ไม่สามารถตรวจสอบการอัปเดทสมาชิกในตาราง: ${e.message}`);
    }

    const saveTime = Date.now() - startSave;
    log.push(`💾 เวลาในการบันทึกและอัปเดท: ${saveTime} ms`);

    const totalEditTime = Date.now() - startEdit;
    log.push(`⏱️ เวลาทั้งหมดในการแก้ไขสมาชิก: ${totalEditTime} ms`);
    log.push(`🌐 URL สุดท้าย: ${page.url()}`);
    log.push(`📊 สถานะการอัปเดท: ${updateSuccessful ? 'สำเร็จ' : 'ไม่สำเร็จ'}`);
    log.push(`✅ ขั้นตอนที่ 5 เสร็จสิ้น: ตรวจสอบการอัปเดทสำเร็จ`);

    // =================== สรุปผลการทดสอบ ===================
    const totalTestTime = Date.now() - startFullTest;
    log.push(`📅 เวลาสิ้นสุดการทดสอบ: ${now()}`);
    log.push(`⏱️ ระยะเวลาทดสอบทั้งหมด: ${totalTestTime} ms`);
    log.push(`🔍 สรุปเวลาในแต่ละขั้นตอน:`);
    log.push(`   - สร้างสมาชิก: ${createTime} ms`);
    log.push(`   - คลิกปุ่มแก้ไข: ${editButtonClickTime} ms`);
    log.push(`   - แก้ไขข้อมูลในฟอร์ม: ${formEditTime} ms`);
    log.push(`   - บันทึกและอัปเดท: ${saveTime} ms`);
    log.push(`   - รวมเวลาการแก้ไขทั้งหมด: ${totalEditTime} ms`);
    log.push(`✅ การทดสอบการแก้ไขข้อมูลสมาชิกเสร็จสิ้น`);

    // บันทึก log ลงไฟล์
    fs.writeFileSync(logFilename, log.join('\n'), 'utf8');
    console.log('\n📝 บันทึก Log ไปยัง', logFilename);
    console.log(log.join('\n'));

  } catch (err) {
    // กรณีเกิด error ไม่คาดคิด
    const errorLog = `[${now()}] ❌ เกิดข้อผิดพลาดที่ไม่คาดคิด: ${err.message}`;
    console.error(errorLog);
    log.push(errorLog);
    fs.writeFileSync(logFilename, log.join('\n'), 'utf8');
  } finally {
    await browser?.close(); // ปิด browser เมื่อเสร็จสิ้น
  }
})();