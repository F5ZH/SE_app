import { User } from '../types';

// 用于存储用户列表和当前用户的键
const CURRENT_USER_KEY = 'vocabulary_app_current_user';
const USERS_KEY = 'vocabulary_app_users';

// 您应用中现有的（全局的）数据键
// 我们需要知道这些键名，以便进行数据迁移
const GUEST_KEYS = [
  'vocabulary_app_word_books',
  'vocabulary_app_study_records',
  'vocabulary_app_study_plans',
  'vocabulary_app_current_plan',
  'vocabulary_app_user_settings',
  'vocabulary_app_check_in'
];

/**
 * 迁移访客（未登录）数据到指定用户
 * @param username 要迁移到的用户名
 */
function migrateGuestData(username: string): void {
  try {
    console.log(`正在将访客数据迁移给新用户: ${username}`);
    for (const key of GUEST_KEYS) {
      // 检查是否存在旧的全局数据
      const data = localStorage.getItem(key);
      if (data) {
        // 1. 复制数据到新用户的键（例如：'guest_user_vocabulary_app_word_books'）
        localStorage.setItem(`${username}_${key}`, data);
        // 2. 删除旧的全局数据，完成迁移
        localStorage.removeItem(key);
      }
    }
    console.log("数据迁移完成。");
  } catch (error) {
    console.error("迁移访客数据失败:", error);
  }
}

export const authService = {
  /**
   * 注册新用户
   */
  register(username: string, password: string): { success: boolean; message: string } {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]') as User[];

    if (users.find(u => u.username === username)) {
      return { success: false, message: '用户名已存在' };
    }

    // 保存新用户（注意：明文存储密码，仅用于原型）
    const newUser = { username, password };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // 关键：如果是系统中的第一个用户，则将所有现有的访客数据迁移给他
    if (users.length === 1) {
      migrateGuestData(username);
    }

    // 注册后自动登录
    localStorage.setItem(CURRENT_USER_KEY, username);
    return { success: true, message: '注册成功' };
  },

  /**
   * 用户登录
   */
  login(username: string, password: string): { success: boolean; message: string } {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]') as User[];

    const user = users.find(u => u.username === username);

    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    if (user.password !== password) {
      return { success: false, message: '密码错误' };
    }

    // 登录成功
    localStorage.setItem(CURRENT_USER_KEY, username);
    return { success: true, message: '登录成功' };
  },

  /**
   * 用户登出
   */
  logout(): void {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  /**
   * 获取当前登录的用户名
   */
  getCurrentUser(): string | null {
    return localStorage.getItem(CURRENT_USER_KEY);
  }
};