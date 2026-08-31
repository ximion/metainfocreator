<template>

<nav class="breadcrumb" aria-label="breadcrumbs">
  <ul>
    <li><RouterLink to="/">Home</RouterLink></li>
    <li class="is-active"><a href="#" aria-current="page">GUI App Metadata</a></li>
  </ul>
</nav>

<div class="content">
<h1 class="title">
  Create metadata for GUI applications
</h1>

<p>
  A GUI application (or desktop application) is an application which has a graphical user interface and is commonly used with mouse and keyboard.
  It also ships a Freedesktop .desktop file to be visible in application menus of a desktop environment (e.g. GNOME or KDE Plasma).
</p>
<p>
  If you do not have a .desktop file yet, this tool can generate one for you. You may also decide to auto-generate the .desktop file from your
  MetaInfo file, to reduce data duplication a bit.
</p>

<p>Please fill out the form below to generate your MetaInfo file as well as (optionally) auxiliary data.</p>

<form novalidate @submit.prevent>

<div class="card">
    <header class="card-header">
      <p class="card-header-title">
        Basic Information
      </p>
    </header>
    <div class="card-content content">

        <div class="field">
            <label class="label">Name of the application</label>
            <div class="control">
                <input class="input" v-model="f.appName.value" @blur="f.appName.touch" type="text" placeholder="The human-readable name of your application">
            </div>

            <p v-if="f.appName.showErrors" class="help is-danger">A name is required</p>
        </div>

        <div class="field">
            <label class="label">Summary of the application</label>
            <div class="control">
                <input class="input" v-model="f.appSummary.value" @blur="f.appSummary.touch" type="text" placeholder="A short text summarizing what the application does">
            </div>

            <p v-if="f.appSummary.showErrors" class="help is-danger">A summary is required</p>
        </div>

        <div class="field">
            <label class="label">Homepage of the application</label>
            <div class="control has-icons-left">
                <input class="input" v-model="f.appHomepage.value" @blur="f.appHomepage.touch" type="text" placeholder="The website where this application is hosted.">
                <span class="icon is-small is-left">
                    <i class="fas fa-link"></i>
                </span>
            </div>

            <div v-if="f.appHomepage.showErrors">
                <p v-if="f.appHomepage.errors.required" class="help is-danger">A project homepage is required</p>
                <p v-if="f.appHomepage.errors.invalidUrl" class="help is-danger">This URL is not accepted</p>
            </div>
        </div>

        <div class="field">
            <label class="label">Description</label>
            <div class="control">
                <textarea class="textarea" v-model="f.appDescription.value" @blur="f.appDescription.touch" placeholder="Long description of this software. You can use Mardown in-line `code`, paragraph and *emphasis* markup."></textarea>
            </div>

            <p v-if="f.appDescription.showErrors" class="help is-danger">A long description is required</p>
        </div>

        <div class="field">
            <label class="label">Unique Software Identifier</label>
            <div class="control has-icons-left">
                <input class="input" v-model="f.cptId.value" @blur="f.cptId.touch" type="text" placeholder="Reverse-DNS string uniquely identifying your application.">
                <span class="icon is-small is-left">
                    <i class="fas fa-fingerprint"></i>
                </span>
            </div>
            <p class="help">A rDNS-style string uniquely identifying your application. Must contain only ASCII characters, dots and numbers.</p>

            <div v-if="f.cptId.showErrors">
                <p v-if="f.cptId.errors.required" class="help is-danger">A component-ID is required</p>
                <p v-if="f.cptId.errors.minlength" class="help is-danger">A component-ID is too short</p>
                <p v-if="f.cptId.errors.forbiddenId" class="help is-danger">This ID is not valid: {{ f.cptId.errors.forbiddenId.value }}</p>
            </div>
        </div>

    </div>
</div>


<div class="card">
    <header class="card-header">
      <p class="card-header-title">
        Licensing
      </p>
    </header>
    <div class="card-content content">

        <div class="field">
        <label class="label">Metadata License</label>
        <div class="control">
            <div class="select">
                <select v-model="f.metadataLicense.value" @blur="f.metadataLicense.touch">
                    <option value="">Choose a metadata license</option>
                    <option v-for="license of metadataLicenses" :key="license.id" :value="license.id">{{ license.name }}</option>
                </select>
            </div>
            <p class="help">The license that applies to this particular metadata and linked assets (like screenshots and videos).</p>

            <p v-if="f.metadataLicense.showErrors" class="help is-danger">A metadata license must be selected</p>
        </div>
        </div>

        <div class="field">
        <label class="label">Software License</label>

        <div class="control">
            <label class="radio">
            <input type="radio" value="simple" v-model="f.rbLicenseMode.value">
            Simple Single License
            </label>
            <label class="radio">
            <input type="radio" value="spdx" v-model="f.rbLicenseMode.value">
            Custom SPDX Expression
            </label>
        </div>
        </div>
        <div class="field is-grouped">
            <div class="control">
            <div class="select">
                <!-- Angular disabled this control rather than removing it, so it stays
                     visible (greyed out) when the SPDX expression mode is selected. -->
                <select v-model="f.simpleProjectLicense.value" :disabled="spdxMode">
                    <option value="">Choose a project license</option>
                    <option v-for="license of spdxLicenses" :key="license.id" :value="license.id">{{ license.name }}</option>
                </select>
                </div>
            </div>

            <div v-if="spdxMode" class="control is-expanded">
                <input class="input" v-model="f.complexProjectLicense.value" @blur="f.complexProjectLicense.touch" type="text" placeholder="A SPDX license expression, e.g. GPL-3.0-or-later and MPL-2.0">
                <p class="help">A <a href="https://spdx.org/licenses/" target="_blank">SPDX</a> license expression string.</p>
                <p v-if="f.complexProjectLicense.showErrors" class="help is-danger">You need to enter a SPDX expression</p>
            </div>
        </div>
        <p class="help">The license that applies to the described software.</p>

    </div>
</div>


<div class="card">
    <header class="card-header">
      <p class="card-header-title">
        Screenshots
      </p>
    </header>
    <div class="card-content content">
        <p>
          Screenshots present your application to the outside world and could be seen by thousands of people. They are optional,
          but you can link to up to three of them here (and add more to the generated metadata if you want to).
          Please paste URLs to screenshots in the format of PNG, JPEG or WebP. You can find more information on how to create good screenshots
          for your application in
          <a href="https://www.freedesktop.org/software/appstream/docs/chap-Quickstart.html#qsr-app-screenshots-info" target="_blank">the AppStream quickstart manual</a>.
        </p>
        <div class="field">
            <label class="label">Primary Screenshot Image</label>
            <div class="control has-icons-left">
                <input class="input" v-model="f.primaryScreenshot.value" @blur="f.primaryScreenshot.touch" type="text" placeholder="URL of the primary screenshot image.">
                <span class="icon is-small is-left">
                    <i class="fas fa-link"></i>
                </span>
            </div>

            <div v-if="f.primaryScreenshot.showErrors">
                <p v-if="f.primaryScreenshot.errors.invalidUrl" class="help is-danger">This URL is not accepted</p>
            </div>
        </div>

        <div class="field">
            <label class="label">Additional Screenshot Image 1</label>
            <div class="control has-icons-left">
                <input class="input" v-model="f.extraScreenshot1.value" @blur="f.extraScreenshot1.touch" type="text" placeholder="URL of an additional screenshot image.">
                <span class="icon is-small is-left">
                    <i class="fas fa-link"></i>
                </span>
            </div>

            <div v-if="f.extraScreenshot1.showErrors">
                <p v-if="f.extraScreenshot1.errors.invalidUrl" class="help is-danger">This URL is not accepted</p>
            </div>
        </div>
        <div class="field">
            <label class="label">Additional Screenshot Image 2</label>
            <div class="control has-icons-left">
                <input class="input" v-model="f.extraScreenshot2.value" @blur="f.extraScreenshot2.touch" type="text" placeholder="URL of an additional screenshot image.">
                <span class="icon is-small is-left">
                    <i class="fas fa-link"></i>
                </span>
            </div>

            <div v-if="f.extraScreenshot2.showErrors">
                <p v-if="f.extraScreenshot2.errors.invalidUrl" class="help is-danger">This URL is not accepted</p>
            </div>
        </div>

    </div>
</div>


<div class="card">
    <header class="card-header">
      <p class="card-header-title">
        Launchables
      </p>
    </header>
    <div class="card-content content">

        <p>
          In order to launch your application from a menu or a software center, you will need a
          <a href="https://specifications.freedesktop.org/desktop-entry-spec/latest/" target="_blank">desktop-entry</a> file. You can either
          set the name of a file you already have, have this tool generate one for you, or generate the file from your metainfo file
          when your application is compiled. For the latter case, this tool can also produce instructions.
        </p>

        <div class="field ">
            <div class="control">
                <label class="radio">
                <input type="radio" value="provided" v-model="f.rbLaunchableMode.value">
                I already have a .desktop file
                </label>
                <label class="radio">
                <input type="radio" value="generate" v-model="f.rbLaunchableMode.value">
                Generate a .desktop file for me
                </label>
                <label class="radio">
                <input type="radio" value="generate-from-mi" v-model="f.rbLaunchableMode.value">
                Create instructions to autogenerate a .desktop file from my metainfo file
                </label>
            </div>
        </div>

        <div v-if="values.rbLaunchableMode === 'provided'" class="field">
            <label class="label">Name of your .desktop file</label>
            <div class="control has-icons-left">
                <input class="input" v-model="f.desktopEntryName.value" @blur="f.desktopEntryName.touch" type="text" placeholder="myapplication.desktop">
                <span class="icon is-small is-left">
                    <i class="far fa-file"></i>
                </span>
            </div>

            <div v-if="f.desktopEntryName.showErrors">
                <p v-if="f.desktopEntryName.errors.required" class="help is-danger">A desktop-entry filename is required</p>
                <p v-if="f.desktopEntryName.errors.invalidName" class="help is-danger">This is not a valid .desktop filename</p>
            </div>
        </div>

    </div>
</div>


<div class="card" v-if="createDesktopData">
    <header class="card-header">
      <p class="card-header-title">
        Categorization
      </p>
    </header>
    <div class="card-content content">
        <p>
          Your software will appear in at least two categories in software center searches and menus of some desktop environments, one
          primary broad category, and one secondary more specific category.
          You can add more secondary categories to your metadata later, if you like to and think your application fits into more categories.
        </p>
        <div class="field is-grouped">

            <div class="control">
              <label class="label">Primary Category</label>
              <div class="select">
                <select v-model="f.primaryCategory.value" @blur="f.primaryCategory.touch">
                    <option value="">Choose a category</option>
                    <option v-for="cat of categoriesPrimary" :key="cat.name" :value="cat.name">{{ cat.desc }} [{{ cat.name }}]</option>
                </select>
              </div>
              <p v-if="f.primaryCategory.showErrors" class="help is-danger">A primary category must be selected</p>
            </div>

            <div class="control">
              <label class="label">Secondary Category</label>
              <div class="select">
                <select v-model="f.secondaryCategory.value" @blur="f.secondaryCategory.touch">
                    <option value="">Choose an additional category</option>
                    <option v-for="cat of categoriesSecondaryFiltered" :key="cat.name" :value="cat.name">{{ cat.desc }} [{{ cat.name }}]</option>
                </select>
              </div>
              <p v-if="f.secondaryCategory.showErrors" class="help is-danger">A secondary category must be selected</p>
            </div>

        </div>
    </div>
</div>


<div class="card" v-if="createDesktopData">
    <header class="card-header">
      <p class="card-header-title">
        Launchable Details
      </p>
    </header>
    <div class="card-content content">

        <div class="field">
            <label class="label">Icon Name</label>
            <div class="control has-icons-left">
                <input class="input" v-model="f.appIcon.value" @blur="f.appIcon.touch" type="text" placeholder="Stock icon name without file extension">
                <span class="icon is-small is-left">
                    <i class="fas fa-icons"></i>
                </span>
            </div>
            <p class="help">
              Please enter the name of your icon (usually installed into <code>/usr/share/icons/hicolor/&lt;size&gt;/apps/</code>) without its
              .png or .svg(z) file extension.
            </p>

            <div v-if="f.appIcon.showErrors">
                <p v-if="f.appIcon.errors.required" class="help is-danger">An icon name is required</p>
                <p v-if="f.appIcon.errors.invalidName" class="help is-danger">This is not a valid icon name</p>
            </div>
        </div>

        <div class="field">
            <label class="label">Executable Name</label>
            <div class="control has-icons-left">
                <input class="input" v-model="f.exeName.value" @blur="f.exeName.touch" type="text" placeholder="Executable (command) binary name">
                <span class="icon is-small is-left">
                    <i class="fas fa-terminal"></i>
                </span>
            </div>
            <p class="help">
              Please enter the name of the binary to run your application (as installed in <code>$PATH</code>). Do not use absolute paths!
            </p>

            <div v-if="f.exeName.showErrors">
                <p v-if="f.exeName.errors.required" class="help is-danger">An executable name is required</p>
                <p v-if="f.exeName.errors.invalidName" class="help is-danger">This is not a valid executable name</p>
            </div>
        </div>

    </div>
</div>


<div class="card">
    <header class="card-header">
      <p class="card-header-title">
        User Input
      </p>
    </header>
    <div class="card-content">

        <div class="content">
            <label class="label">Input Control Methods</label>

            <p>Select how users can interact with your application.</p>

            <div class="field">
            <div class="control">
                <label class="checkbox">
                <!-- Mouse & keyboard is implied unless another input method is selected,
                     in which case Angular force-checked and disabled this box. -->
                <input type="checkbox" v-model="f.cbInputMouseKeys.value" :disabled="mouseKeysLocked">
                Users use this application via mouse &amp; keyboard
                </label>
            </div>
            </div>

            <div class="field">
            <div class="control">
                <label class="checkbox">
                <input type="checkbox" v-model="f.cbInputTouch.value">
                The application is usable on touch devices via touch input
                </label>
            </div>
            </div>

            <div class="field">
            <div class="control">
                <label class="checkbox">
                <input type="checkbox" v-model="f.cbInputGamepad.value">
                This application supports gamepads
                </label>
            </div>
            </div>

            <div class="field">
            <div class="control">
                <label class="checkbox">
                <input type="checkbox" v-model="f.cbInputTablet.value">
                This application supports graphics tablets
                </label>
            </div>
            </div>
        </div>

        <div class="content">
            <label class="label">Minimum Surface Size</label>
            <div class="field ">
                <div class="control">
                    <label class="checkbox">
                    <input type="checkbox" v-model="f.cbMinSurfaceSize.value">
                    My application has a minimum recommended surface size
                    </label>
                </div>
            </div>

            <div v-if="values.cbMinSurfaceSize === true" class="column is-two-fifths" style="padding: 0 !important;">
                <div class="field has-addons">
                    <div class="control is-expanded">
                    <!-- .number matches Angular's number value accessor, which handed
                         makeMetainfoGuiApp a number rather than a string. -->
                    <input v-model.number="f.minSurfaceSize.value" @blur="f.minSurfaceSize.touch" class="input" type="number" inputmode="numeric"
                            placeholder="Minium surface length in logical pixels">
                    </div>
                    <p class="control">
                    <a class="button is-static">
                        dp | px
                    </a>
                    </p>
                </div>
                <div v-if="f.minSurfaceSize.showErrors" class="help">
                    <p v-if="f.minSurfaceSize.errors.min" class="help is-danger">The pixel size is too small</p>
                    <p v-if="f.minSurfaceSize.errors.max" class="help is-danger">The pixel size is unreasonably large</p>
                    <p v-if="f.minSurfaceSize.errors.pattern" class="help is-danger">Only positive numbers are allowed</p>
                </div>

                <p>Set the minimum longest size of the display that can display your application correctly (as the screen
                may be able to be rotated to fit your application). This value will be checked for compatibility with the
                target system before the application is installed.</p>
                <p>The minimum surface size needs to be in logical pixels (also called device-independent pixels). refer to your
                GUI toolkit for more information on this topic, or take a look at the
                <a href="https://www.freedesktop.org/software/appstream/docs/chap-Metadata.html#tag-relations-display_length" target="_blank">
                AppStream specification on display_length</a>.</p>
            </div>


        </div>

    </div>
</div>


<div class="card">
    <header class="card-header">
      <p class="card-header-title">
        Additional Options
      </p>
    </header>
    <div class="card-content content">

        <div class="field">
        <div class="control">
            <label class="checkbox">
            <input type="checkbox" v-model="f.cbMesonSnippets.value">
              Generate <a href="https://mesonbuild.com/">Meson</a> sample snippets for metadata maintenance
            </label>
        </div>
        </div>

    </div>
</div>

<div class="card">
    <header class="card-header">
      <p class="card-header-title">
        Finish
      </p>
    </header>
    <div class="card-content content">

        <div class="field is-grouped">
            <div class="control">
                <a class="button is-link" tabindex="0" @click="generate()">Generate Metadata</a>
            </div>
        </div>

    </div>
</div>

</form>

<br/>
<!-- Output area -->


<div v-if="form.error.value" class="notification is-danger">
  <p><strong>Unable to generate metadata:</strong></p>
  <p>{{ form.error.value }}</p>
</div>


<article class="panel is-success" v-if="dataGenerated">
  <p class="panel-heading">
    Result
  </p>

  <!-- MetaInfo data -->
  <div class="panel-block">
  <div class="column is-full">
      <h2 class="title is-2">MetaInfo File</h2>
      <p>Install this file as as <code>/usr/share/metainfo/{{ finalCptId }}.metainfo.xml</code></p>
      <p>You can validate this metadata locally by running: <code>appstreamcli validate {{ finalCptId }}.metainfo.xml</code></p>
      <div class="box pl-1 pb-1">
          <button style="float: right;" class="button is-info is-light is-rounded"
                  @click="copyText(dataMetainfo)">Copy</button>
          <pre style="padding: 0 !important;"><code v-highlight="{ code: dataMetainfo, lang: 'xml' }"></code></pre>
      </div>

      <div v-if="dataMesonValidate" style="margin-top: 1em;">
        <h3 class="subtitle is-3">Meson Validation Testcase</h3>
        <p>
          Adjust the data location in <code>metainfo_file</code> and add this snippet to your Meson build definition in order to
          validate the MetaInfo file as part of the project's tests.
        </p>
        <div class="box pl-1 pb-1">
            <button style="float: right;" class="button is-info is-light is-rounded"
                    @click="copyText(dataMesonValidate)">Copy</button>
            <pre style="padding: 0 !important;"><code v-highlight="{ code: dataMesonValidate, lang: 'meson' }"></code></pre>
        </div>
      </div>
  </div>
  </div>

  <!-- Info how a desktop-entry file could be autogenerated -->
  <div class="panel-block" v-if="values.rbLaunchableMode === 'generate-from-mi'">
  <div class="column is-full">
      <h2 class="title is-2">Autogenerate Desktop Entry file from MetaInfo</h2>
      <p>
        The MetaInfo file above contains all essential information to generate a .desktop file from, so the application can be launched.
        The process of generating the desktop-entry file can be automated. You just need to run
        <code>appstreamcli make-desktop-file {{ finalCptId }}.metainfo.xml {{ finalCptId }}.desktop</code> during the build process of your
        application.
      </p>

      <div v-if="dataMesonMItoDE">
        <h3 class="subtitle is-3">Meson Snippet</h3>
        <p>
          This code fragment for the Meson build system can be used to perform the desktop-entry conversion automatically
          when the software is installed:
        </p>
        <div class="box pl-1 pb-1">
            <button style="float: right;" class="button is-info is-light is-rounded"
                    @click="copyText(dataMesonMItoDE)">Copy</button>
            <pre style="padding: 0 !important;"><code v-highlight="{ code: dataMesonMItoDE, lang: 'meson' }"></code></pre>
        </div>
      </div>
  </div>
  </div>

  <!-- Desktop Entry data, in case we generated some -->
  <div class="panel-block" v-if="dataDesktopEntry">
  <div class="column is-full">
      <h2 class="title is-2">Desktop Entry File</h2>
      <p>Install this file as as <code>/usr/share/applications/{{ finalCptId }}.desktop</code></p>
      <p>You can validate this metadata locally by running: <code>desktop-file-validate {{ finalCptId }}.desktop</code></p>
      <div class="box pl-1 pb-1">
            <button style="float: right;" class="button is-info is-light is-rounded"
                    @click="copyText(dataDesktopEntry)">Copy</button>
            <pre style="padding: 0 !important;"><code v-highlight="{ code: dataDesktopEntry, lang: 'toml' }"></code></pre>
        </div>
  </div>
  </div>

  <!-- Localization info -->
  <div class="panel-block">
  <div class="column is-full">
      <h2 class="title is-2">MetaInfo Localization</h2>
      <p>
        AppStream MetaInfo files are recognized by <code>xgettext</code>, so you just need to add <code>{{ finalCptId }}</code> to your
        <code>POTFILES.in</code> to generate templates for all translatable elements in the file. When building the software, you can
        then instruct your build system to merge in the translations into the new file before installing the translated file as
        <code>/usr/share/metainfo/{{ finalCptId }}.metainfo.xml</code>.
      </p>

      <div v-if="dataMesonL10N">
        <h3 class="subtitle is-3">Meson Snippet</h3>
        <p>
          This code fragment for the Meson build system can be used to perform the merge-and-install step, when templates
          were already generated in a previous step.
        </p>
        <div class="box pl-1 pb-1">
            <button style="float: right;" class="button is-info is-light is-rounded"
                    @click="copyText(dataMesonL10N)">Copy</button>
            <pre style="padding: 0 !important;"><code v-highlight="{ code: dataMesonL10N, lang: 'meson' }"></code></pre>
        </div>
      </div>
  </div>
  </div>

</article>

</div> <!-- End of content -->

</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { RouterLink } from 'vue-router';

import { useForm } from '../forms/useForm';
import { required, minLength, min, max, pattern, componentId, url,
         desktopEntry, noPathOrSpace } from '../forms/validators';
import { guessComponentId, arrayAddIfNotEmpty, filterCategoriesByPrimary,
         type LicenseInfo, type PrimaryCategory, type SecondaryCategory } from '../lib/utils';
import { loadAsset } from '../lib/loadasset';
import { copyText } from '../lib/clipboard';
import { makeMetainfoGuiApp, type ASBasicInfo, GUIAppInfo } from '../lib/makemetainfo';
import { makeMesonValidateSnippet, makeMesonMItoDESnippet,
         makeMesonL10NSnippet } from '../lib/makemeson';
import { makeDesktopEntryData } from '../lib/makeauxdata';

const metadataLicenses = ref<LicenseInfo[]>([]);
const spdxLicenses = ref<LicenseInfo[]>([]);
const categoriesPrimary = ref<PrimaryCategory[]>([]);
const categoriesSecondaryAll = ref<SecondaryCategory[]>([]);
const categoriesSecondaryFiltered = ref<SecondaryCategory[]>([]);

const finalCptId = ref('');
const dataGenerated = ref(false);
const dataMetainfo = ref('');
const dataDesktopEntry = ref('');
const dataMesonValidate = ref('');
const dataMesonL10N = ref('');
const dataMesonMItoDE = ref('');

const form = useForm({
    appName:        { initial: '', label: 'application name', validators: [required()] },
    appSummary:     { initial: '', label: 'application summary', validators: [required()] },
    appHomepage:    { initial: '', label: 'homepage', validators: [required(), url()] },
    appDescription: { initial: '', label: 'long description', validators: [required()] },
    cptId:          { initial: '', label: 'component ID',
                      validators: [required(), minLength(4), componentId()] },

    metadataLicense:       { initial: '', label: 'metadata license', validators: [required()] },
    rbLicenseMode:         { initial: 'simple' },
    simpleProjectLicense:  { initial: '', active: () => !spdxMode.value },
    complexProjectLicense: { initial: '', active: () => spdxMode.value },

    primaryScreenshot: { initial: '', label: 'primary screenshot', validators: [url()], allowEmpty: true },
    extraScreenshot1:  { initial: '', label: 'additional screenshot 1', validators: [url()], allowEmpty: true },
    extraScreenshot2:  { initial: '', label: 'additional screenshot 2', validators: [url()], allowEmpty: true },

    rbLaunchableMode: { initial: 'provided' },
    // Either a desktop-entry filename is supplied, or the data needed to build
    // one is - the two sets are never required at the same time.
    desktopEntryName: { initial: '', label: 'desktop-entry filename',
                        validators: [required(), desktopEntry()],
                        active: () => !createDesktopData.value },

    primaryCategory:   { initial: '', label: 'primary application category',
                         validators: [required()], active: () => createDesktopData.value },
    secondaryCategory: { initial: '', label: 'secondary application category',
                         validators: [required()], active: () => createDesktopData.value },

    appIcon: { initial: '', label: 'application icon',
               validators: [required(), noPathOrSpace()], active: () => createDesktopData.value },
    exeName: { initial: '', label: 'executable name',
               validators: [required(), noPathOrSpace()], active: () => createDesktopData.value },

    cbInputMouseKeys: { initial: true },
    cbInputTouch:     { initial: false },
    cbInputGamepad:   { initial: false },
    cbInputTablet:    { initial: false },

    cbMinSurfaceSize: { initial: false },
    minSurfaceSize:   { initial: '', label: 'minimum surface size',
                        validators: [min(10), max(8192), pattern(/^[0-9]*$/)],
                        active: () => values.cbMinSurfaceSize === true },

    cbMesonSnippets: { initial: false },
});
const { f, values, validateField } = form;

const spdxMode = computed(() => values.rbLicenseMode === 'spdx');

// If no desktop-entry filename is provided we have to collect enough data to
// build one ourselves.
const createDesktopData = computed(() => values.rbLaunchableMode !== 'provided');

// Mouse & keyboard is the implied default; it is only unlocked once some other
// input method is selected.
const mouseKeysLocked = computed(() =>
    !values.cbInputTouch && !values.cbInputGamepad && !values.cbInputTablet);

onMounted(async () => {
    metadataLicenses.value = await loadAsset<LicenseInfo[]>('metadata-licenses.json');
    spdxLicenses.value = await loadAsset<LicenseInfo[]>('spdx-licenses.json');
    categoriesPrimary.value = await loadAsset<PrimaryCategory[]>('categories-primary.json');
    categoriesSecondaryAll.value = await loadAsset<SecondaryCategory[]>('categories-secondary.json');
});

/* Guess the component-ID and icon name until the user edits them by hand; see useForm. */
watch(() => [values.appName, values.appHomepage], () => {
    if (!f.cptId.dirty)
        form.setValue('cptId', guessComponentId(values.appHomepage, values.appName));
});

watch(() => values.appName, (name) => {
    if (!f.appIcon.dirty)
        form.setValue('appIcon', name.replace(/ /g, '').trim().toLowerCase());
});

watch(() => values.primaryCategory, (primary) => {
    form.setValue('secondaryCategory', '');
    categoriesSecondaryFiltered.value = filterCategoriesByPrimary(categoriesSecondaryAll.value, primary);
});

watch(mouseKeysLocked, (locked) => {
    if (locked)
        form.setValue('cbInputMouseKeys', true);
}, { immediate: true });

function resetGeneratedData() {
    dataGenerated.value = false;
    dataMetainfo.value = '';
    dataDesktopEntry.value = '';

    dataMesonValidate.value = '';
    dataMesonL10N.value = '';
    dataMesonMItoDE.value = '';
}

function generate() {
    resetGeneratedData();

    if (!validateField(f.appName))
        return;
    if (!validateField(f.appSummary))
        return;
    if (!validateField(f.appHomepage))
        return;
    if (!validateField(f.appDescription))
        return;
    if (!validateField(f.cptId))
        return;
    if (!validateField(f.metadataLicense))
        return;

    const pLicense = (spdxMode.value ? values.complexProjectLicense : values.simpleProjectLicense).trim();
    if (!pLicense) {
        form.fail('No project license has been selected.');
        return;
    }

    if (!validateField(f.primaryScreenshot))
        return;
    if (!validateField(f.extraScreenshot1))
        return;
    if (!validateField(f.extraScreenshot2))
        return;

    const appInfo = new GUIAppInfo();

    const launchableMode = values.rbLaunchableMode;
    if (launchableMode === 'provided') {
        if (!validateField(f.desktopEntryName))
            return;
        appInfo.desktopEntryName = values.desktopEntryName;
    } else {
        // no desktop-entry filename was provided, so we need to check if a bunch more
        // data is present to build one

        if (!validateField(f.primaryCategory))
            return;
        if (!validateField(f.secondaryCategory))
            return;
        if (!validateField(f.appIcon))
            return;
        if (!validateField(f.exeName))
            return;

        appInfo.categories = [values.primaryCategory, values.secondaryCategory];
        appInfo.iconName = values.appIcon;
        appInfo.binary = values.exeName;
    }

    // input controls
    appInfo.inputPointKeyboard = values.cbInputMouseKeys;
    appInfo.inputTouch = values.cbInputTouch;
    appInfo.inputGamepad = values.cbInputGamepad;
    appInfo.inputTablet = values.cbInputTablet;

    // surface size
    if (values.cbMinSurfaceSize) {
        if (!validateField(f.minSurfaceSize))
            return;
        appInfo.minDisplaySize = values.minSurfaceSize;
    }

    // all validity checks have passed at this point
    form.error.value = null;
    finalCptId.value = values.cptId;

    const baseInfo: ASBasicInfo = {
        cid: values.cptId,
        name: values.appName,
        summary: values.appSummary,
        metadataLicense: values.metadataLicense,
        projectLicense: pLicense,
        description: values.appDescription,
        homepage: values.appHomepage,
    };

    arrayAddIfNotEmpty(appInfo.scrImages, values.primaryScreenshot);
    arrayAddIfNotEmpty(appInfo.scrImages, values.extraScreenshot1);
    arrayAddIfNotEmpty(appInfo.scrImages, values.extraScreenshot2);

    const miSelfContained: boolean = (launchableMode === 'generate-from-mi');
    if (launchableMode === 'generate')
        dataDesktopEntry.value = makeDesktopEntryData(baseInfo, appInfo);

    dataGenerated.value = true;
    dataMetainfo.value = makeMetainfoGuiApp(baseInfo, appInfo, miSelfContained);

    // generate new meson snippets
    if (values.cbMesonSnippets) {
        dataMesonValidate.value = makeMesonValidateSnippet(baseInfo);
        dataMesonL10N.value = makeMesonL10NSnippet(baseInfo);
        if (launchableMode === 'generate-from-mi')
            dataMesonMItoDE.value = makeMesonMItoDESnippet(baseInfo);
    }
}
</script>
