require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');

function now() {
    return new Date().toISOString();
}

(async () => {
    let browser;
    const logs = [];

    try {
        browser = await puppeteer.launch({
            headless: false,
            args: [
                '--disable-features=PasswordManagerEnabled,AutomaticPasswordSaving',
                '--disable-save-password-bubble'
            ]
        });

        const page = await browser.newPage();

        // ดักจับ console log จากหน้าเว็บ
        page.on('console', msg => console.log(`[${now()}] PAGE LOG:`, msg.text()));

        // ตรวจสอบ response error
        page.on('response', async response => {
            if (!response.ok()) {
                const body = await response.text();
                console.log(`[${now()}] ❗ RESPONSE ERROR (${response.status()}) ${response.url()}:\n${body}`);
            }
        });

        // จัดการ dialog อัตโนมัติ
        page.on('dialog', async dialog => {
            console.log(`[${now()}] ⚠️ Auto-accept dialog:`, dialog.message());
            await dialog.accept();
        });

        // เริ่มจับเวลาการโหลดหน้าเว็บ
        const pageLoadStart = Date.now();
        await page.goto(process.env.APP_URL, { waitUntil: 'networkidle0' });
        const pageLoadTime = Date.now() - pageLoadStart;

        // ทำการ login
        const loginStart = Date.now();
        await page.type('#username', process.env.LOGIN_USERNAME);
        await page.type('#password', process.env.LOGIN_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        const loginTime = Date.now() - loginStart;

        console.log(`[${now()}] ✅ Logged in: ${page.url()}`);

        // เริ่มจับเวลาการสร้างผู้ใช้
        const createStart = Date.now();

        // คลิกปุ่ม "Create"
        await page.waitForSelector('button');
        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent.trim(), btn);
            if (text === 'Create') {
                await btn.click();
                console.log(`[${now()}] 🟢 Clicked "Create" button`);
                break;
            }
        }

        // กรอกข้อมูลผู้ใช้
        await page.waitForSelector('input[placeholder="Enter username"]');
        const username = 'testuser_' + Date.now();
        const password = 'testpassword123';

        await page.type('input[placeholder="Enter username"]', username);
        await page.type('input[placeholder="Enter password"]', password);

        // เลือก Role และ Project
        const comboboxes = await page.$$('[role="combobox"]');
        for (const [index, box] of comboboxes.entries()) {
            await box.click();
            await page.waitForSelector('[role="option"]');
            const options = await page.$$('[role="option"]');
            if (options.length > 0) {
                await options[0].click();
                console.log(`[${now()}] ✅ Selected option for dropdown ${index + 1}`);
            }
        }

        // คลิกปุ่ม Create ใน Dialog
        const dialog = await page.$('[role="dialog"], .MuiDialog-root, .dialog');
        const dialogButtons = await dialog.$$('button');
        for (const btn of dialogButtons) {
            const text = await page.evaluate(el => el.textContent.trim(), btn);
            if (text === 'Create') {
                await btn.click();
                console.log(`[${now()}] 🟢 Submitted create user form`);
                break;
            }
        }

        // ตรวจสอบว่าผู้ใช้ถูกสร้างสำเร็จหรือไม่
        let userCreated = false;
        let isDuplicate = false;
        try {
            await page.waitForFunction(
                username => {
                    return [...document.querySelectorAll('td')].some(td => td.textContent.includes(username));
                },
                { timeout: 5000 },
                username
            );
            userCreated = true;
        } catch (err) {
            // ถ้าไม่พบชื่อผู้ใช้ในตาราง ให้ตรวจสอบว่ามีข้อความว่า username ซ้ำหรือไม่
            const errorText = await page.evaluate(() => {
                const alert = document.querySelector('.MuiAlert-message, .alert, [role="alert"]');
                return alert ? alert.textContent : '';
            });

            if (errorText.includes('already exists') || errorText.includes('ซ้ำ') || errorText.toLowerCase().includes('duplicate')) {
                isDuplicate = true;
            }
        }

        const createTime = Date.now() - createStart;

        // สรุปผลลัพธ์
        const summary = `
📝 Log saved to create_performance_log.txt

📅 Timestamp: ${now()}
🚀 Page Load Time: ${pageLoadTime.toFixed(2)} ms
🔐 Login Time: ${loginTime.toFixed(2)} ms
👤 Create User Time: ${createTime.toFixed(2)} ms
👤 New Username: ${username}
📌 Result: ${userCreated ? '✅ Create user test passed!' : isDuplicate ? '⚠️ Username already exists. Cannot create.' : '❌ Create user test failed!'}
🌐 Final URL: ${page.url()}
        `.trim();

        console.log(summary);
        logs.push(summary);

        // เขียนลงไฟล์ log
        fs.writeFileSync('create_performance_log.txt', logs.join('\n\n'), 'utf8');
    } catch (err) {
        const errorLog = `[${now()}] ❌ Unexpected error: ${err.message}`;
        console.error(errorLog);
        logs.push(errorLog);
        fs.writeFileSync('create_performance_log.txt', logs.join('\n\n'), 'utf8');
    } finally {
        await browser?.close();
    }
})();
