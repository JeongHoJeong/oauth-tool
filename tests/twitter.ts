import { getTwitterRequestToken } from '../src/twitter'

describe('Twitter OAuth flow', () => {
  const consumerKey = process.env.TWITTER_CONSUMER_KEY as string
  const consumerSecret = process.env.TWITTER_CONSUMER_SECRET as string
  const callbackUrl = process.env.TWITTER_CALLBACK_URL as string

  if (consumerKey && consumerSecret && callbackUrl) {
    test('getTwitterLoginURL', async () => {
      const token = await getTwitterRequestToken({
        consumerKey,
        consumerSecret,
        callbackUrl,
      })

      expect(token).toBeTruthy()
    })
  } else {
    // eslint-disable-next-line no-console
    console.log(
      'Environment variables TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET and ' +
      'TWITTER_CALLBACK_URL not specified. Bypassing the test.'
    )
  }
})
