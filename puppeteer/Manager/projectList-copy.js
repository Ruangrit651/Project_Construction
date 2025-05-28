require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
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

// ฟังก์ชันสำหรับสร้าง screenshot directory ถ้ายังไม่มี
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

// ฟังก์ชันหลักสำหรับทดสอบการเพิ่ม Subtask
async function testAddSubtask() {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--disable-features=PasswordManagerEnabled,AutomaticPasswordSaving',
      '--disable-save-password-bubble',
      '--start-maximized'
    ]
  });
  
  const page = await browser.newPage();
  const logs = [];
  const screenshotDir = path.join(__dirname, 'screenshots');
  ensureDirectoryExists(screenshotDir);
  const logFilename = path.join(__dirname, `AddSubtask_Log_${Date.now()}.txt`);

  try {
    logs.push(`📅 เริ่มทดสอบเวลา: ${now()}`);
    const loadStart = performance.now();

    // 1. เริ่มจาก Login
    logs.push('🔄 เริ่มทดสอบการ Login');
    await page.goto(process.env.APP_URL, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(screenshotDir, '01-login-page.png') });
    logs.push('✅ เข้าสู่หน้า Login สำเร็จ');

    // กรอกข้อมูล Login
    await page.waitForSelector('#username');
    await page.waitForSelector('#password');
    await page.type('#username', process.env.LOGIN_USERNAME_MANAGER);
    await page.type('#password', process.env.LOGIN_PASSWORD_MANAGER);
    await page.screenshot({ path: path.join(screenshotDir, '02-filled-login.png') });
    logs.push('✅ กรอกข้อมูล Login เรียบร้อย');

    // คลิกปุ่ม Login และรอการนำทาง
    const loginStart = performance.now();
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
    const loginEnd = performance.now();
    logs.push(`✅ Login สำเร็จใช้เวลา ${(loginEnd - loginStart).toFixed(2)} ms`);
    await page.screenshot({ path: path.join(screenshotDir, '03-after-login.png') });

    // 2. ไปที่หน้า Project List
    logs.push('🔄 กำลังนำทางไปยังหน้ารายการโปรเจค');
    const navigateToProjectsStart = performance.now();
    await page.goto(`${process.env.APP_URL}/ManagerProjectList`, { waitUntil: 'networkidle0' });
    const navigateToProjectsEnd = performance.now();
    logs.push(`✅ นำทางไปยังหน้ารายการโปรเจคสำเร็จใช้เวลา ${(navigateToProjectsEnd - navigateToProjectsStart).toFixed(2)} ms`);
    
    // รอให้ตารางโหลดเสร็จ
    await page.waitForFunction(() => {
      return !document.querySelector('.animate-spin') &&
        (document.querySelector('table tbody tr') || document.querySelector('table tbody td.text-center'));
    }, { timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotDir, '04-project-list.png') });

    // 3. คลิกเข้าโปรเจคแรก
    logs.push('🔄 กำลังเลือกโปรเจคแรกในรายการ');
    const projectName = await page.evaluate(() => {
      const firstRow = document.querySelector('table tbody tr');
      if (firstRow) {
        const projectNameCell = firstRow.querySelector('td:nth-child(2)');
        return projectNameCell ? projectNameCell.innerText : 'Unknown Project';
      }
      return 'Unknown Project';
    });
    logs.push(`🔍 เลือกโปรเจค: "${projectName}"`);

    // คลิกเข้าไปที่โปรเจค
    const navigateToTasksStart = performance.now();
    await Promise.all([
      page.click('table tbody tr'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
    const navigateToTasksEnd = performance.now();
    logs.push(`✅ นำทางไปยังหน้ารายการงานสำเร็จใช้เวลา ${(navigateToTasksEnd - navigateToTasksStart).toFixed(2)} ms`);
    await page.screenshot({ path: path.join(screenshotDir, '05-task-list.png') });

    // 4. ตรวจสอบว่ามี tasks หรือไม่
    const tasksExist = await page.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr');
      return rows.length > 0;
    });

    if (!tasksExist) {
      logs.push('❌ ไม่พบงานในระบบ ไม่สามารถทดสอบ Subtask ได้');
      throw new Error('No tasks available to test subtasks');
    }

    logs.push('✅ พบงานในระบบ');

    // 5. ขยาย Task แรกเพื่อดู Subtasks
    logs.push('🔄 กำลังขยาย Task แรก');
    const hasExpandButton = await page.evaluate(() => {
      const expandButtons = document.querySelectorAll('button[aria-label="Toggle task details"]');
      if (expandButtons.length > 0) {
        expandButtons[0].click();
        return true;
      }
      return false;
    });

    if (hasExpandButton) {
      logs.push('✅ คลิกขยายข้อมูลงานแล้ว');
      // รอให้ข้อมูล subtasks โหลด
      await page.waitForTimeout(1000);
    }

    // 6. ดึงชื่อและวันที่ของ Task หลัก
    const taskInfo = await page.evaluate(() => {
      const firstRow = document.querySelector('table tbody tr');
      let taskName = 'Unknown Task';
      let taskDates = { start_date: null, end_date: null };

      if (firstRow) {
        // ดึงชื่อ Task
        const taskNameCell = firstRow.querySelector('td:nth-child(2)');
        if (taskNameCell) {
          taskName = taskNameCell.innerText;
        }

        // ค้นหาวันที่ในแถว
        const allCells = firstRow.querySelectorAll('td');
        allCells.forEach(cell => {
          const text = cell.innerText;
          // ค้นหารูปแบบวันที่ YYYY-MM-DD
          const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/g);
          if (dateMatch && dateMatch.length >= 2) {
            taskDates.start_date = dateMatch[0];
            taskDates.end_date = dateMatch[1];
          }
        });

        // ถ้ายังไม่พบ ให้ดูที่ข้อมูลที่ขยายออกมา
        if (!taskDates.start_date || !taskDates.end_date) {
          const expandedInfo = document.querySelector('.expanded-task-info, .task-details');
          if (expandedInfo) {
            const expandedText = expandedInfo.innerText;
            const dateMatches = expandedText.match(/\d{4}-\d{2}-\d{2}/g);
            if (dateMatches && dateMatches.length >= 2) {
              taskDates.start_date = dateMatches[0];
              taskDates.end_date = dateMatches[1];
            }
          }
        }

        // ถ้ายังไม่พบอีก ให้ดูในทั้งหน้า
        if (!taskDates.start_date || !taskDates.end_date) {
          const allText = document.body.innerText;
          const dateMatches = allText.match(/\d{4}-\d{2}-\d{2}/g);
          if (dateMatches && dateMatches.length >= 2) {
            taskDates.start_date = dateMatches[0];
            taskDates.end_date = dateMatches[dateMatches.length - 1]; // ใช้วันที่แรกและวันที่สุดท้ายที่พบ
          }
        }
      }

      return { taskName, taskDates };
    });

    logs.push(`🔍 Task ที่เลือก: "${taskInfo.taskName}"`);
    logs.push(`📅 วันที่ของ Task: ${taskInfo.taskDates.start_date || 'ไม่พบ'} ถึง ${taskInfo.taskDates.end_date || 'ไม่พบ'}`);

    // 7. คลิกปุ่ม Add Subtask
    logs.push('🔄 กำลังคลิกปุ่ม Add Subtask');
    const addButtonClicked = await page.evaluate(() => {
      const addButtons = Array.from(document.querySelectorAll('button'));
      const addSubtaskBtn = addButtons.find(btn =>
        btn.textContent.includes('+ Add') && !btn.textContent.includes('Task')
      );
      if (addSubtaskBtn) {
        addSubtaskBtn.click();
        return true;
      }
      return false;
    });

    if (!addButtonClicked) {
      logs.push('❌ ไม่พบปุ่มเพิ่ม Subtask');
      throw new Error('Add Subtask button not found');
    }

    // 8. รอให้ Dialog เปิด
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    logs.push('✅ Dialog เพิ่ม Subtask เปิดขึ้นแล้ว');
    await page.screenshot({ path: path.join(screenshotDir, '06-add-subtask-dialog.png') });

    // 9. กรอกข้อมูล Subtask
    const subtaskName = `Test Subtask ${Date.now()}`;
    await page.type('input[placeholder="Enter subtask name"]', subtaskName);
    logs.push(`✅ กรอกชื่อ Subtask: ${subtaskName}`);

    await page.type('input[placeholder="Enter description"]', 'This is an automated test subtask');
    logs.push('✅ กรอกคำอธิบาย Subtask');

    // 10. กรอกงบประมาณ
    await page.evaluate(() => {
      const budgetInput = document.querySelector('input[placeholder="Enter budget"]');
      if (budgetInput) budgetInput.value = '';
    });
    await page.type('input[placeholder="Enter budget"]', '5000');
    logs.push('✅ กรอกงบประมาณ: 5,000');

    // 11. กรอกวันที่เริ่มและวันที่สิ้นสุดโดยใช้วันที่ของ Task หลัก
    let startDateStr, endDateStr;

    // ถ้าพบวันที่ของ Task หลัก ใช้วันที่นั้น หรือปรับให้อยู่ในช่วงของ Task หลัก
    if (taskInfo.taskDates.start_date && taskInfo.taskDates.end_date) {
      const taskStartDate = new Date(taskInfo.taskDates.start_date);
      const taskEndDate = new Date(taskInfo.taskDates.end_date);
      
      // กำหนดให้ subtask เริ่มต้นในวันเดียวกับ task หลัก
      const subtaskStartDate = new Date(taskStartDate);
      
      // กำหนดให้ subtask สิ้นสุดก่อน task หลัก 1 วัน
      const subtaskEndDate = new Date(taskEndDate);
      subtaskEndDate.setDate(subtaskEndDate.getDate() - 1);
      
      // ตรวจสอบว่าวันที่สิ้นสุดต้องไม่เร็วกว่าวันที่เริ่มต้น
      if (subtaskEndDate <= subtaskStartDate) {
        subtaskEndDate.setDate(subtaskStartDate.getDate() + 1);
      }
      
      startDateStr = subtaskStartDate.toISOString().split('T')[0];
      endDateStr = subtaskEndDate.toISOString().split('T')[0];
      
      logs.push(`📅 ใช้วันที่ตาม Task หลัก: เริ่มต้น=${startDateStr}, สิ้นสุด=${endDateStr}`);
    } else {
      // ถ้าไม่พบวันที่ของ Task หลัก ใช้วันที่ปัจจุบันและ +7 วัน
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      startDateStr = today.toISOString().split('T')[0];
      endDateStr = nextWeek.toISOString().split('T')[0];
      
      logs.push(`📅 ไม่พบวันที่ของ Task หลัก จึงใช้วันที่ปัจจุบันและ +7 วัน: ${startDateStr} ถึง ${endDateStr}`);
    }

    // กรอกวันที่เริ่ม
    await page.evaluate((date) => {
      const startDateInputs = document.querySelectorAll('input[type="date"]');
      if (startDateInputs.length > 0) {
        startDateInputs[0].value = date;
        startDateInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        startDateInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, startDateStr);
    logs.push(`✅ กำหนดวันเริ่มต้น: ${startDateStr}`);

    // กรอกวันที่สิ้นสุด
    await page.evaluate((date) => {
      const dateInputs = document.querySelectorAll('input[type="date"]');
      if (dateInputs.length > 1) {
        dateInputs[1].value = date;
        dateInputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        dateInputs[1].dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, endDateStr);
    logs.push(`✅ กำหนดวันสิ้นสุด: ${endDateStr}`);

    // 12. เลือกสถานะ In Progress
    await page.evaluate(() => {
      const statusTrigger = document.querySelector('[role="dialog"] [role="combobox"]');
      if (statusTrigger) statusTrigger.click();
    });
    
    // รอให้ dropdown เปิด
    await page.waitForFunction(() => {
      const trigger = document.querySelector('[role="dialog"] [role="combobox"]');
      return trigger && trigger.getAttribute('data-state') === 'open';
    });
    logs.push('✅ Status dropdown เปิดแล้ว');
    
    // เลือก In Progress
    await page.evaluate(() => {
      const options = Array.from(document.querySelectorAll('[role="option"]'));
      const inProgressOption = options.find(option =>
        option.textContent.toLowerCase().includes('in progress')
      );
      if (inProgressOption) inProgressOption.click();
    });
    logs.push('✅ เลือกสถานะเป็น In Progress');
    
    // รอให้ dropdown ปิด
    await page.waitForFunction(() => {
      const trigger = document.querySelector('[role="dialog"] [role="combobox"]');
      return !trigger || trigger.getAttribute('data-state') !== 'open';
    });

    // 13. กรอก progress percentage
    await page.evaluate(() => {
      const progressInput = document.querySelector('input[type="number"]');
      if (progressInput) {
        progressInput.value = '';
        progressInput.focus();
      }
    });
    await page.type('input[type="number"]', '50');
    logs.push('✅ กำหนดความคืบหน้า: 50%');
    
    // บันทึกภาพหน้าจอหลังกรอกข้อมูลครบ
    await page.screenshot({ path: path.join(screenshotDir, '07-filled-subtask-form.png') });

    // 14. คลิกปุ่ม Add Subtask เพื่อบันทึก
    const addSubtaskStart = performance.now();
    
    // หาปุ่ม Add Subtask ที่อยู่ใน Dialog
    await page.evaluate(() => {
      const dialogButtons = Array.from(document.querySelectorAll('[role="dialog"] button'));
      const addButton = dialogButtons.find(btn => 
        btn.textContent.includes('Add Subtask') || 
        (btn.type === 'submit' && !btn.textContent.includes('Cancel'))
      );
      
      if (addButton) {
        addButton.click();
      } else {
        // ถ้าไม่เจอปุ่มที่มีข้อความ Add Subtask ให้ลองหาปุ่มอื่นที่อาจเป็นปุ่มบันทึก
        const possibleSubmitButtons = dialogButtons.filter(btn => 
          !btn.textContent.includes('Cancel') && 
          !btn.textContent.includes('Close')
        );
        
        if (possibleSubmitButtons.length > 0) {
          // ใช้ปุ่มแรกที่อาจเป็นปุ่มบันทึก
          possibleSubmitButtons[0].click();
        }
      }
    });
    
    logs.push('🔄 คลิกปุ่มเพิ่ม Subtask แล้ว');

    // 15. รอให้ dialog ปิด
    try {
      await page.waitForFunction(() => !document.querySelector('[role="dialog"]'), { timeout: 10000 });
      const addSubtaskEnd = performance.now();
      logs.push(`✅ Subtask ถูกบันทึกเรียบร้อยใน ${(addSubtaskEnd - addSubtaskStart).toFixed(2)} ms`);
      
      // บันทึกภาพหลังเพิ่ม Subtask
      await page.screenshot({ path: path.join(screenshotDir, '08-after-adding-subtask.png') });
    } catch (error) {
      logs.push('❌ Dialog ไม่ปิดหลังจากกด Add Subtask - อาจเกิดข้อผิดพลาด');
      
      // บันทึกภาพในกรณีเกิดข้อผิดพลาด
      await page.screenshot({ path: path.join(screenshotDir, '08-error-dialog.png') });
      
      // ตรวจสอบข้อความ error
      const errorMessage = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('.text-red-500, .text-error, .error-message');
        for (const el of errorElements) {
          if (el.innerText.trim() !== '') {
            return el.innerText;
          }
        }
        return document.body.innerText.includes('required fields') ? 
          'Please fill out all required fields properly.' : 'Unknown error';
      });
      
      logs.push(`❌ ข้อความผิดพลาด: ${errorMessage}`);
      
      // ลองปิด dialog และทำต่อ
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const cancelBtn = buttons.find(btn => btn.textContent.includes('Cancel'));
        if (cancelBtn) cancelBtn.click();
      });
    }

    // 16. ตรวจสอบว่า subtask ที่เพิ่มแสดงในรายการ
    await page.waitForTimeout(2000); // รอให้ UI อัพเดต
    
    const subtaskAdded = await page.evaluate((name) => {
      // ลองหา subtask ในหลายรูปแบบ
      const pageContent = document.body.innerText;
      return pageContent.includes(name);
    }, subtaskName);

    if (subtaskAdded) {
      logs.push(`✅ พบ Subtask "${subtaskName}" ในรายการเรียบร้อย`);
      await page.screenshot({ path: path.join(screenshotDir, '09-subtask-verified.png') });
    } else {
      logs.push(`❌ ไม่พบ Subtask "${subtaskName}" ในรายการหลังจากเพิ่ม`);
      await page.screenshot({ path: path.join(screenshotDir, '09-subtask-not-found.png') });
    }

    // สรุปการทดสอบ
    logs.push('');
    logs.push('📋 สรุปการทดสอบการเพิ่ม Subtask');
    logs.push('✅ เปิด Dialog: สำเร็จ');
    logs.push('✅ กรอกข้อมูล: สำเร็จ');
    logs.push(`${subtaskAdded ? '✅' : '❌'} บันทึกและแสดงผล: ${subtaskAdded ? 'สำเร็จ' : 'ไม่สำเร็จ'}`);
    
    const testEndTime = performance.now();
    logs.push(`⏱️ เวลาทดสอบทั้งหมด: ${((testEndTime - loadStart) / 1000).toFixed(2)} วินาที`);
    
    // บันทึก logs
    fs.writeFileSync(logFilename, logs.join('\n'), 'utf8');
    console.log(`\n📝 บันทึก Log ไปที่ ${logFilename}`);
    
    return {
      success: subtaskAdded,
      logs: logs,
      screenshots: screenshotDir
    };
    
  } catch (error) {
    const errMsg = `[${now()}] ❌ เกิดข้อผิดพลาดที่ไม่คาดคิด: ${error.message}`;
    console.error(errMsg);
    logs.push(errMsg);
    
    // บันทึกภาพหน้าจอในกรณีเกิดข้อผิดพลาด
    await page.screenshot({ path: path.join(screenshotDir, 'error-screenshot.png') });
    
    // บันทึก logs
    fs.writeFileSync(logFilename, logs.join('\n'), 'utf8');
    
    return {
      success: false,
      error: error.message,
      logs: logs,
      screenshots: screenshotDir
    };
  } finally {
    await new Promise(r => setTimeout(r, 2000));
    await browser?.close();
  }
}

// เรียกใช้งานฟังก์ชัน
if (require.main === module) {
  (async () => {
    console.log('🚀 เริ่มการทดสอบเพิ่ม Subtask...');
    const result = await testAddSubtask();
    console.log(`🏁 การทดสอบเสร็จสิ้น: ${result.success ? '✅ สำเร็จ' : '❌ ไม่สำเร็จ'}`);
  })();
}

module.exports = { testAddSubtask };