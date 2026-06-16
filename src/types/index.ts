// src/types/index.ts

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  permissions?: string[];
}

export interface PageProps {
  auth: {
    user: User | null;
  };
  is_demo?: boolean | number | string;
  [key: string]: any;
}

export interface NavItem {
  title: string;
  href?: string;
  icon?: any;
  activePaths?: string[];
  children?: NavItem[];
}

// Global declaration for route helper (Ziggy stub)
declare global {
  function route(name?: string, params?: any, absolute?: boolean, config?: any): any;
}
