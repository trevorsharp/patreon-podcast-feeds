import fs, { promises as fsPromises } from 'fs';
import https from 'https';
import { Post } from '../types/post';

const contentFolder = '/app/content';

const getDownloadFileName = (postId: string) => `${contentFolder}/${postId}.mp4`;

const downloadNewEpisodes = async (posts: Post[]) => {
  await fsPromises.mkdir(contentFolder);

  const downloadQueue = posts.reduce(
    (acc, post) => (fs.existsSync(getDownloadFileName(post.id)) ? acc : [...acc, post]),
    [] as Post[]
  );

  for (let i = 0; i < downloadQueue.length; i++) {
    const post = downloadQueue[i];

    const downloadFileName = getDownloadFileName(post.id);
    const tempFileName = `${downloadFileName}.temp`;

    await new Promise<void>((resolve, reject) => {
      https
        .get(post.downloadUrl, (res) => {
          const file = fs.createWriteStream(tempFileName);

          res.pipe(file);

          file.on('finish', () => {
            file.close();
            resolve();
          });
        })
        .on('error', () => {
          reject(`Failed to download episode ${post.id}`);
        });
    });

    await fsPromises.rename(tempFileName, downloadFileName);
  }
};

export { downloadNewEpisodes };
