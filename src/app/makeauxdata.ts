/*
 * Copyright (C) 2020 Matthias Klumpp <matthias@tenstral.net>
 *
 * SPDX-License-Identifier: LGPL-3.0+
 */

import { BasicASInfo, GUIAppInfo } from './makemetainfo';

let deTemplate: string =`[Desktop Entry]
Version=1.0
Type=Application

Name=<?name?>
Comment=<?summary?>
Categories=<?categories?>

Icon=<?icon?>
Exec=<?binary?>
Terminal=false`;

export function makeDesktopEntryData(binfo: BasicASInfo, info: GUIAppInfo): string
{
    let variables = {
            name: binfo.name,
            summary: binfo.summary,
            categories: info.categories.join(';') + ';',
            icon: info.iconName,
            binary: info.binary
        };

    let deData = deTemplate.replace(/<\?(\w+)\?>/g,
        function(match, name) {
            return variables[name];
        });

    return deData;
}
