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


def get_spdx_id_list(licenselist_fname, exceptionlist_fname, git_url, with_deprecated=True):
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


def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    assets_dir = os.path.join(root_dir, 'src', 'assets')
    print('Asset directory is: {}'.format(assets_dir))
    os.chdir(assets_dir)

    get_spdx_id_list('spdx-licenses.json', 'spdx-license-exceptions.json', SPDX_REPO_URL)

    print('All done.')


if __name__ == '__main__':
    main()
