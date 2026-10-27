'use client';

import { createContext, useContext } from 'react';
import type { AdminUser } from '@/lib/types';

export const AdminContext = createContext<{ user: AdminUser | null }>({ user: null });
export const useAdmin = () => useContext(AdminContext);
