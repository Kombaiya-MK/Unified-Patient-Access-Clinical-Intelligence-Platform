/**
 * ResponsiveTabs Component
 *
 * Tabbed interface for mobile dashboards. Renders a horizontal
 * scrollable tab list with keyboard navigation (Arrow keys, Home,
 * End). On desktop (≥1025px) the tab list is hidden via CSS and
 * all panels render simultaneously.
 *
 * @module Dashboard/ResponsiveTabs
 * @task US_044 TASK_005
 */

import React, { useState, useRef, useCallback } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import '../../styles/dashboard-responsive.css';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface ResponsiveTabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  ariaLabel?: string;
  desktopClassName?: string;
}

export const ResponsiveTabs: React.FC<ResponsiveTabsProps> = ({
  tabs,
  defaultTab,
  ariaLabel = 'Dashboard sections',
  desktopClassName,
}) => {
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === 'desktop' || breakpoint === 'large-desktop';
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');
  const tabListRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let nextIndex = index;

      switch (e.key) {
        case 'ArrowRight':
          nextIndex = (index + 1) % tabs.length;
          break;
        case 'ArrowLeft':
          nextIndex = (index - 1 + tabs.length) % tabs.length;
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      setActiveTab(tabs[nextIndex].id);

      const tabList = tabListRef.current;
      if (tabList) {
        const buttons = tabList.querySelectorAll<HTMLButtonElement>(
          '[role="tab"]',
        );
        buttons[nextIndex]?.focus();
      }
    },
    [tabs],
  );

  if (isDesktop) {
    return (
      <div className={desktopClassName || 'responsive-tabs--desktop'}>
        {tabs.map((tab) => (
          <section key={tab.id} role="region" aria-label={tab.label}>
            {tab.content}
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="responsive-tabs">
      <div
        className="responsive-tabs__list"
        role="tablist"
        aria-label={ariaLabel}
        ref={tabListRef}
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={`responsive-tabs__tab${activeTab === tab.id ? ' responsive-tabs__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          className="responsive-tabs__panel"
          hidden={activeTab !== tab.id}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
};
