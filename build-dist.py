#!/usr/bin/env python3
#
# Copyright (C) 2020 Matthias Klumpp <mak@debian.org>
#
# SPDX-License-Identifier: LGPL-3.0+

#
# Shortcut to build the Vue application for different configurations
#

import os
import sys
import subprocess
import shutil
from argparse import ArgumentParser


def main():
    parser = ArgumentParser(description='Build MetaInfo Creator')
    parser.add_argument('-c', '--config', action='store', dest='config', default=None,
                        help='Configuration name to build for')

    # parse all arguments that this script can handle
    h_args, vite_extra_args = parser.parse_known_args()

    # determine our working directory
    root_dir = os.path.dirname(os.path.abspath(__file__))
    print('Source directory is: {}'.format(root_dir))
    os.chdir(root_dir)

    # check if the dependencies have been installed
    if not os.path.isdir(os.path.join(root_dir, 'node_modules')):
        print('Dependencies are not installed.')
        print('Please run `npm install` first.')
        sys.exit(4)

    if not shutil.which('npx'):
        print('npx was not found. Please install Node.js and NPM.')
        sys.exit(4)

    config_name = h_args.config
    if config_name:
        config_name = config_name.lower()
        if config_name == 'fdo':
            config_name = 'freedesktop'

    # construct the Vite build command. Each configuration is a Vite mode, and
    # the mode selects an .env file holding the deployment base URL and whether
    # the router uses hash locations.
    build_cmd = ['npx', 'vite', 'build']
    if config_name == 'freedesktop':
        build_cmd.extend(['--mode', 'fdo'])
    elif config_name:
        build_cmd.extend(['--mode', config_name])

    # type-check before building, so a broken build fails loudly
    print('Checking types...')
    r = subprocess.call(['npx', 'vue-tsc', '--noEmit'])
    if r != 0:
        print('Type check has failed!')
        sys.exit(r)

    # run build
    print('Building configuration: {}'.format(config_name if config_name else 'production'))
    build_cmd.extend(vite_extra_args)
    r = subprocess.call(build_cmd)
    if r != 0:
        print('Build has failed!')
        sys.exit(r)


if __name__ == '__main__':
    main()
