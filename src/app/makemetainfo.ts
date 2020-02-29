/*
 * Copyright (C) 2020 Matthias Klumpp <matthias@tenstral.net>
 *
 * SPDX-License-Identifier: LGPL-3.0+
 */

import { prettyXml } from './prettyxml';

let miTemplateHead: string =`<?xml version="1.0" encoding="UTF-8"?>
<component type="<?ckind?>">
    <id><?cid?></id>

    <name><?name?></name>
    <summary><?summary?></summary>

    <metadata_license><?metadataLicense?></metadata_license>
    <project_license><?projectLicense?></project_license>

    <description><?description?>
    </description>`;

let miTemplateTail: string = '\n</component>\n';

export interface BasicASInfo
{
    cid: string;
    name: string;
    summary: string;
    metadataLicense: string;
    projectLicense: string;
    description: string;
}

function xmlEscape(s: string)
{
    if (!s)
        return s;
    return s.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
}

function convertDescription(desc: string): string
{
    let res: string = '';

    let paras = desc.split('\n\n');
    for (let i = 0; i < paras.length; i++) {
        let para = xmlEscape(paras[i].replace(/\n/g, ' ').trim());

        // transform code markup
        let tmp = para.replace(/`(.*?)`/g,
            function(match, value) {
                return '<code>' + value + '</code>';
            });

        // transform emphases
        tmp = tmp.replace(/\*(.*?)\*/g,
            function(match, value) {
                return '<em>' + value + '</em>';
            });

        res = res + '\n<p>\n' + tmp + '\n</p>';
    }

    return res;
}

function createMetainfoPreamble(binfo: BasicASInfo): string
{
    let miXml = miTemplateHead.replace(/<\?(\w+)\?>/g,
        function(match, name) {
            if (name == 'description')
                return convertDescription(binfo[name]);
            else
                return xmlEscape(binfo[name]);
        });

    let cid = binfo.cid;
    let project_group: string = null;
    if (cid.startsWith('org.kde.'))
        project_group = 'KDE';
    else if (cid.startsWith('org.gnome.'))
        project_group = 'GNOME';
    else if (cid.startsWith('org.mozilla.'))
        project_group = 'Mozilla';
    else if (cid.startsWith('org.xfce.'))
        project_group = 'Xfce';
    if (project_group)
        miXml = miXml + '\n<project_group>' + project_group + '</project_group>';

    return miXml;
}

export class GUIAppInfo
{
    inputPointKeyboard: boolean = true;
    inputTouch: boolean = false;
    inputGamepad: boolean = false;

    scrImages: Array<string> = [];
    desktopEntryName: string = null;

    categories: Array<string> = [];
    iconName: string = null;
    binary: string = null;
}

export function makeMetainfoGuiApp(binfo: BasicASInfo, info: GUIAppInfo, selfcontained: boolean): string
{
    binfo['ckind'] = 'desktop-application';
    let miXml = createMetainfoPreamble(binfo);

    // sanity check
    if (!info.inputPointKeyboard && !info.inputTouch && !info.inputGamepad)
        info.inputPointKeyboard = true;

    // handle input controls, if they are not the default for desktop-apps
    if (info.inputTouch || info.inputGamepad) {
        miXml = miXml + '\n\n​<recommends>\n';
        if (info.inputPointKeyboard) {
            miXml = miXml + '​<control>pointing​</control>\n';
            miXml = miXml + '​<control>keyboard</control>\n';
        }
        if (info.inputTouch)
            miXml = miXml + '​<control>touch</control>\n';
        if (info.inputGamepad)
            miXml = miXml + '​<control>gamepad</control>\n';
         miXml = miXml + '</recommends>';
    }

    // if desktop-entry name wasn't set, we guess one
    if (!info.desktopEntryName)
        info.desktopEntryName = binfo.cid + '.desktop';

    // add launchable (with a bit of extra spacing around it)
    miXml = miXml + '\n\n​<launchable type="desktop-id">' + xmlEscape(info.desktopEntryName) + '​</launchable>';

    // add screenshots, if we have any
    if (info.scrImages.length > 0) {
        miXml = miXml.concat('\n<screenshots>');

        for (let i = 0; i < info.scrImages.length; i++) {
            if (i == 0)
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
            miXml = miXml + '\n\n​<icon type="stock">' + xmlEscape(info.iconName) + '​</icon>\n';
        }

        // add categories
        if (info.categories.length > 0) {
            miXml = miXml.concat('\n<categories>');

            for (let i = 0; i < info.categories.length; i++) {
                miXml = miXml + '\n​<category>' + xmlEscape(info.categories[i]) + '​</category>';
            }

            miXml = miXml.concat('\n</categories>');
        }

        // add binary name
        if (info.binary) {
            miXml = miXml + '\n\n  ​<provides>\n    <binary>' + xmlEscape(info.binary) + '​</binary>\n  </provides>';
        }
    }

    miXml = miXml.trim() + miTemplateTail;
    return prettyXml(miXml);
}

export class ConsoleAppInfo
{
    categories: Array<string> = [];
    iconName: string = null;
    binary: string = null;
}

export function makeMetainfoConsoleApp(binfo: BasicASInfo, info: ConsoleAppInfo): string
{
    binfo['ckind'] = 'console-application';
    let miXml = createMetainfoPreamble(binfo);


    // add the stock icon
    miXml = miXml + '\n\n​<icon type="stock">' + xmlEscape(info.iconName) + '​</icon>\n';


    // add categories
    if (info.categories.length > 0) {
        miXml = miXml.concat('\n<categories>');

        for (let i = 0; i < info.categories.length; i++) {
            miXml = miXml + '\n​<category>' + xmlEscape(info.categories[i]) + '​</category>';
        }

        miXml = miXml.concat('\n</categories>');
    }

    // add binary name
    miXml = miXml + '\n\n  ​<provides>\n    <binary>' + xmlEscape(info.binary) + '​</binary>\n  </provides>';

    miXml = miXml.trim() + miTemplateTail;
    return prettyXml(miXml);
}
