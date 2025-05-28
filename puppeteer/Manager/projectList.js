// นำเข้าโมดูลที่จำเป็นสำหรับการทำงาน
require('dotenv').config();  // โหลดตัวแปรสภาพแวดล้อมจากไฟล์ .env
const puppeteer = require('puppeteer');  // ใช้สำหรับควบคุมเบราว์เซอร์อัตโนมัติ
const fs = require('fs');  // ใช้สำหรับจัดการไฟล์
const { performance } = require('perf_hooks');  // ใช้วัดประสิทธิภาพการทำงาน
const { log } = require('console');

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

    // 4. กรอก Start Date
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

    try {
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
    } catch (error) {
      logs.push(`❌ เกิดข้อผิดพลาดในการคลิกปุ่ม Save: ${error.message}`);
    }

    const saveTaskEnd = performance.now();
    logs.push(`⏱️ บันทึก Task ใช้เวลา: ${(saveTaskEnd - saveTaskStart).toFixed(2)} ms`);

    // รอให้หน้าอัพเดทข้อมูล
    await new Promise(r => setTimeout(r, 1000));

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
    }
    // ====================================================================================================

    // ========== ขั้นตอนที่ 10: ทดสอบคลิกปุ่ม + Add ในโปรเจกต์ที่สร้างขึ้น ==========
    logs.push(`📅 Timestamp: ${now()}`);
    logs.push('🧪 เริ่มทดสอบการคลิกปุ่ม + Add ในโปรเจกต์');

    try {
      // หาแถวที่มีชื่อ Task ที่เราสร้างไว้
      const taskRowFound = await page.evaluate(async (taskNameToFind) => {
        const taskRows = Array.from(document.querySelectorAll('table tbody tr'));
        for (const row of taskRows) {
          if (row.textContent?.includes(taskNameToFind)) {
            // เลือกแถวที่มี Task ที่เราสร้าง
            row.click();
            return true;
          }
        }
        return false;
      }, taskName);

      if (taskRowFound) {
        logs.push('✅ คลิกที่แถวของ Task ที่สร้างแล้ว');

        // รอให้หน้าโหลดหรือมีการอัพเดต UI หลังจากคลิก
        await new Promise(r => setTimeout(r, 1500));

        // คลิกปุ่มลูกศรขวาก่อนเพื่อเข้าถึงรายละเอียดโปรเจ็ค
        const arrowButtonClicked = await page.evaluate(() => {
          // หาปุ่มลูกศรขวาจาก SVG path หรือคลาสที่เกี่ยวข้อง
          const arrowButtons = Array.from(document.querySelectorAll('button'))
            .filter(btn => {
              // ตรวจสอบว่ามี SVG ภายในปุ่ม
              const svg = btn.querySelector('svg');
              if (!svg) return false;

              // ตรวจสอบว่า SVG มี path ที่เป็นลูกศรขวา
              const path = svg.querySelector('path');
              return path && path.getAttribute('d')?.includes('M6.1584 3.13508');
            });

          if (arrowButtons.length > 0) {
            console.log('พบปุ่มลูกศรขวา กำลังคลิก...');
            arrowButtons[0].click();
            return true;
          }

          // วิธีสำรอง - หาปุ่มที่มีลักษณะคล้ายปุ่มนำทาง
          const navigationButtons = Array.from(document.querySelectorAll('button.rt-Button, button[class*="ghost"]'))
            .filter(btn => !btn.textContent.includes('Add') && !btn.textContent.includes('Save'));

          if (navigationButtons.length > 0) {
            console.log('พบปุ่มนำทาง กำลังคลิก...');
            navigationButtons[0].click();
            return true;
          }

          return false;
        });

        if (arrowButtonClicked) {
          logs.push('✅ คลิกปุ่มลูกศรขวาเพื่อเข้าถึงรายละเอียดโปรเจ็คแล้ว');
          // รอให้หน้าโหลดหลังจากคลิกปุ่มลูกศรขวา
          await new Promise(r => setTimeout(r, 1500));
        } else {
          logs.push('⚠️ ไม่พบปุ่มลูกศรขวา - ลองค้นหาปุ่ม + Subtask Add โดยตรง');
        }

        // หาและคลิกปุ่ม + Add ในโปรเจกต์ที่เลือก
        const addButtonClicked = await page.evaluate(() => {
          const addButtons = Array.from(document.querySelectorAll('button'))
            .filter(btn => btn.textContent?.includes('+ Subtask Add'));

          if (addButtons.length > 0) {
            console.log(`พบปุ่ม Add จำนวน ${addButtons.length} ปุ่ม`);
            addButtons[0].click();
            return true;
          }
          return false;
        });

        if (addButtonClicked) {
          logs.push('✅ คลิกปุ่ม + Add ในโปรเจกต์สำเร็จ');

          // รอให้ Dialog หรือฟอร์มแสดงขึ้นมา
          await page.waitForSelector('div[role="dialog"]', { timeout: 5000 })
            .then(() => {
              logs.push('✅ Dialog สำหรับเพิ่มข้อมูลเปิดขึ้นมาแล้ว');
            })
            .catch(() => {
              logs.push('⚠️ ไม่พบ Dialog สำหรับเพิ่มข้อมูล');
            });

          // ========== ขั้นตอนที่ 11: กรอกข้อมูล Subtask ในฟอร์ม ==========
          logs.push('🧪 เริ่มทดสอบการกรอกข้อมูล Subtask');

          try {
            const subtaskDescription = `This is a subtask created by Puppeteer on ${now()}`;
            const subtaskBudget = "2000";
            const progressPercent = "30";

            const today = new Date();
            const subtaskStartDate = today.toISOString().slice(0, 10);
            const subtaskEndDate = new Date();
            subtaskEndDate.setDate(today.getDate() + 3);
            const subtaskEndDateStr = subtaskEndDate.toISOString().slice(0, 10);

            logs.push('🖊️ เริ่มกรอกข้อมูล Subtask ตามลำดับ...');

            const subtaskName = "Sub task " + new Date().toISOString().slice(0, 10);
            // 1. กรอก Subtask Name - ใช้ตัวเลือกทั่วไปมากขึ้น
            await page.waitForSelector('input[placeholder="Enter subtask name"]');
            await page.click('input[placeholder="Enter subtask name"]');
            await page.keyboard.type(subtaskName);
            logs.push('✅ 1. กรอกชื่อ Subtask แล้ว');

            // 2. กรอก Description
            await page.type('input[placeholder="Enter description"]', subtaskDescription);
            logs.push('✅ 2. กรอก Description แล้ว');

            // 3. กรอก Budget
            const budgetInput = await page.$('input[placeholder="Enter budget"]');
            if (budgetInput) {
              await budgetInput.click({ clickCount: 3 });
              await budgetInput.press('Backspace');
              await budgetInput.type(subtaskBudget);
            }
            logs.push('✅ 3. กรอก Budget แล้ว');


            const subtaskstartDateMDY = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
            const subtaskendDateMDY = `${String(endDate.getMonth() + 1).padStart(2, '0')}/${String(endDate.getDate()).padStart(2, '0')}/${endDate.getFullYear()}`;

            // 4. กรอก Start Date 
            await page.click('#add-subtask-start-date').catch(() => null);
            await page.keyboard.down('Control');
            await page.keyboard.press('a');
            await page.keyboard.up('Control');
            await page.keyboard.press('Backspace');
            await page.keyboard.type(subtaskstartDateMDY);
            logs.push('✅ 4. กรอก Start Date แล้ว');

            // 5. กรอก End Date 
            await page.click('#add-subtask-end-date').catch(() => null);
            await page.keyboard.down('Control');
            await page.keyboard.press('a');
            await page.keyboard.up('Control');
            await page.keyboard.press('Backspace');
            await page.keyboard.type(subtaskendDateMDY);
            logs.push('✅ 5. กรอก End Date แล้ว');

            // 6. เลือก Status เป็น "In Progress" (แบบปรับปรุง)
            try {
              logs.push('🔍 กำลังเลือก Status...');

              // คลิกที่ select element ก่อน (แยกออกจาก evaluate)
              const selectExists = await page.evaluate(() => {
                const selectElem = document.querySelector('select, [role="combobox"], [data-radix-select-trigger]');
                if (selectElem) {
                  selectElem.click();
                  return true;
                }
                return false;
              });

              if (selectExists) {
                // รอให้ dropdown แสดง (ระหว่างรอนอก evaluate)
                await new Promise(r => setTimeout(r, 800));

                // จากนั้นจึงเลือก option
                const optionSelected = await page.evaluate(() => {
                  // ค้นหา option ที่เกี่ยวกับ progress
                  const options = document.querySelectorAll('[role="option"], option, [role="menuitem"]');
                  console.log(`พบตัวเลือกทั้งหมด ${options.length} ตัวเลือก`);

                  for (const opt of options) {
                    if (opt.textContent.toLowerCase().includes('progress') ||
                      opt.textContent.toLowerCase().includes('in progress')) {
                      console.log(`คลิกตัวเลือก: ${opt.textContent}`);
                      opt.click();
                      return true;
                    }
                  }
                  return false;
                });

                if (optionSelected) {
                  logs.push('✅ 6. เลือก Status เป็น "In Progress" แล้ว');
                }
                else {
                  // ถ้ายังไม่สำเร็จ ลองใช้วิธีอื่น
                  const alternativeMethod = await page.evaluate(() => {
                    // วิธีที่ 2: ใช้ JavaScript กำหนดค่าโดยตรง
                    const allSelects = document.querySelectorAll('select');
                    for (const select of allSelects) {
                      for (let i = 0; i < select.options.length; i++) {
                        if (select.options[i].textContent.toLowerCase().includes('progress')) {
                          select.selectedIndex = i;
                          select.dispatchEvent(new Event('change', { bubbles: true }));
                          return true;
                        }
                      }
                    }

                    // วิธีที่ 3: หาจาก label และกำหนดค่า
                    const statusLabels = Array.from(document.querySelectorAll('label, span, div'))
                      .filter(el => el.textContent.toLowerCase().includes('status'));

                    for (const label of statusLabels) {
                      const selectNear = label.parentElement?.querySelector('select') ||
                        label.nextElementSibling?.querySelector('select') ||
                        label.closest('div')?.querySelector('select');

                      if (selectNear) {
                        for (let i = 0; i < selectNear.options.length; i++) {
                          if (selectNear.options[i].textContent.toLowerCase().includes('progress')) {
                            selectNear.selectedIndex = i;
                            selectNear.dispatchEvent(new Event('change', { bubbles: true }));
                            return true;
                          }
                        }
                      }
                    }

                    return false;
                  });

                  if (alternativeMethod) {
                    logs.push('✅ 6. เลือก Status เป็น "In Progress" แล้ว (วิธีที่ 2)');
                  } else {
                    logs.push('⚠️ ไม่สามารถเลือก Status ได้ - ลองใช้ค่าเริ่มต้น');
                  }
                }
              } else {
                // วิธีที่ 4: ลองหาวิธีกำหนดค่าด้วยวิธีอื่น เช่น ค้นหา Radio Button
                const radioSelected = await page.evaluate(() => {
                  const radioButtons = document.querySelectorAll('input[type="radio"]');
                  for (const radio of radioButtons) {
                    if (radio.value.toLowerCase().includes('progress') ||
                      radio.nextSibling?.textContent?.toLowerCase().includes('progress')) {
                      radio.checked = true;
                      radio.click();
                      return true;
                    }
                  }
                  return false;
                });

                if (radioSelected) {
                  logs.push('✅ 6. เลือก Status เป็น "In Progress" แล้ว (จากปุ่ม radio)');
                } else {
                  logs.push('⚠️ ไม่สามารถเลือก Status ได้ - ลองใช้ค่าเริ่มต้น');
                  logs.push('ℹ️ ทดลองข้ามขั้นตอนการเลือก Status - อาจใช้ค่าเริ่มต้น');
                }
              }
            } catch (error) {
              logs.push(`❌ เกิดข้อผิดพลาดในการเลือก Status: ${error.message}`);
              // ไม่หยุดการทำงานของโปรแกรม - ข้ามไปขั้นตอนต่อไป
            }

            // 7. กรอก Initial Progress
            try {
              const numberInputs = await page.$$(`input[type="number"]`);
              if (numberInputs.length > 0) {
                // แปลงค่าเป็นตัวเลขก่อนเพื่อกำจัด 0 นำหน้า
                const numericProgress = parseInt(progressPercent, 10);
                const cleanProgressString = numericProgress.toString();

                await numberInputs[0].click({ clickCount: 3 });
                await numberInputs[0].press('Backspace');
                await numberInputs[0].type(cleanProgressString);
                logs.push(`✅ 7. กรอกค่า Initial Progress เป็น ${cleanProgressString} แล้ว`);
              } else {
                // ลองค้นหาด้วยวิธีอื่น เช่น ค้นหา input ที่อยู่ใกล้กับคำว่า Progress
                const progressInputFound = await page.evaluate(() => {
                  // หา input ที่อยู่ใกล้คำว่า Progress หรือ Percent
                  const labels = Array.from(document.querySelectorAll('label, div, span'))
                    .filter(el => el.textContent?.toLowerCase().includes('progress') ||
                      el.textContent?.toLowerCase().includes('percent'));

                  for (const label of labels) {
                    // หา input ที่อยู่ใกล้ๆ
                    const input = label.querySelector('input') ||
                      label.nextElementSibling?.querySelector('input') ||
                      label.parentElement?.querySelector('input');

                    if (input) {
                      input.value = "40"; // ใช้ค่าที่ไม่มี 0 นำหน้า
                      input.dispatchEvent(new Event('input', { bubbles: true }));
                      input.dispatchEvent(new Event('change', { bubbles: true }));
                      return true;
                    }
                  }
                  return false;
                });

                if (progressInputFound) {
                  logs.push('✅ 7. กรอกค่า Initial Progress เป็น 40 แล้ว (ด้วย JavaScript)');
                } else {
                  logs.push('❌ ไม่พบ input สำหรับ Initial Progress');
                }
              }
            } catch (error) {
              logs.push(`❌ เกิดข้อผิดพลาดในการกรอก Initial Progress: ${error.message}`);
            }

            // 8. คลิกปุ่ม Add Subtask
            logs.push('🖱️ กำลังคลิกปุ่ม Add Subtask...');

            try {
              // แก้ไขจาก page.$x เป็น page.evaluate
              const addButtonClicked = await page.evaluate(() => {
                // ค้นหาปุ่มที่มีข้อความ "Add Subtask"
                const buttons = Array.from(document.querySelectorAll('button'))
                  .filter(btn => btn.textContent?.includes('Add Subtask'));

                if (buttons.length > 0) {
                  buttons[0].click();
                  return true;
                }

                // หากไม่พบ ลองหาปุ่มอื่นที่อาจเป็นปุ่มบันทึก
                const confirmButtons = Array.from(document.querySelectorAll('div[role="dialog"] button'))
                  .filter(btn =>
                    !btn.textContent?.toLowerCase().includes('cancel') &&
                    !btn.textContent?.toLowerCase().includes('close')
                  );

                if (confirmButtons.length > 0) {
                  confirmButtons[0].click();
                  return true;
                }

                return false;
              });

              if (addButtonClicked) {
                logs.push('✅ 8. คลิกปุ่มยืนยันการเพิ่ม Subtask แล้ว');

                // รอให้ระบบประมวลผล - แก้ไขจาก waitForTimeout เป็น Promise.setTimeout
                await new Promise(r => setTimeout(r, 1000));

                const dialogClosed = await page.evaluate(() => {
                  return !document.querySelector('div[role="dialog"]');
                });

                if (dialogClosed) {
                  logs.push('✅ Dialog ปิดแล้ว - เพิ่ม Subtask สำเร็จ');
                } else {
                  const errorMessage = await page.evaluate(() => {
                    const errors = document.querySelectorAll('div[role="dialog"] [color="red"], .error-message');
                    return errors.length > 0 ? errors[0].textContent : null;
                  });

                  logs.push(errorMessage ? `❌ พบข้อผิดพลาด: ${errorMessage}` : '⚠️ Dialog ยังเปิดอยู่หลังจากกดปุ่ม');
                }

              } else {
                logs.push('❌ ไม่พบปุ่ม Add Subtask หรือปุ่มยืนยันในฟอร์ม');
                await page.screenshot({ path: 'missing-add-button.png' });
              }
            } catch (error) {
              logs.push(`❌ เกิดข้อผิดพลาดในการคลิกปุ่ม: ${error.message}`);
              await page.screenshot({ path: 'add-button-error.png' });
            }
          } catch (error) {
            // จัดการข้อผิดพลาดที่อาจเกิดขึ้นในภาพรวม
            const errMsg = `[${now()}] ❌ Fatal error: ${error.message}`;
            console.error(errMsg);
            logs.push(errMsg);
          }
        }
      }
    } catch (error) {
      const errMsg = `[${now()}] ❌ Fatal error: ${error.message}`;
      console.error(errMsg);
      logs.push(errMsg);
    }

    // บันทึกล็อกลงไฟล์และแสดงผลในคอนโซล
    fs.writeFileSync(logFilename, logs.join('\n'), 'utf8');
    console.log(`\n📝 Log saved to ${logFilename}`);
    console.log(logs.join('\n'));

  } catch (error) {
    // จัดการข้อผิดพลาดที่อาจเกิดขึ้นในภาพรวมของโปรแกรม
    const errMsg = `[${now()}] ❌ Fatal error: ${error.message}`;
    console.error(errMsg);
    if (logs.length > 0) {
      logs.push(errMsg);
      fs.writeFileSync(logFilename, logs.join('\n'), 'utf8');
    }
  } finally {
    // รอสักครู่ก่อนปิดเบราว์เซอร์
    await new Promise(r => setTimeout(r, 2000));
    if (browser) await browser.close();
  }
})();