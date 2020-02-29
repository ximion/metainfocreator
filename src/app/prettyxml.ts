/*
 * Copyright (C) 2020 Matthias Klumpp <matthias@tenstral.net>
 * original (c) Jonathan Glasmeyer, MIT licensed
 *
 * Adapted from https://github.com/jonathanglasmeyer/prettify-xml
 *
 * SPDX-License-Identifier: MIT
 */

const stringTimesN = (n, char) => Array(n + 1).join(char)

export function prettyXml(xmlInput: string, indentation: number = 2): string
{
    if (!indentation)
        indentation = 2;
    else if (indentation <= 0)
        indentation = 2;

    const indentString = stringTimesN(indentation, ' ')

    let formatted = ''
    const regex = /(>)(<)(\/*)/g
    const xml = xmlInput.replace(regex, `$1\n$2$3`)
    let pad = 0
    xml.split(/\r?\n/).forEach(l => {
        const line = l.trim()

        let indent = 0
        if (line.match(/.+<\/\w[^>]*>$/)) {
            indent = 0
        } else if (line.match(/^<\/\w/)) {
        // Somehow istanbul doesn't see the else case as covered, although it is. Skip it.
        /* istanbul ignore else  */
        if (pad !== 0) {
            pad -= 1
        }
        } else if (line.match(/^<\w([^>]*[^\/])?>.*$/)) {
            indent = 1
        } else {
            indent = 0
        }

        const padding = stringTimesN(pad, indentString)
        formatted += padding + line + '\n' // eslint-disable-line prefer-template
        pad += indent
    })

    return formatted.trim()
}
