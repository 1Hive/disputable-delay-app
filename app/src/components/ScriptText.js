import React from 'react'
import { Link } from '@aragon/ui'
import PropTypes from 'prop-types'
import { transformAddresses } from '../web3-utils'
import { transformIPFSHash, generateURI } from '../lib/ipfs-utils'
import AutoLink from './AutoLink'
import LocalIdentityBadge from './LocalIdentityBadge/LocalIdentityBadge'

// Render a text associated to a script.
// Usually script.executionDescription.
const ScriptText = React.memo(
  ({ disabled, text = '' }) => {
    // If there is no text, the component doesn’t render anything.
    if (!text.trim()) {
      return null
    }
    const TextComponent = disabled ? 'span' : AutoLink

    return (
      <TextComponent>
        <span
          css={`
            a {
              word-break: break-all;
              white-space: normal;
              text-align: left;
            }
          `}
        >
          {text.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {transformAddresses(line, (part, isAddress, index) =>
                isAddress ? (
                  <span title={part} key={index}>
                    {' '}
                    <LocalIdentityBadge badgeOnly={disabled} compact entity={part} />
                  </span>
                ) : (
                  <React.Fragment key={index}>
                    {transformIPFSHash(part, (word, isIpfsHash, i) => {
                      if (isIpfsHash) {
                        const ipfsUrl = generateURI(word)
                        return (
                          <Link href={ipfsUrl} key={i}>
                            {ipfsUrl}{' '}
                          </Link>
                        )
                      }

                      return <span key={i}>{word}</span>
                    })}
                  </React.Fragment>
                )
              )}
              <br />
            </React.Fragment>
          ))}
        </span>
      </TextComponent>
    )
  },
  (prevProps, nextProps) => prevProps.text === nextProps.text
)

ScriptText.propTypes = {
  disabled: PropTypes.bool,
  text: PropTypes.string,
}

export default ScriptText
