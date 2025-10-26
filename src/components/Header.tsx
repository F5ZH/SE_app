import React from 'react';
import { BookOpen, Library, Calendar, Home } from 'lucide-react';

interface HeaderProps {
  currentView: 'dashboard' | 'wordbooks' | 'study' | 'plan';
  onViewChange: (view: 'dashboard' | 'wordbooks' | 'study' | 'plan') => void;
  onPlanNavigation?: () => void;
  hasActivePlan: boolean;
}

/**
 * 应用头部导航组件
 * 提供主要功能模块的导航
 */
const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, onPlanNavigation, hasActivePlan }) => {
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
                onClick={() => {
                  if (item.disabled) return;
                  
                  // 特殊处理学习计划导航
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
                {item.disabled && (
                  <div className="nav-disabled-indicator">
                    <span className="text-xs text-gray-400">需要学习计划</span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Header;
