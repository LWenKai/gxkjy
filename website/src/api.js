const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.gxkjy.com/api';
export const defaultSettings = {
    home_title: '食品安全快检室建设与数字化开证配套',
    home_subtitle: '从快检设备、试剂耗材、样品处理、合格证打印到检测记录管理，帮客户把快检室真正用起来。',
    primary_button_text: '获取配置方案',
    secondary_button_text: '查看服务能力',
    contact_phone: '13363412262',
    wechat_tip: '微信同手机号，可发送检测场景、项目要求和现场照片，沟通配置建议。',
    company_intro: '山西谷芯科技有限公司围绕食品安全快检场景，提供检测仪器、试剂耗材、合格证打印、数据管理和快检室配套建议。山西省内可根据项目情况提供上门安装指导、操作培训和售后支持，省外可远程指导或协商服务方式。',
    show_materials: true,
    show_cloud_module: true,
};
export async function fetchWebsiteSettings() {
    return fetchApi('/public/website/settings').catch(() => defaultSettings);
}
export async function fetchWebsiteMaterials() {
    const data = await fetchApi('/public/website/materials?page_size=100').catch(() => ({
        items: [],
    }));
    return data.items || [];
}
async function fetchApi(path) {
    const response = await fetch(`${API_BASE_URL}${path}`);
    const payload = (await response.json());
    if (!payload.success)
        throw new Error(payload.message || '请求失败');
    return payload.data;
}
//# sourceMappingURL=api.js.map