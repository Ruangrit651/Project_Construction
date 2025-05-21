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

const logFilename = 'Project_Detail_log.txt';

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
      log.push('⚠️ No projects found. Creating a new project first...');

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

      const projectName = `Test Project ${Date.now()}`;
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

      await page.type('[placeholder="Enter actual"]', '5000');
      log.push('📝 Entered Actual: 5,000');

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

      // รอสักครู่ให้ UI อัพเดท
      await page.waitForTimeout(1000);
    }

    // =================== ทดสอบการคลิกปุ่ม Detail ===================
    const startDetail = Date.now();
    log.push(`📅 เวลา: ${now()}`);
    log.push('🔄 Looking for Detail button...');

    // รอให้ตารางแสดงข้อมูลโปรเจกต์โหลดเสร็จ
    await page.waitForSelector('table', { timeout: 5000 });
    log.push('✅ Project table loaded');

    // บันทึกชื่อโปรเจกต์ก่อนคลิกปุ่ม Detail
    const projectName = await page.evaluate(() => {
      const rows = document.querySelectorAll('tr');
      if (rows.length > 1) { // ข้ามแถวหัวตาราง
        const cells = rows[1].querySelectorAll('td');
        if (cells.length > 0) {
          return cells[0].textContent.trim();
        }
      }
      return 'Unknown Project';
    });
    log.push(`📋 Testing project: ${projectName}`);

    // ค้นหาและคลิกปุ่ม Detail ของโปรเจกต์แรก
    const detailButtonClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const detailButton = buttons.find(btn => btn.textContent.includes('Detail'));
      if (detailButton) {
        detailButton.click();
        return true;
      }
      return false;
    });

    if (!detailButtonClicked) {
      throw new Error('Detail button not found or could not be clicked');
    }

    log.push('🟢 Clicked Detail button');

    // =================== ตรวจสอบหน้ารายละเอียดโปรเจกต์ ===================
    // รอให้หน้ารายละเอียดโปรเจกต์โหลดเสร็จ (อาจเป็นหน้าเต็มหรือ dialog)
    await page.waitForFunction(() => {
      // ตรวจสอบการแสดงรายละเอียดโปรเจกต์
      return document.querySelector('div') !== null &&
        document.body.innerText.includes('Budget') &&
        document.body.innerText.includes('Status');
    }, { timeout: 5000 });
    log.push('✅ Project details loaded');

    // ตรวจสอบข้อมูลที่แสดง
    const detailsShown = await page.evaluate((expectedName) => {
      const elements = {
        projectName: document.body.innerText.includes(expectedName),
        budget: document.body.innerText.includes('Budget:'),
        status: document.body.innerText.includes('Status:'),
        startDate: document.body.innerText.includes('Start Date:'),
        endDate: document.body.innerText.includes('End Date:'),
        membersTab: document.body.innerText.includes('Members'),
        tasksTab: document.body.innerText.includes('Tasks')
      };

      return elements;
    }, projectName);

    // บันทึกผลการตรวจสอบ
    log.push(`✅ Project name shown: ${detailsShown.projectName ? 'Yes' : 'No'}`);
    log.push(`✅ Budget shown: ${detailsShown.budget ? 'Yes' : 'No'}`);
    log.push(`✅ Status shown: ${detailsShown.status ? 'Yes' : 'No'}`);
    log.push(`✅ Start Date shown: ${detailsShown.startDate ? 'Yes' : 'No'}`);
    log.push(`✅ End Date shown: ${detailsShown.endDate ? 'Yes' : 'No'}`);
    log.push(`✅ Members tab shown: ${detailsShown.membersTab ? 'Yes' : 'No'}`);
    log.push(`✅ Tasks tab shown: ${detailsShown.tasksTab ? 'Yes' : 'No'}`);

    // ตรวจสอบว่าแท็บ Members เปิดเป็นค่าเริ่มต้น
    const isMembersTabActive = await page.evaluate(() => {
      return document.body.innerText.includes('Project Members');
    });
    log.push(`✅ Members tab active by default: ${isMembersTabActive ? 'Yes' : 'No'}`);

    await new Promise(r => setTimeout(r, 2000));

    // คลิกปุ่มย้อนกลับหรือปิด
    await page.$$eval('button', buttons => {
      const closeButton = buttons.find(btn =>
        btn.textContent.includes('Back to Projects') ||
        btn.textContent.includes('Close') ||
        btn.textContent.includes('←') ||
        btn.textContent.includes('×')

      );
      if (closeButton) {
        closeButton.click();
        return true;
      }
      return false;
    });
    log.push('🟢 Clicked Close/Back button');

    await new Promise(r => setTimeout(r, 1000)); 


    // ตรวจสอบว่ากลับไปยังหน้าโปรเจกต์
    await page.waitForSelector('table', { timeout: 5000 });
    log.push('✅ Returned to projects page');

    const detailTime = Date.now() - startDetail;
    log.push(`⏱️ Total Detail Testing Time: ${detailTime} ms`);
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
    
    // ปิดเบราว์เซอร์
    await browser?.close();
  }
})();