require('dotenv').config();
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
    headless: false,
    args: [
        '--disable-features=PasswordManagerEnabled,AutofillServerCommunication,AutofillEnableAccountWalletStorage',
        '--disable-save-password-bubble',
        '--disable-popup-blocking',
        '--no-default-browser-check',
        '--no-first-run',
        '--disable-notifications',
        '--disable-extensions',
        '--disable-translate'
    ],
    defaultViewport: null,
    ignoreDefaultArgs: ['--enable-automation'], // ทำให้ดูเหมือน user เปิดเอง
});
    const page = await browser.newPage();

    // จัดการ dialog ทุกชนิด (เช่น alert, confirm, prompt)
    page.on('dialog', async dialog => {
        console.log('Auto-accept dialog:', dialog.message());
        await dialog.accept();
    });

    // เข้าหน้าแอดมิน (หรือหน้าที่มี DialogAddUser)
    await page.goto(process.env.APP_URL, { waitUntil: 'networkidle0' });

    // ล็อกอิน
    await page.type('#username', process.env.LOGIN_USERNAME);
    await page.type('#password', process.env.LOGIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // DEBUG: log url หลัง login
    console.log('Current URL:', page.url());

    // รอปุ่ม Create ปรากฏ แล้ว log ข้อความปุ่มทั้งหมด
    await page.waitForSelector('button');
    const buttons = await page.$$('button');
    let found = false;
    for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent, btn);
        console.log('Button text:', text); // DEBUG
        if (text && text.trim() === 'Create') {
            await btn.click();
            found = true;
            break;
        }
    }
    if (!found) {
        console.error('ไม่พบปุ่ม Create');
        await browser.close();
        return;
    }

    // รอ Dialog เปิด
    await page.waitForSelector('input[placeholder="Enter username"]');

    // กรอกข้อมูล
    const username = 'testuser_'
    await page.type('input[placeholder="Enter username"]', username);
    await page.type('input[placeholder="Enter password"]', 'testpassword123');

    // เลือก Role (เลือกตัวแรก)
    await page.waitForSelector('[role="combobox"]');
    const comboboxes = await page.$$('[role="combobox"]');
    if (comboboxes.length > 0) {
        await comboboxes[0].click();
        await page.waitForSelector('[role="option"]');
        const options = await page.$$('[role="option"]');
        if (options.length > 0) {
            await options[0].click();
        }
    }

    // เลือก Project (ถ้ามี combobox ที่สอง)
    if (comboboxes.length > 1) {
        await comboboxes[1].click();
        await page.waitForSelector('[role="option"]');
        const projectOptions = await page.$$('[role="option"]');
        if (projectOptions.length > 0) {
            await projectOptions[0].click(); // เลือก No Project หรือ Project แรก
        }
    }

    // กดปุ่ม Create ใน Dialog (หาใหม่อีกรอบ พร้อม log)
    await page.waitForSelector('button');
    const dialogButtons = await page.$$('button');
    let created = false;
    for (const btn of dialogButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        console.log('Dialog Button text:', text); // DEBUG
        if (text && text.trim() === 'Create') {
            await btn.click();
            created = true;
            break;
        }
    }
    if (!created) {
        console.error('ไม่พบปุ่ม Create ใน Dialog');
        await browser.close();
        return;
    }

    // รอ Alert หรือผลลัพธ์
    // (handler ถูก set ไว้แล้วด้านบน)

    // รอให้ระบบบันทึกเสร็จ (ปรับเวลาตามจริง)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // await browser.close();
})();