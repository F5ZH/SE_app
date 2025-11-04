// src/components/Header.tsx (已合并登出功能)

import React from 'react';
// 1. 引入 Heart 和 LogOut 图标
import { BookOpen, Library, Calendar, Home, LogOut, Heart } from 'lucide-react';

interface HeaderProps {
  // 2. 确保 currentView 类型包含 'wordmate' (你原有的)
  currentView: 'dashboard' | 'wordbooks' | 'study' | 'plan' | 'wordmate';
  // 3. 确保 onViewChange 包含 'wordmate' (你原有的)
  onViewChange: (view: 'dashboard' | 'wordbooks' | 'study' | 'plan' | 'wordmate') => void;
  onPlanNavigation?: () => void;
  hasActivePlan: boolean;
  onLogout: () => void; // 4. 添加 onLogout prop
}

const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onPlanNavigation,
  hasActivePlan,
  onLogout // 5. 接收 onLogout
}) => {

  const navItems = [
    {
      id: 'dashboard' as const,
      label: '首页',
      icon: Home,
      description: '学习概览和统计'
    },
    {
      id: 'wordbooks' as const,
      label: '词书管理',
      icon: Library,
      description: '管理词书和导入新词'
    },
    {
      id: 'plan' as const,
      label: '学习计划',
      icon: Calendar,
      description: '创建和管理学习计划'
    },
    {
      id: 'study' as const,
      label: '开始学习',
      icon: BookOpen,
      description: '开始今日学习任务',
      disabled: !hasActivePlan
    },
    // 6. 你原有的 '单词姬' 导航项 (保留)
    {
      id: 'wordmate' as const,
      label: '单词姬',
      icon: Heart,
      description: '进入 WordMate 养成系统',
      disabled: false
    }
  ];

  return (
    <header className="header">
      <div className="header-container">
        {/* 应用标题 */}
        <div className="header-brand">
          <div className="brand-icon">
            <BookOpen size={24} />
          </div>
          <div className="brand-text">
            <h1 className="brand-title">词汇记忆</h1>
            <p className="brand-subtitle">基于艾宾浩斯遗忘曲线</p>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="header-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
                onClick={() => { // 7. 确保 onPlanNavigation 逻辑被正确处理
                  if (item.disabled) return;
                  if (item.id === 'plan' && onPlanNavigation) {
                    onPlanNavigation();
                  } else {
                    onViewChange(item.id);
                  }
                }}
                disabled={item.disabled}
                title={item.description}
              >
                <Icon size={20} />
                <span className="nav-label">{item.label}</span>
                {item.disabled && item.id === 'study' && ( // 仅“开始学习”显示此提示
                  <div className="nav-disabled-indicator">
                    <span className="text-xs text-gray-400">需要学习计划</span>
                  </div>
                )}
              </button>
            );
          })}

          {/* --- 8. 添加登出按钮 --- */}
          <button
            className="nav-item"
            onClick={onLogout}
            title="登出"
          >
            <LogOut size={20} />
            <span className="nav-label">登出</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;