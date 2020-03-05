/*
 * Copyright (C) 2020 Matthias Klumpp <matthias@tenstral.net>
 *
 * SPDX-License-Identifier: LGPL-3.0+
 */

import { ASBasicInfo, GUIAppInfo } from './makemetainfo';

const deTemplate = `[Desktop Entry]
Version=1.0
Type=Application

Name=<?name?>
Comment=<?summary?>
Categories=<?categories?>

Icon=<?icon?>
Exec=<?binary?>
Terminal=false`;

export function makeDesktopEntryData(binfo: ASBasicInfo, info: GUIAppInfo): string {
    const variables = {
            name: binfo.name,
            summary: binfo.summary,
            categories: info.categories.join(';') + ';',
            icon: info.iconName,
            binary: info.binary
        };

    const deData = deTemplate.replace(/<\?(\w+)\?>/g,
        (match, name) => {
            return variables[name];
        });

    return deData;
}
