/*
 * Copyright (C) 2020 Matthias Klumpp <matthias@tenstral.net>
 *
 * SPDX-License-Identifier: LGPL-3.0+
 */

import { NgModule } from '@angular/core';
import { Router, Routes, RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment';

import { AppComponent } from './app.component';
import { IntroComponent } from './intro.component';
import { GUIAppComponent } from './guiapp.component';
import { ConsoleAppComponent } from './consoleapp.component';
import { AddonComponent } from './addon.component';
import { ServiceComponent } from './service.component';

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
                             useHash: environment.routerHashLocations }),
  ],
  bootstrap: [
      AppComponent
  ]
})
export class AppModule {
  constructor(router: Router) {
      // Debugging aid for routing
      // const replacer = (key, value) => (typeof value === 'function') ? value.name : value;
      // console.log('Routes: ', JSON.stringify(router.config, replacer, 2));
  }
}
