// โหลดตัวแปรจากไฟล์ .env เข้ามาใช้
require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const { performance } = require('perf_hooks');

// ฟังก์ชันช่วยแปลงเวลาปัจจุบันให้อยู่ในรูปแบบวัน/เดือน/ปี ชั่วโมง:นาที:วินาที
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

(async () => {
  let browser;
  const logs = []; // เก็บ log เพื่อเขียนลงไฟล์
  const logFilename = `TaskList_performance_log.txt`; // ตั้งชื่อไฟล์ log

  try {
    // เปิด browser แบบไม่ใช่ headless เพื่อดูการทำงาน
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--disable-features=PasswordManagerEnabled,AutomaticPasswordSaving',
        '--disable-save-password-bubble'
      ]
    });

    const page = await browser.newPage();

    // ดักจับ console.log จากหน้าเว็บ
    page.on('console', msg => console.log(`[${now()}] PAGE LOG:`, msg.text()));

    // ดักจับ error response จาก server
    page.on('response', async response => {
      if (!response.ok()) {
        const body = await response.text();
        console.log(`[${now()}] ❗ RESPONSE ERROR (${response.status()}) ${response.url()}:\n${body}`);
      }
    });

    // === เริ่มการทดสอบ ===
    logs.push(`📅 Timestamp: ${now()}`);
    const loadStart = performance.now();

    // เปิดหน้า Login
    await page.goto(process.env.APP_URL, { waitUntil: 'networkidle0' });

    const loadEnd = performance.now();
    logs.push(`🚀 Login Page Load Time: ${(loadEnd - loadStart).toFixed(2)} ms`);

    // กรอกข้อมูล Login
    await page.waitForSelector('#username');
    await page.waitForSelector('#password');
    await page.type('#username', process.env.LOGIN_USERNAME_MANAGER);
    await page.type('#password', process.env.LOGIN_PASSWORD_MANAGER);
    await new Promise(r => setTimeout(r, 800)); // หน่วงเวลาเล็กน้อย

    // คลิกปุ่ม Login และรอการนำทาง
    const loginStart = performance.now();
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
    const loginEnd = performance.now();
    logs.push(`🔐 Login Time: ${(loginEnd - loginStart).toFixed(2)} ms`);

    // ไปที่หน้า ManagerProjectList
    logs.push(`📅 Timestamp: ${now()}`);
    const navigateToProjectsStart = performance.now();
    await page.goto(`${process.env.APP_URL}/ManagerProjectList`, { waitUntil: 'networkidle0' });
    const navigateToProjectsEnd = performance.now();
    logs.push(`🧭 Navigation to Project List Time: ${(navigateToProjectsEnd - navigateToProjectsStart).toFixed(2)} ms`);

    // รอให้ตารางแสดงโปรเจกต์โหลดเสร็จ
    await page.waitForFunction(() => {
      return !document.querySelector('.animate-spin') &&
        (document.querySelector('table tbody tr') || document.querySelector('table tbody td.text-center'));
    }, { timeout: 10000 });

    // ตรวจสอบว่ามีโปรเจกต์หรือไม่
    const projectExists = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      return rows.length > 0;
    });

    if (!projectExists) {
      logs.push('❌ ไม่พบโปรเจกต์ในระบบ');
      throw new Error('No projects available to test tasks');
    }

    logs.push('✅ พบโปรเจกต์ในระบบ');

    // คลิกเข้าไปยังโปรเจกต์แรกเพื่อดู Task
    const navigateToTasksStart = performance.now();
    await Promise.all([
      page.click('table tbody tr'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
    const navigateToTasksEnd = performance.now();
    logs.push(`🧭 Navigation to Task List Time: ${(navigateToTasksEnd - navigateToTasksStart).toFixed(2)} ms`);

    // ตรวจสอบว่าอยู่ในหน้า Task หรือไม่
    const isTaskListPage = await page.evaluate(() => {
      return window.location.href.includes('/ManagerTask') || window.location.href.includes('/managertasklist');
    });

    if (!isTaskListPage) {
      logs.push('❌ ไม่สามารถเข้าสู่หน้ารายการงานได้');
      throw new Error('Failed to navigate to task list page');
    }

    logs.push('✅ เข้าสู่หน้ารายการงานเรียบร้อย');

    // === ทดสอบการเพิ่ม Task ===
    logs.push(`📅 Timestamp: ${now()}`);
    logs.push('🔄 เริ่มทดสอบการเพิ่มงาน');

    // ตรวจสอบว่าปุ่ม "+ Add Task" มีอยู่หรือไม่
    const addTaskBtnExists = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => btn.textContent.includes('+ Add Task'));
    });

    if (!addTaskBtnExists) {
      logs.push('❌ ไม่พบปุ่ม Add Task');
      throw new Error('Add Task button not found');
    }

    logs.push('✅ พบปุ่ม Add Task');

    // คลิกปุ่ม Add Task
    const addTaskStart = performance.now();
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addTaskBtn = buttons.find(btn => btn.textContent.includes('+ Add Task'));
      if (addTaskBtn) addTaskBtn.click();
    });

    // รอ dialog แสดงขึ้น
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    logs.push('✅ Dialog สำหรับเพิ่มงานแสดงขึ้นเรียบร้อย');

    // กรอกข้อมูลลงในฟอร์ม
    const taskName = `Test Task ${Date.now()}`;
    await page.type('input[placeholder="Enter Task Name"]', taskName);
    logs.push(`✅ กรอกชื่องาน: ${taskName}`);

    await page.type('textarea[placeholder="Enter Task Description"]', 'This is a test task created by Puppeteer');
    logs.push('✅ กรอกรายละเอียดงาน');

    await page.evaluate(() => {
      const budgetInput = document.querySelector('input[placeholder="Enter Task Budget"]');
      if (budgetInput) budgetInput.value = '';
    });
    await page.type('input[placeholder="Enter Task Budget"]', '10000');
    logs.push('✅ กรอกงบประมาณ: 10,000');

    function formatDateMMDDYYYY(date) {
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
    }


    const today = new Date();
    const startDate = formatDateMMDDYYYY(today);

    await page.waitForSelector('#start-date-input');
    await page.click('#start-date-input', { clickCount: 3 }); // เลือกข้อความทั้งหมดก่อนพิมพ์ทับ
    await page.type('#start-date-input', startDate);

   const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);
    const formattedEndDate = formatDateMMDDYYYY(endDate);

    await page.waitForSelector('#end-date-input');
    await page.click('#end-date-input', { clickCount: 3 });
    await page.type('#end-date-input', formattedEndDate);


    // 🔵 คลิกปุ่มเลือกสถานะ (เช่น "Pending")
    await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const statusTrigger = buttons.find(btn =>
        btn.textContent.toLowerCase().includes('pending')
    );
    if (statusTrigger) statusTrigger.click();
    });

    // 🟢 รอให้ dropdown เปิดขึ้นจริง (data-state="open")
    await page.waitForFunction(() => {
    const trigger = document.querySelector('[role="combobox"]');
    return trigger && trigger.getAttribute('data-state') === 'open';
    });
    logs.push('🕒 dropdown เปิดแล้ว');

    // 🟡 คลิกตัวเลือก "In Progress"
    await page.evaluate(() => {
    const options = Array.from(document.querySelectorAll('[role="option"]'));
    const inProgressOption = options.find(option =>
        option.textContent.toLowerCase().includes('in progress')
    );
    if (inProgressOption) inProgressOption.click();
    });
    logs.push('✅ เลือกสถานะเป็น In Progress');

    // 🔴 รอให้ dropdown ปิด (data-state="closed")
    await page.waitForFunction(() => {
    const trigger = document.querySelector('[role="combobox"]');
    return trigger && trigger.getAttribute('data-state') === 'closed';
    });
    logs.push('🕒 ยืนยันว่าปิด dropdown แล้ว');


    // ตรวจสอบว่าปุ่ม Save มีอยู่หรือไม่
    const saveButtonExists = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => btn.textContent.includes('Save'));
    });

    if (!saveButtonExists) {
      logs.push('❌ ไม่พบปุ่ม Save');
      throw new Error('Save button not found');
    }

    logs.push('✅ พบปุ่ม Save');

    // คลิก Save
    const saveStart = performance.now();
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(btn => btn.textContent.includes('Save'));
      if (saveBtn) saveBtn.click();
    });

    // รอให้ dialog ปิดลง (รอ task บันทึก)
    try {
      await page.waitForFunction(() => !document.querySelector('[role="dialog"]'), { timeout: 10000 });
      const saveEnd = performance.now();
      logs.push(`✅ งานถูกบันทึกเรียบร้อยใน ${(saveEnd - saveStart).toFixed(2)} ms`);
    } catch {
      logs.push('❌ Dialog ไม่ปิดหลังจากกด Save');

      const errorVisible = await page.evaluate(() => {
        return document.body.innerText.includes('Error');
      });

      if (errorVisible) logs.push('❌ พบข้อความ Error ในหน้าจอ');

      // พยายามปิด dialog ด้วย Cancel
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const cancelBtn = buttons.find(btn => btn.textContent.includes('Cancel'));
        if (cancelBtn) cancelBtn.click();
      });
      logs.push('🔄 พยายามคลิกปุ่ม Cancel เพื่อปิด Dialog');
      throw new Error('Failed to save task');
    }

    // ตรวจสอบว่างานแสดงอยู่ในรายการหรือไม่
    await new Promise(r => setTimeout(r, 2000));
    const taskAdded = await page.evaluate((expectedTaskName) => {
      const taskElements = document.querySelectorAll('tr, div.task-item');
      return Array.from(taskElements).some(el => el.innerText.includes(expectedTaskName));
    }, taskName);

    if (taskAdded) {
      logs.push('✅ งานที่เพิ่มแสดงอยู่ในรายการเรียบร้อย');
    } else {
      logs.push('⚠️ ไม่พบนามงานในรายการหลังจากบันทึก');
    }

    // สรุปเวลาและ URL ปัจจุบัน
    const testEndTime = performance.now();
    logs.push(`⏱️ Total Test Time: ${(testEndTime - loadStart).toFixed(2)} ms`);
    logs.push(`🌐 Final URL: ${page.url()}`);

    // เขียน log ลงไฟล์
    fs.writeFileSync(logFilename, logs.join('\n'), 'utf8');
    console.log(`\n📝 Log saved to ${logFilename}`);
    console.log(logs.join('\n'));

  } catch (error) {
    const errMsg = `[${now()}] ❌ Unexpected error: ${error.message}`;
    console.error(errMsg);
    fs.writeFileSync(logFilename, logs.join('\n') + '\n' + errMsg, 'utf8');
  } finally {
    await new Promise(r => setTimeout(r, 1000));
    await browser?.close();
  }
})();
