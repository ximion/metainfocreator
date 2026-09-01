/*
 * Copyright (C) 2020-2021 Matthias Klumpp <matthias@tenstral.net>
 *
 * SPDX-License-Identifier: LGPL-3.0+
 */

import { createApp } from 'vue';

import 'bulma/css/bulma.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './highlight-theme.css';
import './style.css';

import App from './App.vue';
import { router } from './router';
import { highlight } from './directives/highlight';

createApp(App)
    .use(router)
    .directive('highlight', highlight)
    .mount('#app');
