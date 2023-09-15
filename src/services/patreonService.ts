import { campaignSchema } from '../types/campaign';
import { campaignSearchSchema } from '../types/campaignSearch';
import { postsSchema } from '../types/post';
import { withCache } from './cacheService';

const getLoginCookies = withCache('patreon-login-cookies', 2 * 60 * 60, async () => {
  const response = await fetch('https://www.patreon.com/api/auth?json-api-version=1.0', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'genericPatreonApi',
        attributes: {
          patreon_auth: {
            redirect_target: 'https://www.patreon.com/home',
            email: process.env.PATREON_EMAIL,
            password: process.env.PATREON_PASSWORD,
            allow_account_creation: false,
          },
          auth_context: 'auth',
        },
        relationships: {},
      },
    }),
    headers: {
      'content-type': 'application/vnd.api+json',
      accept: '*/*',
    },
  });

  if (response.status !== 200) {
    throw `Failed to login to Patreon - ${response.statusText}`;
  }

  let cookies = '';

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      cookies += value.replace(/^([^=]*)=([^;]*);.*$/, '$1=$2; ');
    }
  });

  return cookies;
});

const searchForCampaign = withCache('patreon-campaign-search-', 7 * 24 * 60 * 60, async (searchText: string) => {
  const searchResponse = await fetch(
    `https://www.patreon.com/api/search?q=${encodeURIComponent(searchText)}&json-api-version=1.0`
  );

  if (searchResponse.status !== 200) {
    throw `Failed to search for campaign - ${searchResponse.statusText}`;
  }

  const campaignId = await searchResponse.json().then((responseBody) => campaignSearchSchema.parse(responseBody));

  if (!campaignId) {
    throw `Failed to find campaign for search ${searchText}`;
  }

  const response = await fetch(
    `https://www.patreon.com/api/campaigns/${campaignId}?fields[campaign]=avatar_photo_url%2Cname%2Csummary%2Curl&json-api-version=1.0`
  );

  return await response.json().then((responseBody) => campaignSchema.parse(responseBody));
});

const getPosts = withCache('patreon-posts-', 15 * 60, async (campaignId: string) => {
  const cookies = await getLoginCookies();

  const response = await fetch(
    `https://www.patreon.com/api/posts?fields[post]=title%2Cteaser_text%2Curl%2Cpublished_at%2Ccurrent_user_can_view%2Cpost_file&filter[campaign_id]=${campaignId}&filter[contains_exclusive_posts]=true&filter[is_draft]=false&filter[media_types]=video&json-api-version=1.0`,
    {
      headers: {
        Cookie: cookies,
      },
    }
  );

  if (response.status !== 200) {
    throw `Failed to fetch Patreon posts - ${response.statusText}`;
  }

  return await response.json().then((responseBody) => postsSchema.parse(responseBody));
});

export { getPosts, searchForCampaign };
