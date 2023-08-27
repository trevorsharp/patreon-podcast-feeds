import { Podcast } from 'podcast';
import { Campaign } from '../types/campaign';
import { Post } from '../types/post';

const buildFeed = (hostname: string, campaign: NonNullable<Campaign>, posts: Post[]) => {
  const feed = new Podcast({
    title: campaign.title,
    description: campaign.description,
    imageUrl: campaign.coverUrl,
    author: campaign.title,
  });

  posts.forEach((post) =>
    feed.addItem({
      title: post.title,
      description: post.description,
      url: post.patreonUrl,
      date: post.publishedOn,
      enclosure: {
        url: `http://${hostname}/content/${post.id}.mp4`,
        type: 'video/mp4',
      },
      itunesDuration: post.duration,
    })
  );

  return feed.buildXml();
};

export { buildFeed };
