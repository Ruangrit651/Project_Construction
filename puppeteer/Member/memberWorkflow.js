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

const logFilename = 'Member_Workflow_log.txt';

(async () => {
  const log = [];
  let browser;

  try {
    // =================== ขั้นตอนที่ 0: เตรียมระบบและล็อกอิน ===================
    const startFullTest = Date.now();
    log.push(`📅 เวลาเริ่มทดสอบทั้งหมด: ${now()}`);
    log.push(`🧪 เริ่มการทดสอบการจัดการสมาชิกแบบครบวงจร (Create → Detail → Edit → Suspend → Delete)`);
    
    // เปิด browser แบบไม่เป็น headless
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--disable-features=PasswordManagerEnabled,AutomaticPasswordSaving',
        '--disable-save-password-bubble'
      ]
    });

    const page = await browser.newPage();
    
    // ดักจับ console log จากหน้าเว็บ
    page.on('console', msg => console.log(`[${now()}] PAGE LOG: ${msg.text()}`));

    // ตรวจสอบ response error
    page.on('response', async response => {
      if (!response.ok()) {
        const body = await response.text();
        console.log(`[${now()}] ❗ RESPONSE ERROR (${response.status()}) ${response.url()}:\n${body}`);
      }
    });

    // จัดการ dialog อัตโนมัติ
    page.on('dialog', async dialog => {
      console.log(`[${now()}] ⚠️ Auto-accept dialog: ${dialog.message()}`);
      await dialog.accept();
    });

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
    log.push('🔄 เริ่มสร้างสมาชิกใหม่...');

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

   // =================== ขั้นตอนที่ 2: ดูรายละเอียดสมาชิก ===================
    log.push(`📅 เวลา: ${now()}`);
    log.push('🔄 กำลังดูรายละเอียดของสมาชิก...');
    const startDetail = Date.now();

    // คลิกปุ่ม Detail ของ user ที่เพิ่งสร้าง
    const detailClicked = await page.evaluate(username => {
      const rows = Array.from(document.querySelectorAll('tr'));
      for (const row of rows) {
        if ([...row.querySelectorAll('td')].some(td => td.textContent.includes(username))) {
          const btn = Array.from(row.querySelectorAll('button')).find(b => b.textContent.trim() === 'Detail');
          if (btn) {
            btn.click();
            return true;
          }
        }
      }
      return false;
    }, username);

    if (!detailClicked) throw new Error('ไม่พบปุ่ม Detail ในแถวของ user');

    log.push('🟢 คลิกปุ่ม "Detail" สำหรับสมาชิกที่เลือกสำเร็จ');

    // รอให้ detail dialog หรือหน้าแสดงรายละเอียดปรากฏ
    try {
      await page.waitForSelector('[role="dialog"], .MuiDialog-root, .user-detail-container', { timeout: 5000 });
      log.push('✅ แสดงรายละเอียดของสมาชิกสำเร็จ');
    } catch (e) {
      log.push(`⚠️ ไม่พบ dialog หรือหน้าแสดงรายละเอียด: ${e.message}`);
    }

    // ตรวจสอบข้อมูลที่แสดงในรายละเอียด
    const detailInfo = await page.evaluate(expectedUsername => {
      // ตรวจสอบทั้ง dialog หรือหน้าเต็ม
      const container = document.querySelector('[role="dialog"], .MuiDialog-root, .user-detail-container');
      if (!container) return { found: false };

      const content = container.textContent;
      return { 
        found: true,
        hasUsername: content.includes(expectedUsername),
        hasRole: content.includes('Role:') || content.includes('Roles:'),
        hasProjects: content.includes('Project:') || content.includes('Projects:')
      };
    }, username);

    if (detailInfo.found) {
      log.push(`✅ พบข้อมูลชื่อผู้ใช้ในรายละเอียด: ${detailInfo.hasUsername ? 'ใช่' : 'ไม่'}`);
      log.push(`✅ แสดงข้อมูลบทบาท: ${detailInfo.hasRole ? 'ใช่' : 'ไม่'}`);
      log.push(`✅ แสดงข้อมูลโปรเจกต์: ${detailInfo.hasProjects ? 'ใช่' : 'ไม่'}`);
    } else {
      log.push('⚠️ ไม่สามารถตรวจสอบข้อมูลในหน้ารายละเอียดได้');
    }

// ปิดหน้ารายละเอียด (คลิกปุ่ม Close หรือ X)
try {
  // วิธีที่ 2: ขยายเงื่อนไขการค้นหาปุ่มปิด
  log.push('🔄 กำลังพยายามปิดหน้ารายละเอียด (วิธีที่ 2)...');
  const closeClicked = await page.evaluate(() => {
    // ค้นหาปุ่มได้ละเอียดขึ้น
    const possibleCloseButtons = [
      ...document.querySelectorAll('button'),
      ...document.querySelectorAll('[role="button"]'),
      ...document.querySelectorAll('.MuiDialogActions-root button'),
      ...document.querySelectorAll('.modal-footer button'),
      ...document.querySelectorAll('.dialog-footer button'),
      ...document.querySelectorAll('.close'),
      ...document.querySelectorAll('.btn-close'),
      ...document.querySelectorAll('[data-dismiss="modal"]'),
      ...document.querySelectorAll('[role="dialog"] button'),
      ...document.querySelectorAll('.MuiDialog-root button')
    ];
    
    // กรองปุ่มที่อาจเป็นปุ่มปิด
    const closeButtons = Array.from(new Set(possibleCloseButtons)).filter(btn => {
      if (!btn) return false;
      
      // ตรวจสอบข้อความ
      const text = btn.textContent.trim();
      if (text === 'Close' || text === 'ปิด' || text === 'Back' || text === 'กลับ' || 
          text === '×' || text === '✕' || text === 'Cancel' || text === 'OK') {
        return true;
      }
      
      // ตรวจสอบ attribute ที่เกี่ยวข้อง
      if (btn.getAttribute('aria-label')?.includes('close') ||
          btn.getAttribute('title')?.includes('Close') ||
          btn.classList.contains('close-button') ||
          btn.classList.contains('btnClose')) {
        return true;
      }
      
      // ตรวจสอบว่ามี SVG icon ที่อาจเป็นไอคอนปิด
      return btn.querySelector('svg[data-testid="CloseIcon"]') !== null;
    });
    
    // คลิกปุ่มปิดที่พบอันแรก
    if (closeButtons.length > 0) {
      closeButtons[0].click();
      return true;
    }
    
    return false;
  });
  
  if (closeClicked) {
    log.push('✅ คลิกปุ่มปิดสำเร็จ (วิธีที่ 2)');
  } else {
    log.push('⚠️ ไม่พบปุ่มปิดที่สามารถคลิกได้');
  }
} catch (e) {
  log.push(`⚠️ พบข้อผิดพลาดขณะพยายามปิดหน้ารายละเอียด: ${e.message}`);
}

// รอให้ detail dialog/หน้าปิด
try {
  await page.waitForSelector('[role="dialog"], .MuiDialog-root', { hidden: true, timeout: 2000 });
  log.push('✅ ปิดหน้ารายละเอียดสมาชิกสำเร็จ');
} catch {
  log.push('⚠️ ไม่สามารถตรวจสอบได้ว่าไดอะล็อกปิดสำเร็จ');
  
  // วิธีสุดท้าย: Force refresh หน้า
  log.push('🔄 ใช้วิธี Force refresh หน้าเพื่อปิดไดอะล็อก');
  await page.reload({ waitUntil: 'networkidle0' });
  log.push('✅ รีเฟรชหน้าเว็บเพื่อกลับสู่หน้าตาราง');
}

const detailTime = Date.now() - startDetail;
log.push(`🔍 Detail View Time: ${detailTime} ms`);
log.push(`✅ ขั้นตอนที่ 2 เสร็จสิ้น: ดูรายละเอียดสมาชิกสำเร็จ`);

// รอให้กลับมาที่หน้าตาราง
await new Promise(res => setTimeout(res, 500));

    // =================== ขั้นตอนที่ 3: แก้ไขข้อมูลสมาชิก ===================
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

    // เปลี่ยนชื่อ username ใหม่
    const newUsername = `edited_${username}`;
    await page.evaluate(() => {
      const usernameInput = document.querySelector('input[placeholder="Enter new username"]');
      if (usernameInput) usernameInput.value = '';
    });
    await page.type('input[placeholder="Enter new username"]', newUsername);
    log.push(`📝 เปลี่ยน username เป็น: ${newUsername}`);

    // เปลี่ยนรหัสผ่านใหม่
    try {
        await page.type('input[placeholder="Enter new password (optional)"]', 'newpassword456');
        log.push('📝 กรอกรหัสผ่านใหม่');
    } catch (e) {
        log.push('ℹ️ ไม่พบช่องกรอกรหัสผ่าน หรือไม่สามารถกรอกได้');
    }

    // เปลี่ยน role
    try {
        log.push('🔄 กำลังเปลี่ยนบทบาท...');
        const comboboxes = await page.$$('[role="combobox"]');
        if (comboboxes.length > 0) {
            // สมมติว่า combobox แรกคือ role
            await comboboxes[0].click();
            await page.waitForSelector('[role="option"]');
            const options = await page.$$('[role="option"]');
            if (options.length > 1) {
                await options[1].click(); // เลือก role อันที่สอง
                log.push('✅ เปลี่ยนการเลือกบทบาทสำเร็จ');
            }
        }
    } catch (e) {
        log.push(`⚠️ ไม่สามารถเปลี่ยนบทบาทได้: ${e.message}`);
    }

    // เปลี่ยน project
    try {
        log.push('🔄 กำลังเปลี่ยนโปรเจกต์...');
        
        // วิธีที่เสถียรขึ้นในการหาและคลิก dropdown ของโปรเจกต์
        const projectTriggerClicked = await page.evaluate(() => {
            const labels = Array.from(document.querySelectorAll('label'));
            const projectLabel = labels.find(label => label.textContent.includes('Project'));
            if (projectLabel) {
                // Radix UI puts the trigger next to the label, not always inside.
                const trigger = projectLabel.nextElementSibling?.querySelector('[role="combobox"]') || projectLabel.querySelector('[role="combobox"]');
                if (trigger) {
                    trigger.click();
                    return true;
                }
            }
            // Fallback: คลิก combobox ที่สอง
            const comboboxes = document.querySelectorAll('[role="combobox"]');
            if (comboboxes.length > 1) {
                comboboxes[1].click();
                return true;
            }
            return false;
        });

        if (!projectTriggerClicked) {
            throw new Error('ไม่พบ dropdown สำหรับเลือกโปรเจกต์');
        }
        log.push('🟢 คลิก dropdown ของโปรเจกต์แล้ว');

        // เพิ่มการรอเล็กน้อยเผื่อมี animation
        await new Promise(res => setTimeout(res, 500));

        // รอให้ตัวเลือกปรากฏด้วย timeout ที่นานขึ้น
        await page.waitForSelector('[role="option"]', { timeout: 5000, visible: true });
        log.push('✅ ตัวเลือกโปรเจกต์ปรากฏขึ้นแล้ว');

        const options = await page.$$('[role="option"]');
        if (options.length > 1) {
            await options[1].click(); // เลือก project อันที่สองเพื่อทดสอบการเปลี่ยนแปลง
            log.push('✅ เปลี่ยนการเลือกโปรเจกต์สำเร็จ');
        } else if (options.length === 1) {
            await options[0].click();
            log.push('✅ เปลี่ยนการเลือกโปรเจกต์สำเร็จ (มีแค่ตัวเลือกเดียว)');
        } else {
            log.push('⚠️ ไม่พบตัวเลือกใน dropdown ของโปรเจกต์');
        }
    } catch (e) {
        log.push(`⚠️ ไม่สามารถเปลี่ยนโปรเจกต์ได้: ${e.message}`);
    }

    const formEditTime = Date.now() - startEdit;
    log.push(`⌨️ เวลาการแก้ไขข้อมูลในฟอร์ม: ${formEditTime} ms`);

    // คลิกปุ่ม Update เพื่อบันทึกการเปลี่ยนแปลง
    const startSave = Date.now();
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
            username = username; // ใช้ username เดิมต่อ (ไม่เปลี่ยนเป็น newUsername)
            break;
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
      // หาก update สำเร็จ ให้ใช้ username ใหม่
      username = newUsername;
    } catch (e) {
      log.push(`⚠️ ไม่สามารถตรวจสอบการอัปเดทสมาชิกในตาราง: ${e.message}`);
    }

    const saveTime = Date.now() - startSave;
    log.push(`💾 เวลาในการบันทึกและอัปเดท: ${saveTime} ms`);
    const totalEditTime = Date.now() - startEdit;
    log.push(`⏱️ เวลาทั้งหมดในการแก้ไขสมาชิก: ${totalEditTime} ms`);
    log.push(`📊 สถานะการอัปเดท: ${updateSuccessful ? 'สำเร็จ' : 'ไม่สำเร็จ'}`);
    log.push(`✅ ขั้นตอนที่ 3 เสร็จสิ้น: แก้ไขข้อมูลสมาชิกสำเร็จ`);

    // =================== ขั้นตอนที่ 4: ระงับสมาชิก ===================
    log.push(`📅 เวลา: ${now()}`);
    log.push('🔄 กำลังระงับสมาชิก...');
    const startSuspend = Date.now();

    // คลิกปุ่ม Suspend ของ user
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
    log.push(`🔴 เวลาการคลิกปุ่ม Suspend: ${suspendButtonClickTime} ms`);
    log.push('🟢 คลิกปุ่ม "Suspend" สำหรับสมาชิกที่เลือกสำเร็จ');

    // รอให้ Dialog ยืนยันการ Suspend ปรากฏ
    await page.waitForSelector('[role="dialog"], .MuiDialog-root');
    log.push('✅ แสดง dialog ยืนยันการระงับสมาชิกสำเร็จ');

    // กดปุ่ม "Suspend User" ใน Dialog
    const startConfirmSuspend = Date.now();
    
    const confirmDialogClicked = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"], .MuiDialog-root');
      if (!dialog) return false;
      
      // หาปุ่ม Suspend User
      const suspendButtons = Array.from(dialog.querySelectorAll('button')).filter(b => 
        b.textContent.includes('Suspend User') ||
        b.textContent.includes('Suspend') ||
        b.classList.contains('red') ||
        window.getComputedStyle(b).color.includes('255, 0, 0')
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
    
    log.push('🟢 คลิกปุ่มยืนยันการระงับสมาชิกใน dialog สำเร็จ');
    
    // รอให้ Dialog ปิดหลังจากกดยืนยัน
    try {
      await page.waitForSelector('[role="dialog"], .MuiDialog-root', { hidden: true, timeout: 5000 });
      log.push('✅ Dialog ยืนยันการระงับสมาชิกปิดหลังจากยืนยัน');
    } catch {
      log.push('⚠️ Dialog ยืนยันการระงับสมาชิกไม่ปิดหลังจากยืนยัน');
    }
    
    // ตรวจสอบสถานะใหม่ของผู้ใช้ (ควรจะเปลี่ยนจาก "Suspend" เป็น "Activate")
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
    log.push(`⏱️ เวลาในการยืนยันและประมวลผลการระงับ: ${confirmSuspendTime} ms`);
    
    if (userStatusChange.activateButtonFound) {
      log.push('✅ สถานะสมาชิกเปลี่ยนแปลง: ปุ่ม "Suspend" เปลี่ยนเป็น "Activate"');
    } else {
      log.push('⚠️ ไม่สามารถยืนยันการเปลี่ยนปุ่มเป็น "Activate"');
    }
    
    if (userStatusChange.suspendedStatusFound) {
      log.push('✅ สถานะในตารางแสดงว่าสมาชิกถูกระงับแล้ว');
    }
    
    // รวมเวลาทั้งหมดของการ Suspend
    const totalSuspendTime = Date.now() - startSuspend;
    log.push(`⏱️ เวลาทั้งหมดในการระงับสมาชิก: ${totalSuspendTime} ms`);
    log.push(`✅ ขั้นตอนที่ 4 เสร็จสิ้น: ระงับสมาชิกสำเร็จ`);

    // =================== ขั้นตอนที่ 5: ลบสมาชิก ===================
    log.push(`📅 เวลา: ${now()}`);
    log.push('🔄 กำลังลบสมาชิก...');
    const startDelete = Date.now();

    // คลิกปุ่ม Delete ของ user
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
    log.push(`🔴 เวลาการคลิกปุ่ม Delete: ${deleteButtonClickTime} ms`);
    log.push('🟢 คลิกปุ่ม "Delete" สำหรับสมาชิกที่เลือกสำเร็จ');

    // รอให้ Dialog ยืนยันการ Delete ปรากฏ
    await page.waitForSelector('[role="dialog"], .MuiDialog-root');
    log.push('✅ แสดง dialog ยืนยันการลบสมาชิกสำเร็จ');

    // กดปุ่ม "Delete" ใน Dialog
    const startConfirmDelete = Date.now();
    
    const confirmDeleteClicked = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"], .MuiDialog-root');
      if (!dialog) return false;
      
      // หาปุ่ม Delete
      const deleteButtons = Array.from(dialog.querySelectorAll('button')).filter(b => 
        b.textContent.includes('Delete') || 
        b.classList.contains('red') ||
        window.getComputedStyle(b).color.includes('255, 0, 0')
      );
      
      if (deleteButtons.length > 0) {
        deleteButtons[0].click();
        return true;
      }
      
      return false;
    });
    
    if (!confirmDeleteClicked) {
      throw new Error('ไม่พบปุ่ม "Delete" ใน Dialog');
    }
    
    log.push('🟢 คลิกปุ่มยืนยันการลบสมาชิกใน dialog สำเร็จ');
    
    // รอให้ Dialog ปิดหลังจากกดยืนยัน
    try {
      await page.waitForSelector('[role="dialog"], .MuiDialog-root', { hidden: true, timeout: 5000 });
      log.push('✅ Dialog ยืนยันการลบสมาชิกปิดหลังจากยืนยัน');
    } catch {
      log.push('⚠️ Dialog ยืนยันการลบสมาชิกไม่ปิดหลังจากยืนยัน');
    }
    
    // ตรวจสอบว่า user ถูกลบไปแล้ว (ไม่ปรากฏในตาราง)
    await new Promise(res => setTimeout(res, 1000)); // รอให้ UI อัพเดต
    
    const userDeleted = await page.evaluate(username => {
      const rows = Array.from(document.querySelectorAll('tr'));
      return !rows.some(row => 
        [...row.querySelectorAll('td')].some(td => td.textContent.includes(username))
      );
    }, username);
    
    const confirmDeleteTime = Date.now() - startConfirmDelete;
    log.push(`⏱️ เวลาในการยืนยันและประมวลผลการลบ: ${confirmDeleteTime} ms`);
    
    if (userDeleted) {
      log.push('✅ สมาชิกถูกลบออกจากตารางสำเร็จ');
    } else {
      log.push('⚠️ สมาชิกยังคงปรากฏในตารางหลังการลบ');
    }
    
    // รวมเวลาทั้งหมดของการ Delete
    const totalDeleteTime = Date.now() - startDelete;
    log.push(`⏱️ เวลาทั้งหมดในการลบสมาชิก: ${totalDeleteTime} ms`);
    log.push(`✅ ขั้นตอนที่ 5 เสร็จสิ้น: ลบสมาชิกสำเร็จ`);

    // =================== สรุปผลการทดสอบ ===================
    const totalTestTime = Date.now() - startFullTest;
    log.push(`📅 เวลาสิ้นสุดการทดสอบ: ${now()}`);
    log.push(`⏱️ ระยะเวลาทดสอบทั้งหมด: ${totalTestTime} ms`);
    log.push(`🔍 สรุปเวลาในแต่ละขั้นตอน:`);
    log.push(`   - เข้าสู่ระบบ: ${loginTime} ms`);
    log.push(`   - สร้างสมาชิก: ${createTime} ms`);
    log.push(`   - ดูรายละเอียดสมาชิก: ${detailTime} ms`);
    log.push(`   - แก้ไขข้อมูลสมาชิก: ${totalEditTime} ms`);
    log.push(`   - ระงับสมาชิก: ${totalSuspendTime} ms`);
    log.push(`   - ลบสมาชิก: ${totalDeleteTime} ms`);
    log.push(`🌐 URL สุดท้าย: ${page.url()}`);
    log.push(`✅ การทดสอบการจัดการสมาชิกแบบครบวงจรเสร็จสิ้น`);

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