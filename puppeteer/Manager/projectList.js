// นำเข้าโมดูลที่จำเป็นสำหรับการทำงาน
require('dotenv').config();  // โหลดตัวแปรสภาพแวดล้อมจากไฟล์ .env
const puppeteer = require('puppeteer');  // ใช้สำหรับควบคุมเบราว์เซอร์อัตโนมัติ
const fs = require('fs');  // ใช้สำหรับจัดการไฟล์
const { performance } = require('perf_hooks');  // ใช้วัดประสิทธิภาพการทำงาน

// ฟังก์ชันสำหรับแสดงเวลาปัจจุบันในรูปแบบ วัน/เดือน/ปี ชั่วโมง:นาที:วินาที
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

// ฟังก์ชันหลักแบบ IIFE (Immediately Invoked Function Expression)
(async () => {
  // ประกาศตัวแปรสำหรับเก็บ browser instance และบันทึกล็อก
  let browser;
  const logs = [];
  const logFilename = `SubtaskOperations_log.txt`;

  try {
    // เริ่มต้นเบราว์เซอร์ในโหมดที่มองเห็นได้ พร้อมกับเพิ่ม protocolTimeout
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--disable-features=PasswordManagerEnabled,AutomaticPasswordSaving',
        '--disable-save-password-bubble'
      ],
      protocolTimeout: 60000  // เพิ่ม timeout เป็น 60 วินาที เพื่อแก้ปัญหา screenshot timeout
    });

    // สร้างแท็บใหม่
    const page = await browser.newPage();

    // ติดตามข้อความ log จากหน้าเว็บ
    page.on('console', msg => console.log(`[${now()}] PAGE LOG:`, msg.text()));

    // ตรวจจับการตอบสนองจากเซิร์ฟเวอร์ที่มีข้อผิดพลาด
    page.on('response', async response => {
      if (!response.ok()) {
        try {
          const body = await response.text();
          console.log(`[${now()}] ❗ RESPONSE ERROR (${response.status()}) ${response.url()}:\n${body}`);
        } catch (error) {
          console.log(`[${now()}] ❗ RESPONSE ERROR (${response.status()}) ${response.url()}: Could not get body`);
        }
      }
    });

    // ========== ขั้นตอนที่ 1: เข้าสู่ระบบ ==========

    logs.push(`📅 Timestamp: ${now()}`);
    const loadStart = performance.now();
    await page.goto(process.env.APP_URL, { waitUntil: 'networkidle0' });
    const loadEnd = performance.now();
    logs.push(`🚀 Login Page Load Time: ${(loadEnd - loadStart).toFixed(2)} ms`);

    await page.waitForSelector('#username');
    await page.waitForSelector('#password');
    await page.type('#username', process.env.LOGIN_USERNAME_MANAGER);
    await page.type('#password', process.env.LOGIN_PASSWORD_MANAGER);
    await new Promise(r => setTimeout(r, 800));

    const loginStart = performance.now();
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
    const loginEnd = performance.now();
    logs.push(`🔐 Login Time: ${(loginEnd - loginStart).toFixed(2)} ms`);

    // ========== ขั้นตอนที่ 2: นำทางไปยังหน้ารายการโปรเจกต์ ==========

    logs.push(`📅 Timestamp: ${now()}`);
    const navigateToProjectsStart = performance.now();
    await page.goto(`${process.env.APP_URL}/ManagerProjectList`, { waitUntil: 'networkidle0' });
    const navigateToProjectsEnd = performance.now();
    logs.push(`🧭 Navigation to Project List Time: ${(navigateToProjectsEnd - navigateToProjectsStart).toFixed(2)} ms`);

    await page.waitForFunction(() => {
      return !document.querySelector('.animate-spin') &&
        (document.querySelector('table tbody tr') || document.querySelector('table tbody td.text-center'));
    }, { timeout: 10000 });

    const projectExists = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      return rows.length > 0;
    });

    if (!projectExists) {
      logs.push('❌ ไม่พบโปรเจกต์ในระบบ');
      throw new Error('No projects available to test tasks');
    }

    logs.push('✅ พบโปรเจกต์ในระบบ');

    // ========== ขั้นตอนที่ 3: เข้าสู่รายการงาน (Task) ในโปรเจกต์ ==========

    const navigateToTasksStart = performance.now();
    await Promise.all([
      page.click('table tbody tr'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
    const navigateToTasksEnd = performance.now();
    logs.push(`🧭 Navigation to Task List Time: ${(navigateToTasksEnd - navigateToTasksStart).toFixed(2)} ms`);

    const isTaskListPage = await page.evaluate(() => {
      return window.location.href.includes('/ManagerTask') || window.location.href.includes('/managertasklist');
    });

    if (!isTaskListPage) {
      logs.push('❌ ไม่สามารถเข้าสู่หน้ารายการงานได้');
      throw new Error('Failed to navigate to task list page');
    }

    logs.push('✅ เข้าสู่หน้ารายการงานเรียบร้อย');

    // ========== ขั้นตอนที่ 4: สร้าง Task ใหม่ ==========

    logs.push(`📅 Timestamp: ${now()}`);
    logs.push('🧪 เริ่มทดสอบการสร้าง Task ใหม่');

    const errorMsgExists = await page.evaluate(() => {
      const errorElements = Array.from(document.querySelectorAll('div, p, span')).filter(
        el => el.textContent?.includes('กรุณากรอกข้อมูลให้ครบถ้วน') ||
          el.textContent?.includes('เลือก Project')
      );
      return errorElements.length > 0;
    });

    if (errorMsgExists) {
      logs.push('⚠️ พบข้อความแจ้งเตือน "กรุณากรอกข้อมูลให้ครบถ้วนและเลือก Project"');

      const projectSelected = await page.evaluate(() => {
        const projectSelectors = document.querySelectorAll('select, .project-selector, [role="combobox"]');
        if (projectSelectors.length > 0) {
          projectSelectors[0].click();
          return true;
        }
        return false;
      });

      if (projectSelected) {
        logs.push('✅ ทำการเลือก Project แล้ว');
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    try {
      const buttonTexts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).map(btn => btn.textContent.trim());
      });
      logs.push(`📊 ปุ่มที่พบในหน้า: ${buttonTexts.join(', ')}`);

      const clickResult = await page.evaluate(() => {
        const addButton = Array.from(document.querySelectorAll('button'))
          .find(btn => btn.textContent.includes('+ Add Task'));
        if (addButton) {
          addButton.click();
          return true;
        }
        return false;
      });

      if (!clickResult) throw new Error('ไม่พบปุ่มที่มีข้อความ + Add Task');
      logs.push('✅ คลิกปุ่ม + Add Task สำเร็จ');
    } catch (error) {
      logs.push(`❌ ไม่สามารถคลิกปุ่ม + Add Task: ${error.message}`);
      await page.screenshot({ path: 'error-add-task-button.png', fullPage: true });
      throw error;
    }

    await page.waitForSelector('div[role="dialog"]');
    logs.push('✅ Dialog เปิดขึ้นมาแล้ว');

    // สร้างข้อมูล Task ที่จะใช้ทดสอบ
    const taskName = `Test Task ${new Date().toISOString().slice(0, 10)}`;
    const description = `This is a test task created by Puppeteer on ${now()}`;
    const budget = "5000";
    const status = "pending";

    // กำหนดวันที่
    const today = new Date();
    const startDate = today.toISOString().slice(0, 10);
    const endDate = new Date();
    endDate.setDate(today.getDate() + 7);
    const endDateStr = endDate.toISOString().slice(0, 10);

    // รูปแบบวันที่แบบ MM/DD/YYYY
    const startDateMDY = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
    const endDateMDY = `${String(endDate.getMonth() + 1).padStart(2, '0')}/${String(endDate.getDate()).padStart(2, '0')}/${endDate.getFullYear()}`;

    logs.push('🖊️ เริ่มกรอกข้อมูลตามลำดับ...');

    // 1. กรอก Task Name
    await page.type('input[placeholder="Enter Task Name"]', taskName);
    logs.push('✅ 1. กรอก Task Name แล้ว');
    await new Promise(r => setTimeout(r, 300));

    // 2. กรอก Description
    await page.type('textarea[placeholder="Enter Task Description"]', description);
    logs.push('✅ 2. กรอก Description แล้ว');
    await new Promise(r => setTimeout(r, 300));

    // 3. กรอก Budget
    await page.type('input[placeholder="Enter Task Budget"]', budget);
    logs.push('✅ 3. กรอก Budget แล้ว');
    await new Promise(r => setTimeout(r, 300));

    logs.push('🔄 กำลังกำหนด Start Date ด้วยวิธีใหม่...');

    await page.click('#start-date-input').catch(() => null);
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(startDateMDY);

    await page.click('#end-date-input').catch(() => null);
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.keyboard.type(endDateMDY);

    try {
      await page.evaluate(() => {
        const statusSelect = document.querySelector('select[name="status"], select#status');
        if (statusSelect) {
          statusSelect.value = "pending";
          statusSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      logs.push('✅ 6. เลือก Status เป็น "pending" แล้ว');
    } catch (error) {
      logs.push(`⚠️ ไม่สามารถเลือก Status ได้: ${error.message}`);
    }

    // 7. ตรวจสอบและเลือก Project
    try {
      const projectSelectorExists = await page.evaluate(() => {
        return !!document.querySelector('select[name="project"], select#project, [aria-label*="project"], [placeholder*="project"]');
      });

      if (projectSelectorExists) {
        logs.push('🔍 พบตัวเลือก Project ในฟอร์ม กำลังเลือก Project...');

        await page.evaluate(() => {
          const projectSelect = document.querySelector('select[name="project"], select#project');
          if (projectSelect && projectSelect.options.length > 0) {
            projectSelect.selectedIndex = 1; // เลือกตัวเลือกแรกที่ไม่ใช่ค่าเริ่มต้น
            projectSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });

        logs.push('✅ 7. เลือก Project เรียบร้อยแล้ว');
      }
    } catch (error) {
      logs.push(`⚠️ ไม่สามารถเลือก Project ได้: ${error.message}`);
    }

    // แสดงค่าของฟิลด์ที่กรอกเพื่อตรวจสอบ
    const formValues = await page.evaluate(() => {
      return {
        taskName: document.querySelector('input[placeholder="Enter Task Name"]')?.value,
        description: document.querySelector('textarea[placeholder="Enter Task Description"]')?.value,
        budget: document.querySelector('input[placeholder="Enter Task Budget"]')?.value,
        startDate: document.querySelectorAll('input[type="date"]')[0]?.value,
        endDate: document.querySelectorAll('input[type="date"]')[1]?.value
      };
    });

    logs.push(`📝 ค่าที่กรอกในฟอร์ม: ${JSON.stringify(formValues)}`);

    // รอสักครู่ก่อนคลิกปุ่มบันทึก
    const saveTaskStart = performance.now();
    await new Promise(r => setTimeout(r, 1000));

    // ========== ขั้นตอนที่ 8: บันทึก Task ==========

    logs.push('🖱️ กำลังคลิกปุ่ม Save...');

    try {
      // ตรวจสอบว่ามีข้อความแจ้งเตือนในฟอร์มหรือไม่
      const formErrors = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('[color="red"], .text-red-500, .error, .text-danger');
        return Array.from(errorElements).map(el => el.textContent.trim());
      });

      if (formErrors.length > 0) {
        logs.push(`⚠️ พบข้อความแจ้งเตือนในฟอร์ม: ${formErrors.join(', ')}`);
      }

      // คลิกปุ่ม Save
      const buttonFound = await page.evaluate(() => {
        const saveButtons = [
          ...Array.from(document.querySelectorAll('button')).filter(btn =>
            btn.textContent.trim() === 'Save' ||
            btn.textContent.trim().includes('Save')),
          ...Array.from(document.querySelectorAll('button[type="submit"]')),
          ...Array.from(document.querySelectorAll('div[role="dialog"] button')).filter(btn =>
            !btn.textContent.trim().includes('Cancel'))
        ];

        console.log("พบปุ่มที่อาจเป็นปุ่ม Save:", saveButtons.length, "ปุ่ม");

        if (saveButtons.length > 0) {
          const buttonText = saveButtons[0].textContent.trim();
          console.log("กำลังคลิกปุ่ม:", buttonText);
          saveButtons[0].click();
          return buttonText;
        }
        return null;
      });

      if (buttonFound) {
        logs.push(`✅ คลิกปุ่ม "${buttonFound}" แล้ว`);
      } else {
        logs.push('❌ ไม่พบปุ่ม Save ในหน้าจอ');
        throw new Error('ไม่พบปุ่ม Save');
      }

      // รอให้ Dialog ปิดหรือ API ตอบกลับ
      await Promise.race([
        page.waitForResponse(response => response.url().includes('/api/task')).catch(() => null),
        page.waitForFunction(() => !document.querySelector('div[role="dialog"]')).catch(() => null),
        new Promise(r => setTimeout(r, 10000))
      ]);

      // ตรวจสอบว่า Dialog ปิดแล้วหรือยัง
      const dialogClosed = await page.evaluate(() =>
        !document.querySelector('div[role="dialog"]')
      );

      if (dialogClosed) {
        logs.push('✅ Dialog ปิดแล้ว แสดงว่าน่าจะบันทึกสำเร็จ');
      } else {
        logs.push('⚠️ Dialog ยังไม่ปิด อาจมีปัญหา');

        // ดูว่ามีข้อความแจ้งเตือนหรือไม่
        const errorMsg = await page.evaluate(() => {
          const errorElements = document.querySelectorAll('[color="red"], .text-red-500, .error');
          return Array.from(errorElements).map(el => el.textContent.trim()).join(", ");
        });

        if (errorMsg) {
          logs.push(`❌ ข้อความแจ้งเตือนในฟอร์ม: ${errorMsg}`);
        }

        // ลองคลิกปุ่ม Save อีกครั้ง
        logs.push('🔄 ลองคลิกปุ่ม Save อีกครั้ง...');
        await page.evaluate(() => {
          const saveButtons = Array.from(document.querySelectorAll('div[role="dialog"] button')).filter(
            btn => !btn.textContent.includes('Cancel')
          );
          if (saveButtons.length > 0) saveButtons[0].click();
        });

        // รอให้ Dialog ปิดอีกครั้ง
        await Promise.race([
          page.waitForFunction(() => !document.querySelector('div[role="dialog"]')).catch(() => null),
          new Promise(r => setTimeout(r, 5000))
        ]);
      }

      // ลองคลิกปุ่มนอก Dialog เพื่อปิด Dialog หากยังเปิดอยู่
      await page.evaluate(() => {
        const dialog = document.querySelector('div[role="dialog"]');
        if (dialog) {
          // คลิกที่ overlay หรือพื้นหลังของ dialog
          const overlay = dialog.parentElement;
          if (overlay) overlay.click();

          // หรือกดปุ่ม ESC
          document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Escape',
            code: 'Escape',
            keyCode: 27,
            which: 27,
            bubbles: true
          }));
        }
      });

    } catch (error) {
      logs.push(`❌ เกิดข้อผิดพลาดขณะบันทึก Task: ${error.message}`);
    }

    const saveTaskEnd = performance.now();
    logs.push(`⏱️ บันทึก Task ใช้เวลา: ${(saveTaskEnd - saveTaskStart).toFixed(2)} ms`);

    // รอให้หน้าอัพเดทข้อมูล
    await new Promise(r => setTimeout(r, 3000));

    // ========== ขั้นตอนที่ 9: ตรวจสอบผลลัพธ์ ==========

    // ตรวจสอบว่า Task ที่สร้างปรากฏในรายการหรือไม่
    const taskCreated = await page.evaluate((taskNameToFind) => {
      const taskElements = Array.from(document.querySelectorAll('table tbody tr'));
      return taskElements.some(row => row.textContent?.includes(taskNameToFind));
    }, taskName);

    if (taskCreated) {
      logs.push('✅ สร้าง Task เรียบร้อยและปรากฏในรายการ');
    } else {
      logs.push('❓ สร้าง Task แล้วแต่ไม่พบในรายการ (อาจต้องรีเฟรชหน้า)');

      // ลองรีเฟรชหน้าเพื่อดูอีกครั้ง
      await page.reload({ waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 2000));

      // ตรวจสอบอีกครั้งหลังจากรีเฟรช
      const taskFoundAfterRefresh = await page.evaluate((taskNameToFind) => {
        const taskElements = Array.from(document.querySelectorAll('table tbody tr'));
        return taskElements.some(row => row.textContent?.includes(taskNameToFind));
      }, taskName);

      if (taskFoundAfterRefresh) {
        logs.push('✅ พบ Task หลังจากรีเฟรชหน้า');
      } else {
        logs.push('⚠️ ยังไม่พบ Task หลังจากรีเฟรชหน้าแล้ว');
      }
    }

    // ========== ขั้นตอนที่ 10: เลือก Task เพื่อเพิ่ม Subtask ==========

    // logs.push(`📅 Timestamp: ${now()}`);
    // logs.push('🧪 เริ่มทดสอบการเพิ่ม Subtask');

    // // คลิกที่ Task ที่เพิ่งสร้าง
    // try {
    //   const clickTask = await page.evaluate((taskNameToClick) => {
    //     const taskRows = Array.from(document.querySelectorAll('table tbody tr'));
    //     const targetRow = taskRows.find(row => row.textContent.includes(taskNameToClick));

    //     if (targetRow) {
    //       targetRow.click();
    //       return true;
    //     }
    //     return false;
    //   }, taskName);

    //   if (clickTask) {
    //     logs.push('✅ คลิกที่ Task เรียบร้อยแล้ว');
    //     await page.waitForNavigation({ waitUntil: 'networkidle0' });
    //   } else {
    //     logs.push('❌ ไม่พบ Task ที่ต้องการคลิก');
    //     throw new Error('ไม่พบ Task ที่ต้องการคลิก');
    //   }
    // } catch (error) {
    //   logs.push(`❌ เกิดข้อผิดพลาดขณะคลิก Task: ${error.message}`);
    //   await page.screenshot({ path: 'error-task-click.png', fullPage: true });
    // }

    //========== ขั้นตอนที่ 11: เพิ่ม Subtask ==========

    logs.push('🔍 กำลังหาปุ่ม + Add สำหรับเพิ่ม Subtask...');

    await new Promise(r => setTimeout(r, 2000)); // รอให้หน้าโหลดเสร็จสมบูรณ์

    // ค้นหาและคลิกปุ่ม + Add
    try {
      const addButtonVisible = await page.evaluate(() => {
        const addButtons = Array.from(document.querySelectorAll('button')).filter(
          btn => btn.textContent.includes('+ Add')
        );
        return addButtons.length > 0;
      });

      if (addButtonVisible) {
        logs.push('✅ พบปุ่ม + Add แล้ว');

        await page.evaluate(() => {
          const addButtons = Array.from(document.querySelectorAll('button')).filter(
            btn => btn.textContent.includes('+ Add')
          );
          addButtons[0].click();
        });

        logs.push('✅ คลิกปุ่ม + Add แล้ว');

        // รอให้ Dialog ปรากฏและโหลดเสร็จสมบูรณ์
        await page.waitForSelector('div[role="dialog"]', { visible: true, timeout: 5000 });
        logs.push('✅ Dialog เปิดขึ้นมาแล้ว');
        await new Promise(r => setTimeout(r, 5000)); // รอให้ UI render เสร็จสมบูรณ์

        // สร้างข้อมูล Subtask ที่จะใช้ทดสอบ
        const subtaskName = `Test Subtask ${new Date().toISOString().slice(0, 10)}`;
        const description = `This is a test subtask created by Puppeteer on ${now()}`;
        const budget = "2000";
        const progressPercent = 25;

        // กำหนดวันที่
        const today = new Date();
        const startDate = today.toISOString().slice(0, 10);
        const endDate = new Date();
        endDate.setDate(today.getDate() + 7);
        const endDateStr = endDate.toISOString().slice(0, 10);

        // รูปแบบวันที่แบบ MM/DD/YYYY
        const startDateMDY = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
        const endDateMDY = `${String(endDate.getMonth() + 1).padStart(2, '0')}/${String(endDate.getDate()).padStart(2, '0')}/${endDate.getFullYear()}`;

        logs.push('🖊️ เริ่มกรอกข้อมูล Subtask ตามลำดับ...');

        // 1. กรอก Subtask Name
        await page.waitForSelector('#add-subtask-name', { timeout: 5000 });
        await page.type('#add-subtask-name', "Test Subtask");
        logs.push('✅ 1. กรอก Subtask Name แล้ว');
        await new Promise(r => setTimeout(r, 300));

        // 2. กรอก Description
        await page.type('input[placeholder="Enter description"]', description);
        logs.push('✅ 2. กรอก Description แล้ว');
        await new Promise(r => setTimeout(r, 300));

        // 3. กรอก Budget
        await page.type('input[placeholder="Enter budget"]', budget);
        logs.push('✅ 3. กรอก Budget แล้ว');
        await new Promise(r => setTimeout(r, 300));

        // 4. กำหนด Start Date
        await page.evaluate(() => {
          const startDateInput = document.querySelector('input[type="date"]');
          if (startDateInput) startDateInput.click();
        });
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.keyboard.press('Backspace');
        await page.keyboard.type(startDateMDY);
        logs.push('✅ 4. กำหนด Start Date แล้ว');
        await new Promise(r => setTimeout(r, 300));

        // 5. กำหนด End Date
        await page.evaluate(() => {
          const dateInputs = document.querySelectorAll('input[type="date"]');
          if (dateInputs.length > 1) dateInputs[1].click();
        });
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await page.keyboard.press('Backspace');
        await page.keyboard.type(endDateMDY);
        logs.push('✅ 5. กำหนด End Date แล้ว');
        await new Promise(r => setTimeout(r, 300));

        // 6. เลือก Status
        await page.evaluate(() => {
          const statusSelect = document.querySelector('button[role="combobox"]');
          if (statusSelect) statusSelect.click();
        });
        await new Promise(r => setTimeout(r, 500));

        await page.evaluate(() => {
          const inProgressOption = Array.from(document.querySelectorAll('[role="option"]')).find(
            option => option.textContent.includes('In Progress')
          );
          if (inProgressOption) inProgressOption.click();
        });
        logs.push('✅ 6. เลือก Status เป็น "In Progress" แล้ว');
        await new Promise(r => setTimeout(r, 500));

        // 7. กำหนด Initial Progress
        await page.evaluate((percent) => {
          const progressInput = document.querySelector('input[type="number"]');
          if (progressInput) {
            progressInput.value = percent.toString();
            progressInput.dispatchEvent(new Event('input', { bubbles: true }));
            progressInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, progressPercent);
        logs.push(`✅ 7. กำหนด Initial Progress เป็น ${progressPercent}% แล้ว`);
        await new Promise(r => setTimeout(r, 500));

        // 8. คลิกปุ่ม Add Subtask
        const addSubtaskButtonClick = await page.evaluate(() => {
          const addSubtaskButtons = Array.from(document.querySelectorAll('button')).filter(
            btn => btn.textContent.includes('Add Subtask')
          );

          if (addSubtaskButtons.length > 0) {
            addSubtaskButtons[0].click();
            return true;
          }
          return false;
        });

        if (addSubtaskButtonClick) {
          logs.push('✅ คลิกปุ่ม Add Subtask แล้ว');

          // รอให้ Dialog ปิดหรือ API ตอบกลับ
          await Promise.race([
            page.waitForResponse(response => response.url().includes('/api/subtask')).catch(() => null),
            page.waitForFunction(() => !document.querySelector('div[role="dialog"]')).catch(() => null),
            new Promise(r => setTimeout(r, 10000))
          ]);

          // ตรวจสอบว่า Dialog ปิดแล้วหรือยัง
          const dialogClosed = await page.evaluate(() => !document.querySelector('div[role="dialog"]'));
          if (dialogClosed) {
            logs.push('✅ Dialog ปิดแล้ว แสดงว่าการเพิ่ม Subtask สำเร็จ');
          } else {
            logs.push('⚠️ Dialog ยังไม่ปิด อาจมีปัญหา');

            // ดูว่ามีข้อความแจ้งเตือนหรือไม่
            const errorMsg = await page.evaluate(() => {
              const errorElements = document.querySelectorAll('[color="red"], .text-red-500, .error');
              return Array.from(errorElements).map(el => el.textContent.trim()).join(", ");
            });

            if (errorMsg) {
              logs.push(`❌ ข้อความแจ้งเตือนในฟอร์ม: ${errorMsg}`);
            }
          }

          // รอให้หน้าอัพเดทข้อมูล
          await new Promise(r => setTimeout(r, 3000));

          // 9. ตรวจสอบว่า Subtask ถูกเพิ่มเข้าไปในรายการหรือไม่
          const subtaskCreated = await page.evaluate((subtaskNameToFind) => {
            const subtaskElements = document.querySelectorAll('table tbody tr');
            return Array.from(subtaskElements).some(row => row.textContent?.includes(subtaskNameToFind));
          }, subtaskName);

          if (subtaskCreated) {
            logs.push('✅ เพิ่ม Subtask เรียบร้อยและปรากฏในรายการ');
          } else {
            logs.push('⚠️ เพิ่ม Subtask แล้วแต่ไม่พบในรายการ (อาจต้องรีเฟรชหน้า)');

            // ลองรีเฟรชหน้าเพื่อดูอีกครั้ง
            await page.reload({ waitUntil: 'networkidle0' });
            await new Promise(r => setTimeout(r, 2000));

            const subtaskFoundAfterRefresh = await page.evaluate((subtaskNameToFind) => {
              const subtaskElements = document.querySelectorAll('table tbody tr');
              return Array.from(subtaskElements).some(row => row.textContent?.includes(subtaskNameToFind));
            }, subtaskName);

            if (subtaskFoundAfterRefresh) {
              logs.push('✅ พบ Subtask หลังจากรีเฟรชหน้า');
            } else {
              logs.push('❌ ยังไม่พบ Subtask หลังจากรีเฟรชหน้าแล้ว');
            }
          }
        } else {
          logs.push('❌ ไม่พบปุ่ม Add Subtask ในหน้าจอ');
        }
      } else {
        logs.push('❌ ไม่พบปุ่ม + Add ในหน้าจอ');
      }
    } catch (error) {
      logs.push(`❌ เกิดข้อผิดพลาดขณะเพิ่ม Subtask: ${error.message}`);
      await page.screenshot({ path: 'error-add-subtask.png', fullPage: true });
    }

    // บันทึกล็อกลงไฟล์และแสดงผลในคอนโซล
    fs.writeFileSync(logFilename, logs.join('\n'), 'utf8');
    console.log(`\n📝 Log saved to ${logFilename}`);
    console.log(logs.join('\n'));

  } catch (error) {
    // จัดการข้อผิดพลาดที่อาจเกิดขึ้น
    const errMsg = `[${now()}] ❌ Unexpected error: ${error.message}`;
    console.error(errMsg);
    logs.push(errMsg);
    fs.writeFileSync(logFilename, logs.join('\n'), 'utf8');
    
  } finally {
    // รอสักครู่ก่อนปิดเบราว์เซอร์
    await new Promise(r => setTimeout(r, 2000));
    await browser?.close();
  }
})();