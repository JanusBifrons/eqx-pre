import React from 'react';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { AppLayout } from '../shared/layout/AppLayout';

export const Route = createRootRoute({
    component: () => (
        <>
            <AppLayout>
                <Outlet />
            </AppLayout>
            <TanStackRouterDevtools />
        </>
    ),
});
