
export function arrayAddIfNotEmpty(arr: Array<any>, element: any): boolean
{
    let e = element;
    if (typeof e === 'string' || e instanceof String)
        e = e.trim();
    if (!e)
        return false;

    arr.push(e);
    return true;
}

export function isAcceptableUrl(url: string): boolean
{
    // if the URL doesn't exist, that's okay too
    if (!url)
        return true;

    // we only permit HTTP(s) URLs in most places in AppStream,
    // so we can just make this mandatory here
    if (url.startsWith('https://') || url.startsWith('http://'))
        return true;
    return false;
}

export function guessComponentId(homepage: string, appName: string): string
{
    if (!homepage)
        return '';

    let url;
    try {
        let urlStr = homepage;
        if (!urlStr.startsWith('http'))
            urlStr = 'https://' + homepage;
        url = new URL(urlStr);
    } catch { return ''; }

    let userPart = ''; // Only used with GitHub URLs at the moment
    let rDNSRootParts = url.host.split('.').reverse()
    if (rDNSRootParts.length >= 2) {
        // Usually projects hosted on GitHub are not from GitHub Inc. / Microsoft
        // themselves, so we use github.io for those apps (this seems to be the way
        // at Github to indicate "created on our platform, but not owned by us)
        // We also special-case the GitHub username here, for extra namespace precision.
        if (rDNSRootParts[1].toLowerCase() == 'github') {
            rDNSRootParts[0] = 'io';
            userPart = url.pathname.split('/')[1];
            if (userPart)
                userPart = userPart + '.';
        }
    }

    let tmp = rDNSRootParts.join('.') + '.' + userPart + appName;
    tmp = tmp.trim()
             .toLowerCase()
             .normalize()
             .replace(/[^\x00-\x7F]/g, '')
             .replace(/www/g, '')
             .replace(/ /g, '_')
             .replace(/-/g, '_')
             .replace(/:/g, '_')
             .replace(/&/g, '')
             .replace(/</g, '')
             .replace(/>/g, '')
             .replace(/"/g, '')
             .replace(/'/g, '');
    return tmp;
}

export interface CIDValidationResult {
  valid: boolean;
  message: string;
}

export function componentIdValid(cid: string): CIDValidationResult
{
    let res: CIDValidationResult = {valid: false, message: 'ID was empty'}
    if (!cid)
        return res;

    let rDNSParts = cid.split('.')
    if (rDNSParts.length < 3) {
        res.message = 'ID does not follow the reverse-DNS scheme';
        return res;
    }

    for (let i = 0; i < rDNSParts.length; i++) {
        if (!rDNSParts[i].trim()) {
            res.message = 'ID contains an empty segment.';
            return res;
        }
    }

    let ascii = /^[ -~]+$/;
    if (!ascii.test(cid)) {
        res.message = 'ID contains non-ASCII characters.';
        return res;
    }

    if (cid.includes(' ')) {
        res.message = 'ID contains spaces.';
        return res;
    }

    if (cid.includes('-')) {
        res.message = 'ID contains hyphens.';
        return res;
    }

    for (let i = 0; i < cid.length; i++) {
        let code = cid.charCodeAt(i);
        if (!(code > 47 && code < 58) && // numeric (0-9)
            !(code > 64 && code < 91) && // upper alpha (A-Z)
            !(code > 96 && code < 123)) { // lower alpha (a-z)
                if ((cid[i] != '_') && (cid[i] != '.')) {
                    res.message = `ID contains invalid character: ${cid[i]}`;
                    return res;
                }
        }
    }

    res.message = null;
    res.valid = true;
    return res;
}
