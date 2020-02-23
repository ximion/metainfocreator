import { NgModule } from '@angular/core';
import { Router, Routes, RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';

import { ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { IntroComponent } from './intro.component';
import { GUIAppComponent } from './guiapp.component';

const routes: Routes = [
      { path: '', component: IntroComponent },
      { path: 'guiapp', component: GUIAppComponent },
    ];

@NgModule({
  declarations: [
      AppComponent,
      IntroComponent,
      GUIAppComponent
  ],
  imports: [
      BrowserModule,
      ReactiveFormsModule,
      RouterModule.forRoot(routes, { enableTracing: false }),
  ],
  bootstrap: [
      AppComponent
  ]
})
export class AppModule {
  constructor(router: Router) {
      // Debugging aid for routing
      //const replacer = (key, value) => (typeof value === 'function') ? value.name : value;
      //console.log('Routes: ', JSON.stringify(router.config, replacer, 2));
  }
}
