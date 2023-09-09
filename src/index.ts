import { Hono } from 'hono';
import { getPosts, searchForCampaign } from './services/patreonService';
import { buildFeed } from './services/feedService';

const app = new Hono();

app.get('/', (c) => c.text('Patreon Podcast Feeds Is Up And Running'));

app.get('/:feedId', async (c) => {
  const feedId = c.req.param('feedId');
  const hostname = c.req.headers.get('host') ?? '';

  const campaign = await searchForCampaign(feedId);
  if (!campaign) return c.text('Campaign Not Found', 404);

  const posts = await getPosts(campaign.id);

  return c.text(buildFeed(hostname, feedId, campaign, posts));
});

app.get('/:feedId/:postId', async (c) => {
  const feedId = c.req.param('feedId');
  const postId = c.req.param('postId');

  const campaign = await searchForCampaign(feedId);
  if (!campaign) return c.text('Campaign Not Found', 404);

  const post = await getPosts(campaign.id).then((posts) => posts.find((post) => post.id === postId));
  if (!post) return c.text('Post Not Found', 404);

  return c.redirect(post.downloadUrl);
});

export default {
  fetch: app.fetch,
  port: 3000,
};
