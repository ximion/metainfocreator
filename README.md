AppStream MetaInfo Creator
==========================

[AppStream](https://github.com/ximion/appstream) is a cross-distro effort for providing metadata for software in
the Freedesktop ecosystem. It provides a convenient way to get information about not installed software, and is one
of the building blocks for software centers.

This web application provides an easy way to generate good initial metadata for some software types to represent them in software
centers or to provide additional metadata for systems.
Users just have to answer a few questions to get started with creating AppStream MetaInfo/AppData files.

## Users

Users can use the production instance [hosted at Freedesktop.org](https://www.freedesktop.org/software/appstream/metainfocreator/)
to generate their metadata. All metadata generation happens locally in the browser, no data is transferred to Freedesktop.

## Developers

![Build & Test](https://github.com/ximion/metainfocreator/workflows/Build%20&%20Test/badge.svg)

The MetaInfo Creator is a [Vue 3](https://vuejs.org/) web application, built with [Vite](https://vite.dev/), intended
to make it very easy for users to generate MetaInfo files to ship with their software.

All metadata generation logic lives in `src/lib/` and is deliberately free of any framework dependency, so it can be
tested (and reused) on its own. The Vue views in `src/views/` only collect user input and hand it to those functions.

### Setting up

You need Node.js and NPM, installed via your distribution's package manager. Then set up the repository:
```bash
npm install
```

### Development server

Run `npm run dev` for a development server. Navigate to `http://localhost:5173/`.
The app will automatically reload if you change any of the source files.

### Tests and linting

```bash
npm run test   # run the generator unit tests
npm run lint   # run ESLint
```

The tests pin the exact output of the metadata generators with snapshots. If a change to `src/lib/` alters the
generated files, the snapshots will fail - review the diff carefully before updating them with `npx vitest -u`,
since people commit the generated output verbatim.

### Build

Run the provided `./build-dist.py` script to build the project.
The build artifacts will be stored in the `dist/metainfocreator/` directory.

By default this produces a build for deployment at the root of a domain, using regular history-based routing.
Pass `--config fdo` to build the configuration used for the instance hosted at Freedesktop.org, which is served
from a subdirectory and therefore uses hash-based routing:
```bash
./build-dist.py              # default configuration
./build-dist.py --config fdo # freedesktop.org configuration
```
The two configurations are Vite modes, and their settings live in `.env` and `.env.fdo` respectively.

### Updating the bundled data

The SPDX license lists and the XDG category lists in `public/assets/` are generated. Run `./update-assets.py` to
refresh them from their upstream sources.
