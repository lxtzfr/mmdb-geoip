const v4 = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
const v6 = /^([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)$/

const v4PrivateRanges = [
    /^10\./,                                          // 10.0.0.0/8 Private
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,                // 172.16.0.0/12 Private
    /^192\.168\./,                                    // 192.168.0.0/16 Private
    /^127\./,                                         // 127.0.0.0/8 Loopback
    /^169\.254\./,                                    // 169.254.0.0/16 Link-local
    /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // 100.64.0.0/10 CGNAT
    /^0\./,                                           // 0.0.0.0/8 Invalid
    /^22[4-9]\.|^23[0-9]\./,                         // 224.0.0.0/4 Multicast
    /^24[0-9]\.|^25[0-5]\./,                         // 240.0.0.0/4 Reserved + Broadcast
]

const v6PrivateRanges = [
    /^fc/i, /^fd/i,                      // ULA (Unique Local Address)
    /^fe80:/i,                           // Link-Local
    /^::1$/,                             // Loopback
    /^::$/,                              // Unspecified
    /^ff/i,                              // Multicast
]

export function isPublicIp(ip: string) {
    if (v4.test(ip)) {
        return !v4PrivateRanges.some(range => range.test(ip))
    }
    if (v6.test(ip)) {
        return !v6PrivateRanges.some(range => range.test(ip.toLowerCase()))
    }
    return false
}
