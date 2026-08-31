/*
 * Copyright (C) 2020-2021 Matthias Klumpp <matthias@tenstral.net>
 *
 * SPDX-License-Identifier: LGPL-3.0+
 */

import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router';

import IntroView from './views/IntroView.vue';
import GuiAppView from './views/GuiAppView.vue';
import ConsoleAppView from './views/ConsoleAppView.vue';
import AddonView from './views/AddonView.vue';
import ServiceView from './views/ServiceView.vue';

// The freedesktop.org deployment lives in a subdirectory and uses hash locations
const useHash = import.meta.env.VITE_ROUTER_HASH === 'true';

export const router = createRouter({
    history: useHash
        ? createWebHashHistory(import.meta.env.BASE_URL)
        : createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', component: IntroView },
        { path: '/guiapp', component: GuiAppView },
        { path: '/consoleapp', component: ConsoleAppView },
        { path: '/addon', component: AddonView },
        { path: '/service', component: ServiceView },
    ],

    scrollBehavior(to, from, savedPosition) {
        return savedPosition ?? { top: 0 };
    },
});
