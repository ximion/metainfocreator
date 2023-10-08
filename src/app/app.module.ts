/*
 * Copyright (C) 2020-2021 Matthias Klumpp <matthias@tenstral.net>
 *
 * SPDX-License-Identifier: LGPL-3.0+
 */

import { NgModule } from '@angular/core';
import { Router, Routes, RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment';

import { HighlightModule, HIGHLIGHT_OPTIONS } from 'ngx-highlightjs';

import { AppComponent } from './app.component';
import { IntroComponent } from './intro.component';
import { GUIAppComponent } from './guiapp.component';
import { ConsoleAppComponent } from './consoleapp.component';
import { AddonComponent } from './addon.component';
import { ServiceComponent } from './service.component';

import { ClipboardService } from './clipboard.service';

const routes: Routes = [
      { path: '', component: IntroComponent },
      { path: 'guiapp', component: GUIAppComponent },
      { path: 'consoleapp', component: ConsoleAppComponent },
      { path: 'addon', component: AddonComponent },
      { path: 'service', component: ServiceComponent },
    ];

@NgModule({
  declarations: [
      AppComponent,
      IntroComponent,
      GUIAppComponent,
      ConsoleAppComponent,
      AddonComponent,
      ServiceComponent
  ],
  imports: [
      BrowserModule,
      HttpClientModule,
      ReactiveFormsModule,
      RouterModule.forRoot(routes,
                           { enableTracing: false,
    scrollPositionRestoration: 'enabled',
    useHash: environment.routerHashLocations }),
      HighlightModule,
  ],
  providers: [
    ClipboardService,
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: {
        coreLibraryLoader: () => import('highlight.js/lib/core'),
        languages: {
            xml: () => import('highlight.js/lib/languages/xml'),
            meson: () => import('highlight.js/lib/languages/python'),
            toml: () => import('highlight.js/lib/languages/ini')
        }
      }
    }
  ],
  bootstrap: [
      AppComponent
  ]
})
export class AppModule {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(router: Router) {
      // Debugging aid for routing
      // const replacer = (key, value) => (typeof value === 'function') ? value.name : value;
      // console.log('Routes: ', JSON.stringify(router.config, replacer, 2));
  }
}
