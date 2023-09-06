import { z } from 'zod';

const campaignSchema = z
  .object({
    data: z.array(
      z.object({
        id: z.string(),
        attributes: z.object({
          name: z.string(),
          summary: z.string(),
          avatar_photo_url: z.string(),
          url: z.string(),
        }),
      })
    ),
  })
  .transform((campaigns) => {
    const campaign = campaigns.data.find(() => true);

    if (!campaign) return campaign;

    return {
      id: campaign.id.replace('campaign_', ''),
      title: campaign.attributes.name,
      description: campaign.attributes.summary,
      coverUrl: campaign.attributes.avatar_photo_url,
      patreonUrl: campaign.attributes.url,
    };
  });

type Campaign = NonNullable<z.infer<typeof campaignSchema>>;

export { campaignSchema };
export type { Campaign };
