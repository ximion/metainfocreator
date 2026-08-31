/*
 * Copyright (C) 2020 Matthias Klumpp <matthias@tenstral.net>
 *
 * SPDX-License-Identifier: LGPL-3.0+
 */

import { prettyXml } from './prettyxml';

const miTemplateHead = `<?xml version="1.0" encoding="UTF-8"?>
<component type="<?ckind?>">
    <id><?cid?></id>

    <name><?name?></name>
    <summary><?summary?></summary>

    <metadata_license><?metadataLicense?></metadata_license>
    <project_license><?projectLicense?></project_license>`;

const miTemplateTail = '\n</component>\n';

export interface ASBasicInfo {
    cid: string;
    name: string;
    summary: string;
    metadataLicense: string;
    projectLicense: string;
    description: string;
    homepage: string;
    [key: string]: unknown;
}

function xmlEscape(s: string) {
    if (!s)
        return s;
    return s.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
}

function convertDescription(desc: string): string {
    let res = '';
    if (!desc)
        return res;

    const paras = desc.split('\n\n');
    for (const paraRaw of paras) {
        const para = xmlEscape(paraRaw.replace(/\n/g, ' ').trim());

        // transform code markup
        let tmp = para.replace(/`(.*?)`/g,
            (match, value) => {
                return '<code>' + value + '</code>';
            });

        // transform emphases
        tmp = tmp.replace(/\*(.*?)\*/g,
            (match, value) => {
                return '<em>' + value + '</em>';
            });

        res = res + '\n<p>\n' + tmp + '\n</p>';
    }

    return res;
}

class ASRelationXMLData {
    extends: Array<string> = [];
    requires: Array<string> = [];
    recommends: Array<string> = [];
    supports: Array<string> = [];
}

function createMetainfoPreamble(binfo: ASBasicInfo, relXMLData: ASRelationXMLData = null): string {
    let miXml = miTemplateHead.replace(/<\?(\w+)\?>/g,
        (match, name) => {
            return xmlEscape(binfo[name] as string);
        });

    // add (injected) relation XML, if there is any
    if (relXMLData) {
        if ((relXMLData.extends.length !== 0) ||
            (relXMLData.requires.length !== 0) ||
            (relXMLData.recommends.length !== 0) ||
            (relXMLData.supports.length !== 0))
            miXml = miXml + '\n';

        const addRelationXml = (items: Array<string>, relName: string) => {
            if (items.length <= 0)
                return;
            miXml = miXml + '\n<' + relName + '>\n';
            for (const item of items)
                miXml = miXml + item + '\n';
            miXml = miXml + '</' + relName + '>';
        };

        addRelationXml(relXMLData.extends, 'extends');
        addRelationXml(relXMLData.requires, 'requires');
        addRelationXml(relXMLData.recommends, 'recommends');
        addRelationXml(relXMLData.supports, 'supports');
    }

    // add long description block
    miXml = miXml + '\n\n<description>' + convertDescription(binfo.description) + '\n</description>';

    const cid = binfo.cid;
    let projectGroup: string = null;
    if (cid.startsWith('org.kde.'))
        projectGroup = 'KDE';
    else if (cid.startsWith('org.gnome.'))
        projectGroup = 'GNOME';
    else if (cid.startsWith('org.mozilla.'))
        projectGroup = 'Mozilla';
    else if (cid.startsWith('org.xfce.'))
        projectGroup = 'Xfce';
    if (projectGroup)
        miXml = miXml + '\n<project_group>' + projectGroup + '</project_group>';

    if (binfo.homepage)
        miXml = miXml + '\n\n<url type="homepage">' + xmlEscape(binfo.homepage) + '</url>';


    return miXml;
}

export class GUIAppInfo {
    inputPointKeyboard = true;
    inputTouch = false;
    inputGamepad = false;
    inputTablet = false;

    scrImages: Array<string> = [];
    desktopEntryName: string = null;

    categories: Array<string> = [];
    iconName: string = null;
    binary: string = null;

    minDisplaySize = 0;
}

export function makeMetainfoGuiApp(binfo: ASBasicInfo, info: GUIAppInfo, selfcontained: boolean): string {
    // sanity check
    if (!info.inputPointKeyboard && !info.inputTouch && !info.inputGamepad)
        info.inputPointKeyboard = true;

    binfo.ckind = 'desktop-application';
    const relXmlData: ASRelationXMLData = new ASRelationXMLData();

    // handle input controls, if they are not the default for desktop-apps
    if (info.inputTouch || info.inputGamepad || info.inputTablet) {
        if (info.inputPointKeyboard) {
            relXmlData.supports.push('<control>pointing</control>');
            relXmlData.supports.push('<control>keyboard</control>');
        }
        if (info.inputTouch)
            relXmlData.supports.push('<control>touch</control>');
        if (info.inputGamepad)
            relXmlData.supports.push('<control>gamepad</control>');
        if (info.inputTablet)
            relXmlData.supports.push('<control>tablet</control>');
    }

    // minimum surface size
    if (info.minDisplaySize >= 10)
        relXmlData.recommends.push(`<display_length compare="ge">${info.minDisplaySize}</display_length>`);

    // create generic preamble
    let miXml = createMetainfoPreamble(binfo, relXmlData);

    // if desktop-entry name wasn't set, we guess one
    if (!info.desktopEntryName)
        info.desktopEntryName = binfo.cid + '.desktop';

    // add launchable (with a bit of extra spacing around it)
    miXml = miXml + '\n\n<launchable type="desktop-id">' + xmlEscape(info.desktopEntryName) + '</launchable>';

    // add screenshots, if we have any
    if (info.scrImages.length > 0) {
        miXml = miXml.concat('\n<screenshots>');

        for (let i = 0; i < info.scrImages.length; i++) {
            if (i === 0)
                miXml = miXml.concat('<screenshot type="default">\n<image>');
            else
                miXml = miXml.concat('<screenshot>\n<image>');
            miXml = miXml.concat(xmlEscape(info.scrImages[i]));
            miXml = miXml.concat('</image>\n</screenshot>');
        }

        miXml = miXml.concat('\n</screenshots>');
    }

    // add additional stuff if the metainfo file should be selfcontained
    // (e.g. if a desktop-entry is generated from it)
    if (selfcontained) {

        // add the stock icon
        if (info.iconName) {
            miXml = miXml + '\n\n<icon type="stock">' + xmlEscape(info.iconName) + '</icon>\n';
        }

        // add categories
        if (info.categories.length > 0) {
            miXml = miXml.concat('\n<categories>');

            for (const category of info.categories) {
                miXml = miXml + '\n<category>' + xmlEscape(category) + '</category>';
            }

            miXml = miXml.concat('\n</categories>');
        }

        // add binary name
        if (info.binary) {
            miXml = miXml + '\n\n  <provides>\n    <binary>' + xmlEscape(info.binary) + '</binary>\n  </provides>';
        }
    }

    miXml = miXml.trim() + miTemplateTail;
    return prettyXml(miXml);
}

export class ConsoleAppInfo {
    categories: Array<string> = [];
    iconName: string = null;
    binary: string = null;
}

export function makeMetainfoConsoleApp(binfo: ASBasicInfo, info: ConsoleAppInfo): string {
    binfo.ckind = 'console-application';
    let miXml = createMetainfoPreamble(binfo);

    // add the stock icon
    miXml = miXml + '\n\n<icon type="stock">' + xmlEscape(info.iconName) + '</icon>\n';

    // add categories
    if (info.categories.length > 0) {
        miXml = miXml.concat('\n<categories>');

        for (const category of info.categories) {
            miXml = miXml + '\n<category>' + xmlEscape(category) + '</category>';
        }

        miXml = miXml.concat('\n</categories>');
    }

    // add binary name
    miXml = miXml + '\n\n  <provides>\n    <binary>' + xmlEscape(info.binary) + '</binary>\n  </provides>';

    miXml = miXml.trim() + miTemplateTail;
    return prettyXml(miXml);
}

export class AddonInfo {
    extends: Array<string> = [];
    iconName: string = null;
}

export function makeMetainfoAddon(binfo: ASBasicInfo, info: AddonInfo): string {
    binfo.ckind = 'addon';
    const relXmlData: ASRelationXMLData = new ASRelationXMLData();
    for (const exCid of info.extends)
        relXmlData.extends.push('<id>' + exCid + '</id>');
    let miXml = createMetainfoPreamble(binfo, relXmlData);

    // add the stock icon, if we have one
    if (info.iconName)
        miXml = miXml + '\n\n<icon type="stock">' + xmlEscape(info.iconName) + '</icon>';

    miXml = miXml.trim() + miTemplateTail;
    return prettyXml(miXml);
}

export class ServiceInfo {
    categories: Array<string> = [];
    iconName: string = null;
    serviceName: string = null;
}

export function makeMetainfoService(binfo: ASBasicInfo, info: ServiceInfo): string {
    binfo.ckind = 'service';
    let miXml = createMetainfoPreamble(binfo);

    // add service launcher name
    miXml = miXml + '\n\n<launchable type="service">' + xmlEscape(info.serviceName) + '</launchable>';

    // add the stock icon
    miXml = miXml + '\n\n<icon type="stock">' + xmlEscape(info.iconName) + '</icon>\n';

    // add categories
    if (info.categories.length > 0) {
        miXml = miXml.concat('\n<categories>');

        for (const category of info.categories) {
            miXml = miXml + '\n<category>' + xmlEscape(category) + '</category>';
        }

        miXml = miXml.concat('\n</categories>');
    }

    miXml = miXml.trim() + miTemplateTail;
    return prettyXml(miXml);
}
