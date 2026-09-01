<template>

<nav class="breadcrumb" aria-label="breadcrumbs">
  <ul>
    <li><RouterLink to="/">Home</RouterLink></li>
    <li class="is-active"><a href="#" aria-current="page">Console App Metadata</a></li>
  </ul>
</nav>

<div class="content">
<h1 class="title">
  Create metadata for console applications
</h1>

<p>
  Console application are any application that have a command-line or text-based interface and are designed to be used by a human user in a console.
  Their binaries need to be present in <code>PATH</code>.
</p>
<p>
  The console mode needs to be the primary way of using your application, if the application has a GUI and an optional text mode as well, please create
  a GUI application MetaInfo file for it instead (the CLI can be advertised by adding a <code>provides ⮡ binary</code> entry).
  Examples of console applications are for example <code>ffmpeg</code>, <code>vi</code>, <code>flatpak</code> and of course
  <code>appstreamcli</code> itself.
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
                   placeholder="Long description of this software."
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
               :simple="f.simpleProjectLicense" :complex="f.complexProjectLicense" />


<CategoryCard :primary="f.primaryCategory" :secondary="f.secondaryCategory" secondary-required>
    Your software will appear in at least two categories in software center searches, one primary broad category, and one secondary
    more specific one.
    You can add more secondary categories to your metadata later, if you think your console application fits into even more categories.
</CategoryCard>


<div class="card">
    <header class="card-header">
      <p class="card-header-title">
        Details
      </p>
    </header>
    <div class="card-content content">

        <TextField :field="f.appIcon" label="Icon Name"
                   placeholder="Stock icon name without file extension"
                   icon="fas fa-icons"
                   :messages="{ required: 'An icon name is required', invalidName: 'This is not a valid icon name' }">
            <template #help>
              Please enter the name of your icon (usually installed into <code>/usr/share/icons/hicolor/&lt;size&gt;/apps/</code>) without its
              .png or .svg(z) file extension.<br/>
              This is currently exclusively used to show your application in software centers, and may simply be the project's logo. You may enter
              <code>utilities-terminal</code> here if you have no icon on your own and want a generic placeholder.
            </template>
        </TextField>

        <TextField :field="f.exeName" label="Executable Name"
                   placeholder="Executable (command) binary name"
                   icon="fas fa-terminal"
                   :messages="{ required: 'An executable name is required', invalidName: 'This is not a valid executable name' }">
            <template #help>
              Please enter the name of the binary to run your application (as installed in the systems's standard <code>$PATH</code>).
              Do not use an absolute path!
            </template>
        </TextField>

    </div>
</div>


<MesonOptionCard :field="f.cbMesonSnippets" />

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

</article>

<ValidationToolsPanel v-if="dataGenerated" />

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
import ValidationToolsPanel from '../components/ValidationToolsPanel.vue';

import { useForm } from '../forms/useForm';
import { required, minLength, componentId, url, noPathOrSpace } from '../forms/validators';
import { guessComponentId } from '../lib/utils';
import { makeMetainfoConsoleApp, type ASBasicInfo, ConsoleAppInfo } from '../lib/makemetainfo';
import { makeMesonValidateSnippet } from '../lib/makemeson';

const finalCptId = ref('');
const dataGenerated = ref(false);
const dataMetainfo = ref('');
const dataMesonValidate = ref('');

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

    primaryCategory:   { initial: '', label: 'primary application category', validators: [required()] },
    secondaryCategory: { initial: '', label: 'secondary application category', validators: [required()] },

    appIcon: { initial: '', label: 'application icon', validators: [required(), noPathOrSpace()] },
    exeName: { initial: '', label: 'executable name', validators: [required(), noPathOrSpace()] },

    cbMesonSnippets: { initial: false },
});
const { f, values, validateField } = form;

const spdxMode = computed(() => values.rbLicenseMode === 'spdx');

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

function resetGeneratedData() {
    dataGenerated.value = false;
    dataMetainfo.value = '';
    dataMesonValidate.value = '';
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

    if (!validateField(f.primaryCategory))
        return;
    if (!validateField(f.secondaryCategory))
        return;
    if (!validateField(f.appIcon))
        return;
    if (!validateField(f.exeName))
        return;

    const appInfo = new ConsoleAppInfo();
    appInfo.categories = [values.primaryCategory, values.secondaryCategory];
    appInfo.iconName = values.appIcon;
    appInfo.binary = values.exeName;

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

    dataGenerated.value = true;
    dataMetainfo.value = makeMetainfoConsoleApp(baseInfo, appInfo);

    // generate new meson snippets
    if (values.cbMesonSnippets)
        dataMesonValidate.value = makeMesonValidateSnippet(baseInfo);
}
</script>
