<template>

<nav class="breadcrumb" aria-label="breadcrumbs">
  <ul>
    <li><RouterLink to="/">Home</RouterLink></li>
    <li class="is-active"><a href="#" aria-current="page">Service Metadata</a></li>
  </ul>
</nav>

<div class="content">
<h1 class="title">
  Create metadata for system services
</h1>

<p>
  Services are background processes ("daemons") providing a general system ability and usually are not controlled directly by the user.
  They can for example be webservers, mailservers, webapps etc. Anything that the systemd service manager can start falls into this category.
</p>
<p>
  While the AppStream specification is not requiring the use of systemd for service management, this feature has only properly been tested with
  systemd. So, please consider adding a systemd .service file for your daemon as well if it does not already have one, or at least test if the
  service-name set in this metadata is the right one <code>systemctl</code> recognizes to launch your init script.
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

        <TextField :field="f.cptName" label="Name of the service"
                   placeholder="The human-readable name of your service"
                   message="A name is required" />

        <TextField :field="f.cptSummary" label="Summary of the service"
                   placeholder="A short text summarizing what the service does"
                   message="A summary is required" />

        <TextField :field="f.cptHomepage" label="Homepage of the service"
                   placeholder="The website where this service source code is hosted."
                   icon="fas fa-link"
                   :messages="{ required: 'A project homepage is required', invalidUrl: 'This URL is not accepted' }" />

        <TextField :field="f.cptDescription" label="Description" multiline
                   placeholder="Long description of this software."
                   message="A long description is required" />

        <TextField :field="f.cptId" label="Unique Software Identifier"
                   placeholder="Reverse-DNS string uniquely identifying your software."
                   icon="fas fa-fingerprint"
                   :messages="{
                       required: 'A component-ID is required',
                       minlength: 'A component-ID is too short',
                       forbiddenId: `This ID is not valid: ${f.cptId.errors.forbiddenId?.value ?? ''}`,
                   }">
            <template #help>A rDNS-style string uniquely identifying this software component. Must contain only ASCII characters, dots and numbers.</template>
        </TextField>

    </div>
</div>


<LicensingCard :metadata-license="f.metadataLicense" :mode="f.rbLicenseMode"
               :simple="f.simpleProjectLicense" :complex="f.complexProjectLicense" />


<CategoryCard :primary="f.primaryCategory" :secondary="f.secondaryCategory">
    Your software will appear in at least two categories in software center searches, one primary broad category, and one secondary
    more specific one.
    You can add more secondary categories to your metadata later, if you think your service fits into even more categories. The secondary
    category is optional for services.
</CategoryCard>


<div class="card">
    <header class="card-header">
      <p class="card-header-title">
        Details
      </p>
    </header>
    <div class="card-content content">

        <TextField :field="f.cptIcon" label="Icon Name"
                   placeholder="Stock icon name without file extension"
                   icon="fas fa-icons"
                   :messages="{ required: 'An icon name is required', invalidName: 'This is not a valid icon name' }">
            <template #help>
              Please enter the name of your icon (usually installed into <code>/usr/share/icons/hicolor/&lt;size&gt;/apps/</code>) without its
              .png or .svg(z) file extension.
            </template>
        </TextField>

        <TextField :field="f.serviceName" label="Service Name"
                   placeholder="System service name"
                   icon="fas fa-cogs"
                   :messages="{ required: 'A service launcher name is required', invalidName: 'This is not a valid service name' }">
            <template #help>
              Please enter the name of the service as run by the init system. This is the name you would use in a <code>systemctl status</code>
              command to refer to your service. If you only support systemd, you may include the systemd unit type suffix (<code>.service</code>, <code>.timer</code>, etc.)
              in the service name to make it more explicit.
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
import { makeMetainfoService, type ASBasicInfo, ServiceInfo } from '../lib/makemetainfo';
import { makeMesonValidateSnippet } from '../lib/makemeson';

const finalCptId = ref('');
const dataGenerated = ref(false);
const dataMetainfo = ref('');
const dataMesonValidate = ref('');

const form = useForm({
    cptName:        { initial: '', label: 'service human-readable name', validators: [required()] },
    cptSummary:     { initial: '', label: 'service summary', validators: [required()] },
    cptHomepage:    { initial: '', label: 'homepage', validators: [required(), url()] },
    cptDescription: { initial: '', label: 'long description', validators: [required()] },
    cptId:          { initial: '', label: 'component ID',
                      validators: [required(), minLength(4), componentId()] },

    metadataLicense:       { initial: '', label: 'metadata license', validators: [required()] },
    rbLicenseMode:         { initial: 'simple' },
    simpleProjectLicense:  { initial: '', active: (v) => v.rbLicenseMode !== 'spdx' },
    complexProjectLicense: { initial: '', active: (v) => v.rbLicenseMode === 'spdx' },

    primaryCategory:   { initial: '', label: 'primary service category', validators: [required()] },
    // a service may sit in a single category
    secondaryCategory: { initial: '', label: 'secondary service category', allowEmpty: true },

    cptIcon:     { initial: '', label: 'service icon', validators: [required(), noPathOrSpace()] },
    serviceName: { initial: '', label: 'service launcher name', validators: [required(), noPathOrSpace()] },

    cbMesonSnippets: { initial: false },
});
const { f, values, validateField } = form;

const spdxMode = computed(() => values.rbLicenseMode === 'spdx');

/*
 * Offer a component ID and an icon name derived from what has been entered so
 * far. Both stop for good once the user edits that field themselves - see the
 * two ways of writing a field value in useForm.
 */
watch(() => [values.cptName, values.cptHomepage], () => {
    if (!f.cptId.dirty)
        f.cptId.set(guessComponentId(values.cptHomepage, values.cptName));
});

watch(() => values.cptName, (name) => {
    if (!f.cptIcon.dirty)
        f.cptIcon.set(name.replace(/ /g, '').trim().toLowerCase());
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
    if (!validateField(f.cptIcon))
        return;
    if (!validateField(f.serviceName))
        return;

    const cptInfo = new ServiceInfo();
    cptInfo.categories = [values.primaryCategory];
    if (values.secondaryCategory)
        cptInfo.categories.push(values.secondaryCategory);
    cptInfo.iconName = values.cptIcon;
    cptInfo.serviceName = values.serviceName;

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
    dataMetainfo.value = makeMetainfoService(baseInfo, cptInfo);

    // generate new meson snippets
    if (values.cbMesonSnippets)
        dataMesonValidate.value = makeMesonValidateSnippet(baseInfo);
}
</script>
