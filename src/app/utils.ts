
export function guessComponentId(homepage: string, appName: string): string
{
    if (!homepage)
    return '';

    let url;
    try {
        url = new URL(homepage);
    } catch { return ''; }

    let rDNSRootParts = url.host.split('.').reverse()
    if (rDNSRootParts.length >= 2) {
        // usually projects hosted on GitHub are not from GitHub / Microsoft
        // themselves, so we use github.io for those apps.
        // This is super nitpicky though.
        if (rDNSRootParts[1].toLowerCase() == 'github')
            rDNSRootParts[0] = 'io';
    }

    let tmp = rDNSRootParts.join('.') + '.' + appName;
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
