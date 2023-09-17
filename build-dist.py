#!/usr/bin/env python3
#
# Copyright (C) 2020 Matthias Klumpp <mak@debian.org>
#
# SPDX-License-Identifier: LGPL-3.0+

#
# Shortcut to build the Angular application for different configurations
#

import os
import sys
import subprocess
import shutil
from argparse import ArgumentParser


FDO_BASE_HREF = 'https://www.freedesktop.org/software/appstream/metainfocreator/'


def main():
    parser = ArgumentParser(description='Build MetaInfo Creator')
    parser.add_argument('-c', '--config', action='store', dest='config', default=None,
                        help='Configuration name to build for')

    # parse all arguments that this script can handle
    h_args, ng_extra_args = parser.parse_known_args()

    # determine our working directory
    root_dir = os.path.dirname(os.path.abspath(__file__))
    print('Source directory is: {}'.format(root_dir))
    os.chdir(root_dir)

    # check if we have the Angular executable
    if not shutil.which('ng'):
        print('Angular CLI was not found.')
        print('Please install it via `npm install -g @angular/cli`')
        sys.exit(4)

    config_name = h_args.config
    if config_name:
        config_name = config_name.lower()
        if config_name == 'fdo':
            config_name = 'freedesktop'

    # construct the Angular build command
    ngbuild_cmd = ['ng', 'build']
    if not config_name:
        ngbuild_cmd.extend(['--configuration', 'production'])
    elif config_name == 'freedesktop':
        ngbuild_cmd.extend(['--configuration', 'freedesktop'])
        ngbuild_cmd.extend(['--base-href', FDO_BASE_HREF])
    else:
        ngbuild_cmd.extend(['--configuration', config_name])

    # run build
    print('Building configuration: {}'.format(config_name))
    ngbuild_cmd.extend(ng_extra_args)
    r = subprocess.call(ngbuild_cmd)
    if r != 0:
        print('Build has failed!')
        sys.exit(r)


if __name__ == '__main__':
    main()
