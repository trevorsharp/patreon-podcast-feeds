import { Podcast } from 'podcast';
import { Campaign } from '../types/campaign';
import { Post } from '../types/post';

const buildFeed = (hostname: string, feedId: string, campaign: Campaign, posts: Post[]) => {
  const feed = new Podcast({
    title: campaign.title,
    description: campaign.description,
    imageUrl: campaign.coverUrl,
    author: campaign.title,
    siteUrl: campaign.patreonUrl,
  });

  posts.forEach((post) =>
    feed.addItem({
      guid: post.id,
      title: post.title,
      description: `${post.description}\n\n${post.patreonUrl}`,
      url: post.patreonUrl,
      date: post.publishedOn,
      enclosure: {
        url: `http://${hostname}/${feedId}/${post.id}`,
        type: 'video/mp4',
      },
      itunesDuration: post.duration,
    })
  );

  return feed.buildXml();
};

export { buildFeed };
