/*
 * Copyright (C) 2020 Matthias Klumpp <matthias@tenstral.net>
 *
 * SPDX-License-Identifier: LGPL-3.0+
 */

import { ASBasicInfo } from './makemetainfo';

let mesonValidateTemplate: string =`# Validate MetaInfo file
metainfo_file = '/path/to/<?mifname?>'
ascli_exe = find_program('appstreamcli', required: false)
if ascli_exe.found()
  test('validate metainfo file',
        ascli_exe,
        args: ['validate',
               '--no-net',
               '--pedantic',
               metainfo_file]
  )
endif`;

export function makeMesonValidateSnippet(binfo: ASBasicInfo): string
{
    let validateSnippet = mesonValidateTemplate.replace(/<\?(mifname)\?>/g, binfo.cid + '.metainfo.xml');
    return validateSnippet;
}

let mesonMItoDETemplate: string =`# Create desktop-entry file from metainfo
metainfo_file = '/path/to/<?mifname?>'
ascli_exe = find_program('appstreamcli')
custom_target('gen-desktop-entry',
    input : [metainfo_file],
    output : ['<?defname?>'],
    command : [ascli_exe, 'make-desktop-file', '@INPUT@', '@OUTPUT@'],
    install: true,
    install_dir: join_paths (get_option ('datadir'), 'applications')
)`;

export function makeMesonMItoDESnippet(binfo: ASBasicInfo): string
{
    let snippet = mesonMItoDETemplate.replace(/<\?(mifname)\?>/g, binfo.cid + '.metainfo.xml');
    snippet = snippet.replace(/<\?(defname)\?>/g, binfo.cid + '.desktop');
    return snippet;
}

let mesonL10NTemplate: string =`# Localize a MetaInfo file and install it
i18n = import('i18n')

# NOTE: Remember to add the XML file to POTFILES.in!
metainfo_file = '/path/to/<?mifname?>'
i18n.merge_file(
    input:  metainfo_file,
    output: '<?mifname?>',
    type: 'xml',
    po_dir: join_paths (meson.source_root(), 'po'),
    install: true,
    install_dir: join_paths (get_option ('datadir'), 'metainfo')
)`;

export function makeMesonL10NSnippet(binfo: ASBasicInfo): string
{
    let snippet = mesonL10NTemplate.replace(/<\?(mifname)\?>/g, binfo.cid + '.metainfo.xml');
    return snippet;
}
