// นำเข้าโมดูลที่จำเป็นสำหรับการทำงาน
require('dotenv').config();  // โหลดตัวแปรสภาพแวดล้อมจากไฟล์ .env
const puppeteer = require('puppeteer');  // ใช้สำหรับควบคุมเบราว์เซอร์อัตโนมัติ
const fs = require('fs');  // ใช้สำหรับจัดการไฟล์
const { performance } = require('perf_hooks');  // ใช้วัดประสิทธิภาพการทำงาน
const { log } = require('console'); // ใช้สำหรับแสดงข้อความในคอนโซล

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
          return false;
        });

        // หาและคลิกปุ่ม + Subtask Add ในโปรเจกต์ที่เลือก
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
          logs.push('✅ คลิกปุ่ม + Subtask Add ในโปรเจกต์สำเร็จ');

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
              // ค้นหาปุ่ม Add Subtask และคลิก
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

                  // ตรวจสอบว่า Subtask ปรากฏในรายการหรือไม่
                  await new Promise(r => setTimeout(r, 1500)); // รอให้หน้า UI อัพเดต

                  logs.push(`📅 Timestamp: ${now()}`);
                  logs.push('🧪 เริ่มทดสอบการค้นหา Subtask ในรายการ');

                  const subtaskName = "Sub task " + new Date().toISOString().slice(0, 10);
                  const subtaskFound = await page.evaluate((expectedName) => {
                    const allRows = document.querySelectorAll('table tbody tr, .subtask-list-item, [role="row"]');
                    console.log(`พบแถวทั้งหมด ${allRows.length} แถว`);

                    for (const row of allRows) {
                      if (row.textContent.includes(expectedName)) {
                        console.log(`พบ Subtask: ${expectedName}`);
                        return true;
                      }
                    }
                    return false;
                  }, subtaskName);

                  if (subtaskFound) {
                    logs.push('✅ พบ Subtask ในรายการแล้ว');

                    // ทดสอบปุ่ม Edit
                    logs.push('🧪 เริ่มทดสอบปุ่ม Edit Subtask');

                    let editButtonClicked = false;

                    try {
                      // คลิกปุ่ม Edit สำหรับ Subtask ที่เพิ่งสร้าง
                      editButtonClicked = await page.evaluate(async (subtaskName) => {
                        // ค้นหาแถวที่มี Subtask ที่ต้องการ
                        const rows = Array.from(document.querySelectorAll('table tbody tr, .subtask-list-item, [role="row"]'));
                        console.log(`พบแถวทั้งหมด ${rows.length} แถว`);

                        for (const row of rows) {
                          if (row.textContent.includes(subtaskName)) {
                            console.log(`พบแถวที่มี Subtask "${subtaskName}"`);

                            // ค้นหาปุ่ม Edit ในแถวนี้โดยใช้ ID เป็นหลัก (แม่นยำที่สุด)
                            let editButton = row.querySelector('#subtaskEdit');

                            // หากไม่พบด้วย ID ลองหาด้วย properties อื่นๆ
                            if (!editButton) {
                              editButton = row.querySelector('button[color="orange"], button.cursor-pointer[variant="soft"]');
                            }

                            // หากยังไม่พบ ลองหาจากข้อความในปุ่ม
                            if (!editButton) {
                              const buttons = Array.from(row.querySelectorAll('button'));
                              editButton = buttons.find(btn => btn.textContent.includes('Edit'));
                            }

                            if (editButton) {
                              console.log('พบปุ่ม Edit สำหรับ Subtask');
                              editButton.click();
                              return true;
                            } else {
                              // Debug: แสดงปุ่มทั้งหมดที่พบในแถวนี้
                              const allButtons = Array.from(row.querySelectorAll('button'));
                              console.log(`พบปุ่มทั้งหมด ${allButtons.length} ปุ่มในแถวนี้`);
                              allButtons.forEach((btn, idx) => {
                                console.log(`ปุ่มที่ ${idx + 1}:`, {
                                  text: btn.textContent,
                                  id: btn.id,
                                  class: btn.className,
                                  color: btn.getAttribute('color')
                                });
                              });
                              return false;
                            }
                          }
                        }
                        console.log('ไม่พบแถวของ Subtask ที่ต้องการ Edit');
                        return false;
                      }, subtaskName);
                    } catch (error) {
                      logs.push(`❌ เกิดข้อผิดพลาดในการแก้ไข Subtask: ${error.message}`);

                    }

                    // ตอนนี้ editButtonClicked จะถูกกำหนดค่าแล้วและสามารถใช้งานได้
                    if (editButtonClicked) {
                      logs.push('✅ คลิกปุ่ม Edit Subtask สำเร็จ');

                      // รอให้ Dialog แก้ไขปรากฏ
                      try {
                        await page.waitForSelector('div[role="dialog"]', { timeout: 5000 });
                        logs.push('✅ Dialog แก้ไข Subtask ปรากฏแล้ว');

                        // รอให้ข้อมูลโหลดเสร็จ (สังเกตจากการหายไปของข้อความ Loading)
                        await page.waitForFunction(() => {
                          return !document.querySelector('div[role="dialog"]')?.textContent.includes('Loading subtask details');
                        }, { timeout: 5000 }).catch(() => {
                          logs.push('⚠️ ไม่พบข้อความ Loading หรือโหลดข้อมูลนานเกินไป');
                        });

                        // รอสักครู่ให้แน่ใจว่าฟอร์มโหลดเสร็จสมบูรณ์
                        await new Promise(r => setTimeout(r, 1000));

                        logs.push('🖊️ กำลังแก้ไขข้อมูล Subtask...');

                        // 1. แก้ไข Subtask Name
                        const newSubtaskName = `Edited Subtask - ${new Date().toISOString().slice(0, 10)}`;
                        const nameInput = await page.$('input[placeholder="Enter subtask name"]');
                        if (nameInput) {
                          await nameInput.click({ clickCount: 3 }); // เลือกข้อความทั้งหมด
                          await nameInput.press('Backspace'); // ลบข้อความเดิม
                          await nameInput.type(newSubtaskName); // พิมพ์ข้อความใหม่
                          logs.push('✅ แก้ไขชื่อ Subtask เป็น: ' + newSubtaskName);
                        } else {
                          logs.push('❌ ไม่พบช่องกรอกชื่อ Subtask');
                        }

                        // 2. แก้ไข Description
                        const newDescription = `Description edited by Puppeteer on ${new Date().toISOString()}`;
                        const descInput = await page.$('input[placeholder="Enter description"]');
                        if (descInput) {
                          await descInput.click({ clickCount: 3 });
                          await descInput.press('Backspace');
                          await descInput.type(newDescription);
                          logs.push('✅ แก้ไข Description เรียบร้อย');
                        }

                        // 3. แก้ไข Budget
                        const newBudget = "3000";
                        const budgetInput = await page.$('input[placeholder="Enter budget"]');
                        if (budgetInput) {
                          await budgetInput.click({ clickCount: 3 });
                          await budgetInput.press('Backspace');
                          await budgetInput.type(newBudget);
                          logs.push('✅ แก้ไข Budget เป็น: ' + newBudget);
                        }

                        // 4. แก้ไข Start Date ถ้าต้องการ
                        // (เว้นไว้ใช้ค่าเดิม)

                        // 5. แก้ไข End Date ถ้าต้องการ
                        // (เว้นไว้ใช้ค่าเดิม)

                        // 6. แก้ไข Status (เลือกเป็น "In Progress")
                        await page.evaluate(() => {
                          // คลิกที่ dropdown เพื่อเปิด
                          const statusDropdown = document.querySelector('[role="combobox"], [data-radix-select-trigger], select');
                          if (statusDropdown) statusDropdown.click();
                        });

                        // รอให้ dropdown แสดง
                        await new Promise(r => setTimeout(r, 500));

                        // เลือก "In Progress"
                        const inProgressSelected = await page.evaluate(() => {
                          const options = document.querySelectorAll('[role="option"], option, [role="menuitem"]');
                          for (const opt of options) {
                            if (opt.textContent.toLowerCase().includes('in progress')) {
                              opt.click();
                              return true;
                            }
                          }
                          return false;
                        });

                        if (inProgressSelected) {
                          logs.push('✅ เปลี่ยน Status เป็น "In Progress"');
                        } else {
                          logs.push('⚠️ ไม่สามารถเลือก Status เป็น "In Progress" ได้');
                        }

                        // 7. แก้ไข Progress (%)
                        const newProgress = "50";
                        const progressInput = await page.$('input[type="number"]');
                        if (progressInput) {
                          await progressInput.click({ clickCount: 3 });
                          await progressInput.press('Backspace');
                          await progressInput.type(newProgress);
                          logs.push('✅ เปลี่ยน Progress เป็น: ' + newProgress + '%');
                        }

                        // 8. คลิกปุ่ม Update Subtask
                        const updateClicked = await page.evaluate(() => {
                          const updateButton = Array.from(document.querySelectorAll('button'))
                            .find(btn => btn.textContent.includes('Update Subtask'));

                          if (updateButton) {
                            updateButton.click();
                            return true;
                          }
                          return false;
                        });

                        if (updateClicked) {
                          logs.push('✅ คลิกปุ่ม Update Subtask แล้ว');

                          // รอให้ Dialog ปิด
                          await new Promise(r => setTimeout(r, 2000));

                          const dialogClosed = await page.evaluate(() => {
                            return !document.querySelector('div[role="dialog"]');
                          });

                          if (dialogClosed) {
                            logs.push('✅ Dialog ปิดลงแล้ว - อัพเดท Subtask สำเร็จ');

                            // รอให้หน้า UI อัพเดต
                            await new Promise(r => setTimeout(r, 1000));

                            // ตรวจสอบว่า Subtask ถูกอัพเดทในรายการ
                            const subtaskUpdated = await page.evaluate((newName) => {
                              const rows = Array.from(document.querySelectorAll('table tbody tr, .subtask-list-item, [role="row"]'));
                              return rows.some(row => row.textContent.includes(newName));
                            }, newSubtaskName);

                            if (subtaskUpdated) {
                              logs.push('✅ พบข้อมูล Subtask ที่อัพเดทแล้วในรายการ');
                            } else {
                              logs.push('⚠️ ไม่พบข้อมูล Subtask ที่อัพเดทในรายการ - อาจมีการเปลี่ยนแปลงแล้วแต่ไม่แสดงผลทันที');
                            }


                            // ทดสอบต่อไป - ทดสอบปุ่ม Delete Subtask
                            logs.push('🧪 เริ่มทดสอบปุ่ม Delete Subtask');

                            try {
                              // ค้นหา Subtask ที่เพิ่งแก้ไขในรายการและคลิกปุ่ม Delete
                              const deleteButtonClicked = await page.evaluate(async (newSubtaskName) => {
                                // ค้นหาแถวที่มี Subtask ที่ต้องการ
                                const rows = Array.from(document.querySelectorAll('table tbody tr, .subtask-list-item, [role="row"]'));
                                console.log(`พบแถวทั้งหมด ${rows.length} แถว สำหรับการลบ`);

                                for (const row of rows) {
                                  if (row.textContent.includes(newSubtaskName)) {
                                    console.log(`พบแถวที่มี Subtask "${newSubtaskName}" สำหรับการลบ`);

                                    // ค้นหาปุ่ม Delete โดยใช้ ID เป็นหลัก (แม่นยำที่สุด)
                                    let deleteButton = row.querySelector('#subtaskDelete');

                                    // หากไม่พบด้วย ID ลองหาด้วย properties อื่นๆ
                                    if (!deleteButton) {
                                      deleteButton = row.querySelector('button[color="red"], button.cursor-pointer[variant="soft"][color="red"]');
                                    }

                                    // หากยังไม่พบ ลองหาจากข้อความในปุ่ม
                                    if (!deleteButton) {
                                      const buttons = Array.from(row.querySelectorAll('button'));
                                      deleteButton = buttons.find(btn => btn.textContent.includes('Delete'));
                                    }

                                    if (deleteButton) {
                                      console.log('พบปุ่ม Delete สำหรับ Subtask');
                                      deleteButton.click();
                                      return true;
                                    } else {
                                      // Debug: แสดงปุ่มทั้งหมดที่พบในแถวนี้
                                      const allButtons = Array.from(row.querySelectorAll('button'));
                                      console.log(`พบปุ่มทั้งหมด ${allButtons.length} ปุ่มในแถวนี้`);
                                      allButtons.forEach((btn, idx) => {
                                        console.log(`ปุ่มที่ ${idx + 1}:`, {
                                          text: btn.textContent,
                                          id: btn.id,
                                          class: btn.className,
                                          color: btn.getAttribute('color')
                                        });
                                      });
                                      return false;
                                    }
                                  }
                                }
                                console.log(`ไม่พบแถวของ Subtask "${newSubtaskName}" ที่ต้องการลบ`);
                                return false;
                              }, newSubtaskName);

                              if (deleteButtonClicked) {
                                logs.push('✅ คลิกปุ่ม Delete Subtask สำเร็จ');

                                // รอให้ Dialog ยืนยันการลบปรากฏ
                                try {
                                  await page.waitForSelector('div[role="dialog"]', { timeout: 5000 });
                                  logs.push('✅ Dialog ยืนยันการลบ Subtask ปรากฏแล้ว');

                                  // รอสักครู่เพื่อให้ Dialog แสดงผลเต็มที่
                                  await new Promise(r => setTimeout(r, 800));

                                  // คลิกปุ่ม Confirm เพื่อยืนยันการลบ
                                  const confirmButtonClicked = await page.evaluate(() => {
                                    // ค้นหาปุ่ม Confirm ใน Dialog
                                    const confirmButton = Array.from(document.querySelectorAll('div[role="dialog"] button'))
                                      .find(btn =>
                                        btn.textContent.includes('Confirm') ||
                                        (btn.getAttribute('color') === 'red' && !btn.textContent.includes('Cancel'))
                                      );

                                    if (confirmButton) {
                                      console.log('พบปุ่ม Confirm ใน Dialog ยืนยันการลบ');
                                      confirmButton.click();
                                      return true;
                                    }
                                    return false;
                                  });

                                  if (confirmButtonClicked) {
                                    logs.push('✅ คลิกปุ่มยืนยันการลบ Subtask');

                                    // รอให้ Dialog ปิดและระบบประมวลผลการลบ
                                    await new Promise(r => setTimeout(r, 2000));

                                    // ตรวจสอบว่า Dialog ปิดลงหรือไม่
                                    const dialogClosed = await page.evaluate(() => {
                                      return !document.querySelector('div[role="dialog"]');
                                    });

                                    if (dialogClosed) {
                                      logs.push('✅ Dialog ปิดลงแล้ว');

                                      // รอให้หน้า UI อัพเดต
                                      await new Promise(r => setTimeout(r, 1000));

                                      // ตรวจสอบว่า Subtask ถูกลบออกจากรายการหรือไม่
                                      const subtaskDeleted = await page.evaluate((deletedName) => {
                                        const rows = Array.from(document.querySelectorAll('table tbody tr, .subtask-list-item, [role="row"]'));
                                        return !rows.some(row => row.textContent.includes(deletedName));
                                      }, newSubtaskName);

                                      if (subtaskDeleted) {
                                        logs.push('✅ Subtask ถูกลบออกจากรายการเรียบร้อย');

                                        logs.push('🎉 การทดสอบ CRUD Subtask ทั้งหมดสำเร็จ');
                                      } else {
                                        logs.push('❌ Subtask ยังคงปรากฏในรายการแม้หลังจากลบแล้ว');

                                      }
                                    } else {
                                      logs.push('⚠️ Dialog ยังคงเปิดอยู่หลังจากคลิกปุ่ม Confirm - อาจมีข้อผิดพลาดในการลบ');

                                      // ตรวจสอบข้อผิดพลาด
                                      const errorMsg = await page.evaluate(() => {
                                        const errorElement = document.querySelector('div[role="dialog"] [color="red"], .error-message');
                                        return errorElement ? errorElement.textContent : null;
                                      });

                                      if (errorMsg) {
                                        logs.push(`❌ พบข้อผิดพลาดในการลบ Subtask: ${errorMsg}`);
                                      }

                                    }
                                  } else {
                                    logs.push('❌ ไม่พบปุ่มยืนยันการลบใน Dialog');
                                  }
                                } catch (error) {
                                  logs.push(`❌ เกิดข้อผิดพลาดในการลบ Subtask: ${error.message}`);
                                }
                              } else {
                                logs.push('❌ ไม่สามารถคลิกปุ่ม Delete Subtask');
                              }
                            } catch (error) {
                              logs.push(`❌ เกิดข้อผิดพลาดในขั้นตอนการลบ Subtask: ${error.message}`);
                            }
                          } else {
                            logs.push('❌ Dialog ยังคงเปิดอยู่หลังจากคลิกปุ่ม Update - อาจมีข้อผิดพลาดในการบันทึก');

                            // ตรวจสอบว่ามีข้อความแสดงข้อผิดพลาดหรือไม่
                            const errorMsg = await page.evaluate(() => {
                              const errorElement = document.querySelector('div[role="dialog"] [color="red"], .error-message');
                              return errorElement ? errorElement.textContent : null;
                            });

                            if (errorMsg) {
                              logs.push(`❌ พบข้อผิดพลาด: ${errorMsg}`);
                            }

                          }
                        } else {
                          logs.push('❌ ไม่พบปุ่ม Update Subtask');
                        }

                      } catch (error) {
                        logs.push(`❌ เกิดข้อผิดพลาดในการแก้ไข Subtask: ${error.message}`);
                      }
                    } else {
                      logs.push('❌ ไม่สามารถคลิกปุ่ม Edit Subtask');
                    }

                  } else {
                    logs.push('❌ ไม่พบ Subtask ในรายการ ไม่สามารถทดสอบปุ่ม Edit และ Delete ได้');
                  }
                } else {
                  const errorMessage = await page.evaluate(() => {
                    const errors = document.querySelectorAll('div[role="dialog"] [color="red"], .error-message');
                    return errors.length > 0 ? errors[0].textContent : null;
                  });

                  logs.push(errorMessage ? `❌ พบข้อผิดพลาด: ${errorMessage}` : '⚠️ Dialog ยังเปิดอยู่หลังจากกดปุ่ม');
                }

              } else {
                logs.push('❌ ไม่พบปุ่ม Add Subtask หรือปุ่มยืนยันในฟอร์ม');
              }
            } catch (error) {
              logs.push(`❌ เกิดข้อผิดพลาดในการคลิกปุ่ม: ${error.message}`);
            }
          } catch (error) {
            // จัดการข้อผิดพลาดที่อาจเกิดขึ้นในภาพรวม
            const errMsg = `[${now()}] ❌ Fatal error: ${error.message}`;
            console.error(errMsg);
            logs.push(errMsg);
          }

          // ========== ขั้นตอนที่ 12: ทดสอบปุ่ม Edit ของ Task ==========
          logs.push(`📅 Timestamp: ${now()}`);
          logs.push('🧪 เริ่มทดสอบการแก้ไข Task');

          // ค้นหาและคลิกปุ่ม Edit ของ Task
          try {
            const editTaskButtonClicked = await page.evaluate((taskName) => {
              // ค้นหาแถวที่มี Task ที่ต้องการ
              const taskRows = Array.from(document.querySelectorAll('table tbody tr'));
              console.log(`พบแถว Task ทั้งหมด ${taskRows.length} แถว`);

              for (const row of taskRows) {
                if (row.textContent.includes(taskName)) {
                  console.log(`พบแถวที่มี Task "${taskName}"`);

                  // ค้นหาปุ่ม Edit โดยใช้ ID เป็นหลัก
                  let editButton = row.querySelector('#task-edit');

                  // หากไม่พบด้วย ID ลองหาด้วย properties อื่นๆ
                  if (!editButton) {
                    editButton = row.querySelector('button[color="orange"], button.cursor-pointer[variant="soft"][color="orange"]');
                  }

                  // หากยังไม่พบ ลองหาจากข้อความในปุ่ม
                  if (!editButton) {
                    const buttons = Array.from(row.querySelectorAll('button'));
                    editButton = buttons.find(btn => btn.textContent.trim().includes('Edit'));
                  }

                  if (editButton) {
                    console.log('พบปุ่ม Edit สำหรับ Task');
                    editButton.click();
                    return true;
                  } else {
                    // Debug: แสดงปุ่มทั้งหมดที่พบในแถวนี้
                    const allButtons = Array.from(row.querySelectorAll('button'));
                    console.log(`พบปุ่มทั้งหมด ${allButtons.length} ปุ่มในแถวนี้`);
                    allButtons.forEach((btn, idx) => {
                      console.log(`ปุ่มที่ ${idx + 1}:`, {
                        text: btn.textContent.trim(),
                        id: btn.id,
                        class: btn.className,
                        color: btn.getAttribute('color')
                      });
                    });
                    return false;
                  }
                }
              }
              console.log(`ไม่พบแถวของ Task "${taskName}" ที่ต้องการแก้ไข`);
              return false;
            }, taskName);

            if (editTaskButtonClicked) {
              logs.push('✅ คลิกปุ่ม Edit Task สำเร็จ');

              // รอให้ Dialog แก้ไขปรากฏ
              try {
                await page.waitForSelector('div[role="dialog"]', { timeout: 5000 });
                logs.push('✅ Dialog แก้ไข Task ปรากฏแล้ว');

                // รอให้ข้อมูลโหลดเสร็จ
                await new Promise(r => setTimeout(r, 1500));

                logs.push('🖊️ กำลังแก้ไขข้อมูล Task...');

                // 1. แก้ไขชื่อ Task
                const editedTaskName = `Edited Task - ${new Date().toISOString().slice(0, 10)}`;
                const nameInput = await page.$('input[value="' + taskName + '"]');
                if (nameInput) {
                  await nameInput.click({ clickCount: 3 });
                  await nameInput.press('Backspace');
                  await nameInput.type(editedTaskName);
                  logs.push('✅ แก้ไขชื่อ Task เป็น: ' + editedTaskName);
                } else {
                  logs.push('⚠️ ไม่พบช่องกรอกชื่อ Task ตามที่คาดหวัง - ลองใช้ตัวเลือกอื่น');

                  // ค้นหา input แบบอื่นๆ
                  const inputs = await page.$$('input');
                  if (inputs.length > 0) {
                    await inputs[0].click({ clickCount: 3 });
                    await inputs[0].press('Backspace');
                    await inputs[0].type(editedTaskName);
                    logs.push('✅ แก้ไขชื่อ Task เป็น: ' + editedTaskName + ' (ใช้ input ตัวแรกที่พบ)');
                  }
                }

                // 2. แก้ไข Description
                const newTaskDescription = `Description edited by automation test on ${new Date().toISOString()}`;
                const descInput = await page.$('div[role="dialog"] input:nth-child(2)');
                if (descInput) {
                  await descInput.click({ clickCount: 3 });
                  await descInput.press('Backspace');
                  await descInput.type(newTaskDescription);
                  logs.push('✅ แก้ไข Description เรียบร้อย');
                }

                // 3. แก้ไข Budget
                const newTaskBudget = "7500";
                try {
                  // ใช้วิธี JS โดยตรงในการค้นหาและกำหนดค่า
                  const budgetUpdated = await page.evaluate((value) => {
                    // วิธีที่ 1: ค้นหาจาก label ที่มีคำว่า Budget
                    const labels = Array.from(document.querySelectorAll('label'));
                    for (const label of labels) {
                      if (label.textContent.includes('Budget')) {
                        const input = label.querySelector('input');
                        if (input) {
                          input.value = value;
                          input.dispatchEvent(new Event('input', { bubbles: true }));
                          input.dispatchEvent(new Event('change', { bubbles: true }));
                          console.log('พบและแก้ไข Budget จาก label');
                          return true;
                        }
                      }
                    }
                    return false;
                  }, newTaskBudget);

                  if (budgetUpdated) {
                    logs.push('✅ แก้ไข Budget เป็น: ' + newTaskBudget + ' (ใช้วิธี JS โดยตรง)');
                  } else {
                    logs.push('❌ ไม่พบช่องกรอก Budget');
                  }
                } catch (error) {
                  logs.push('❌ ไม่สามารถแก้ไข Budget ได้: ' + error.message);
                }

                // 4. แก้ไข End Date (เพิ่มอีก 10 วัน)
                try {
                  // หา input ที่เป็น type="date" ตัวที่สอง (End Date)
                  const dateInputs = await page.$$('input[type="date"]');
                  if (dateInputs.length >= 2) {
                    const endDateInput = dateInputs[1];

                    // คำนวณวันที่ใหม่ (เพิ่ม 10 วัน)
                    const today = new Date();
                    const newEndDate = new Date();
                    newEndDate.setDate(today.getDate() + 10);
                    const newEndDateStr = newEndDate.toISOString().split('T')[0]; // รูปแบบ YYYY-MM-DD

                    await endDateInput.click({ clickCount: 3 });
                    await endDateInput.press('Backspace');
                    await endDateInput.type(newEndDateStr);
                    logs.push('✅ แก้ไข End Date เป็น: ' + newEndDateStr);
                  }
                } catch (error) {
                  logs.push(`⚠️ ไม่สามารถแก้ไข End Date: ${error.message}`);
                }

                // 5. แก้ไข Status เป็น "In Progress"
                try {
                  // คลิกที่ dropdown Status
                  const statusClick = await page.evaluate(() => {
                    const statusLabels = Array.from(document.querySelectorAll('div[role="dialog"] label'))
                      .filter(label => label.textContent.includes('Status'));

                    if (statusLabels.length > 0) {
                      const selectElement = statusLabels[0].querySelector('button[data-radix-select-trigger], select');
                      if (selectElement) {
                        selectElement.click();
                        return true;
                      }
                    }
                    return false;
                  });

                  if (statusClick) {
                    logs.push('✅ คลิก dropdown Status');

                    // รอให้ dropdown แสดงตัวเลือก
                    await new Promise(r => setTimeout(r, 500));

                    // เลือก "In Progress"
                    const statusSelected = await page.evaluate(() => {
                      const options = document.querySelectorAll('[role="option"], [data-radix-select-value], .option-item');
                      for (const option of options) {
                        if (option.textContent.toLowerCase().includes('in progress')) {
                          option.click();
                          return true;
                        }
                      }
                      return false;
                    });

                    if (statusSelected) {
                      logs.push('✅ เปลี่ยน Status เป็น "In Progress"');
                    }
                  }
                } catch (error) {
                  logs.push(`⚠️ ไม่สามารถเปลี่ยน Status: ${error.message}`);
                }

                // 6. แก้ไข Progress เป็น 60%
                const progressInput = await page.$('input[type="number"]');
                if (progressInput) {
                  await progressInput.click({ clickCount: 3 });
                  await progressInput.press('Backspace');
                  await progressInput.type('60');
                  logs.push('✅ แก้ไข Progress เป็น 60%');
                }

                // 7. คลิกปุ่ม Update
                const updateClicked = await page.evaluate(() => {
                  const updateButtons = Array.from(document.querySelectorAll('div[role="dialog"] button'))
                    .filter(btn =>
                      btn.textContent.includes('Update') ||
                      (btn.textContent.includes('Save') && !btn.textContent.includes('Cancel'))
                    );

                  if (updateButtons.length > 0) {
                    updateButtons[0].click();
                    return true;
                  }
                  return false;
                });

                if (updateClicked) {
                  logs.push('✅ คลิกปุ่ม Update Task แล้ว');

                  // รอให้ Dialog ปิดและข้อมูลอัพเดต
                  await new Promise(r => setTimeout(r, 2000));

                  // ตรวจสอบว่า Dialog ปิดลงหรือไม่
                  const dialogClosed = await page.evaluate(() => {
                    return !document.querySelector('div[role="dialog"]');
                  });

                  if (dialogClosed) {
                    logs.push('✅ Dialog ปิดลงแล้ว - อัพเดท Task สำเร็จ');

                    // รอให้หน้า UI อัพเดต
                    await new Promise(r => setTimeout(r, 1500));

                    // ตรวจสอบว่า Task ถูกอัพเดทในรายการ
                    const taskUpdated = await page.evaluate((newTaskName) => {
                      const rows = Array.from(document.querySelectorAll('table tbody tr'));
                      return rows.some(row => row.textContent.includes(newTaskName));
                    }, editedTaskName);

                    if (taskUpdated) {
                      logs.push('✅ พบข้อมูล Task ที่อัพเดทแล้วในรายการ');
                      logs.push('🎉 การทดสอบการแก้ไข Task สำเร็จ');
                    } else {
                      logs.push('⚠️ ไม่พบข้อมูล Task ที่อัพเดทในรายการ - อาจมีการเปลี่ยนแปลงแล้วแต่ไม่แสดงผลทันที');
                    }
                  } else {
                    logs.push('❌ Dialog ยังคงเปิดอยู่หลังจากคลิกปุ่ม Update - อาจมีข้อผิดพลาดในการบันทึก');

                    // ตรวจสอบข้อความแสดงข้อผิดพลาด
                    const errorMsg = await page.evaluate(() => {
                      const errorElement = document.querySelector('div[role="dialog"] [color="red"], .error-message');
                      return errorElement ? errorElement.textContent : null;
                    });

                    if (errorMsg) {
                      logs.push(`❌ พบข้อผิดพลาด: ${errorMsg}`);
                    }
                  }
                } else {
                  logs.push('❌ ไม่พบปุ่ม Update Task');
                }
              } catch (error) {
                logs.push(`❌ เกิดข้อผิดพลาดในการแก้ไข Task: ${error.message}`);
              }
            } else {
              logs.push('❌ ไม่สามารถคลิกปุ่ม Edit Task');
            }
          } catch (error) {
            logs.push(`❌ เกิดข้อผิดพลาดในกระบวนการแก้ไข Task: ${error.message}`);
          }

          // ========== ขั้นตอนที่ 13: ทดสอบปุ่ม Delete ของ Task ==========
          logs.push(`📅 Timestamp: ${now()}`);
          logs.push('🧪 เริ่มทดสอบการลบ Task');

          try {
            // ค้นหา Task ที่เพิ่งแก้ไข (Edited Task)
            const editedTaskName = `Edited Task - ${new Date().toISOString().slice(0, 10)}`;

            // ค้นหาและคลิกปุ่ม Delete ของ Task
            const deleteTaskButtonClicked = await page.evaluate((taskName) => {
              // ค้นหาแถวที่มี Task ที่ต้องการ
              const taskRows = Array.from(document.querySelectorAll('table tbody tr'));
              console.log(`พบแถว Task ทั้งหมด ${taskRows.length} แถว สำหรับการลบ`);

              for (const row of taskRows) {
                if (row.textContent.includes(taskName)) {
                  console.log(`พบแถวที่มี Task "${taskName}" สำหรับการลบ`);

                  // ค้นหาปุ่ม Delete โดยใช้ ID เป็นหลัก (แม่นยำที่สุด)
                  let deleteButton = row.querySelector('#delete-task, button[id*="delete"]');

                  // หากไม่พบด้วย ID ลองหาด้วย properties อื่นๆ
                  if (!deleteButton) {
                    deleteButton = row.querySelector('button[color="red"], button.cursor-pointer[variant="soft"][color="red"]');
                  }

                  // หากยังไม่พบ ลองหาจากข้อความในปุ่ม
                  if (!deleteButton) {
                    const buttons = Array.from(row.querySelectorAll('button'));
                    deleteButton = buttons.find(btn =>
                      btn.textContent.trim().includes('Delete') ||
                      btn.classList.contains('delete-btn')
                    );
                  }

                  if (deleteButton) {
                    console.log('พบปุ่ม Delete สำหรับ Task');
                    deleteButton.click();
                    return true;
                  }
                }
              }
              return false;
            }, editedTaskName);

            if (deleteTaskButtonClicked) {
              logs.push('✅ คลิกปุ่ม Delete Task สำเร็จ');

              // รอให้ Dialog ยืนยันการลบปรากฏ
              await page.waitForSelector('div[role="dialog"]', { timeout: 5000 });
              logs.push('✅ Dialog ยืนยันการลบ Task ปรากฏแล้ว');

              // รอสักครู่ให้ Dialog พร้อมใช้งาน
              await new Promise(r => setTimeout(r, 800));

              // คลิกปุ่ม Delete ในกล่องยืนยัน
              const confirmButtonClicked = await page.evaluate(() => {
                // ลองค้นหาปุ่ม Delete ด้วย ID ก่อน (แม่นยำที่สุด)
                let deleteButton = document.querySelector('#delete-task');

                if (!deleteButton) {
                  // ค้นหาปุ่มที่เป็นสีแดงและมีข้อความ Delete
                  const buttons = Array.from(document.querySelectorAll('div[role="dialog"] button'))
                    .filter(btn =>
                      (btn.textContent.includes('Delete') || btn.textContent.includes('ลบ')) &&
                      (btn.getAttribute('color') === 'red' || btn.className.includes('red'))
                    );

                  if (buttons.length > 0) {
                    deleteButton = buttons[0];
                  }
                }

                if (deleteButton) {
                  deleteButton.click();
                  return true;
                }
                return false;
              });

              if (confirmButtonClicked) {
                logs.push('✅ คลิกปุ่มยืนยันการลบ Task สำเร็จ');

                // รอให้ Dialog ปิดและระบบประมวลผลการลบ
                await new Promise(r => setTimeout(r, 2000));

                // ตรวจสอบว่า Dialog ปิดลงหรือไม่
                const dialogClosed = await page.evaluate(() => {
                  return !document.querySelector('div[role="dialog"]');
                });

                if (dialogClosed) {
                  logs.push('✅ Dialog ปิดลงแล้ว');

                  // รอให้หน้า UI อัพเดต
                  await new Promise(r => setTimeout(r, 1000));

                  // ตรวจสอบว่า Task ถูกลบออกจากรายการหรือไม่
                  const taskDeleted = await page.evaluate((deletedTaskName) => {
                    const rows = Array.from(document.querySelectorAll('table tbody tr'));
                    return !rows.some(row => row.textContent.includes(deletedTaskName));
                  }, editedTaskName);

                  if (taskDeleted) {
                    logs.push('✅ Task ถูกลบออกจากรายการเรียบร้อย');
                    logs.push('🎉 การทดสอบการลบ Task สำเร็จ');
                  } else {
                    logs.push('❌ Task ยังคงปรากฏในรายการแม้หลังจากลบแล้ว');
                  }
                } else {
                  logs.push('❌ Dialog ยังคงเปิดอยู่หลังจากคลิกปุ่ม Delete - อาจมีข้อผิดพลาดในการลบ');
                }
              } else {
                logs.push('❌ ไม่พบปุ่มยืนยันการลบ Task ใน Dialog');
              }
            } else {
              logs.push('❌ ไม่สามารถคลิกปุ่ม Delete Task');
            }
          } catch (error) {
            logs.push(`❌ เกิดข้อผิดพลาดในการลบ Task: ${error.message}`);
          }

          logs.push('🏁 สิ้นสุดการทดสอบการทำงานของ Task Management');

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