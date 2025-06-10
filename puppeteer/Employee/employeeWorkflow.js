// นำเข้าโมดูลที่จำเป็นสำหรับการทำงาน
require('dotenv').config();  // โหลดตัวแปรสภาพแวดล้อมจากไฟล์ .env
const puppeteer = require('puppeteer');  // ใช้สำหรับควบคุมเบราว์เซอร์อัตโนมัติ
const fs = require('fs');  // ใช้สำหรับจัดการไฟล์
const { performance } = require('perf_hooks');  // ใช้วัดประสิทธิภาพการทำงาน
const path = require('path');  // ใช้สำหรับจัดการเส้นทางไฟล์

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

// ฟังก์ชันสำหรับรอด้วย setTimeout (ทดแทน waitForTimeout สำหรับ puppeteer รุ่นเก่า)
async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ฟังก์ชันหลักแบบ IIFE (Immediately Invoked Function Expression)
(async () => {
    // ประกาศตัวแปรสำหรับเก็บ browser instance และบันทึกล็อก
    let browser;
    const logs = [];
    const logFilename = `EmployeeWorkflow_log.txt`;

    try {
        // เริ่มต้นเบราว์เซอร์ในโหมดที่มองเห็นได้ พร้อมกับเพิ่ม protocolTimeout
        browser = await puppeteer.launch({
            headless: false,
            args: [
                '--disable-features=PasswordManagerEnabled,AutomaticPasswordSaving',
                '--disable-save-password-bubble',
                '--start-maximized'
            ],
            protocolTimeout: 60000,  // เพิ่ม timeout เป็น 60 วินาที
            defaultViewport: null    // ปรับขนาด viewport ให้เต็มจอ
        });

        // สร้างแท็บใหม่
        const page = await browser.newPage();

        // ติดตามข้อความ log จากหน้าเว็บ
        page.on('console', msg => console.log(`[${now()}] PAGE LOG:`, msg.text()));

        // // ตรวจจับการตอบสนองจากเซิร์ฟเวอร์ที่มีข้อผิดพลาด
        // page.on('response', async response => {
        //     if (!response.ok()) {
        //         try {
        //             const body = await response.text();
        //             console.log(`[${now()}] ❗ RESPONSE ERROR (${response.status()}) ${response.url()}:\n${body}`);
        //         } catch (error) {
        //             console.log(`[${now()}] ❗ RESPONSE ERROR (${response.status()}) ${response.url()}: Could not get body`);
        //         }
        //     }
        // });

        // ========== ขั้นตอนที่ 1: เข้าสู่ระบบ ==========

        logs.push(`📅 Timestamp: ${now()}`);
        logs.push(`🧪 เริ่มทดสอบการเข้าสู่ระบบ`);

        const loadStart = performance.now();
        await page.goto(process.env.APP_URL, { waitUntil: 'networkidle0' });
        const loadEnd = performance.now();
        logs.push(`🚀 Login Page Load Time: ${(loadEnd - loadStart).toFixed(2)} ms`);

        await page.waitForSelector('#username');
        await page.waitForSelector('#password');
        await page.type('#username', process.env.LOGIN_USERNAME_EMPLOYEE);
        await page.type('#password', process.env.LOGIN_PASSWORD_EMPLOYEE);
        await wait(800);  // รอสักครู่ก่อนกดปุ่ม

        const loginStart = performance.now();
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
        ]);
        const loginEnd = performance.now();
        logs.push(`🔐 Login Time: ${(loginEnd - loginStart).toFixed(2)} ms`);
        logs.push(`✅ Login Successful`);

        // ตรวจสอบข้อมูลการยืนยันตัวตน
        try {
            const authInfo = await page.evaluate(() => {
                const token = localStorage.getItem('token') ||
                    sessionStorage.getItem('token') ||
                    localStorage.getItem('authToken') ||
                    sessionStorage.getItem('authToken');
                const userId = localStorage.getItem('userId') ||
                    sessionStorage.getItem('userId') ||
                    localStorage.getItem('user_id') ||
                    sessionStorage.getItem('user_id');
                return {
                    userId: userId || 'Not found',
                    hasToken: !!token
                };
            });
            logs.push(`🔍 Auth Debug - User ID: ${authInfo.userId}, Token: ${authInfo.hasToken ? 'Found' : 'Not found'}`);
        } catch (error) {
            logs.push(`⚠️ Cannot read auth info: ${error.message}`);
        }

        // ========== ขั้นตอนที่ 2: ตรวจสอบการนำทางไปยังหน้ารายการโปรเจกต์ ==========

        logs.push(`📅 Timestamp: ${now()}`);
        logs.push(`🧪 ตรวจสอบว่าอยู่ที่หน้า Project List หรือไม่`);

        // รอให้หน้าเว็บโหลดสมบูรณ์
        await wait(1000);

        // ตรวจสอบว่าอยู่ที่หน้า Project List หรือไม่ (หลังล็อกอิน)
        // const isProjectListPage = await page.evaluate(() => {
        //     return window.location.pathname.includes('employeeProjectList') ||
        //         document.querySelector('button[value="projectlist"][data-state="active"]') !== null ||
        //         document.querySelector('button[aria-selected="true"]') !== null;
        // });

        // if (!isProjectListPage) {
        //     logs.push(`⚠️ หลังจากล็อกอินไม่ได้อยู่ที่หน้า Project List ระบบจะนำทางไปยังหน้านั้น`);
        //     const navigateToProjectsStart = performance.now();
        //     await page.goto(`${process.env.APP_URL}/employeeProjectList`, { waitUntil: 'networkidle0' });
        //     const navigateToProjectsEnd = performance.now();
        //     logs.push(`🧭 Navigation to Project List Time: ${(navigateToProjectsEnd - navigateToProjectsStart).toFixed(2)} ms`);
        // } else {
        //     logs.push(`✅ หลังจากล็อกอินอยู่ที่หน้า Project List แล้ว`);
        // }

        // // รอให้รายการโปรเจกต์โหลดเสร็จ
        // await page.waitForFunction(() => {
        //     return !document.querySelector('.animate-spin') &&
        //         (document.querySelector('.project-card') ||
        //             document.querySelector('.project-list') ||
        //             document.querySelector('table tbody tr'));
        // }, { timeout: 10000 }).catch(() => {
        //     logs.push(`⚠️ รอโหลดรายการโปรเจกต์เกินเวลาที่กำหนด`);
        // });

        // ========== ขั้นตอนที่ 3: เลือกโปรเจกต์แรก ==========

        logs.push(`📅 Timestamp: ${now()}`);
        logs.push(`🧪 เริ่มทดสอบการเลือกโปรเจกต์แรก`);

        // ตรวจสอบว่ามีโปรเจกต์หรือไม่
        const projectExists = await page.evaluate(() => {
            const projectCards = document.querySelectorAll('.project-card');
            const tableRows = document.querySelectorAll('table tbody tr');
            return (projectCards.length > 0) || (tableRows.length > 0 && !tableRows[0].textContent.includes('No projects'));
        });

        if (projectExists) {
            logs.push(`✅ พบโปรเจกต์ในระบบ`);

            // เลือกโปรเจกต์แรก - ปรับปรุงประสิทธิภาพ
            const selectProjectStart = performance.now();

            // ใช้ try-catch เพื่อจับข้อผิดพลาดที่อาจเกิดขึ้น
            try {
                // // บันทึก URL ก่อนคลิก เพื่อตรวจสอบว่ามีการเปลี่ยนแปลงหรือไม่
                // const beforeUrl = await page.url();
                // logs.push(`🔍 URL ก่อนเลือกโปรเจกต์: ${beforeUrl}`);-----------------------------------------

                // ตรวจสอบว่ามี clickable element หรือไม่
                const hasClickableProject = await page.evaluate(() => {
                    return !!document.querySelector('.project-card a, table tbody tr a, .project-card button, table tbody tr button');
                });

                if (hasClickableProject) {
                    logs.push(`✓ พบปุ่มหรือลิงก์สำหรับเลือกโปรเจกต์`);

                    // ลด timeout เพื่อให้ทำงานเร็วขึ้น
                    // try {
                    //     await Promise.all([
                    //         page.click('.project-card a, table tbody tr a, .project-card button, table tbody tr button'),
                    //         page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 7000 })
                    //     ]);
                    //     logs.push(`✓ คลิกแล้วและมีการเปลี่ยนหน้า`);
                    // } catch (navError) {
                    //     logs.push(`⚠️ คลิกแล้วแต่การนำทางล้มเหลว: ${navError.message}`);
                    //     // ตรวจสอบว่า URL เปลี่ยนไปหรือไม่
                    //     const currentUrl = await page.url();
                    //     if (currentUrl !== beforeUrl) {
                    //         logs.push(`✓ แม้จะมีข้อผิดพลาด แต่ URL เปลี่ยนเป็น: ${currentUrl}`);
                    //     } else {
                    //         logs.push(`⚠️ URL ไม่เปลี่ยนแปลง ลองวิธีอื่น`);
                    //     }
                    // }
                } else {
                    logs.push(`⚠️ ไม่พบปุ่มหรือลิงก์ ลองคลิกที่ element โดยตรง`);

                    // ถ้าไม่มี clickable element ให้ลองคลิกที่ element อื่นแทน
                    const hasProjectCard = await page.evaluate(() => !!document.querySelector('.project-card'));
                    const hasTableRow = await page.evaluate(() => !!document.querySelector('table tbody tr'));

                    if (hasProjectCard) {
                        logs.push(`✓ คลิกที่ project card`);
                        await page.click('.project-card');
                    } else if (hasTableRow) {
                        logs.push(`✓ คลิกที่ table row`);
                        await page.click('table tbody tr');
                    }
                }

                // รอสักครู่เพื่อให้การ navigation เสร็จสมบูรณ์
                await wait(1000);

                // // ตรวจสอบ URL อีกครั้งหลังรอ
                // const afterUrl = await page.url();
                // logs.push(`🔍 URL หลังเลือกโปรเจกต์: ${afterUrl}`);
                // if (afterUrl !== beforeUrl) {
                //     logs.push(`✓ URL เปลี่ยนแปลงหลังจากเลือกโปรเจกต์`);
                // }

            } catch (error) {
                logs.push(`⚠️ เกิดข้อผิดพลาดในการเลือกโปรเจกต์: ${error.message}`);
            }

            const selectProjectEnd = performance.now();
            logs.push(`🔄 Project Selection Time: ${(selectProjectEnd - selectProjectStart).toFixed(2)} ms`);

            // ตรวจสอบว่าอยู่ที่หน้า Timeline หรือไม่
            const isTimelinePage = await page.evaluate(() => {
                return document.querySelector('button[value="timeline"][data-state="active"]') !== null ||
                    document.querySelector('button[aria-selected="true"]') !== null ||
                    window.location.pathname.includes('/employeePlan');
            });

            if (isTimelinePage) {
                logs.push(`✅ นำทางไปยังหน้า Timeline เรียบร้อยแล้ว`);

                // // บันทึกว่าอยู่ที่หน้า Timeline ของโปรเจกต์อะไร
                // const projectInfo = await page.evaluate(() => {
                //     const projectName = document.querySelector('h1, h2, .project-title')?.textContent || 'ไม่ทราบชื่อโปรเจกต์';
                //     return { name: projectName };
                // });
                // logs.push(`📋 อยู่ที่หน้า Timeline ของโปรเจกต์: ${projectInfo.name}`);

                // ========== ขั้นตอนที่ 4: นำทางไปยังหน้า Resource/Budget ==========

                logs.push(`📅 Timestamp: ${now()}`);
                logs.push(`🧪 เริ่มทดสอบการนำทางไปยังหน้า Resource/Budget`);

                const navigateToResourceStart = performance.now();

                try {
                    // วิธีที่ 1: คลิกปุ่มตรงๆ
                    try {
                        await page.click('button[value="resource"], [aria-controls*="resource"], [title*="ทรัพยากร"], [title*="Resource"]');
                        logs.push(`✓ คลิกที่ปุ่ม Resource/Budget โดยตรง`);
                    } catch (directClickError) {
                        logs.push(`⚠️ ไม่สามารถคลิกปุ่มโดยตรงได้: ${directClickError.message}`);

                        // วิธีที่ 2: ใช้ JavaScript เพื่อค้นหาและคลิกปุ่ม
                        await page.evaluate(() => {
                            const buttons = Array.from(document.querySelectorAll('button'));
                            console.log('จำนวนปุ่มทั้งหมด:', buttons.length);

                            const resourceButton = buttons.find(button => {
                                const buttonText = button.innerText || button.textContent || '';
                                return button.value === 'resource' ||
                                    button.id && button.id.includes('trigger-resource') ||
                                    button.title && button.title.includes('ทรัพยากร') ||
                                    buttonText.includes('Resource') || buttonText.includes('ทรัพยากร');
                            });

                            if (resourceButton) {
                                console.log('พบปุ่ม Resource/Budget:', resourceButton.outerHTML);
                                resourceButton.click();
                                return true;
                            }

                            console.log('ไม่พบปุ่ม Resource/Budget');
                            return false;
                        });

                        logs.push(`✓ พยายามคลิกที่ปุ่ม Resource/Budget ด้วย JavaScript`);
                    }

                    // // รอให้การนำทางเสร็จสิ้น
                    // await Promise.race([
                    //     page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => { }),
                    //     // wait(1000)  // รออย่างน้อย 2 วินาที
                    // ]);

                    // ตรวจสอบว่านำทางสำเร็จหรือไม่
                    const isResourcePage = await page.evaluate(() => {
                        const url = window.location.href;
                        const activeTab = document.querySelector('button[value="resource"][data-state="active"], button[aria-selected="true"][title*="ทรัพยากร"]');
                        const pageTitle = document.querySelector('h1, h2')?.textContent || '';

                        return {
                            isResourcePage: !!activeTab || url.includes('resource') || url.includes('Resource'),
                            activeTabText: activeTab?.textContent || 'Resource/Budget',
                            url: url
                        };
                    });

                    if (isResourcePage.isResourcePage) {
                        logs.push(`✅ นำทางไปยังหน้า Resource/Budget สำเร็จ`);
                        // logs.push(`🔍 URL ปัจจุบัน: ${isResourcePage.url}`);
                        // logs.push(`🔍 แท็บที่เลือก: ${isResourcePage.activeTabText}`);

                        // ========== ขั้นตอนที่ 5: ตรวจสอบปุ่มดรอปดาวน์และรายงาน/งาน ==========
                        logs.push(`📅 Timestamp: ${now()}`);
                        logs.push(`🧪 เริ่มทดสอบการกดปุ่มดรอปดาวน์และตรวจสอบรายงาน/งาน`);

                        const checkDropdownStart = performance.now();

                        try {
                            // รอให้หน้า Resource/Budget โหลดเสร็จสมบูรณ์ก่อน
                            await wait(1000);

                            // ค้นหาปุ่ม + Add และคลิก
                            const addButtonClicked = await page.evaluate(() => {
                                // วิธีที่ 1: ค้นหาตามข้อความ
                                const addButtons = Array.from(document.querySelectorAll('button'))
                                    .filter(btn => btn.textContent?.includes('+ Add') || btn.textContent?.includes('Add'));

                                if (addButtons.length > 0) {
                                    console.log('พบปุ่ม + Add:', addButtons[0].outerHTML);
                                    addButtons[0].click();
                                    return true;
                                }

                                console.log('ไม่พบปุ่ม + Add');
                                return false;
                            });

                            if (addButtonClicked) {
                                logs.push(`✓ คลิกที่ปุ่ม + Add สำเร็จ`);

                                // รอให้ dialog เปิดขึ้น
                                await wait(1000);

                                // ตรวจสอบว่า dialog เปิดขึ้นหรือไม่
                                const dialogOpened = await page.evaluate(() => {
                                    const dialog = document.querySelector('[role="dialog"], .dialog-content, [data-state="open"]');
                                    return !!dialog;
                                });

                                if (dialogOpened) {
                                    logs.push(`✅ Dialog เพิ่มทรัพยากรเปิดขึ้นสำเร็จ`);

                                    // ========== ทดสอบกรอกข้อมูลในฟอร์ม ==========
                                    logs.push(`🧪 เริ่มทดสอบการกรอกข้อมูลเพิ่มทรัพยากร`);

                                    try {
                                        // 1. กรอกชื่อทรัพยากร (Resource Name)
                                        const resourceNameInput = await page.$('input[placeholder="Enter Resource Name"]');
                                        if (resourceNameInput) {
                                            await resourceNameInput.type('ทรัพยากรทดสอบ Puppeteer',);
                                            logs.push(`✓ กรอกชื่อทรัพยากร: "ทรัพยากรทดสอบ Puppeteer"`);
                                        } else {
                                            logs.push(`⚠️ ไม่พบช่องกรอกชื่อทรัพยากร`);
                                        }

                                        // 2. เลือกประเภททรัพยากร (Resource Type)
                                        const selectTrigger = await page.$('.select-trigger');
                                        if (selectTrigger) {
                                            await selectTrigger.click();
                                            logs.push(`✓ คลิกเพื่อเปิดตัวเลือกประเภททรัพยากร`);

                                            // รอนานขึ้นให้ตัวเลือกแสดงเต็มที่
                                            await wait(1200);

                                            // ดึงข้อมูลตัวเลือกที่มีทั้งหมดเพื่อดีบัก
                                            const availableOptions = await page.evaluate(() => {
                                                const allOptions = Array.from(document.querySelectorAll('.select-item, [role="option"], li[role="option"], .select-dropdown-item, div[data-value]'));
                                                return allOptions.map(opt => ({
                                                    text: opt.textContent.trim(),
                                                    value: opt.getAttribute('data-value'),
                                                    class: opt.className
                                                }));
                                            });

                                            logs.push(`ℹ️ ตัวเลือกที่พบ: ${JSON.stringify(availableOptions)}`);

                                            // ใช้การค้นหาที่ยืดหยุ่นมากขึ้น
                                            const optionClicked = await page.evaluate(() => {
                                                // ค้นหาด้วยหลายตัวเลือกของเซเลกเตอร์
                                                const selectors = [
                                                    'div[role="option"]',
                                                    '.select-item',
                                                    'li[role="option"]',
                                                    '.select-dropdown-item',
                                                    'div[data-value]'
                                                ];

                                                // รวมตัวเลือกจากทุกเซเลกเตอร์
                                                let allOptions = [];
                                                selectors.forEach(selector => {
                                                    allOptions = [...allOptions, ...document.querySelectorAll(selector)];
                                                });

                                                // กรองซ้ำ
                                                allOptions = [...new Set(allOptions)];

                                                // แสดงตัวเลือกที่พบทั้งหมดในคอนโซล
                                                console.log('ตัวเลือกทั้งหมดที่พบ:', allOptions.map(opt => ({
                                                    text: opt.textContent.trim(),
                                                    value: opt.getAttribute('data-value') || 'no-value'
                                                })));

                                                // ค้นหาตัวเลือกที่ตรงกับ equipment (ไม่สนใจตัวพิมพ์ใหญ่เล็ก)
                                                const equipmentOption = allOptions.find(option =>
                                                    option.textContent.toLowerCase().includes('equipment') ||
                                                    option.textContent.includes('อุปกรณ์') ||
                                                    (option.getAttribute('data-value') || '').toLowerCase() === 'equipment'
                                                );

                                                if (equipmentOption) {
                                                    equipmentOption.click();
                                                    return true;
                                                }

                                                // ถ้าไม่พบ equipment ลองเลือกตัวเลือกที่ 2 (ถ้ามี)
                                                if (allOptions.length > 1) {
                                                    console.log('ไม่พบ equipment แต่เลือกตัวเลือกที่ 2 แทน');
                                                    allOptions[1].click();
                                                    return true;
                                                } else if (allOptions.length > 0) {
                                                    // ถ้ามีแค่ตัวเลือกเดียว
                                                    allOptions[0].click();
                                                    return true;
                                                }

                                                return false;
                                            });

                                            if (optionClicked) {
                                                logs.push(`✓ เลือกประเภททรัพยากร (อาจไม่ใช่ equipment)`);
                                            } else {
                                                logs.push(`⚠️ ไม่พบตัวเลือกประเภทใดๆ ในดรอปดาวน์`);
                                            }
                                        }

                                        // 3. กรอกต้นทุน (Cost)
                                        const costInput = await page.$('input[placeholder="Enter Cost"]');
                                        if (costInput) {
                                            await costInput.click({ clickCount: 3 }); // เลือกทั้งหมด (ถ้ามีข้อความเดิม)
                                            await costInput.type('1500');
                                            logs.push(`✓ กรอกต้นทุน: "1,500"`);
                                        } else {
                                            logs.push(`⚠️ ไม่พบช่องกรอกต้นทุน`);
                                        }

                                        // 4. กรอกจำนวน (Quantity)
                                        const quantityInput = await page.$('input[placeholder="Enter Quantity"]');
                                        if (quantityInput) {
                                            await quantityInput.click({ clickCount: 3 }); // เลือกทั้งหมด (ถ้ามีข้อความเดิม)
                                            await quantityInput.type('5');
                                            logs.push(`✓ กรอกจำนวน: "5"`);
                                        } else {
                                            logs.push(`⚠️ ไม่พบช่องกรอกจำนวน`);
                                        }

                                        // รอสักครู่ก่อนกด Save
                                        await wait(1000);

                                        // 5. กดปุ่ม Save
                                        const saveButton = await page.evaluateHandle(() => {
                                            // ค้นหาปุ่มทั้งหมด
                                            const buttons = Array.from(document.querySelectorAll('button'));

                                            // หาปุ่มที่มีข้อความ Save
                                            const saveBtn = buttons.find(button =>
                                                button.textContent.includes('Save') ||
                                                button.innerText.includes('Save')
                                            );

                                            return saveBtn;
                                        });

                                        if (saveButton) {
                                            await saveButton.click();
                                            logs.push(`✓ คลิกปุ่ม Save`);

                                            // รอให้การบันทึกเสร็จสิ้น
                                            await wait(2000);

                                            // ตรวจสอบว่ามีการเพิ่มข้อมูลสำเร็จหรือไม่ (สังเกตจาก dialog ปิดและมีรายการใหม่)
                                            const dialogClosed = await page.evaluate(() => {
                                                return !document.querySelector('[role="dialog"], .dialog-content, [data-state="open"]');
                                            });

                                            if (dialogClosed) {
                                                logs.push(`✅ บันทึกข้อมูลทรัพยากรสำเร็จ (dialog ปิดแล้ว)`);

                                                // ตรวจสอบว่ามีรายการทรัพยากรใหม่หรือไม่
                                                const newResourceExists = await page.evaluate(() => {
                                                    // หาข้อความในตารางหรือรายการ
                                                    return document.body.textContent.includes('ทรัพยากรทดสอบ Puppeteer');
                                                });

                                                if (newResourceExists) {
                                                    logs.push(`✅ พบรายการทรัพยากรใหม่ในหน้า`);
                                                } else {
                                                    logs.push(`ℹ️ ไม่พบข้อความของรายการทรัพยากรใหม่ในหน้า`);
                                                }
                                            } else {
                                                logs.push(`⚠️ dialog ยังคงเปิดอยู่หลังจากกด Save`);
                                            }
                                        } else {
                                            logs.push(`⚠️ ไม่พบปุ่ม Save`);
                                        }
                                    } catch (formError) {
                                        logs.push(`⚠️ เกิดข้อผิดพลาดในการกรอกข้อมูล: ${formError.message}`);
                                    }
                                } else {
                                    logs.push(`⚠️ ไม่พบ dialog หลังจากคลิกปุ่ม + Add`);
                                }

                                const checkDropdownEnd = performance.now();
                                logs.push(`🔄 Dropdown Check Time: ${(checkDropdownEnd - checkDropdownStart).toFixed(2)} ms`);
                            } else {
                                logs.push(`⚠️ ไม่พบปุ่ม + Add`);
                            }
                        } catch (error) {
                            logs.push(`⚠️ เกิดข้อผิดพลาดในการนำทางไปหน้า Resource/Budget: ${error.message}`);
                        }

                        // ========== ขั้นตอนที่ 6: ตรวจสอบปุ่มดรอปดาวน์และปุ่ม Edit ==========
                        logs.push(`📅 Timestamp: ${now()}`);
                        logs.push(`🧪 เริ่มทดสอบการกดปุ่มดรอปดาวน์และตรวจสอบปุ่ม Edit`);

                        const checkArrowDropdownStart = performance.now();

                        try {
                            // รอให้หน้า Resource/Budget โหลดเสร็จสมบูรณ์ก่อน
                            await wait(1000);

                            const arrowButtonClicked = await page.evaluate(() => {
                                // หาปุ่มลูกศรขวาจาก SVG path หรือคลาสที่เกี่ยวข้อง
                                const arrowButtons = Array.from(document.querySelectorAll('button'))
                                    .filter(btn => {
                                        // ตรวจสอบว่ามี SVG ภายในปุ่ม
                                        const svg = btn.querySelector('svg');
                                        if (!svg) return false;

                                        // ตรวจสอบว่า SVG มี path ที่เป็นลูกศรขวา
                                        const path = svg.querySelector('path');
                                        return path && path.getAttribute('d')?.includes('M3.13523 6.15803');
                                    });

                                if (arrowButtons.length > 0) {
                                    console.log('พบปุ่มลูกศรขวา กำลังคลิก...');
                                    arrowButtons[0].click();
                                    return true;
                                }
                                return false;
                            });

                            if (arrowButtonClicked) {
                                logs.push(`✓ คลิกที่ปุ่มดรอปดาวน์สำเร็จ`);

                                // รอให้รายการดรอปดาวน์แสดง
                                await wait(1000);
                                const addButtonResult = await page.evaluate(() => {
                                    const addButtons = Array.from(document.querySelectorAll('button'))
                                        .filter(btn => btn.textContent?.includes('Edit'));
                                    const buttonCount = addButtons.length;

                                    console.log(`พบปุ่ม Edit จำนวน ${buttonCount} ปุ่ม`);

                                    if (buttonCount > 0) {
                                        addButtons[0].click();
                                        return { clicked: true, count: buttonCount };
                                    }
                                    return { clicked: false, count: buttonCount };
                                });

                                // ย้ายการบันทึกออกมาด้านนอก
                                logs.push(`✅ พบปุ่ม Edit จำนวน ${addButtonResult.count} ปุ่ม`);

                                if (addButtonResult.clicked) {
                                    logs.push('✅ คลิกปุ่ม Edit ในโปรเจกต์สำเร็จ');

                                    // รอให้หน้าแก้ไขโหลด
                                    await wait(1000);

                                    // ตรวจสอบว่ามีฟอร์มแก้ไขปรากฏหรือไม่
                                    const editFormOpened = await page.evaluate(() => {
                                        const dialog = document.querySelector('[role="dialog"], .dialog-content, [data-state="open"]');
                                        return !!dialog;
                                    });

                                    if (editFormOpened) {
                                        logs.push('✅ ฟอร์มแก้ไขเปิดขึ้นสำเร็จ');

                                        // ทดสอบการแก้ไขข้อมูลในฟอร์ม Edit Resource
                                        logs.push('🧪 เริ่มทดสอบการแก้ไขข้อมูลทรัพยากร');

                                        try {
                                            // 1. แก้ไขชื่อทรัพยากร
                                            const resourceNameInput = await page.$('input[placeholder="Enter Resource Name"]');
                                            if (resourceNameInput) {
                                                await resourceNameInput.click({ clickCount: 3 }); // เลือกทั้งหมด
                                                await resourceNameInput.type('ทรัพยากรที่แก้ไขแล้ว');
                                                logs.push('✓ แก้ไขชื่อทรัพยากรเป็น "ทรัพยากรที่แก้ไขแล้ว"');
                                            } else {
                                                logs.push('⚠️ ไม่พบช่องกรอกชื่อทรัพยากร');
                                            }

                                            // 2. เปลี่ยนประเภททรัพยากร
                                            const selectTrigger = await page.$('.select-trigger');
                                            if (selectTrigger) {
                                                await selectTrigger.click();
                                                logs.push('✓ คลิกเพื่อเปิดตัวเลือกประเภททรัพยากร');

                                                // รอให้ตัวเลือกแสดง
                                                await wait(1000);

                                                // เพิ่มความยืดหยุ่นในการค้นหาตัวเลือก worker
                                                const workerOption = await page.evaluate(() => {
                                                    // ค้นหาด้วยวิธีต่างๆ
                                                    const options = Array.from(document.querySelectorAll('.select-item, [role="option"], li[role="option"], .select-dropdown-item'));

                                                    // แสดง debug ข้อมูล
                                                    console.log('ตัวเลือกที่พบทั้งหมด:', options.map(opt => ({
                                                        text: opt.textContent.trim(),
                                                        value: opt.getAttribute('data-value'),
                                                        classes: opt.className
                                                    })));

                                                    // ค้นหาตัวเลือก worker ด้วยหลายเงื่อนไข
                                                    const workerOpt = options.find(opt =>
                                                        (opt.getAttribute('data-value') === 'worker') ||
                                                        (opt.textContent.toLowerCase().trim() === 'worker') ||
                                                        (opt.textContent.toLowerCase().trim().includes('worker'))
                                                    );

                                                    if (workerOpt) {
                                                        workerOpt.click();
                                                        return { clicked: true, text: workerOpt.textContent.trim() };
                                                    }

                                                    return { clicked: false };
                                                });

                                                if (workerOption.clicked) {
                                                    logs.push(`✓ เลือกประเภททรัพยากรเป็น "${workerOption.text}"`);
                                                } else {
                                                    logs.push('⚠️ ไม่พบตัวเลือกประเภท "worker" เลย');
                                                }
                                            } else {
                                                logs.push('⚠️ ไม่พบตัวเลือกประเภททรัพยากร');
                                            }

                                            // 3. แก้ไขต้นทุน (Cost)
                                            const costInput = await page.$('input[placeholder="Enter Cost"]');
                                            if (costInput) {
                                                await costInput.click({ clickCount: 3 }); // เลือกทั้งหมด
                                                await costInput.type('2500');
                                                logs.push('✓ แก้ไขต้นทุนเป็น "2,500"');
                                            } else {
                                                logs.push('⚠️ ไม่พบช่องกรอกต้นทุน');
                                            }

                                            // 4. แก้ไขจำนวน (Quantity)
                                            const quantityInput = await page.$('input[placeholder="Enter Quantity"]');
                                            if (quantityInput) {
                                                await quantityInput.click({ clickCount: 3 }); // เลือกทั้งหมด
                                                await quantityInput.type('8');
                                                logs.push('✓ แก้ไขจำนวนเป็น "8"');
                                            } else {
                                                logs.push('⚠️ ไม่พบช่องกรอกจำนวน');
                                            }

                                            // รอสักครู่ก่อนกดปุ่ม Update
                                            await wait(1000);

                                            // 5. กดปุ่ม Update
                                            const updateButton = await page.evaluateHandle(() => {
                                                const buttons = Array.from(document.querySelectorAll('button'));
                                                return buttons.find(button =>
                                                    button.textContent.includes('Update') ||
                                                    button.innerText.includes('Update')
                                                );
                                            });

                                            if (updateButton) {
                                                await updateButton.click();
                                                logs.push('✓ คลิกปุ่ม Update เพื่อบันทึกการแก้ไข');

                                                // รอให้การบันทึกเสร็จสิ้น
                                                await wait(2000);

                                                // ตรวจสอบว่า Dialog ปิดหรือไม่
                                                const dialogClosed = await page.evaluate(() => {
                                                    return !document.querySelector('[role="dialog"], .dialog-content, [data-state="open"]');
                                                });

                                                if (dialogClosed) {
                                                    logs.push('✅ บันทึกการแก้ไขทรัพยากรสำเร็จ (dialog ปิดแล้ว)');

                                                    // ตรวจสอบว่าชื่อทรัพยากรถูกอัพเดตในหน้าเว็บหรือไม่
                                                    const updatedResourceExists = await page.evaluate(() => {
                                                        return document.body.textContent.includes('ทรัพยากรที่แก้ไขแล้ว');
                                                    });

                                                    if (updatedResourceExists) {
                                                        logs.push('✅ พบข้อมูลทรัพยากรที่อัพเดตแล้วในหน้า');
                                                    } else {
                                                        logs.push('ℹ️ ไม่พบข้อมูลทรัพยากรที่อัพเดตในหน้า (อาจต้องโหลดข้อมูลใหม่)');
                                                    }
                                                } else {
                                                    logs.push('⚠️ Dialog ยังคงเปิดอยู่หลังจากกดปุ่ม Update');
                                                }
                                            } else {
                                                logs.push('⚠️ ไม่พบปุ่ม Update');

                                                // ลองหาปุ่มที่มีข้อความคล้าย "Update", "Save" หรือ "Submit"
                                                const saveButtons = await page.evaluate(() => {
                                                    const buttons = Array.from(document.querySelectorAll('button'));
                                                    const saveBtn = buttons.find(btn =>
                                                        btn.textContent.includes('Save') ||
                                                        btn.textContent.includes('Submit') ||
                                                        btn.textContent.includes('Update') ||
                                                        btn.textContent.includes('บันทึก') ||
                                                        btn.textContent.includes('ยืนยัน')
                                                    );
                                                    return saveBtn ? true : false;
                                                });

                                                if (saveButtons) {
                                                    logs.push('✓ พบปุ่มบันทึกอื่นๆ พยายามคลิก...');
                                                    await page.click('button:last-of-type');
                                                    await wait(1500);
                                                }
                                            }
                                        } catch (editError) {
                                            logs.push(`⚠️ เกิดข้อผิดพลาดในการแก้ไขข้อมูล: ${editError.message}`);
                                        }
                                    } else {
                                        logs.push('⚠️ ไม่พบฟอร์มแก้ไขหลังจากคลิกปุ่ม Edit');
                                    }
                                } else {
                                    logs.push('⚠️ ไม่พบปุ่ม Edit ในโปรเจกต์');
                                }
                            } else {
                                logs.push(`⚠️ ไม่พบปุ่มดรอปดาวน์ตามที่ระบุ`);

                                // ลองค้นหาแบบกว้างขึ้น
                                const alternativeButtons = await page.evaluate(() => {
                                    const allButtons = Array.from(document.querySelectorAll('button, [role="button"]'));
                                    return allButtons.slice(0, 10).map(btn => ({
                                        text: btn.textContent.trim(),
                                        html: btn.outerHTML.slice(0, 100) // เก็บแค่ 100 ตัวอักษรแรก
                                    })).filter(btn => btn.text.length > 0);
                                });

                                logs.push(`ℹ️ พบปุ่มทั้งหมดบนหน้าเว็บ ${alternativeButtons.length} ปุ่ม`);
                                if (alternativeButtons.length > 0) {
                                    logs.push(`📋 ปุ่มที่พบ (แสดง 3 ปุ่มแรก):`);
                                    alternativeButtons.slice(0, 3).forEach(btn => {
                                        logs.push(`   • ${btn.text}`);
                                    });

                                    // ลองหาปุ่มที่เกี่ยวข้องกับการดำเนินการ
                                    const actionButtons = alternativeButtons.filter(btn =>
                                        btn.text.includes('Action') ||
                                        btn.text.includes('Option') ||
                                        btn.text.includes('Menu') ||
                                        btn.html.includes('dropdown')
                                    );

                                    if (actionButtons.length > 0) {
                                        logs.push(`✓ พบปุ่มที่อาจเป็นดรอปดาวน์: "${actionButtons[0].text}"`);

                                        await page.evaluate((buttonText) => {
                                            const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
                                            const actionButton = buttons.find(btn => btn.textContent.includes(buttonText));
                                            if (actionButton) actionButton.click();
                                        }, actionButtons[0].text);

                                        logs.push('✓ พยายามคลิกที่ปุ่มดรอปดาวน์ทางเลือก');
                                        await wait(1000);
                                    }
                                }
                            }
                        } catch (error) {
                            logs.push(`⚠️ เกิดข้อผิดพลาดในการตรวจสอบดรอปดาวน์: ${error.message}`);
                        }

                        const checkArrowDropdownEnd = performance.now();
                        logs.push(`🔄 Arrow Dropdown Check Time: ${(checkArrowDropdownEnd - checkArrowDropdownStart).toFixed(2)} ms`);



                        // ========== ขั้นตอนที่ 7: ทดสอบการลบทรัพยากร ==========
                        logs.push(`📅 Timestamp: ${now()}`);
                        logs.push(`🧪 เริ่มทดสอบการลบทรัพยากร`);

                        const deleteTestStart = performance.now();

                        try {
                            await wait(1000);
                            const editedResourceName = 'ทรัพยากรที่แก้ไขแล้ว';

                            const deleteResourceButtonClicked = await page.evaluate((resourceName) => {
                                const resourceRows = Array.from(document.querySelectorAll('table tbody tr'));
                                for (const row of resourceRows) {
                                    if (row.textContent.includes(resourceName)) {
                                        let deleteButton = row.querySelector('#delete-resource, button[id*="delete"]') ||
                                            row.querySelector('button[color="red"], button.cursor-pointer[variant="soft"][color="red"]') ||
                                            Array.from(row.querySelectorAll('button')).find(btn =>
                                                btn.textContent.trim().includes('Delete') || btn.classList.contains('delete-btn')
                                            );

                                        if (deleteButton) {
                                            deleteButton.click();
                                            return true;
                                        }
                                    }
                                }
                                return false;
                            }, editedResourceName);

                            if (deleteResourceButtonClicked) {
                                logs.push('✓ คลิกปุ่ม Delete ทรัพยากรสำเร็จ');

                                await page.waitForSelector('div[role="dialog"], [role="dialog"], .dialog-content, [data-state="open"]', { timeout: 5000 })
                                    .then(() => logs.push('✅ กล่องยืนยันการลบเปิดขึ้นสำเร็จ'))
                                    .catch(() => logs.push('⚠️ ไม่พบกล่องยืนยันการลบ (timeout)'));

                                await wait(800);

                                const confirmButtonClicked = await tryClickConfirmButton(page, logs, 2);

                                if (confirmButtonClicked) {
                                    logs.push('✓ คลิกปุ่ม Confirm เพื่อยืนยันการลบ');
                                    await wait(3000);

                                    const dialogClosed = await page.evaluate(() => {
                                        return !document.querySelector('div[role="dialog"], [role="dialog"], .dialog-content, [data-state="open"]');
                                    });

                                    if (dialogClosed) {
                                        logs.push('✅ Dialog ปิดลงแล้ว - การลบกำลังดำเนินการ');

                                        // ในส่วนที่ตรวจสอบว่าทรัพยากรถูกลบแล้วหรือไม่
                                        // logs.push('🔄 รีเฟรชหน้าเพื่อให้แน่ใจว่าข้อมูลหายไปจริง');
                                        // รอให้ API เสร็จสิ้นการทำงาน
                                        // await wait(3000);
                                        // รีเฟรชหน้า
                                        // await page.reload({ waitUntil: 'networkidle0' });
                                        // รออีกครั้งหลังจากรีเฟรช
                                        // await wait(2000);

                                        // ตรวจสอบว่าทรัพยากรได้หายไปจริงหรือไม่
                                        const resourceDeleted = await page.evaluate((deletedResourceName) => {
                                            const rows = Array.from(document.querySelectorAll('table tbody tr'));
                                            const stillExists = rows.some(row => row.textContent.includes(deletedResourceName));
                                            console.log('ยังพบทรัพยากร:', stillExists);
                                            console.log('ข้อความในแถว:', rows.map(r => r.textContent.trim()));
                                            return !stillExists;
                                        }, editedResourceName);

                                        if (resourceDeleted) {
                                            logs.push('✅ ทรัพยากรถูกลบออกจากรายการเรียบร้อย');
                                            logs.push('🎉 การทดสอบการลบทรัพยากรสำเร็จ');
                                        } else {
                                            logs.push('⚠️ การลบล้มเหลว: ทรัพยากรยังคงปรากฏในรายการแม้หลังจากลบแล้ว');

                                            // บันทึกข้อมูลการเรียก API เพื่อช่วยในการแก้ไขปัญหา
                                            const apiCalls = await page.evaluate(() => {
                                                return performance.getEntries()
                                                    .filter(entry => entry.name.includes('/api/'))
                                                    .map(e => ({ url: e.name, duration: e.duration }))
                                                    .slice(-5); // แสดงเฉพาะ 5 รายการล่าสุด
                                            });

                                            if (apiCalls.length > 0) {
                                                logs.push(`📊 API calls ล่าสุด: ${apiCalls.length} รายการ`);
                                                apiCalls.forEach(call => {
                                                    logs.push(`   - ${call.url} (${call.duration.toFixed(2)} ms)`);
                                                });
                                            }
                                        }
                                    } else {
                                        logs.push('⚠️ Dialog ยังคงเปิดอยู่หลังจากกด Confirm');
                                    }
                                } else {
                                    logs.push('⚠️ ไม่พบปุ่ม Confirm ในกล่องยืนยันการลบ หรือคลิกไม่สำเร็จ');
                                }
                            } else {
                                logs.push('⚠️ ไม่สามารถคลิกปุ่ม Delete ทรัพยากร');

                                // fallback → dropdown
                                const dropdownClicked = await page.evaluate(() => {
                                    const dropdowns = Array.from(document.querySelectorAll('button'))
                                        .filter(btn => {
                                            const svg = btn.querySelector('svg');
                                            return svg && svg.querySelector('path');
                                        });

                                    if (dropdowns.length > 0) {
                                        dropdowns[0].click();
                                        return true;
                                    }
                                    return false;
                                });

                                if (dropdownClicked) {
                                    logs.push('✓ คลิกที่ปุ่มดรอปดาวน์สำเร็จ');
                                    await wait(800);

                                    const deleteButtonClicked = await page.evaluate(() => {
                                        const deleteButtons = Array.from(document.querySelectorAll('button'))
                                            .filter(btn => btn.textContent?.includes('Delete'));

                                        if (deleteButtons.length > 0) {
                                            deleteButtons[0].click();
                                            return true;
                                        }
                                        return false;
                                    });

                                    if (deleteButtonClicked) {
                                        logs.push('✓ คลิกปุ่ม Delete ในเมนูดรอปดาวน์สำเร็จ');
                                        await wait(800);

                                        const confirmDialogOpened = await page.evaluate(() => {
                                            return !!document.querySelector('div[role="dialog"], [role="dialog"], .dialog-content, [data-state="open"]');
                                        });

                                        if (confirmDialogOpened) {
                                            logs.push('✅ กล่องยืนยันการลบเปิดขึ้นสำเร็จ');

                                            const confirmClicked = await tryClickConfirmButton(page, logs, 2);
                                            if (confirmClicked) {
                                                logs.push('✓ คลิกปุ่ม Confirm เพื่อยืนยันการลบ');
                                                await wait(3000);

                                                logs.push('🔄 รีเฟรชหน้าเพื่อให้แน่ใจว่าข้อมูลหายไปจริง');
                                                await page.reload({ waitUntil: 'networkidle0' });
                                                await wait(2000);
                                            }
                                        }
                                    }
                                }
                            }

                            const deleteTestEnd = performance.now();
                            logs.push(`🔄 Delete Test Time: ${(deleteTestEnd - deleteTestStart).toFixed(2)} ms`);

                        } catch (deleteError) {
                            logs.push(`⚠️ เกิดข้อผิดพลาดในการทดสอบการลบ: ${deleteError.message}`);
                        }

                        // ========== ฟังก์ชันช่วยคลิกปุ่ม Confirm ==========
                        async function tryClickConfirmButton(page, logs, retries = 2) {
                            for (let i = 0; i < retries; i++) {
                                try {
                                    // วิธีใหม่: พยายามค้นหาปุ่มตาม ID เฉพาะก่อน
                                    const specificIdButtonClicked = await page.evaluate(() => {
                                        const confirmButton = document.querySelector('#delete-resource-button-confirm-em');
                                        if (confirmButton) {
                                            console.log('พบปุ่มยืนยันจาก ID เฉพาะ');
                                            confirmButton.click();
                                            return true;
                                        }
                                        return false;
                                    });

                                    if (specificIdButtonClicked) {
                                        logs.push(`✓ พบและคลิกปุ่มยืนยันโดยใช้ ID เฉพาะ`);
                                        return true;
                                    }

                                    // ความพยายามแรก: โดยรูปแบบข้อความปุ่มทั่วไป
                                    const confirmButtonClicked = await page.evaluate(() => {
                                        // รูปแบบข้อความปุ่มยืนยันทั่วไป
                                        const confirmTexts = ['confirm', 'yes', 'ok', 'delete', 'remove', 'ยืนยัน', 'ตกลง', 'ลบ'];

                                        // พยายามค้นหาปุ่มตามเนื้อหาข้อความ (ไม่คำนึงถึงตัวพิมพ์ใหญ่-เล็ก)
                                        const buttons = Array.from(document.querySelectorAll('button, [role="button"]'))
                                            .filter(btn => {
                                                const text = btn.textContent?.trim().toLowerCase() || '';
                                                return confirmTexts.some(confirmText =>
                                                    text === confirmText || text.includes(confirmText));
                                            });

                                        // พยายามค้นหาปุ่มตามคุณสมบัติทั่วไป
                                        if (buttons.length === 0) {
                                            const dialogButtons = Array.from(document.querySelectorAll(
                                                'div[role="dialog"] button, [role="dialog"] button, .dialog-content button, [data-state="open"] button'
                                            ));

                                            // จะมีปุ่มยืนยันเป็นปุ่มหลัก/มีสีหรือปุ่มทางขวาสุด
                                            const primaryButton = dialogButtons.find(btn =>
                                                btn.classList.contains('primary') ||
                                                btn.getAttribute('color') === 'primary' ||
                                                btn.getAttribute('variant') === 'contained' ||
                                                btn.classList.contains('btn-danger')
                                            );

                                            if (primaryButton) {
                                                primaryButton.click();
                                                return true;
                                            }

                                            // ถ้าไม่พบปุ่มหลักและมีปุ่มพอดีสองปุ่ม
                                            // ปุ่มด้านขวามักจะเป็นการยืนยัน (ปุ่มด้านซ้ายมักจะเป็นยกเลิก)
                                            if (dialogButtons.length === 2) {
                                                dialogButtons[1].click();
                                                return true;
                                            }

                                            return false;
                                        }

                                        // คลิกปุ่มแรกที่พบ
                                        buttons[0].click();
                                        return true;
                                    });

                                    if (confirmButtonClicked) {
                                        return true;
                                    }

                                    // ความพยายามที่สอง: พยายามคลิกปุ่มที่มีคุณสมบัติเฉพาะ
                                    await wait(500);
                                    const buttonSelector = await page.evaluate(() => {
                                        // บันทึกปุ่มทั้งหมดเพื่อดีบัก
                                        console.log('ปุ่มที่พบ:',
                                            Array.from(document.querySelectorAll('button'))
                                                .map(b => ({ text: b.textContent, class: b.className }))
                                        );

                                        // ค้นหาปุ่มสีแดงหรือปุ่มหลักที่อาจแสดงถึงการลบ
                                        const dangerButtons = document.querySelectorAll('button[color="error"], button[color="danger"], button[color="red"]');
                                        if (dangerButtons.length > 0) return 'button[color="error"], button[color="danger"], button[color="red"]';

                                        return null;
                                    });

                                    if (buttonSelector) {
                                        await page.click(buttonSelector);
                                        return true;
                                    }

                                } catch (error) {
                                    logs.push(`⚠️ พยายามคลิกปุ่มยืนยันครั้งที่ ${i + 1} ไม่สำเร็จ: ${error.message}`);
                                    await wait(500);
                                }
                            }

                            logs.push('ℹ️ ทดลองใช้วิธี force click ปุ่มยืนยันด้วย JavaScript');

                            // เพิ่มส่วนนี้หลังจากกล่องโต้ตอบได้รับการยืนยันว่าเปิด
                            await page.evaluate(() => {
                                const dialog = document.querySelector('div[role="dialog"], [role="dialog"], .dialog-content, [data-state="open"]');
                                if (dialog) {
                                    const buttons = Array.from(dialog.querySelectorAll('button'));
                                    console.log('พบปุ่มในกล่องโต้ตอบ:', buttons.length);
                                    console.log('รายละเอียดปุ่ม:', buttons.map(b => ({
                                        text: b.textContent.trim(),
                                        classes: b.className,
                                        attributes: Array.from(b.attributes).map(a => `${a.name}="${a.value}"`).join(', ')
                                    })));

                                    // ทดลองคลิกปุ่มสุดท้าย (มักจะเป็นปุ่มยืนยัน)
                                    if (buttons.length > 0) {
                                        buttons[buttons.length - 1].click();
                                        return true;
                                    }
                                }
                                return false;
                            });

                            // เพิ่มการรอเพื่อให้แน่ใจว่าคำสั่งทำงานเสร็จ
                            await wait(500);

                            // ตรวจสอบว่า dialog ปิดแล้วหรือไม่
                            const dialogClosed = await page.evaluate(() => {
                                return !document.querySelector('div[role="dialog"], [role="dialog"], .dialog-content, [data-state="open"]');
                            });

                            // คืนค่าสถานะการปิด dialog
                            return dialogClosed;
                        }

                        const navigateToResourceEnd = performance.now();
                        logs.push(`🔄 Resource/Budget Navigation Time: ${(navigateToResourceEnd - navigateToResourceStart).toFixed(2)} ms`);
                    } else {
                        logs.push(`⚠️ ไม่สามารถนำทางไปยังหน้า Resource/Budget ได้`);
                        logs.push(`🔍 URL ปัจจุบัน: ${isResourcePage.url}`);
                    }
                } catch (error) {
                    logs.push(`⚠️ เกิดข้อผิดพลาดในการนำทางไปหน้า Resource/Budget: ${error.message}`);
                }
            } else {
                logs.push(`⚠️ หลังจากเลือกโปรเจกต์ไม่ได้อยู่ที่หน้า Timeline`);

                // ลองคลิกที่ Timeline tab
                try {
                    await page.click('button[value="timeline"]');
                    await wait(1000);
                    logs.push(`🔄 พยายามคลิกที่แท็บ Timeline โดยตรง`);

                    // ตรวจสอบอีกครั้งว่าอยู่ที่หน้า Timeline หรือยัง
                    const isTimelinePageNow = await page.evaluate(() => {
                        return document.querySelector('button[value="timeline"][data-state="active"]') !== null ||
                            document.querySelector('button[aria-selected="true"]') !== null ||
                            window.location.pathname.includes('/employeePlan');
                    });

                    if (isTimelinePageNow) {
                        logs.push(`✅ นำทางไปยังหน้า Timeline สำเร็จหลังจากคลิกที่แท็บโดยตรง`);
                    } else {
                        logs.push(`❌ ยังคงไม่ได้อยู่ที่หน้า Timeline แม้พยายามคลิกที่แท็บโดยตรง`);
                    }
                } catch (error) {
                    logs.push(`⚠️ ไม่สามารถคลิกที่แท็บ Timeline โดยตรงได้: ${error.message}`);
                }
            }
        } else {
            logs.push(`⚠️ ไม่พบโปรเจกต์ในระบบ`);
        }

        // สรุปผลการทดสอบ
        logs.push(`\n======== สรุปผลการทดสอบ ========`);
        logs.push(`📅 เวลาสิ้นสุด: ${now()}`);
        logs.push(`✅ การทดสอบเสร็จสมบูรณ์`);

    } catch (error) {
        console.error(`[${now()}] ❌ ERROR:`, error);
        logs.push(`❌ เกิดข้อผิดพลาด: ${error.message}`);
        logs.push(`📑 Stack Trace: ${error.stack}`);  // เก็บ stack trace เพื่อการแก้ไขข้อผิดพลาด
    } finally {
        // เขียนบันทึกลงในไฟล์
        fs.writeFileSync(logFilename, logs.join('\n'));
        console.log(`[${now()}] 📝 บันทึกผลการทดสอบลงในไฟล์ ${logFilename}`);

        // ปิดเบราว์เซอร์
        if (browser) {
            await browser.close();
            console.log(`[${now()}] 🔒 ปิดเบราว์เซอร์เรียบร้อย`);
        }
    }
})();