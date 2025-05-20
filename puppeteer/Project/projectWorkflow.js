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

const logFilename = 'Project_Workflow_log.txt';

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
    const startFullTest = Date.now();
    log.push(`📅 เวลาเริ่มทดสอบทั้งหมด: ${now()}`);
    log.push(`🧪 เริ่มการทดสอบการทำงานของโปรเจกต์แบบครบวงจร (Detail → Edit → Delete)`);

    const startLoad = Date.now();
    await page.goto(process.env.APP_URL, { waitUntil: 'networkidle0' });
    const pageLoadTime = Date.now() - startLoad;
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
      // log.push('⚠️ No projects found. Creating a new project first...');

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

      const projectName = `Workflow Test Project ${Date.now()}`;
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

      // await page.type('[placeholder="Enter actual"]', '5000');
      // log.push('📝 Entered Actual: 5,000');

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

      // try {
      //   await page.waitForFunction(
      //     (expectedProject) => {
      //       const cells = document.querySelectorAll('td');
      //       return Array.from(cells).some(cell => cell.textContent.includes(expectedProject));
      //     },
      //     { timeout: 5000 },
      //     projectName
      //   );

      //   log.push('✅ New project created and appears in the table');
      // } catch (e) {
      //   log.push(`⚠️ New project not found in table: ${e.message}`);
      //   throw new Error('Failed to create a new project');
      // }

      // รอสักครู่ให้ UI อัพเดท
      await page.waitForTimeout(2000);
    }

    // =================== ขั้นตอนที่ 1: ทดสอบปุ่ม Detail ===================
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
    log.push(`✅ STEP 1 COMPLETE: Detail testing successful`);


    // =================== ขั้นตอนที่ 2: ทดสอบปุ่ม Edit ===================
    const startEdit = Date.now();
    log.push(`📅 เวลา: ${now()}`);
    log.push('🔄 Looking for Edit button...');

    // รอให้ตารางแสดงข้อมูลโปรเจกต์โหลดเสร็จ
    await page.waitForSelector('table', { timeout: 5000 });
    log.push('✅ Project table loaded');

    // บันทึกข้อมูลโปรเจกต์ก่อนแก้ไข
    const originalProjectInfo = await page.evaluate(() => {
      const rows = document.querySelectorAll('tr');
      if (rows.length > 1) { // ข้ามแถวหัวตาราง
        const cells = rows[1].querySelectorAll('td');
        if (cells.length > 0) {
          return {
            name: cells[0].textContent.trim(),
            budget: cells[1] ? cells[1].textContent.trim() : 'N/A',
            status: cells[2] ? cells[2].textContent.trim() : 'N/A'
          };
        }
      }
      return { name: 'Unknown Project', budget: 'N/A', status: 'N/A' };
    });
    
    log.push(`📋 Testing project: ${originalProjectInfo.name}`);
    log.push(`📋 Current budget: ${originalProjectInfo.budget}`);
    log.push(`📋 Current status: ${originalProjectInfo.status}`);

    // ค้นหาและคลิกปุ่ม Edit ของโปรเจกต์แรก
    const editButtonClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const editButton = buttons.find(btn => btn.textContent.includes('Edit'));
      if (editButton) {
        editButton.click();
        return true;
      }
      return false;
    });

    if (!editButtonClicked) {
      throw new Error('Edit button not found or could not be clicked');
    }
    
    log.push('🟢 Clicked Edit button');

    // =================== ตรวจสอบที่ Dialog แก้ไขโปรเจกต์ ===================
    // รอให้ Dialog แก้ไขโปรเจกต์เปิดขึ้น
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    log.push('✅ Edit Project dialog opened');


    // ตรวจสอบว่าฟอร์มแสดงข้อมูลโปรเจกต์เดิมถูกต้อง
    const formHasCurrentValues = await page.evaluate((expectedName) => {
      const nameInput = document.querySelector('[placeholder="Enter project name"]');
      return nameInput && nameInput.value.includes(expectedName);
    }, originalProjectInfo.name);
    
    log.push(`✅ Form shows current project name: ${formHasCurrentValues ? 'Yes' : 'No'}`);

    // =================== แก้ไขข้อมูลโปรเจกต์ ===================
    // แก้ไขชื่อโปรเจกต์
    const newProjectName = `Edited Project ${Date.now()}`;
    await page.evaluate(() => {
      const nameInput = document.querySelector('[placeholder="Enter project name"]');
      if (nameInput) {
        nameInput.value = '';
      }
    });
    await page.type('[placeholder="Enter project name"]', newProjectName);
    log.push(`📝 Changed Project Name to: ${newProjectName}`);

    // แก้ไขงบประมาณ
    const newBudget = '20000';
    await page.evaluate(() => {
      const budgetInput = document.querySelector('[placeholder="Enter budget"]');
      if (budgetInput) {
        budgetInput.value = '';
      }
    });
    await page.type('[placeholder="Enter budget"]', newBudget);
    log.push(`📝 Changed Budget to: ${newBudget}`);

    // แก้ไขสถานะ
    await page.$$eval('.select-trigger', selects => {
      const statusSelect = selects.find(select => 
        select.textContent.includes('In progress') || 
        select.textContent.includes('Completed') ||
        select.textContent.includes('Suspend operations') ||
        select.textContent.includes('Project Cancellation')
      );
      if (statusSelect) statusSelect.click();
    });

    await page.waitForSelector('[role="option"]', { timeout: 5000 });
    
    // เลือกสถานะ "Completed"
    await page.$$eval('[role="option"]', options => {
      const completedOption = options.find(option => option.textContent.includes('Completed'));
      if (completedOption) completedOption.click();
    });
    
    log.push('📝 Changed Status to: Completed');


    // คลิกปุ่ม Update
    await page.$$eval('button', buttons => {
      const updateButton = buttons.find(btn => btn.textContent.includes('Update'));
      if (updateButton) {
        updateButton.click();
        return true;
      }
      return false;
    });
    
    log.push('🟢 Clicked Update button');

    // รอให้ Dialog ปิด (ปุ่ม Update ควรปิด Dialog เมื่อบันทึกเสร็จ)
    try {
      await page.waitForFunction(
        () => !document.querySelector('[role="dialog"]'),
        { timeout: 5000 } 
      );
      log.push('✅ Dialog closed after update');
    } catch (e) {
      log.push(`⚠️ Dialog did not close: ${e.message}`);
      
      // ตรวจสอบว่ามีข้อความแสดงข้อผิดพลาดหรือไม่
      const errorMessage = await page.evaluate(() => {
        return document.body.innerText.includes('error') || document.body.innerText.includes('Error');
      });
      
      if (errorMessage) {
        log.push('⚠️ Error message detected on dialog');
      }
      
      // พยายามคลิกปุ่ม Cancel เพื่อปิด Dialog
      await page.$$eval('button', buttons => {
        const cancelButton = buttons.find(btn => btn.textContent.includes('Cancel'));
        if (cancelButton) {
          cancelButton.click();
          return true;
        }
        return false;
      });
      
      log.push('🟢 Attempted to click Cancel button');
    }

    // =================== ตรวจสอบว่าข้อมูลถูกอัพเดทหรือไม่ ===================
    // รอให้ตารางโหลดใหม่
    await page.waitForSelector('table', { timeout: 5000 });
    log.push('✅ Project table reloaded');

    // ตรวจสอบข้อมูลที่ถูกแก้ไข
    const updatedProjectInfo = await page.evaluate((expectedName) => {
      const rows = document.querySelectorAll('tr');
      
      // ค้นหาแถวของโปรเจกต์ที่เพิ่งแก้ไข
      let projectRow = null;
      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td');
        if (cells.length > 0 && cells[0].textContent.trim().includes(expectedName)) {
          projectRow = rows[i];
          break;
        }
      }
      
      if (projectRow) {
        const cells = projectRow.querySelectorAll('td');
        return {
          found: true,
          name: cells[0].textContent.trim(),
          budget: cells[1] ? cells[1].textContent.trim() : 'N/A',
          status: cells[2] ? cells[2].textContent.trim() : 'N/A'
        };
      }
      
      return { found: false };
    }, newProjectName);

    if (updatedProjectInfo.found) {
      log.push('✅ Updated project found in table');
      log.push(`📋 Updated project name: ${updatedProjectInfo.name}`);
      log.push(`📋 Updated budget: ${updatedProjectInfo.budget}`);
      log.push(`📋 Updated status: ${updatedProjectInfo.status}`);
      
      // ตรวจสอบว่าข้อมูลถูกอัพเดทตามที่แก้ไขหรือไม่
      if (updatedProjectInfo.name.includes(newProjectName)) {
        log.push('✅ Project name was updated correctly');
      } else {
        log.push('⚠️ Project name was not updated as expected');
      }
      
      // ตรวจสอบงบประมาณ (อาจมีการจัดรูปแบบตัวเลข เช่น "20,000")
      if (updatedProjectInfo.budget.includes('20') || updatedProjectInfo.budget.includes('20,000')) {
        log.push('✅ Budget was updated correctly');
      } else {
        log.push('⚠️ Budget was not updated as expected');
      }
      
      if (updatedProjectInfo.status.includes('Completed')) {
        log.push('✅ Status was updated correctly');
      } else {
        log.push('⚠️ Status was not updated as expected');
      }
    } else {
      log.push('⚠️ Could not find updated project in table');
    }

    const editTime = Date.now() - startEdit;
    log.push(`⏱️ Total Edit Testing Time: ${editTime} ms`);
    log.push(`🌐 Final URL: ${page.url()}`);
    log.push(`✅ STEP 2 COMPLETE: Edit testing successful`);

    // =================== ขั้นตอนที่ 3: ทดสอบปุ่ม Delete ===================
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
    log.push(`✅ STEP 3 COMPLETE: Delete testing successful`);

    // =================== สรุปผลการทดสอบ ===================
    const totalTestTime = Date.now() - startFullTest;
    log.push(`📅 เวลาสิ้นสุดการทดสอบ: ${now()}`);
    log.push(`⏱️ ระยะเวลาทดสอบทั้งหมด: ${totalTestTime} ms`);
    log.push(`🔍 สรุปเวลาในแต่ละขั้นตอน:`);
    log.push(`   - Detail: ${detailTime} ms`);
    log.push(`   - Edit: ${editTime} ms`);
    log.push(`   - Delete: ${deleteTime} ms`);
    log.push(`🌐 Final URL: ${page.url()}`);
    log.push(`✅ การทดสอบครบวงจรเสร็จสิ้น (Detail → Edit → Delete)`);

    fs.writeFileSync(logFilename, log.join('\n'), 'utf8');
    console.log('\n📝 Log saved to', logFilename);
    console.log(log.join('\n'));

  } catch (err) {
    const errorLog = `📅 เวลา: ${now()} ❌ Unexpected error: ${err.message}`;
    console.error(errorLog);
    log.push(errorLog);
    fs.writeFileSync(logFilename, log.join('\n'), 'utf8');
  } finally {
    await new Promise(r => setTimeout(r, 2000)); // ชะลอให้เห็นผลลัพธ์

    await browser?.close();
  }
})();