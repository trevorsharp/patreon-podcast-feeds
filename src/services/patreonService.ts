import { Campaign, campaignSchema } from '../types/campaign';
import { campaignSearchSchema } from '../types/campaignSearch';
import { Post, postsSchema } from '../types/post';
import { get as getCache, set as setCache } from './cacheService';

const getLoginCookies = async () => {
  const cacheKey = 'patreon-login-cookies';
  const cacheResult = getCache<string>(cacheKey);

  if (cacheResult) return cacheResult;

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

  setCache<string>(cacheKey, cookies, 2 * 60 * 60);

  return cookies;
};

const searchForCampaign = async (searchText: string) => {
  const cacheKey = `campaign-search-${searchText}`;
  const cacheResult = getCache<Campaign>(cacheKey);

  if (cacheResult) return cacheResult;

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

  const campaign = await response.json().then((responseBody) => campaignSchema.parse(responseBody));

  if (campaign) setCache<Campaign>(cacheKey, campaign, 7 * 24 * 60 * 60);

  return campaign;
};

const getPosts = async (campaignId: string) => {
  const cacheKey = `posts-${campaignId}`;
  const cacheResult = getCache<Post[]>(cacheKey);

  if (cacheResult) return cacheResult;

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

  const posts = await response.json().then((responseBody) => postsSchema.parse(responseBody));

  setCache<Post[]>(cacheKey, posts, 15 * 60);

  return posts;
};

export { getPosts, searchForCampaign };
