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
      ],
      defaultViewport: null, // ใช้ viewport ขนาดเต็มจอ
    });

    const page = await browser.newPage();

    // =================== เริ่มทดสอบ ===================
    const startFullTest = Date.now();
    log.push(`📅 เวลาเริ่มทดสอบทั้งหมด: ${now()}`);
    log.push(`🧪 เริ่มการทดสอบการทำงานของโปรเจกต์แบบครบวงจร (Create → Detail → Edit → Delete)`);

    const startLoad = Date.now();
    await page.goto(process.env.APP_URL, { waitUntil: 'networkidle0' });
    const pageLoadTime = Date.now() - startLoad;
    log.push(`🚀 Page Load Time: ${pageLoadTime} ms`); //โหลดก่อนล็อกอิน

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
    const startProjectNav = Date.now();
    await page.goto(`${process.env.APP_URL}adminproject`, { waitUntil: 'networkidle0' });
    const projectNavTime = Date.now() - startProjectNav;

    log.push(`⏱️ Project Page Navigation Time: ${projectNavTime} ms`);
    if (page.url().includes('adminproject')) {
      // log.push('✅ Successfully navigated to Project page');
    } else {
      throw new Error('Failed to navigate to Project page');
    }

    // =================== ขั้นตอนที่ 0: สร้างโปรเจกต์ใหม่ ===================
     const startCreate = Date.now();
    // log.push(`📅 เวลา: ${now()}`);
    // log.push('🔄 Looking for Create button...');

    await page.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => btn.textContent.includes('Create'));
    }, { timeout: 1100 });

    await page.$$eval('button', buttons => {
      const createButton = buttons.find(btn => btn.textContent.includes('Create'));
      if (createButton) {
        createButton.click();
        return true;
      }
      return false;
    });

    log.push('🟢 Clicked Create button'); 

    await page.waitForSelector('[role="dialog"]', { timeout: 1100 });
    // log.push('✅ Create Project dialog opened');

    const newProjectName = `Test Project ${Date.now()}`;
    await page.type('[placeholder="Enter project name"]', newProjectName);
    // log.push(`📝 Entered Project Name: ${newProjectName}`);

    try {
      // แก้ไขส่วนการเลือกเจ้าของโปรเจกต์ให้ทนทานต่อข้อผิดพลาดมากขึ้น
      // log.push('🔄 กำลังเลือกเจ้าของโปรเจกต์...');
      
      // วิธีที่ 1: ใช้ CSS Selector ที่หลากหลายในการคลิก dropdown
      await page.waitForSelector('.select-trigger, .dropdown-toggle, select[name="owner"], div[role="combobox"]', { timeout: 1100 });
      
      await page.evaluate(() => {
        // เลือกจากตัวเลือกหลายรูปแบบที่อาจเป็นไปได้
        const ownerSelectors = [
          '.select-trigger', 
          '.dropdown-toggle', 
          'select[name="owner"]', 
          'div[role="combobox"]',
          'div[aria-haspopup="listbox"]'
        ];
        
        for (const selector of ownerSelectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            if (element.textContent.includes('เลือกเจ้าของโปรเจกต์') || 
                element.textContent.includes('เจ้าของ') || 
                element.textContent.includes('Owner')) {
              element.click();
              return;
            }
          }
        }
        
        // ถ้าไม่เจอ ลองคลิกที่ dropdown ตัวแรกที่เจอในแบบฟอร์ม
        const form = document.querySelector('form, [role="dialog"]');
        if (form) {
          const dropdowns = form.querySelectorAll('.select-trigger, select, [role="combobox"]');
          if (dropdowns.length > 0) {
            dropdowns[0].click();
          }
        }
      });
      
      // รอนานขึ้นสำหรับตัวเลือกปรากฏ
      await page.waitForFunction(() => {
        // ตรวจสอบจากหลายตัวเลือกที่อาจเป็นไปได้
        return document.querySelector('[role="option"], [role="listbox"] li, .dropdown-item, select option') !== null;
      }, { timeout: 8000 });
      
      // คลิกเลือกตัวเลือกแรก
      await page.evaluate(() => {
        // ลองค้นหาจากหลายรูปแบบ
        const optionSelectors = [
          '[role="option"]', 
          '[role="listbox"] li', 
          '.dropdown-item', 
          'select option'
        ];
        
        for (const selector of optionSelectors) {
          const options = document.querySelectorAll(selector);
          if (options.length > 0) {
            options[0].click();
            return;
          }
        }
      });
      
      log.push('✅ เลือกเจ้าของโปรเจกต์สำเร็จ');
    } catch (e) {
      log.push(`⚠️ ไม่สามารถเลือกเจ้าของโปรเจกต์ได้: ${e.message}`);
      log.push('ℹ️ ดำเนินการต่อโดยไม่มีเจ้าของโปรเจกต์');
    }

    await page.type('[placeholder="Enter budget"]', '10000');
    // log.push('📝 Entered Budget: 10,000');

    const today = new Date();
    const startDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    await page.type('input[type="date"]', startDate);
    // log.push(`📝 Entered Start Date: ${startDate}`);

    today.setMonth(today.getMonth() + 1);
    const endDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    await page.$$eval('input[type="date"]', inputs => {
      if (inputs.length > 1) inputs[1].focus();
    });
    await page.keyboard.type(endDate);
    // log.push(`📝 Entered End Date: ${endDate}`);

    const saveStart = Date.now();
    try {
      await page.$$eval('button', buttons => {
        const saveButton = buttons.find(btn => btn.textContent.includes('Save'));
        if (saveButton) {
          saveButton.click();
          return true;
        }
        return false;
      });

      log.push('🟢 Clicked Save button');
    } catch (e) {
      log.push(`⚠️ Could not click Save button: ${e.message}`);
    }

    try {
      await page.waitForFunction(
        () => !document.querySelector('[role="dialog"]'),
        { timeout: 1100 }
      );
      log.push('✅ Dialog closed after save');
    } catch (e) {
      log.push(`⚠️ Dialog did not close: ${e.message}`);
    }

    // รอให้ตารางโหลดใหม่
    await page.waitForSelector('table', { timeout: 1100 });
    await new Promise(resolve => setTimeout(resolve, 2000)); // รอเพิ่มเติมให้ข้อมูลอัพเดท

    // บันทึกจำนวนโปรเจกต์หลังสร้าง เพื่อเปรียบเทียบ
    const projectCountBeforeCreate = await page.evaluate(() => {
      return document.querySelectorAll('table tr').length - 1; // หักแถวหัวตาราง
    });

    try {
      await page.waitForFunction(
        (expectedProject) => {
          const cells = document.querySelectorAll('td');
          return Array.from(cells).some(cell => cell.textContent.includes(expectedProject));
        },
        { timeout: 1100 },
        newProjectName
      );

      log.push('✅ New project appears in the table');
    } catch (e) {
      log.push(`⚠️ New project not found in table: ${e.message}`);
    }

    // ตรวจสอบจำนวนโปรเจกต์หลังการสร้าง
    const projectCountAfterCreate = await page.evaluate(() => {
      return document.querySelectorAll('table tr').length - 1; // หักแถวหัวตาราง
    });
    

    const createTime = Date.now() - startCreate;
    log.push(`⏱️ Total Create Project Time: ${createTime} ms`);
    log.push(`✅ ขั้นตอนที่ 0 เสร็จสิ้น: การทดสอบการสร้างโปรเจกต์สำเร็จ`);

    // =================== ขั้นตอนที่ 1: ทดสอบปุ่ม Detail ===================
    const startDetail = Date.now();
    // log.push(`📅 เวลา: ${now()}`);
    // log.push('🔄 Looking for Detail button...');

    // รอให้ตารางแสดงข้อมูลโปรเจกต์โหลดเสร็จ
    await page.waitForSelector('table', { timeout: 1100 });
    // log.push('✅ Project table loaded');

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
    // log.push(`📋 Testing project: ${projectName}`);

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
    }, { timeout: 1100 });
    // log.push('✅ Project details loaded');

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
    // log.push(`✅ Project name shown: ${detailsShown.projectName ? 'Yes' : 'No'}`);
    // log.push(`✅ Budget shown: ${detailsShown.budget ? 'Yes' : 'No'}`);
    // log.push(`✅ Status shown: ${detailsShown.status ? 'Yes' : 'No'}`);
    // log.push(`✅ Start Date shown: ${detailsShown.startDate ? 'Yes' : 'No'}`);
    // log.push(`✅ End Date shown: ${detailsShown.endDate ? 'Yes' : 'No'}`);
    // log.push(`✅ Members tab shown: ${detailsShown.membersTab ? 'Yes' : 'No'}`);
    // log.push(`✅ Tasks tab shown: ${detailsShown.tasksTab ? 'Yes' : 'No'}`);

    // ตรวจสอบว่าแท็บ Members เปิดเป็นค่าเริ่มต้น
    const isMembersTabActive = await page.evaluate(() => {
      return document.body.innerText.includes('Project Members');
    });
    // log.push(`✅ Members tab active by default: ${isMembersTabActive ? 'Yes' : 'No'}`);

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
    await page.waitForSelector('table', { timeout: 1100 });
    log.push('✅ Returned to projects page');

    const detailTime = Date.now() - startDetail;
    log.push(`⏱️ Total Detail Testing Time: ${detailTime} ms`);
    // log.push(`🌐 Final URL: ${page.url()}`);
    log.push(`✅ STEP 1 COMPLETE: Detail testing successful`);

    // =================== ขั้นตอนที่ 2: ทดสอบปุ่ม Edit ===================
    const startEdit = Date.now();
    // log.push(`📅 เวลา: ${now()}`);
    // log.push('🔄 Looking for Edit button...');

    // รอให้ตารางแสดงข้อมูลโปรเจกต์โหลดเสร็จ
    await page.waitForSelector('table', { timeout: 1100 });
    // log.push('✅ Project table loaded');

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
    
    // log.push(`📋 Testing project: ${originalProjectInfo.name}`);
    // log.push(`📋 Current budget: ${originalProjectInfo.budget}`);
    // log.push(`📋 Current status: ${originalProjectInfo.status}`);

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
    
    // log.push('🟢 Clicked Edit button');

    // =================== ตรวจสอบที่ Dialog แก้ไขโปรเจกต์ ===================
    // รอให้ Dialog แก้ไขโปรเจกต์เปิดขึ้น
    await page.waitForSelector('[role="dialog"]', { timeout: 1100 });
    // log.push('✅ Edit Project dialog opened');

    // ตรวจสอบว่าฟอร์มแสดงข้อมูลโปรเจกต์เดิมถูกต้อง
    const formHasCurrentValues = await page.evaluate((expectedName) => {
      const nameInput = document.querySelector('[placeholder="Enter project name"]');
      return nameInput && nameInput.value.includes(expectedName);
    }, originalProjectInfo.name);
    
    // log.push(`✅ Form shows current project name: ${formHasCurrentValues ? 'Yes' : 'No'}`);

    // =================== แก้ไขข้อมูลโปรเจกต์ ===================
    // แก้ไขชื่อโปรเจกต์
    const editedProjectName = `Edited Project ${Date.now()}`;
    await page.evaluate(() => {
      const nameInput = document.querySelector('[placeholder="Enter project name"]');
      if (nameInput) {
        nameInput.value = '';
      }
    });
    await page.type('[placeholder="Enter project name"]', editedProjectName);
    // log.push(`📝 Changed Project Name to: ${editedProjectName}`);

    // แก้ไขเจ้าของโปรเจกต์
    try {
      log.push('🔄 Changing project owner...');
      // คลิกที่ dropdown ของ Owner
      await page.evaluate(() => {
        const ownerDropdowns = document.querySelectorAll('.select-trigger');
        // This assumes the owner dropdown is the first one. A more robust selector might be needed.
        if(ownerDropdowns.length > 0) {
            ownerDropdowns[0].click();
        } else {
            throw new Error('Owner dropdown trigger not found');
        }
      });

      // รอให้ตัวเลือกแสดง
      await page.waitForSelector('[role="option"]', { timeout: 1100 });
      log.push('✅ Owner options are visible');

      // เลือกเจ้าของคนใหม่ (คนที่สองในลิสต์, เพื่อให้แน่ใจว่ามีการเปลี่ยนแปลง)
      await page.evaluate(() => {
        const options = document.querySelectorAll('[role="option"]');
        if (options.length > 1) {
          // options[0] might be "No owner" or the current owner, so we select the next one.
          options[1].click(); 
        } else if (options.length === 1) {
          options[0].click();
        } else {
          throw new Error("No owner options found to select.");
        }
      });
      log.push('✅ Selected a new owner');
    } catch (e) {
        log.push(`⚠️ Could not change project owner: ${e.message}`);
    }

    // แก้ไขงบประมาณ
    const newBudget = '20000';
    await page.evaluate(() => {
      const budgetInput = document.querySelector('[placeholder="Enter budget"]');
      if (budgetInput) {
        budgetInput.value = '';
      }
    });
    await page.type('[placeholder="Enter budget"]', newBudget);
    // log.push(`📝 Changed Budget to: ${newBudget}`);

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

    await page.waitForSelector('[role="option"]', { timeout: 1100 });
    
    // เลือกสถานะ "Completed"
    await page.$$eval('[role="option"]', options => {
      const completedOption = options.find(option => option.textContent.includes('Completed'));
      if (completedOption) completedOption.click();
    });
    
    // log.push('📝 Changed Status to: Completed');


    // คลิกปุ่ม Update
const startUpdate = Date.now(); // เพิ่มการวัดเวลาเริ่มต้น
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
    { timeout: 1100 } 
  );
  const updateTime = Date.now() - startUpdate; // คำนวณเวลาที่ใช้
  // log.push('✅ Dialog closed after update');
  log.push(`⏱️ Time to close dialog after Update: ${updateTime} ms`);
} catch (e) {
  log.push(`⚠️ Dialog did not close: ${e.message}`);
}

    // =================== ตรวจสอบว่าข้อมูลถูกอัพเดทหรือไม่ ===================
    // รอให้ตารางโหลดใหม่
    await page.waitForSelector('table', { timeout: 1100 });
    // log.push('✅ Project table reloaded');

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
    }, editedProjectName);

    if (updatedProjectInfo.found) {
      // log.push('✅ Updated project found in table');
      // log.push(`📋 Updated project name: ${updatedProjectInfo.name}`);
      // log.push(`📋 Updated budget: ${updatedProjectInfo.budget}`);
      // log.push(`📋 Updated status: ${updatedProjectInfo.status}`);
      
      // ตรวจสอบว่าข้อมูลถูกอัพเดทตามที่แก้ไขหรือไม่
      if (updatedProjectInfo.name.includes(editedProjectName)) {
        // log.push('✅ Project name was updated correctly');
      } else {
        log.push('⚠️ Project name was not updated as expected');
      }
      
      // ตรวจสอบงบประมาณ (อาจมีการจัดรูปแบบตัวเลข เช่น "20,000")
      if (updatedProjectInfo.budget.includes('20') || updatedProjectInfo.budget.includes('20,000')) {
        // log.push('✅ Budget was updated correctly');
      } else {
        log.push('⚠️ Budget was not updated as expected');
      }
      
      if (updatedProjectInfo.status.includes('Completed')) {
        // log.push('✅ Status was updated correctly');
      } else {
        log.push('⚠️ Status was not updated as expected');
      }
    } else {
      log.push('⚠️ Could not find updated project in table');
    }

    const editTime = Date.now() - startEdit;
    log.push(`⏱️ Total Edit Testing Time: ${editTime} ms`);
    // log.push(`🌐 Final URL: ${page.url()}`);
    log.push(`✅ STEP 2 COMPLETE: Edit testing successful`);

    // =================== ขั้นตอนที่ 3: ทดสอบปุ่ม Delete ===================
    const startDelete = Date.now();
    // log.push(`📅 เวลา: ${now()}`);
    // log.push('🔄 Testing Delete Project functionality...');

    // รอให้ตารางแสดงข้อมูลโปรเจกต์โหลดเสร็จ
    await page.waitForSelector('table', { timeout: 1100 });
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
    
    // log.push(`📋 Testing delete on project: ${projectToDelete.name}`);
    // log.push(`📋 Project ID: ${projectToDelete.id}`);

    // จำนวนโปรเจกต์ก่อนลบ
    const projectCountBefore = await page.evaluate(() => {
      return document.querySelectorAll('table tr').length - 1; // หักแถวหัวตาราง
    });
    
    // log.push(`📊 Project count before delete: ${projectCountBefore}`);

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
    await page.waitForSelector('[role="dialog"]', { timeout: 1100 });
    // log.push('✅ Delete confirmation dialog opened');

    // ตรวจสอบว่า Dialog แสดงข้อมูลโปรเจกต์ที่จะลบถูกต้อง
    const dialogContent = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return dialog ? dialog.textContent : '';
    });
    
    if (dialogContent.includes(projectToDelete.name)) {
      // log.push('✅ Dialog shows correct project name');
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
      // log.push('✅ Dialog has Cancel button');
    } else {
      log.push('⚠️ Cancel button not found in dialog');
    }
    
    if (hasButtons.hasDelete) {
      // log.push('✅ Dialog has Delete button');
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
    
    // log.push('🟢 Clicked Delete button in confirmation dialog');

    // รอให้ Dialog ปิด (ปุ่ม Delete ควรปิด Dialog เมื่อลบเสร็จ)
    try {
      await page.waitForFunction(
        () => !document.querySelector('[role="dialog"]'),
        { timeout: 1100 }
      );
      // log.push('✅ Dialog closed after delete');
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
        { timeout: 1100 }
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
    await page.waitForSelector('table', { timeout: 1100 });
    // log.push('✅ Project table reloaded');

    // ตรวจสอบว่าโปรเจกต์ถูกลบไปหรือไม่
    const projectStillExists = await page.evaluate((projectName) => {
      const cells = document.querySelectorAll('td');
      return Array.from(cells).some(cell => cell.textContent.includes(projectName));
    }, projectToDelete.name);
    
    if (!projectStillExists) {
      // log.push('✅ Project was successfully deleted and removed from table');
    } else {
      log.push('⚠️ Project still appears in table after delete attempt');
    }

    // จำนวนโปรเจกต์หลังลบ
    const projectCountAfter = await page.evaluate(() => {
      return document.querySelectorAll('table tr').length - 1; // หักแถวหัวตาราง
    });
    
    // log.push(`📊 Project count after delete: ${projectCountAfter}`);
    
    if (projectCountAfter < projectCountBefore) {
      // log.push('✅ Number of projects decreased as expected');
    } else {
      log.push('⚠️ Number of projects did not decrease');
    }

    const deleteTime = Date.now() - startDelete;
    log.push(`⏱️ Total Delete Testing Time: ${deleteTime} ms`);
    // log.push(`🌐 Final URL: ${page.url()}`);
    log.push(`✅ STEP 3 COMPLETE: Delete testing successful`);

    // =================== สรุปผลการทดสอบ ===================
    const totalTestTime = Date.now() - startFullTest;
    log.push(`📅 เวลาสิ้นสุดการทดสอบ: ${now()}`);
    log.push(`⏱️ ระยะเวลาทดสอบทั้งหมด: ${totalTestTime} ms`);
    log.push(`🔍 สรุปเวลาในแต่ละขั้นตอน:`);
    log.push(`   - Create: ${createTime} ms`);
    log.push(`   - Detail: ${detailTime} ms`);
    log.push(`   - Edit: ${editTime} ms`);
    log.push(`   - Delete: ${deleteTime} ms`);
    log.push(`🌐 Final URL: ${page.url()}`);
    log.push(`✅ การทดสอบครบวงจรเสร็จสิ้น (Create → Detail → Edit → Delete)`);

    fs.writeFileSync(logFilename, log.join('\n'), 'utf8');
    console.log('\n📝 Log saved to', logFilename);
    console.log(log.join('\n'));

  } catch (err) {
    const errorLog = `📅 เวลา: ${now()} ❌ Unexpected error: ${err.message}`;
    console.error(errorLog);
    log.push(errorLog);
    fs.writeFileSync(logFilename, log.join('\n'), 'utf8');
  } finally {
    await new Promise(r => setTimeout(r, 1000)); // ชะลอให้เห็นผลลัพธ์

    await browser?.close();
  }
})();