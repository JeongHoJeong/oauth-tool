import { OAuth } from 'oauth'
import fetch from 'node-fetch'

interface TwitterOAuthInfoBase {
  consumerKey: string
  consumerSecret: string
  callbackUrl: string
}

function getTwitterOAuthObject({ consumerKey, consumerSecret, callbackUrl }: TwitterOAuthInfoBase) {
  return new OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    consumerKey,
    consumerSecret,
    '1.0A',
    callbackUrl,
    'HMAC-SHA1',
  )
}

interface TwitterGetAuthHeaderOptions extends TwitterOAuthInfoBase, TwitterVerification {
  url: string
}

function getAuthHeader(options: TwitterGetAuthHeaderOptions) {
  const { url } = options
  const oauth = getTwitterOAuthObject(options)

  const { oauthToken, oauthTokenSecret } = options
  const header = oauth.authHeader(url, oauthToken, oauthTokenSecret)
  return header
}

export async function getTwitterRequestToken(oauthInfo: TwitterOAuthInfoBase) {
  return new Promise<string>((resolve, reject) => {
    const oauth = getTwitterOAuthObject(oauthInfo)

    oauth.getOAuthRequestToken((error, oauthRequestToken) => {
      if (error) {
        reject(error)
      } else {
        resolve(oauthRequestToken)
      }
    })
  })
}

export async function getTwitterLoginURL(oauthInfo: TwitterOAuthInfoBase) {
  const token = await getTwitterRequestToken(oauthInfo)
  return `https://twitter.com/oauth/authorize?oauth_token=${token}`
}

interface TwitterVerification {
  oauthToken: string
  oauthTokenSecret: string
  userId: string
  screenName: string
}

export async function verifyTwitterOAuthToken(
  oauthToken: string,
  oauthVerifier: string,
  oauthConsumerKey: string,
): Promise<TwitterVerification | undefined> {
  const url = `https://api.twitter.com/oauth/access_token?` +
    `oauth_token=${oauthToken}&` +
    `oauth_verifier=${oauthVerifier}&` +
    `oauth_consumer_key=${oauthConsumerKey}`
  const result = await fetch(url, {
    method: 'POST',
  })

  if (result.status === 200) {
    const text = await result.text()
    const verification: Partial<TwitterVerification> = {}

    text.split('&').forEach(pair => {
      const [key, value] = pair.split('=')

      if (value) {
        if (key === 'oauth_token') {
          verification.oauthToken = value
        } else if (key === 'oauth_token_secret') {
          verification.oauthTokenSecret = value
        } else if (key === 'user_id') {
          verification.userId = value
        }
      }
    })

    if (Object.keys(verification).length === 3) {
      return verification as TwitterVerification
    }
  }

  return
}

export interface TwitterUserInfo {
  id: number
  id_str: string
  name: string
  screen_name: string
  location: string
  description: string
}

interface TwitterGetUserInfoOptions extends TwitterOAuthInfoBase, TwitterVerification {}

export async function getTwitterUserInfo(options: TwitterGetUserInfoOptions): Promise<TwitterUserInfo | undefined> {
  const url = 'https://api.twitter.com/1.1/account/verify_credentials.json'
  const authHeader = getAuthHeader({
    ...options,
    url,
  })

  const result = await fetch(url, {
    headers: {
      'Authorization': authHeader,
    },
  })

  if (result.status === 200) {
    return result.json()
  }

  return
}
