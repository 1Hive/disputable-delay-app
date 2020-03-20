const SPLIT_IPFS_REGEX = /(Qm[a-zA-Z0-9]{44})/
const TEST_IPFS_REGEX = /(Qm[a-zA-Z0-9]{44})/

const IPFS_ENDPOINT = 'https://ipfs.eth.aragon.network/ipfs'

export function transformIPFSHash(str, callback) {
  return str
    .split(SPLIT_IPFS_REGEX)
    .map((part, index) => callback(part, TEST_IPFS_REGEX.test(part), index))
}

export function generateURI(hash) {
  return `${IPFS_ENDPOINT}/${hash}`
}
