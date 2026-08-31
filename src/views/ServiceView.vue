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

        <div class="field">
            <label class="label">Name of the service</label>
            <div class="control">
                <input class="input" v-model="f.cptName.value" @blur="f.cptName.touch" type="text" placeholder="The human-readable name of your service">
            </div>

            <p v-if="f.cptName.showErrors" class="help is-danger">A name is required</p>
        </div>

        <div class="field">
            <label class="label">Summary of the service</label>
            <div class="control">
                <input class="input" v-model="f.cptSummary.value" @blur="f.cptSummary.touch" type="text" placeholder="A short text summarizing what the service does">
            </div>

            <p v-if="f.cptSummary.showErrors" class="help is-danger">A summary is required</p>
        </div>

        <div class="field">
            <label class="label">Homepage of the service</label>
            <div class="control has-icons-left">
                <input class="input" v-model="f.cptHomepage.value" @blur="f.cptHomepage.touch" type="text" placeholder="The website where this service source code is hosted.">
                <span class="icon is-small is-left">
                    <i class="fas fa-link"></i>
                </span>
            </div>

            <div v-if="f.cptHomepage.showErrors">
                <p v-if="f.cptHomepage.errors.required" class="help is-danger">A project homepage is required</p>
                <p v-if="f.cptHomepage.errors.invalidUrl" class="help is-danger">This URL is not accepted</p>
            </div>
        </div>

        <div class="field">
            <label class="label">Description</label>
            <div class="control">
                <textarea class="textarea" v-model="f.cptDescription.value" @blur="f.cptDescription.touch" placeholder="Long description of this software."></textarea>
            </div>

            <p v-if="f.cptDescription.showErrors" class="help is-danger">A long description is required</p>
        </div>

        <div class="field">
            <label class="label">Unique Software Identifier</label>
            <div class="control has-icons-left">
                <input class="input" v-model="f.cptId.value" @blur="f.cptId.touch" type="text" placeholder="Reverse-DNS string uniquely identifying your software.">
                <span class="icon is-small is-left">
                    <i class="fas fa-fingerprint"></i>
                </span>
            </div>
            <p class="help">A rDNS-style string uniquely identifying this software component. Must contain only ASCII characters, dots and numbers.</p>

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
            <p class="help">The license that applies to this particular metadata and linked assets.</p>

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
                <p class="help">A <a href="https://spdx.org/licenses/">SPDX</a> license expression string.</p>
                <p v-if="f.complexProjectLicense.showErrors" class="help is-danger">You need to enter a SPDX expression</p>
            </div>
        </div>
        <p class="help">The license that applies to the described software.</p>

    </div>
</div>


<div class="card">
    <header class="card-header">
      <p class="card-header-title">
        Categorization
      </p>
    </header>
    <div class="card-content content">
        <p>
          Your software will appear in at least two categories in software center searches, one primary broad category, and one secondary
          more specific one.
          You can add more secondary categories to your metadata later, if you think your service fits into even more categories. The secondary
          category is optional for services.
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
            </div>

        </div>
    </div>
</div>


<div class="card">
    <header class="card-header">
      <p class="card-header-title">
        Details
      </p>
    </header>
    <div class="card-content content">

        <div class="field">
            <label class="label">Icon Name</label>
            <div class="control has-icons-left">
                <input class="input" v-model="f.cptIcon.value" @blur="f.cptIcon.touch" type="text" placeholder="Stock icon name without file extension">
                <span class="icon is-small is-left">
                    <i class="fas fa-icons"></i>
                </span>
            </div>
            <p class="help">
              Please enter the name of your icon (usually installed into <code>/usr/share/icons/hicolor/&lt;size&gt;/apps/</code>) without its
              .png or .svg(z) file extension.
            </p>

            <div v-if="f.cptIcon.showErrors">
                <p v-if="f.cptIcon.errors.required" class="help is-danger">An icon name is required</p>
                <p v-if="f.cptIcon.errors.invalidName" class="help is-danger">This is not a valid icon name</p>
            </div>
        </div>

        <div class="field">
            <label class="label">Service Name</label>
            <div class="control has-icons-left">
                <input class="input" v-model="f.serviceName.value" @blur="f.serviceName.touch" type="text" placeholder="System service name">
                <span class="icon is-small is-left">
                    <i class="fas fa-cogs"></i>
                </span>
            </div>
            <p class="help">
              Please enter the name of the service as run by the init system. This is the name you would use in a <code>systemctl status</code>
              command to refer to your service. If you only support systemd, you may include the systemd unit type suffix (<code>.service</code>, <code>.timer</code>, etc.)
              in the service name to make it more explicit.
            </p>

            <div v-if="f.serviceName.showErrors">
                <p v-if="f.serviceName.errors.required" class="help is-danger">A service launcher name is required</p>
                <p v-if="f.serviceName.errors.invalidName" class="help is-danger">This is not a valid service name</p>
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
              Generate <a href="https://mesonbuild.com/">Meson</a> sample snippet for metadata maintenance
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

</article>

<article class="panel is-info" v-if="dataGenerated">
  <p class="panel-heading">
    Missing tools to validate your data?
  </p>

  <div class="panel-block">
  <div class="column is-full">
      <h4 class="title is-4">MetaInfo Validation</h4>
      <p>
        For validation of <em>MetaInfo</em> files, you need <code>appstreamcli</code>, which is available in pretty much every Linux distribution.
        For best results, you should validate with version <code>0.12.10</code> or later.
      </p>
      <p>On Debian, Ubuntu and their derivatives, AppStream is preinstalled. In case it is missing, it can be installed using <code>apt install appstream</code></p>
      <p>On Fedora and its derivatives, you can install AppStream via <code>dnf install appstream</code></p>
  </div>
  </div>
</article>

</div> <!-- End of content -->

</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { RouterLink } from 'vue-router';

import { useForm } from '../forms/useForm';
import { required, minLength, componentId, url, noPathOrSpace } from '../forms/validators';
import { guessComponentId, filterCategoriesByPrimary,
         type LicenseInfo, type PrimaryCategory, type SecondaryCategory } from '../lib/utils';
import { loadAsset } from '../lib/loadasset';
import { copyText } from '../lib/clipboard';
import { makeMetainfoService, type ASBasicInfo, ServiceInfo } from '../lib/makemetainfo';
import { makeMesonValidateSnippet } from '../lib/makemeson';

const metadataLicenses = ref<LicenseInfo[]>([]);
const spdxLicenses = ref<LicenseInfo[]>([]);
const categoriesPrimary = ref<PrimaryCategory[]>([]);
const categoriesSecondaryAll = ref<SecondaryCategory[]>([]);
const categoriesSecondaryFiltered = ref<SecondaryCategory[]>([]);

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
    simpleProjectLicense:  { initial: '', active: () => !spdxMode.value },
    complexProjectLicense: { initial: '', active: () => spdxMode.value },

    primaryCategory:   { initial: '', label: 'primary service category', validators: [required()] },
    // optional for services, unlike console and GUI applications
    secondaryCategory: { initial: '', label: 'secondary service category', allowEmpty: true },

    cptIcon:     { initial: '', label: 'service icon', validators: [required(), noPathOrSpace()] },
    serviceName: { initial: '', label: 'service launcher name', validators: [required(), noPathOrSpace()] },

    cbMesonSnippets: { initial: false },
});
const { f, values, validateField } = form;

const spdxMode = computed(() => values.rbLicenseMode === 'spdx');

onMounted(async () => {
    metadataLicenses.value = await loadAsset<LicenseInfo[]>('metadata-licenses.json');
    spdxLicenses.value = await loadAsset<LicenseInfo[]>('spdx-licenses.json');
    categoriesPrimary.value = await loadAsset<PrimaryCategory[]>('categories-primary.json');
    categoriesSecondaryAll.value = await loadAsset<SecondaryCategory[]>('categories-secondary.json');
});

/*
 * Guess the component-ID and icon name from what the user has typed so far.
 * Both guesses stop for good once the user edits that particular field by hand:
 * setValue() does not mark a field dirty, so only real user input closes the
 * guard. This mirrors how Angular's setValue() behaved.
 */
watch(() => [values.cptName, values.cptHomepage], () => {
    if (!f.cptId.dirty)
        form.setValue('cptId', guessComponentId(values.cptHomepage, values.cptName));
});

watch(() => values.cptName, (name) => {
    if (!f.cptIcon.dirty)
        form.setValue('cptIcon', name.replace(/ /g, '').trim().toLowerCase());
});

watch(() => values.primaryCategory, (primary) => {
    form.setValue('secondaryCategory', '');
    categoriesSecondaryFiltered.value = filterCategoriesByPrimary(categoriesSecondaryAll.value, primary);
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
