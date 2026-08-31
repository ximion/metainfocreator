/*
 * Copyright (C) 2020-2021 Matthias Klumpp <matthias@tenstral.net>
 *
 * SPDX-License-Identifier: LGPL-3.0+
 */

/**
 * Load one of the static JSON data files from the assets directory.
 *
 * The path is resolved against the deployment base, which is how the
 * freedesktop.org install (served from a subdirectory) finds its data. This
 * files are fetched at runtime rather than bundled, so they can be refreshed
 * by update-assets.py without rebuilding the application.
 */
export async function loadAsset<T>(name: string): Promise<T> {
    const response = await fetch(`${import.meta.env.BASE_URL}assets/${name}`);
    if (!response.ok)
        throw new Error(`Unable to load ${name}: ${response.status} ${response.statusText}`);
    return await response.json() as T;
}
