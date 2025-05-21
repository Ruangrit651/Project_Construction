require('dotenv').config(); // โหลดตัวแปรจากไฟล์ .env
const puppeteer = require('puppeteer'); // เรียกใช้งาน Puppeteer
const fs = require('fs'); // ใช้สำหรับบันทึก log ลงไฟล์
const { performance } = require('perf_hooks'); // ใช้จับเวลาการทำงานของแต่ละขั้นตอน

// 🔧 ฟังก์ชันคืนวันที่และเวลาในรูปแบบ วัน/เดือน/ปี ชั่วโมง:นาที:วินาที
function now() {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // เดือนเริ่มที่ 0
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

(async () => {
  let browser;
  const logs = []; // ตัวแปรสำหรับเก็บ log ทั้งหมด

  try {
    // เปิดเบราว์เซอร์พร้อมกำหนด option
    browser = await puppeteer.launch({
      headless: false, // เปิดให้เห็นหน้าต่างเบราว์เซอร์
      args: [
        '--disable-features=PasswordManagerEnabled,AutomaticPasswordSaving', // ปิดการจัดการรหัสผ่านอัตโนมัติ
        '--disable-save-password-bubble'
      ]
    });

    const page = await browser.newPage(); // เปิดแท็บใหม่

    // ดักจับ log ที่แสดงในหน้าเว็บ
    page.on('console', msg => console.log(`[${now()}] PAGE LOG:`, msg.text()));

    // ดักจับ response ที่ error จาก server
    page.on('response', async response => {
      if (!response.ok()) {
        const body = await response.text();
        console.log(`[${now()}] ❗ RESPONSE ERROR (${response.status()}) ${response.url()}:\n${body}`);
      }
    });

    // เริ่มจับเวลาโหลดหน้า Login
    logs.push(`📅 Timestamp: ${now()}`);
    const loadStart = performance.now();
    await page.goto(process.env.APP_URL, { waitUntil: 'networkidle0' });
    const loadEnd = performance.now();
    const pageLoadTime = (loadEnd - loadStart).toFixed(2);
    logs.push(`🚀 Login Page Load Time: ${pageLoadTime} ms`);

    // กรอกข้อมูลเข้าสู่ระบบ
    await page.waitForSelector('#username');
    await page.waitForSelector('#password');
    await page.type('#username', process.env.LOGIN_USERNAME_MANAGER);
    await page.type('#password', process.env.LOGIN_PASSWORD_MANAGER);
    await new Promise(r => setTimeout(r, 800)); // หน่วงเวลาให้พอมองเห็นตอนกรอกข้อมูล

    // คลิกเข้าสู่ระบบและวัดเวลา
    const loginStart = performance.now();
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
    const loginEnd = performance.now();
    const loginTime = (loginEnd - loginStart).toFixed(2);
    logs.push(`🔐 Login Time: ${loginTime} ms`);

    // ไปยังหน้า Project List Manager
    const navigateStart = performance.now();
    await page.goto(`${process.env.APP_URL}/ManagerProjectList`, { waitUntil: 'networkidle0' });
    const navigateEnd = performance.now();
    const navigationTime = (navigateEnd - navigateStart).toFixed(2);
    logs.push(`🧭 Navigation to Project List Time: ${navigationTime} ms`);

    // ตรวจสอบว่า header ของตารางโปรเจกต์แสดงอยู่หรือไม่
    const headerExists = await page.evaluate(() => {
      const header = document.querySelector('h1');
      return header && header.innerText.includes('Projects');
    });
    logs.push(`📋 Projects Header Exists: ${headerExists ? '✅' : '❌'}`);

    // รอให้โหลดข้อมูลตารางโปรเจกต์เสร็จ
    await page.waitForFunction(() => {
      return !document.querySelector('.animate-spin') &&
        (document.querySelector('table tbody tr') || 
         document.querySelector('table tbody td.text-center'));
    }, { timeout: 10000 });

    // ตรวจสอบว่าโปรเจกต์โหลดสำเร็จหรือไม่
    const projectsInfo = await page.evaluate(() => {
      const noProjectsElement = document.querySelector('table tbody td.text-center');
      if (noProjectsElement && noProjectsElement.innerText.includes('No projects available')) {
        return { hasProjects: false, count: 0, message: 'No projects available' };
      }
      
      const rows = document.querySelectorAll('table tbody tr');
      return {
        hasProjects: rows.length > 0,
        count: rows.length,
        columns: Array.from(document.querySelectorAll('table thead th')).map(th => th.innerText)
      };
    });

    if (projectsInfo.hasProjects) {
      logs.push(`📊 Projects Loaded: ✅ (${projectsInfo.count} projects)`);
      logs.push(`🔍 Table Columns: ${projectsInfo.columns.join(', ')}`);
      
      // ดึงข้อมูลโปรเจกต์ตัวแรกในตาราง
      if (projectsInfo.count > 0) {
        const firstProjectInfo = await page.evaluate(() => {
          const firstRow = document.querySelector('table tbody tr');
          const projectName = firstRow.querySelector('td').innerText;
          const projectId = firstRow.getAttribute('key') || 'unknown';
          return { projectName, projectId };
        });
        
        logs.push(`🔎 First Project: ${firstProjectInfo.projectName} (ID: ${firstProjectInfo.projectId})`);
        
        // ทดสอบคลิกเพื่อเข้าไปยังหน้า ManagerTask ของโปรเจกต์
        const clickStart = performance.now();
        await Promise.all([
          page.click('table tbody tr'),
          page.waitForNavigation({ waitUntil: 'networkidle0' }),
        ]);
        const clickEnd = performance.now();
        const clickTime = (clickEnd - clickStart).toFixed(2);
        
        const currentUrl = page.url();
        const navigatedCorrectly = currentUrl.includes('/ManagerTask') && 
                                  currentUrl.includes('project_id=') && 
                                  currentUrl.includes('project_name=');
        
        logs.push(`🖱️ Project Click Navigation Time: ${clickTime} ms`);
        logs.push(`🔀 Navigated to ManagerTask: ${navigatedCorrectly ? '✅' : '❌'}`);
        logs.push(`🌐 Final URL: ${currentUrl}`);
      }
    } else {
      logs.push(`📊 Projects: ${projectsInfo.message}`); //ไม่มีโปรเจ็คในตาราง
    }
    await new Promise(r => setTimeout(r, 2000));

    // แสดง log ทั้งหมดใน console
    console.log('\n' + logs.join('\n') + '\n');

    // เขียน log ลงไฟล์
    const logFile = 'ProjectListManager_test_log.txt';
    fs.writeFileSync(logFile, logs.join('\n'), 'utf8');
    console.log(`📝 Log saved to ${logFile}\n`);
    

  } catch (error) {
    const errMsg = `[${now()}] ❌ Unexpected error: ${error.message}`;
    console.error(errMsg);
    
    // บันทึก log ข้อผิดพลาด
    fs.writeFileSync('ProjectListManager_error_log.txt', errMsg, 'utf8');
  } finally {
    await new Promise(r => setTimeout(r, 2000)); // หน่วงเวลาก่อนปิดเบราว์เซอร์
    
    await browser?.close(); // ปิดเบราว์เซอร์
  }
})();
