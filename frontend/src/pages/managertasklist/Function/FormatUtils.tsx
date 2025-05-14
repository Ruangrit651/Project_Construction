/**
 * ไฟล์รวมฟังก์ชันจัดรูปแบบข้อมูลต่างๆ
 */

/**
 * จัดรูปแบบวันที่เป็น dd/mm/yyyy
 */
export const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * จัดรูปแบบตัวเลขงบประมาณให้มี comma คั่น
 */
export const formatBudget = (budget: number | undefined): string => {
    if (budget === undefined && budget !== 0) return "-";
    return Number(budget).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
};