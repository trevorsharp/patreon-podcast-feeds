import { z } from 'zod';

const campaignSchema = z
  .object({
    data: z.object({
      id: z.string(),
      attributes: z.object({
        avatar_photo_url: z.string(),
        name: z.string(),
        summary: z.string(),
        url: z.string(),
      }),
    }),
  })
  .transform((campaign) => ({
    id: campaign.data.id,
    title: campaign.data.attributes.name,
    description: campaign.data.attributes.summary,
    coverUrl: campaign.data.attributes.avatar_photo_url,
    patreonUrl: campaign.data.attributes.url,
  }));

type Campaign = NonNullable<z.infer<typeof campaignSchema>>;

export { campaignSchema };
export type { Campaign };
