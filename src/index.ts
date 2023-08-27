import dotenv from 'dotenv';
import Fastify from 'fastify';
import FastifyStatic from '@fastify/static';
import { downloadNewEpisodes } from './services/downloadService';
import { getPosts, searchForCampaign } from './services/patreonService';
import { buildFeed } from './services/feedService';

dotenv.config();

const feeds = process.env.FEEDS?.split(',').map((feedId) => feedId.trim()) ?? [];

const fastify = Fastify({
  logger: true,
});

fastify.register(FastifyStatic, {
  root: '/app/content',
  prefix: '/content/',
});

fastify.get('/', async (_, reply) => {
  reply.code(200);
  return 'Patreon Podcast Feeds Is Up And Running';
});

fastify.get('/update', async (_, reply) => {
  updateFeeds();
  reply.code(200);
  return 'Updating Feeds';
});

fastify.get<{ Params: { feedId: string } }>('/:feedId', async (request, reply) => {
  const feedId = feeds.find((feed) => feed.toLowerCase() === request.params.feedId.toLowerCase());
  if (!feedId) {
    reply.code(404);
    return 'Feed Not Found';
  }

  const campaign = await searchForCampaign(feedId);
  if (!campaign) {
    reply.code(404);
    return 'Campaign Not Found';
  }

  const posts = await getPosts(campaign.id);

  reply.code(200);
  return buildFeed(request.hostname, campaign, posts);
});

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) throw err;
  console.log(`Server is now listening on ${address}`);
});

let currentlyUpdating = false;

const updateFeeds = async () => {
  if (currentlyUpdating) return;

  currentlyUpdating = true;

  for (let i = 0; i < feeds.length; i++) {
    const campaign = await searchForCampaign(feeds[i]);
    if (!campaign) throw `Could not find campaign for feed ${feeds[i]}`;

    const posts = await getPosts(campaign.id);

    await downloadNewEpisodes(posts);
  }

  currentlyUpdating = false;
};

setInterval(() => updateFeeds().catch((e) => console.error(e)), 10 * 60 * 1000);

console.log(`Feeds - ${feeds.join(' / ')}`);
