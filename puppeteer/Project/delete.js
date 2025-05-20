require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');

// 🔧 ฟังก์ชันคืนวันที่และเวลาในรูปแบบ วัน/เดือน/ปี ชั่วโมง:นาที:วินาที
function now() {
  const date = new Date();
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

const logFilename = 'Project_Delete_log.txt';

(async () => {
  const log = [];
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--disable-features=PasswordManagerEnabled,AutomaticPasswordSaving',
        '--disable-save-password-bubble'
      ]
    });

    const page = await browser.newPage();

    // =================== เริ่มทดสอบ ===================
    const startLoad = Date.now();
    await page.goto(process.env.APP_URL, { waitUntil: 'networkidle0' });
    const pageLoadTime = Date.now() - startLoad;
    log.push(`📅 เวลา: ${now()}`);
    log.push(`🚀 Page Load Time: ${pageLoadTime} ms`);

    // =================== ล็อกอิน ===================
    const startLogin = Date.now();
    await page.type('#username', process.env.LOGIN_USERNAME);
    await page.type('#password', process.env.LOGIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    const loginTime = Date.now() - startLogin;
    log.push(`🔐 Login Time: ${loginTime} ms`);
    log.push(`✅ Login success: ${page.url()}`);

    // =================== นำทางไปยังหน้า Project ===================
    log.push(`📅 เวลา: ${now()}`);
    log.push('🔄 Navigating to Project page...');
    
    await page.goto(`${process.env.APP_URL}/adminproject`, { waitUntil: 'networkidle0' });
    
    log.push(`🔍 Current URL: ${page.url()}`);
    if (page.url().includes('/adminproject')) {
      log.push('✅ Successfully navigated to Project page');
    } else {
      throw new Error('Failed to navigate to Project page');
    }
    
    // =================== ตรวจสอบว่ามีโปรเจกต์ในตารางหรือไม่ ===================
    await page.waitForSelector('table', { timeout: 5000 });
    
    const hasProjects = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tr');
      // ถ้ามีแถวมากกว่า 1 แถว (มีแถวหัวตารางและแถวข้อมูล) แสดงว่ามีโปรเจกต์
      return rows.length > 1;
    });
    
    if (!hasProjects) {
    //   log.push('⚠️ No projects found. Creating a new project first...');
      
      // =================== สร้างโปรเจกต์ใหม่ ===================
      log.push('🔄 Looking for Create button...');
      
      await page.waitForFunction(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(btn => btn.textContent.includes('Create'));
      }, { timeout: 5000 });
      
      await page.$$eval('button', buttons => {
        const createButton = buttons.find(btn => btn.textContent.includes('Create'));
        if (createButton) {
          createButton.click();
          return true;
        }
        return false;
      });
      
      log.push('🟢 Clicked Create button');
      
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      log.push('✅ Create Project dialog opened');
      
      const projectName = `Delete Test Project ${Date.now()}`;
      await page.type('[placeholder="Enter project name"]', projectName);
      log.push(`📝 Entered Project Name: ${projectName}`);
      
      try {
        await page.$$eval('.select-trigger', selects => {
          const ownerSelect = selects.find(select => 
            select.textContent.includes('เลือกเจ้าของโปรเจกต์')
          );
          if (ownerSelect) ownerSelect.click();
        });
        
        await page.waitForSelector('[role="option"]', { timeout: 3000 });
        
        await page.$$eval('[role="option"]', options => {
          if (options.length > 0) options[0].click();
        });
        
        log.push('✅ Selected project owner');
      } catch (e) {
        log.push(`⚠️ Could not select project owner: ${e.message}`);
      }
      
      await page.type('[placeholder="Enter budget"]', '10000');
      log.push('📝 Entered Budget: 10,000');
      
    //   await page.type('[placeholder="Enter actual"]', '5000');
    //   log.push('📝 Entered Actual: 5,000');
      
      const today = new Date();
      const startDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      await page.type('input[type="date"]', startDate);
      log.push(`📝 Entered Start Date: ${startDate}`);
      
      today.setMonth(today.getMonth() + 1);
      const endDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      await page.$$eval('input[type="date"]', inputs => {
        if (inputs.length > 1) inputs[1].focus();
      });
      await page.keyboard.type(endDate);
      log.push(`📝 Entered End Date: ${endDate}`);
      
      await page.$$eval('button', buttons => {
        const saveButton = buttons.find(btn => btn.textContent.includes('Save'));
        if (saveButton) {
          saveButton.click();
          return true;
        }
        return false;
      });
      
      log.push('🟢 Clicked Save button');
      
      try {
        await page.waitForFunction(
          () => !document.querySelector('[role="dialog"]'),
          { timeout: 5000 }
        );
        log.push('✅ Dialog closed after save');
      } catch (e) {
        log.push(`⚠️ Dialog did not close: ${e.message}`);
      }
      
      try {
        await page.waitForFunction(
          (expectedProject) => {
            const cells = document.querySelectorAll('td');
            return Array.from(cells).some(cell => cell.textContent.includes(expectedProject));
          },
          { timeout: 5000 },
          projectName
        );
        
        log.push('✅ New project created and appears in the table');
      } catch (e) {
        log.push(`⚠️ New project not found in table: ${e.message}`);
        throw new Error('Failed to create a new project');
      }
      
    //   // รอสักครู่ให้ UI อัพเดท
    //   await page.waitForTimeout(1000);
    }

    // =================== ทดสอบการคลิกปุ่ม Delete ===================
    const startDelete = Date.now();
    log.push(`📅 เวลา: ${now()}`);
    log.push('🔄 Testing Delete Project functionality...');

    // รอให้ตารางแสดงข้อมูลโปรเจกต์โหลดเสร็จ
    await page.waitForSelector('table', { timeout: 5000 });
    log.push('✅ Project table loaded');

    // บันทึกข้อมูลโปรเจกต์ก่อนลบ
    const projectToDelete = await page.evaluate(() => {
      const rows = document.querySelectorAll('tr');
      if (rows.length > 1) { // ข้ามแถวหัวตาราง
        const cells = rows[1].querySelectorAll('td');
        if (cells.length > 0) {
          return {
            name: cells[0].textContent.trim(),
            id: cells[0].closest('tr').getAttribute('data-project-id') || 'Unknown ID'
          };
        }
      }
      return { name: 'Unknown Project', id: 'Unknown ID' };
    });
    
    log.push(`📋 Testing delete on project: ${projectToDelete.name}`);
    log.push(`📋 Project ID: ${projectToDelete.id}`);

    // จำนวนโปรเจกต์ก่อนลบ
    const projectCountBefore = await page.evaluate(() => {
      return document.querySelectorAll('table tr').length - 1; // หักแถวหัวตาราง
    });
    
    log.push(`📊 Project count before delete: ${projectCountBefore}`);

    // ค้นหาและคลิกปุ่ม Delete ของโปรเจกต์แรก
    const deleteButtonClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const deleteButton = buttons.find(btn => btn.textContent.includes('Delete'));
      if (deleteButton) {
        deleteButton.click();
        return true;
      }
      return false;
    });

    if (!deleteButtonClicked) {
      throw new Error('Delete button not found or could not be clicked');
    }
    
    log.push('🟢 Clicked Delete button');

    // =================== ตรวจสอบ Dialog ยืนยันการลบ ===================
    // รอให้ Dialog ยืนยันการลบเปิดขึ้น
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    log.push('✅ Delete confirmation dialog opened');

    // ตรวจสอบว่า Dialog แสดงข้อมูลโปรเจกต์ที่จะลบถูกต้อง
    const dialogContent = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return dialog ? dialog.textContent : '';
    });
    
    if (dialogContent.includes(projectToDelete.name)) {
      log.push('✅ Dialog shows correct project name');
    } else {
      log.push('⚠️ Dialog may not show correct project information');
    }

    // ตรวจสอบว่ามีปุ่ม Cancel และ Delete ใน Dialog
    const hasButtons = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const buttons = dialog ? dialog.querySelectorAll('button') : [];
      return {
        hasCancel: Array.from(buttons).some(btn => btn.textContent.includes('Cancel')),
        hasDelete: Array.from(buttons).some(btn => btn.textContent.includes('Delete'))
      };
    });
    
    if (hasButtons.hasCancel) {
      log.push('✅ Dialog has Cancel button');
    } else {
      log.push('⚠️ Cancel button not found in dialog');
    }
    
    if (hasButtons.hasDelete) {
      log.push('✅ Dialog has Delete button');
    } else {
      log.push('⚠️ Delete button not found in dialog');
    }

    // คลิกปุ่ม Delete ใน Dialog
    await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const buttons = dialog ? dialog.querySelectorAll('button') : [];
      const deleteButton = Array.from(buttons).find(btn => btn.textContent.includes('Delete'));
      if (deleteButton) {
        deleteButton.click();
        return true;
      }
      return false;
    });
    
    log.push('🟢 Clicked Delete button in confirmation dialog');

    // รอให้ Dialog ปิด (ปุ่ม Delete ควรปิด Dialog เมื่อลบเสร็จ)
    try {
      await page.waitForFunction(
        () => !document.querySelector('[role="dialog"]'),
        { timeout: 5000 }
      );
      log.push('✅ Dialog closed after delete');
    } catch (e) {
      log.push(`⚠️ Dialog did not close: ${e.message}`);
    }

    // รอให้ Toast notification แสดงขึ้น (ถ้ามี)
    try {
      await page.waitForFunction(
        () => {
          const toast = document.querySelector('[role="status"]');
          return toast !== null;
        },
        { timeout: 5000 }
      );
      
      const toastMessage = await page.evaluate(() => {
        const toast = document.querySelector('[role="status"]');
        return toast ? toast.textContent : '';
      });
      
      log.push(`✅ Toast notification appeared: "${toastMessage}"`);
    } catch (e) {
      log.push('ℹ️ No toast notification detected');
    }

    // =================== ตรวจสอบว่าโปรเจกต์ถูกลบออกจากตารางหรือไม่ ===================
    // รอให้ตารางโหลดใหม่
    await page.waitForSelector('table', { timeout: 5000 });
    log.push('✅ Project table reloaded');

    // ตรวจสอบว่าโปรเจกต์ถูกลบไปหรือไม่
    const projectStillExists = await page.evaluate((projectName) => {
      const cells = document.querySelectorAll('td');
      return Array.from(cells).some(cell => cell.textContent.includes(projectName));
    }, projectToDelete.name);
    
    if (!projectStillExists) {
      log.push('✅ Project was successfully deleted and removed from table');
    } else {
      log.push('⚠️ Project still appears in table after delete attempt');
    }

    // จำนวนโปรเจกต์หลังลบ
    const projectCountAfter = await page.evaluate(() => {
      return document.querySelectorAll('table tr').length - 1; // หักแถวหัวตาราง
    });
    
    log.push(`📊 Project count after delete: ${projectCountAfter}`);
    
    if (projectCountAfter < projectCountBefore) {
      log.push('✅ Number of projects decreased as expected');
    } else {
      log.push('⚠️ Number of projects did not decrease');
    }

    const deleteTime = Date.now() - startDelete;
    log.push(`⏱️ Total Delete Testing Time: ${deleteTime} ms`);
    log.push(`🌐 Final URL: ${page.url()}`);

    fs.writeFileSync(logFilename, log.join('\n'), 'utf8');
    console.log('\n📝 Log saved to', logFilename);
    console.log(log.join('\n'));

  } catch (err) {
    const errorLog = `📅 เวลา: ${now()} ❌ Unexpected error: ${err.message}`;
    console.error(errorLog);
    log.push(errorLog);
    fs.writeFileSync(logFilename, log.join('\n'), 'utf8');
  } finally {
    await new Promise(r => setTimeout(r, 5000)); // ชะลอให้เห็นผลลัพธ์
    
    await browser?.close();
  }
})();