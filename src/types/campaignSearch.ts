import { z } from 'zod';

const campaignSearchSchema = z
  .object({
    data: z.array(
      z.object({
        id: z.string(),
      })
    ),
  })
  .transform((campaignSearch) => campaignSearch.data.find(() => true)?.id?.replace('campaign_', ''));

export { campaignSearchSchema };
