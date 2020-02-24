
import { BasicASInfo } from './makemetainfo';

let mesonValidateTemplate: string =`# Validate MetaInfo file
metainfo_file = '<?mifname?>'
ascli = find_program('appstreamcli', required: false)
if ascli.found()
  test ('Validate metainfo file',
        ascli,
        args: ['validate', '--no-net', '--pedantic', appdata_file.full_path()]
  )
endif`;

export function makeMesonValidateSnippet(binfo: BasicASInfo): string
{
    let validateSnippet = mesonValidateTemplate.replace(/<\?(mifname)\?>/g, binfo.cid + '.metainfo.xml');
    return validateSnippet;
}
