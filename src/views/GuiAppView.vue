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

        <TextField :field="f.appName" label="Name of the application"
                   placeholder="The human-readable name of your application"
                   message="A name is required" />

        <TextField :field="f.appSummary" label="Summary of the application"
                   placeholder="A short text summarizing what the application does"
                   message="A summary is required" />

        <TextField :field="f.appHomepage" label="Homepage of the application"
                   placeholder="The website where this application is hosted."
                   icon="fas fa-link"
                   :messages="{ required: 'A project homepage is required', invalidUrl: 'This URL is not accepted' }" />

        <TextField :field="f.appDescription" label="Description" multiline
                   placeholder="Long description of this software. You can use Mardown in-line `code`, paragraph and *emphasis* markup."
                   message="A long description is required" />

        <TextField :field="f.cptId" label="Unique Software Identifier"
                   placeholder="Reverse-DNS string uniquely identifying your application."
                   icon="fas fa-fingerprint"
                   :messages="{
                       required: 'A component-ID is required',
                       minlength: 'A component-ID is too short',
                       forbiddenId: `This ID is not valid: ${f.cptId.errors.forbiddenId?.value ?? ''}`,
                   }">
            <template #help>A rDNS-style string uniquely identifying your application. Must contain only ASCII characters, dots and numbers.</template>
        </TextField>

    </div>
</div>


<LicensingCard :metadata-license="f.metadataLicense" :mode="f.rbLicenseMode"
               :simple="f.simpleProjectLicense" :complex="f.complexProjectLicense" linked-assets />


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

        <TextField :field="f.primaryScreenshot" label="Primary Screenshot Image"
                   placeholder="URL of the primary screenshot image."
                   icon="fas fa-link"
                   :messages="{ invalidUrl: 'This URL is not accepted' }" />

        <TextField :field="f.extraScreenshot1" label="Additional Screenshot Image 1"
                   placeholder="URL of an additional screenshot image."
                   icon="fas fa-link"
                   :messages="{ invalidUrl: 'This URL is not accepted' }" />

        <TextField :field="f.extraScreenshot2" label="Additional Screenshot Image 2"
                   placeholder="URL of an additional screenshot image."
                   icon="fas fa-link"
                   :messages="{ invalidUrl: 'This URL is not accepted' }" />

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

        <TextField v-if="!createDesktopData" :field="f.desktopEntryName"
                   label="Name of your .desktop file"
                   placeholder="myapplication.desktop"
                   icon="far fa-file"
                   :messages="{
                       required: 'A desktop-entry filename is required',
                       invalidName: 'This is not a valid .desktop filename',
                   }" />

    </div>
</div>


<CategoryCard v-if="createDesktopData" :primary="f.primaryCategory" :secondary="f.secondaryCategory" secondary-required>
    Your software will appear in at least two categories in software center searches and menus of some desktop environments, one
    primary broad category, and one secondary more specific category.
    You can add more secondary categories to your metadata later, if you like to and think your application fits into more categories.
</CategoryCard>


<div class="card" v-if="createDesktopData">
    <header class="card-header">
      <p class="card-header-title">
        Launchable Details
      </p>
    </header>
    <div class="card-content content">

        <TextField :field="f.appIcon" label="Icon Name"
                   placeholder="Stock icon name without file extension"
                   icon="fas fa-icons"
                   :messages="{ required: 'An icon name is required', invalidName: 'This is not a valid icon name' }">
            <template #help>
              Please enter the name of your icon (usually installed into <code>/usr/share/icons/hicolor/&lt;size&gt;/apps/</code>) without its
              .png or .svg(z) file extension.
            </template>
        </TextField>

        <TextField :field="f.exeName" label="Executable Name"
                   placeholder="Executable (command) binary name"
                   icon="fas fa-terminal"
                   :messages="{ required: 'An executable name is required', invalidName: 'This is not a valid executable name' }">
            <template #help>
              Please enter the name of the binary to run your application (as installed in <code>$PATH</code>). Do not use absolute paths!
            </template>
        </TextField>

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
                <!-- Mouse and keyboard is implied while nothing else is selected,
                     so the box is held checked until another method is ticked. -->
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
                    <!-- .number so the generator receives a number rather than a string -->
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


<MesonOptionCard :field="f.cbMesonSnippets" plural />

<GenerateCard @generate="generate" />

</form>

<br/>
<!-- Output area -->

<ErrorNotice :message="form.error.value" />

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
      <CodeBlock :code="dataMetainfo" lang="xml" />

      <div v-if="dataMesonValidate" style="margin-top: 1em;">
        <h3 class="subtitle is-3">Meson Validation Testcase</h3>
        <p>
          Adjust the data location in <code>metainfo_file</code> and add this snippet to your Meson build definition in order to
          validate the MetaInfo file as part of the project's tests.
        </p>
        <CodeBlock :code="dataMesonValidate" lang="meson" />
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
        <CodeBlock :code="dataMesonMItoDE" lang="meson" />
      </div>
  </div>
  </div>

  <!-- Desktop Entry data, in case we generated some -->
  <div class="panel-block" v-if="dataDesktopEntry">
  <div class="column is-full">
      <h2 class="title is-2">Desktop Entry File</h2>
      <p>Install this file as as <code>/usr/share/applications/{{ finalCptId }}.desktop</code></p>
      <p>You can validate this metadata locally by running: <code>desktop-file-validate {{ finalCptId }}.desktop</code></p>
      <CodeBlock :code="dataDesktopEntry" lang="toml" />
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
        <CodeBlock :code="dataMesonL10N" lang="meson" />
      </div>
  </div>
  </div>

</article>

</div> <!-- End of content -->

</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { RouterLink } from 'vue-router';

import TextField from '../components/TextField.vue';
import LicensingCard from '../components/LicensingCard.vue';
import CategoryCard from '../components/CategoryCard.vue';
import MesonOptionCard from '../components/MesonOptionCard.vue';
import GenerateCard from '../components/GenerateCard.vue';
import ErrorNotice from '../components/ErrorNotice.vue';
import CodeBlock from '../components/CodeBlock.vue';

import { useForm } from '../forms/useForm';
import { required, minLength, min, max, pattern, componentId, url,
         desktopEntry, noPathOrSpace } from '../forms/validators';
import { guessComponentId, arrayAddIfNotEmpty } from '../lib/utils';
import { makeMetainfoGuiApp, type ASBasicInfo, GUIAppInfo } from '../lib/makemetainfo';
import { makeMesonValidateSnippet, makeMesonMItoDESnippet,
         makeMesonL10NSnippet } from '../lib/makemeson';
import { makeDesktopEntryData } from '../lib/makeauxdata';

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
    simpleProjectLicense:  { initial: '', active: (v) => v.rbLicenseMode !== 'spdx' },
    complexProjectLicense: { initial: '', active: (v) => v.rbLicenseMode === 'spdx' },

    primaryScreenshot: { initial: '', label: 'primary screenshot', validators: [url()], allowEmpty: true },
    extraScreenshot1:  { initial: '', label: 'additional screenshot 1', validators: [url()], allowEmpty: true },
    extraScreenshot2:  { initial: '', label: 'additional screenshot 2', validators: [url()], allowEmpty: true },

    rbLaunchableMode: { initial: 'provided' },
    // Either the user names an existing desktop-entry file, or they supply the
    // pieces needed to build one - never both.
    desktopEntryName: { initial: '', label: 'desktop-entry filename',
                        validators: [required(), desktopEntry()],
                        active: (v) => v.rbLaunchableMode === 'provided' },

    primaryCategory:   { initial: '', label: 'primary application category',
                         validators: [required()], active: (v) => v.rbLaunchableMode !== 'provided' },
    secondaryCategory: { initial: '', label: 'secondary application category',
                         validators: [required()], active: (v) => v.rbLaunchableMode !== 'provided' },

    appIcon: { initial: '', label: 'application icon',
               validators: [required(), noPathOrSpace()], active: (v) => v.rbLaunchableMode !== 'provided' },
    exeName: { initial: '', label: 'executable name',
               validators: [required(), noPathOrSpace()], active: (v) => v.rbLaunchableMode !== 'provided' },

    cbInputMouseKeys: { initial: true },
    cbInputTouch:     { initial: false },
    cbInputGamepad:   { initial: false },
    cbInputTablet:    { initial: false },

    cbMinSurfaceSize: { initial: false },
    // v-model.number turns this into a number as soon as the box holds one,
    // and leaves the empty string behind when it is cleared again.
    minSurfaceSize:   { initial: '' as string | number, label: 'minimum surface size',
                        validators: [min(10), max(8192), pattern(/^[0-9]*$/)],
                        active: (v) => v.cbMinSurfaceSize === true },

    cbMesonSnippets: { initial: false },
});
const { f, values, validateField } = form;

const spdxMode = computed(() => values.rbLicenseMode === 'spdx');

// Without an existing desktop-entry file we have to collect enough information
// to build one.
const createDesktopData = computed(() => values.rbLaunchableMode !== 'provided');

// Mouse and keyboard is the implied default; it only becomes a real choice once
// some other input method is on offer.
const mouseKeysLocked = computed(() =>
    !values.cbInputTouch && !values.cbInputGamepad && !values.cbInputTablet);

/*
 * Offer a component ID and an icon name derived from what has been entered so
 * far. Both stop for good once the user edits that field themselves - see the
 * two ways of writing a field value in useForm.
 */
watch(() => [values.appName, values.appHomepage], () => {
    if (!f.cptId.dirty)
        f.cptId.set(guessComponentId(values.appHomepage, values.appName));
});

watch(() => values.appName, (name) => {
    if (!f.appIcon.dirty)
        f.appIcon.set(name.replace(/ /g, '').trim().toLowerCase());
});

watch(mouseKeysLocked, (locked) => {
    if (locked)
        f.cbInputMouseKeys.set(true);
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
        appInfo.minDisplaySize = Number(values.minSurfaceSize);
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
