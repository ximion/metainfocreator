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

The MetaInfo Creator is an Angular (9+) web application intended to make it very easy for users to generate MetaInfo files
to ship with their software.

### Installing Angular

First, you need to install Node.js via your distribution's package manager. Then you need to fetch NPM, the Node package manager and
install that one as well.
Once that is finished, you can install the Angular CLI globally and set up the repository:
```bash
# install Angular
npm install -g @angular/cli
# retrieve other stuff we need
npm install .
```

### Development server

Run `ng serve` for a development server. Navigate to `http://localhost:4200/`.
The app will automatically reload if you change any of the source files.

### Build

Run the provided `./build-dist.py` script to build the project.
The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.
