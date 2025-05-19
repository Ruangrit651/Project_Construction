require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');

// ฟังก์ชันคืนเวลาปัจจุบันในรูปแบบ ISO string
function now() {
  return new Date().toISOString();
}

// ชื่อไฟล์ log (เขียนทับทุกครั้ง)
const logFilename = 'Project_navigation_log.txt';

(async () => {
  const log = [];
  let browser;

  try {
    // เปิด browser แบบไม่ซ่อนหน้า
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--disable-features=PasswordManagerEnabled,AutomaticPasswordSaving',
        '--disable-save-password-bubble'
      ]
    });

    const page = await browser.newPage();

    // เริ่มจับเวลาการโหลดหน้าเว็บ
    const startLoad = Date.now();
    await page.goto(process.env.APP_URL, { waitUntil: 'networkidle0' });
    const pageLoadTime = Date.now() - startLoad;
    log.push(`📅 Timestamp: ${now()}`);
    log.push(`🚀 Page Load Time: ${pageLoadTime} ms`);

    // กรอกแบบฟอร์ม login
    const startLogin = Date.now();
    await page.type('#username', process.env.LOGIN_USERNAME);
    await page.type('#password', process.env.LOGIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    const loginTime = Date.now() - startLogin;
    log.push(`🔐 Login Time: ${loginTime} ms`);
    log.push(`✅ Login success: ${page.url()}`);

    // =================== เริ่มการทดสอบการเปลี่ยนแท็บไปยัง Project ===================
    
    // 1. ตรวจสอบว่าเราอยู่ที่หน้า Member
    log.push(`🔍 Current URL before clicking Project tab: ${page.url()}`);
    if (page.url().includes('/admin') && !page.url().includes('/adminproject')) {
      log.push('✅ Currently on Member page as expected');
    } else {
      log.push('⚠️ Not on expected Member page');
    }

    // 2. คลิกที่แท็บ Project - วิธีใหม่ที่น่าจะทำงานกับ Radix UI
    log.push('🔄 Attempting to click on Project tab...');
    const startProjectTabClick = Date.now();
    
    // บันทึกภาพหน้าจอเพื่อการดีบัก
    await page.screenshot({ path: 'before_click.png' });
    log.push('📸 Screenshot before click saved');
    
    // วิธีที่ 1: ใช้ wait for selector ที่เฉพาะเจาะจงกับ Radix Tabs แล้วคลิกโดยตรง
    try {
      // หา Project tab โดยใช้ text content
      await page.waitForFunction(() => {
        const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
        return tabs.some(tab => tab.textContent.includes('Project'));
      }, { timeout: 5000 });
      
      // คลิกโดยตรงด้วย puppeteer (ไม่ผ่าน evaluate)
      await page.$$eval('[role="tab"]', tabs => {
        const projectTab = tabs.find(tab => tab.textContent.includes('Project'));
        if (projectTab) {
          // ให้คลิกด้วย native event เพื่อทริกเกอร์ React event ให้ถูกต้อง
          projectTab.click();
          return true;
        }
        return false;
      });
      
      log.push('✅ Clicked Project tab using direct selection');
    } catch (e) {
      log.push(`⚠️ Direct click failed: ${e.message}`);
    }
    
    // รอสักครู่เพื่อให้การนำทางทำงาน
    await page.waitForTimeout(2000);
    
    // ตรวจสอบ URL หลังจากคลิก
    if (page.url().includes('/adminproject')) {
      log.push('✅ URL changed to /adminproject after click');
    } else {
      log.push('⚠️ URL did not change, trying alternative methods...');
      
      // วิธีที่ 2: ใช้ page.$eval กับเซเลกเตอร์ที่เฉพาะเจาะจงมากขึ้น
      try {
        // แบบที่ 1 - คลิกตรงๆ
        await page.$eval('button:nth-child(2)[role="tab"]', btn => btn.click());
        log.push('✅ Tried clicking second tab button');
        
        // รอการนำทาง
        await page.waitForTimeout(1000);
        
        // แบบที่ 2 - ลองหาด้วย XPath
        if (!page.url().includes('/adminproject')) {
          const [projectTabElement] = await page.$x("//button[contains(text(), 'Project')]");
          if (projectTabElement) {
            await projectTabElement.click();
            log.push('✅ Clicked Project tab using XPath');
          }
          
          // รอการนำทาง
          await page.waitForTimeout(1000);
        }
      } catch (e) {
        log.push(`⚠️ Alternative click failed: ${e.message}`);
      }
    }
    
    // วิธีที่ 3: รีเซ็ต React app โดยใช้การนำทางโดยตรง (fallback)
    if (!page.url().includes('/adminproject')) {
      log.push('🔄 Using direct navigation to /adminproject as fallback');
      await page.goto(`${process.env.APP_URL}/adminproject`, { waitUntil: 'networkidle0' });
    }
    
    const projectTabClickTime = Date.now() - startProjectTabClick;
    log.push(`⏱️ Project Tab Click Time: ${projectTabClickTime} ms`);
    
    // 3. ตรวจสอบว่าเราอยู่ที่หน้า Project
    log.push(`🔍 Current URL after attempts: ${page.url()}`);
    if (page.url().includes('/adminproject')) {
      log.push('✅ Successfully navigated to Project page');
    } else {
      log.push('⚠️ Failed to navigate to Project page');
    }
    
    // บันทึกภาพหน้าจอหลังคลิก
    await page.screenshot({ path: 'after_click.png' });
    log.push('📸 Screenshot after click saved');
    
    // 4. ตรวจสอบเนื้อหาของหน้า Project
    const projectPageContent = await page.evaluate(() => {
      // เก็บข้อมูลสำคัญของหน้า
      const title = document.querySelector('h1, h2, h3')?.textContent || 'No title found';
      const hasTable = !!document.querySelector('table');
      const buttonTexts = Array.from(document.querySelectorAll('button'))
        .map(btn => btn.textContent.trim())
        .filter(text => text.length > 0);
      
      // ตรวจสอบว่าปุ่ม Project เป็น active
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
      const projectTab = tabs.find(tab => tab.textContent.includes('Project'));
      
      const projectTabActive = projectTab && (
        projectTab.getAttribute('aria-selected') === 'true' ||
        projectTab.classList.contains('active') ||
        window.getComputedStyle(projectTab).borderBottomColor.includes('rgb(59, 130, 246)') ||
        projectTab.querySelector('.text-blue-400')
      );
      
      return {
        title,
        hasTable,
        buttonTexts,
        projectTabActive,
        url: window.location.href
      };
    });
    
    log.push('📄 Project Page Content:');
    log.push(`  Current URL in browser: ${projectPageContent.url}`);
    log.push(`  Title: ${projectPageContent.title}`);
    log.push(`  Has Table: ${projectPageContent.hasTable ? 'Yes' : 'No'}`);
    log.push(`  Buttons: ${projectPageContent.buttonTexts.join(', ')}`);
    log.push(`  Project Tab Active: ${projectPageContent.projectTabActive ? 'Yes' : 'No'}`);
    
    // เขียน log ลงไฟล์แบบเขียนทับ
    fs.writeFileSync(logFilename, log.join('\n'), 'utf8');
    console.log('\n📝 Log saved to', logFilename);
    console.log(log.join('\n'));

  } catch (err) {
    const errorLog = `[${now()}] ❌ Unexpected error: ${err.message}`;
    console.error(errorLog);
    log.push(errorLog);
    fs.writeFileSync(logFilename, log.join('\n'), 'utf8');
  } finally {
    await browser?.close();
  }
})();