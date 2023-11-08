import { z } from 'zod';

const postsSchema = z
  .object({
    data: z.array(
      z.object({
        id: z.string(),
        attributes: z.object({
          title: z.string(),
          teaser_text: z.string().nullable().default(''),
          url: z.string(),
          published_at: z.coerce.date(),
          current_user_can_view: z.boolean(),
          post_file: z
            .object({
              download_url: z.string(),
              duration: z.number(),
            })
            .optional(),
        }),
      })
    ),
  })
  .transform((posts) =>
    posts.data
      .filter((post) => post.attributes.current_user_can_view && !!post.attributes.post_file)
      .map((post) => ({
        id: post.id,
        title: post.attributes.title,
        description: post.attributes.teaser_text,
        publishedOn: post.attributes.published_at,
        duration: post.attributes.post_file!.duration,
        patreonUrl: post.attributes.url,
        downloadUrl: post.attributes.post_file!.download_url,
      }))
  );

type Post = z.infer<typeof postsSchema>[number];

export { postsSchema };
export type { Post };
