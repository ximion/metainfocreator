#!/usr/bin/env python3
#
# Copyright (C) 2015-2020 Matthias Klumpp <mak@debian.org>
#
# SPDX-License-Identifier: LGPL-2.1+

#
# Script to download updated static data from the web and process it for AppStream to use.
#

import os
import json
import requests
import subprocess
from datetime import date
from tempfile import TemporaryDirectory


SPDX_REPO_URL = 'https://github.com/spdx/license-list-data.git'
MENU_SPEC_URL = 'https://gitlab.freedesktop.org/xdg/xdg-specs/raw/master/menu/menu-spec.xml'


def _read_spdx_licenses(data_dir, last_tag_ver):
    # load license and exception data
    licenses_json_fname = os.path.join(data_dir, 'json', 'licenses.json')
    exceptions_json_fname = os.path.join(data_dir, 'json', 'exceptions.json')
    with open(licenses_json_fname, 'r') as f:
        licenses_data = json.loads(f.read())
    with open(exceptions_json_fname, 'r') as f:
        exceptions_data = json.loads(f.read())

    # get version of the data we are currently retrieving
    license_ver_ref = licenses_data.get('licenseListVersion')
    if not license_ver_ref:
        license_ver_ref = last_tag_ver
    exceptions_ver_ref = exceptions_data.get('licenseListVersion')
    if not license_ver_ref:
        exceptions_ver_ref = last_tag_ver

    license_list = []
    for license in licenses_data['licenses']:
        is_free = True if license.get('isFsfLibre') and license.get('isOsiApproved') else False
        license_list.append({'id': license['licenseId'],
                             'name': license['name'],
                             'free': is_free})

    exceptions_list = []
    for exception in exceptions_data['exceptions']:
        exceptions_list.append({'id': exception['licenseExceptionId'],
                                'name': exception['name']})

    license_list = sorted(license_list, key=lambda k: k['id'])
    exceptions_list = sorted(exceptions_list, key=lambda k: k['id'])
    return {'licenses': license_list,
            'exceptions': exceptions_list,
            'license_list_ver': license_ver_ref,
            'eceptions_list_ver': exceptions_ver_ref}


def update_spdx_license_list(git_url, licenselist_fname, exceptionlist_fname, with_deprecated=True):
    print('Updating list of SPDX licenses...')
    tdir = TemporaryDirectory(prefix='spdx_master-')

    subprocess.check_call(['git',
                           'clone',
                           git_url, tdir.name])
    last_tag_ver = subprocess.check_output(['git', 'describe', '--abbrev=0',  '--tags'], cwd=tdir.name)
    last_tag_ver = str(last_tag_ver.strip(), 'utf-8')
    if last_tag_ver.startswith('v'):
        last_tag_ver = last_tag_ver[1:]

    license_data = _read_spdx_licenses(tdir.name, last_tag_ver)

    with open(licenselist_fname, 'w') as f:
        f.write(json.dumps(license_data['licenses'], sort_keys=True, indent=4))

    with open(exceptionlist_fname, 'w') as f:
        f.write(json.dumps(license_data['exceptions'], sort_keys=True, indent=4))


def update_categories_list(spec_url, primary_fname, secondary_fname):
    ''' The worst parser ever, extracting category information directoly from the spec Docbook file '''
    from enum import Enum, auto

    req = requests.get(spec_url)

    class SpecSection(Enum):
        NONE = auto()
        MAIN_CATS = auto()
        MAIN_CATS_BODY = auto()
        EXTRA_CATS = auto()
        EXTRA_CATS_BODY = auto()

    def get_entry(line):
        start = line.index('<entry>') + 7
        end = line.index('</entry>')
        return line[start:end].strip()

    main_cats = []
    extra_cats = []

    current_cat = {}
    spec_sect = SpecSection.NONE
    for line in str(req.content, 'utf-8').splitlines():
        if '<entry>Main Category</entry>' in line:
            spec_sect = SpecSection.MAIN_CATS
            continue

        if '<entry>Additional Category</entry>' in line:
            spec_sect = SpecSection.EXTRA_CATS
            continue

        if '<tbody>' in line:
            current_cat = {}
            if spec_sect == SpecSection.MAIN_CATS:
                spec_sect = SpecSection.MAIN_CATS_BODY
            else:
                spec_sect = SpecSection.EXTRA_CATS_BODY
            continue

        if spec_sect == SpecSection.MAIN_CATS_BODY:
            if '<row>' in line:
                if current_cat:
                    main_cats.append(current_cat)
                    current_cat = {}
                continue
            if '</tbody>' in line:
                if current_cat:
                    main_cats.append(current_cat)
                    current_cat = {}
                spec_sect = SpecSection.NONE
                continue

            if '<entry>' in line:
                if current_cat.get('desc'):
                    continue
                if current_cat:
                    current_cat['desc'] = get_entry(line)
                else:
                    current_cat['name'] = get_entry(line)
            continue

        if spec_sect == SpecSection.EXTRA_CATS_BODY:
            if '<row>' in line:
                if current_cat:
                    extra_cats.append(current_cat)
                    current_cat = {}
                continue
            if '</tbody>' in line:
                if current_cat:
                    main_cats.append(current_cat)
                    current_cat = {}
                spec_sect = SpecSection.NONE
                # nothing interesting follows for us after the additional categories are done
                break

            if '<entry>' in line:
                if current_cat.get('rel'):
                    continue
                if current_cat:
                    if not current_cat.get('desc'):
                        current_cat['desc'] = get_entry(line)
                    if not current_cat.get('rel'):
                        current_cat['rel'] = get_entry(line)
                else:
                    current_cat['name'] = get_entry(line)
            continue

    # we don't want to expose the Audio and Video categories, as a special rule applies
    # for them. People should use AudioVideo instead.
    main_cats = [e for e in main_cats if (e['name'] != 'Audio' and e['name'] != 'Video')]

    main_cats = sorted(main_cats, key=lambda k: k['name'])
    extra_cats = sorted(extra_cats, key=lambda k: k['name'])

    with open(primary_fname, 'w') as f:
        f.write(json.dumps(main_cats, sort_keys=True, indent=4))

    with open(secondary_fname, 'w') as f:
        f.write(json.dumps(extra_cats, sort_keys=True, indent=4))


def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    assets_dir = os.path.join(root_dir, 'src', 'assets')
    print('Asset directory is: {}'.format(assets_dir))
    os.chdir(assets_dir)

    update_spdx_license_list(SPDX_REPO_URL, 'spdx-licenses.json', 'spdx-license-exceptions.json')
    update_categories_list(MENU_SPEC_URL, 'categories-primary.json', 'categories-secondary.json')

    print('All done.')


if __name__ == '__main__':
    main()
