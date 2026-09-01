<template>

<nav class="breadcrumb" aria-label="breadcrumbs">
  <ul>
    <li><RouterLink to="/">Home</RouterLink></li>
    <li class="is-active"><a href="#" aria-current="page">Addon Metadata</a></li>
  </ul>
</nav>

<div class="content">
<h1 class="title">
  Create metadata for addons
</h1>

<p>
  Addons are software components that are not standalone applications but intended to be used with another software component,
  usually extending the functionality of their parent application.
</p>
<p>
  They can, for example, be new themes and visual styles for a video editor, plugins to expand a text editor with a VI mode,
  web browser extensions etc.
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

        <TextField :field="f.cptName" label="Name of the addon"
                   placeholder="The human-readable name of your addon"
                   message="A name is required" />

        <TextField :field="f.cptSummary" label="Summary of the addon"
                   placeholder="A short text summarizing what the addon does"
                   message="A summary is required" />

        <TextField :field="f.cptHomepage" label="Homepage of the addon"
                   placeholder="The website where this addon is hosted."
                   icon="fas fa-link"
                   :messages="{ required: 'A project homepage is required', invalidUrl: 'This URL is not accepted' }" />

        <TextField :field="f.cptDescription" label="Description" multiline
                   placeholder="Long description of this software."
                   message="A long description is required" />

        <TextField :field="f.cptId" label="Unique Software Identifier"
                   placeholder="Reverse-DNS string uniquely identifying your addon."
                   icon="fas fa-fingerprint"
                   :messages="{
                       required: 'A component-ID is required',
                       minlength: 'A component-ID is too short',
                       forbiddenId: `This ID is not valid: ${f.cptId.errors.forbiddenId?.value ?? ''}`,
                   }">
            <template #help>A rDNS-style string uniquely identifying your addon. Must contain only ASCII characters, dots and numbers.</template>
        </TextField>

    </div>
</div>

<div class="card">
    <header class="card-header">
      <p class="card-header-title">
        Details
      </p>
    </header>
    <div class="card-content content">

        <TextField :field="f.extendsCptId" label="Component ID of the extended application"
                   placeholder="Reverse-DNS string uniquely identifying your addon."
                   icon="fas fa-fingerprint"
                   :messages="{
                       required: 'The component-ID of a parent application is required',
                       minlength: `The parent application's component-ID is too short`,
                       forbiddenId: `This ID is not valid: ${f.extendsCptId.errors.forbiddenId?.value ?? ''}`,
                   }">
            <template #help>
                The unique rDNS-style identifier of the application this addon was built for.<br/>
                An addon can extend multiple other application - please add more <code>extends</code> tags to the
                generated MetaInfo file manually, if you need this functionality.
            </template>
        </TextField>

        <TextField :field="f.cptIcon" label="Icon Name"
                   placeholder="Stock icon name without file extension"
                   icon="fas fa-icons"
                   :messages="{ invalidName: 'This is not a valid icon name' }">
            <template #help>
              Please enter the name of your icon (usually installed into <code>/usr/share/icons/hicolor/&lt;size&gt;/apps/</code>) without its
              .png or .svg(z) file extension.
              The icon name is optional for addons.
            </template>
        </TextField>

    </div>
</div>


<LicensingCard :metadata-license="f.metadataLicense" :mode="f.rbLicenseMode"
               :simple="f.simpleProjectLicense" :complex="f.complexProjectLicense" />


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
import MesonOptionCard from '../components/MesonOptionCard.vue';
import GenerateCard from '../components/GenerateCard.vue';
import ErrorNotice from '../components/ErrorNotice.vue';
import CodeBlock from '../components/CodeBlock.vue';
import ValidationToolsPanel from '../components/ValidationToolsPanel.vue';

import { useForm } from '../forms/useForm';
import { required, minLength, componentId, url, noPathOrSpace } from '../forms/validators';
import { guessComponentId } from '../lib/utils';
import { makeMetainfoAddon, type ASBasicInfo, AddonInfo } from '../lib/makemetainfo';
import { makeMesonValidateSnippet } from '../lib/makemeson';

const finalCptId = ref('');
const dataGenerated = ref(false);
const dataMetainfo = ref('');
const dataMesonValidate = ref('');

const form = useForm({
    cptName:        { initial: '', label: 'addon name', validators: [required()] },
    cptSummary:     { initial: '', label: 'addon summary', validators: [required()] },
    cptHomepage:    { initial: '', label: 'homepage', validators: [required(), url()] },
    cptDescription: { initial: '', label: 'long description', validators: [required()] },
    cptId:          { initial: '', label: 'component ID',
                      validators: [required(), minLength(4), componentId()] },
    extendsCptId:   { initial: '', label: 'extended app component ID',
                      validators: [required(), minLength(4), componentId()] },

    metadataLicense:       { initial: '', label: 'metadata license', validators: [required()] },
    rbLicenseMode:         { initial: 'simple' },
    simpleProjectLicense:  { initial: '', active: (v) => v.rbLicenseMode !== 'spdx' },
    complexProjectLicense: { initial: '', active: (v) => v.rbLicenseMode === 'spdx' },

    // The icon is optional for addons, and unlike the other component types it
    // is not derived from the name either.
    cptIcon: { initial: '', label: 'addon icon', validators: [noPathOrSpace()], allowEmpty: true },

    cbMesonSnippets: { initial: false },
});
const { f, values, validateField } = form;

const spdxMode = computed(() => values.rbLicenseMode === 'spdx');

/* Offer a component ID until the user takes the field over; see useForm. */
watch(() => [values.cptName, values.cptHomepage], () => {
    if (!f.cptId.dirty)
        f.cptId.set(guessComponentId(values.cptHomepage, values.cptName));
});

function resetGeneratedData() {
    dataGenerated.value = false;
    dataMetainfo.value = '';
    dataMesonValidate.value = '';
}

function generate() {
    resetGeneratedData();

    if (!validateField(f.cptName))
        return;
    if (!validateField(f.cptSummary))
        return;
    if (!validateField(f.cptHomepage))
        return;
    if (!validateField(f.cptDescription))
        return;
    if (!validateField(f.cptId))
        return;
    if (!validateField(f.extendsCptId))
        return;
    if (!validateField(f.metadataLicense))
        return;

    const pLicense = (spdxMode.value ? values.complexProjectLicense : values.simpleProjectLicense).trim();
    if (!pLicense) {
        form.fail('No project license has been selected.');
        return;
    }

    if (!validateField(f.cptIcon))
        return;

    const addonInfo = new AddonInfo();
    addonInfo.extends = [values.extendsCptId];
    addonInfo.iconName = values.cptIcon;

    // all validity checks have passed at this point
    form.error.value = null;
    finalCptId.value = values.cptId;

    const baseInfo: ASBasicInfo = {
        cid: values.cptId,
        name: values.cptName,
        summary: values.cptSummary,
        metadataLicense: values.metadataLicense,
        projectLicense: pLicense,
        description: values.cptDescription,
        homepage: values.cptHomepage,
    };

    dataGenerated.value = true;
    dataMetainfo.value = makeMetainfoAddon(baseInfo, addonInfo);

    // generate new meson snippets
    if (values.cbMesonSnippets)
        dataMesonValidate.value = makeMesonValidateSnippet(baseInfo);
}
</script>
