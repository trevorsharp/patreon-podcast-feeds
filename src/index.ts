import dotenv from 'dotenv';
import Fastify from 'fastify';
import { getPosts, searchForCampaign } from './services/patreonService';
import { buildFeed } from './services/feedService';

dotenv.config();

const fastify = Fastify({
  logger: true,
});

fastify.get('/', async (_, reply) => {
  reply.code(200);
  return 'Patreon Podcast Feeds Is Up And Running';
});

fastify.get<{ Params: { feedId: string } }>('/:feedId', async (request, reply) => {
  const campaign = await searchForCampaign(request.params.feedId);
  if (!campaign) {
    reply.code(404);
    return 'Campaign Not Found';
  }

  const posts = await getPosts(campaign.id);

  reply.code(200);
  return buildFeed(request.hostname, request.params.feedId, campaign, posts);
});

fastify.get<{ Params: { feedId: string; postId: string } }>('/:feedId/:postId', async (request, reply) => {
  const campaign = await searchForCampaign(request.params.feedId);
  if (!campaign) {
    reply.code(404);
    return 'Campaign Not Found';
  }

  const post = await getPosts(campaign.id).then((posts) => posts.find((post) => post.id === request.params.postId));
  if (!post) {
    reply.code(404);
    return 'Post Not Found';
  }

  reply.redirect(302, post.downloadUrl);
});

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) throw err;
  console.log(`Server is now listening on ${address}`);
});
