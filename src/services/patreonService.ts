import { Campaign, campaignSchema } from '../types/campaign';
import { Post, postsSchema } from '../types/post';
import { get as getCache, set as setCache } from './cacheService';

const getLoginCookies = async () => {
  const cacheKey = 'patreon-login-cookies';
  const cacheResult = getCache<string>(cacheKey);

  if (cacheResult) return cacheResult;

  const response = await fetch(
    'https://www.patreon.com/api/auth?include=user.null&fields\\[user\\]=\\[\\]&json-api-version=1.0',
    {
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
    }
  );

  if (response.status !== 200) {
    throw `Failed to login to Patreon - ${response.statusText}`;
  }

  let cookies = '';

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      cookies += value.replace(/^([^=]*)=([^;]*);.*$/, '$1=$2; ');
    }
  });

  setCache(cacheKey, cookies, 30 * 60);

  return cookies;
};

const searchForCampaign = async (searchText: string) => {
  const cacheKey = `campaign-search-${searchText}`;
  const cacheResult = getCache<Campaign>(cacheKey);

  if (cacheResult) return cacheResult;

  const response = await fetch(
    `https://www.patreon.com/api/search?q=${encodeURIComponent(
      searchText
    )}&page%5Bnumber%5D=1&json-api-version=1.0&include=\\[\\]`
  );

  if (response.status !== 200) {
    throw `Failed to search for campaign - ${response.statusText}`;
  }

  const campaign = await response
    .json()
    .then((responseBody) => campaignSchema.parse(responseBody))
    .catch(() => {
      throw 'Failed to parse campaigns';
    });

  if (campaign) setCache(cacheKey, campaign, 7 * 24 * 60 * 60);

  return campaign;
};

const getPosts = async (campaignId: string) => {
  const cacheKey = `posts-${campaignId}`;
  const cacheResult = getCache<Post[]>(cacheKey);

  if (cacheResult) return cacheResult;

  const cookies = await getLoginCookies();

  const response = await fetch(
    `https://www.patreon.com/api/posts?include=campaign%2Caccess_rules%2Cattachments%2Caudio%2Caudio_preview.null%2Cimages%2Cmedia%2Cnative_video_insights%2Cpoll.choices%2Cpoll.current_user_responses.user%2Cpoll.current_user_responses.choice%2Cpoll.current_user_responses.poll%2Cuser%2Cuser_defined_tags%2Cti_checks&fields[campaign]=currency%2Cshow_audio_post_download_links%2Cavatar_photo_url%2Cavatar_photo_image_urls%2Cearnings_visibility%2Cis_nsfw%2Cis_monthly%2Cname%2Curl&fields[post]=change_visibility_at%2Ccomment_count%2Ccommenter_count%2Ccontent%2Ccurrent_user_can_comment%2Ccurrent_user_can_delete%2Ccurrent_user_can_view%2Ccurrent_user_has_liked%2Ccurrent_user_can_report%2Cembed%2Cimage%2Cimpression_count%2Cinsights_last_updated_at%2Cis_paid%2Clike_count%2Cmeta_image_url%2Cmin_cents_pledged_to_view%2Cpost_file%2Cpost_metadata%2Cpublished_at%2Cpatreon_url%2Cpost_type%2Cpledge_url%2Cpreview_asset_type%2Cthumbnail%2Cthumbnail_url%2Cteaser_text%2Ctitle%2Cupgrade_url%2Curl%2Cwas_posted_by_campaign_owner%2Chas_ti_violation%2Cmoderation_status%2Cpost_level_suspension_removal_date%2Cpls_one_liners_by_category%2Cvideo_preview%2Cview_count&fields[post_tag]=tag_type%2Cvalue&fields[user]=image_url%2Cfull_name%2Curl&fields[access_rule]=access_rule_type%2Camount_cents&fields[media]=id%2Cimage_urls%2Cdownload_url%2Cmetadata%2Cfile_name&fields[native_video_insights]=average_view_duration%2Caverage_view_pct%2Chas_preview%2Cid%2Clast_updated_at%2Cnum_views%2Cpreview_views%2Cvideo_duration&filter[campaign_id]=${campaignId}&filter[contains_exclusive_posts]=true&filter[is_draft]=false&filter[media_types]=video&sort=-published_at&json-api-version=1.0`,
    {
      headers: {
        Cookie: cookies,
      },
    }
  );

  if (response.status !== 200) {
    throw `Failed to fetch Patreon posts - ${response.statusText}`;
  }

  const posts = await response
    .json()
    .then((responseBody) => postsSchema.parse(responseBody))
    .catch(() => {
      throw 'Failed to parse posts';
    });

  setCache(cacheKey, posts, 15 * 60);

  return posts;
};

export { getPosts, searchForCampaign };
