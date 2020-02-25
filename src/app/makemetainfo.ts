
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

export interface BasicASInfo {
  cid: string;
  name: string;
  summary: string;
  metadataLicense: string;
  projectLicense: string;
  description: string;
}

export class GUIAppInfo {
  scrImages: Array<string> = [];
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

export function makeMetainfoGuiApp(binfo: BasicASInfo, info: GUIAppInfo): string
{
    binfo['ckind'] = 'desktop-application';
    let miXml = createMetainfoPreamble(binfo);

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

    miXml = miXml + miTemplateTail;
    return prettyXml(miXml);
}
