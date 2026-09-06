import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'fitora.video-progress.v1';

export type VideoProgressRecord = {
  videoId: string;
  positionSeconds: number;
  durationSeconds: number;
  updatedAt: string;
};

type VideoProgressMap = Record<string, VideoProgressRecord>;

const readAll = async (): Promise<VideoProgressMap> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const videoProgressService = {
  getAll: readAll,

  get: async (videoId: string) => {
    const progress = await readAll();
    return progress[videoId] ?? null;
  },

  save: async (videoId: string, positionSeconds: number, durationSeconds: number) => {
    if (!Number.isFinite(positionSeconds) || positionSeconds < 0) return;
    const progress = await readAll();
    progress[videoId] = {
      videoId,
      positionSeconds,
      durationSeconds: Math.max(durationSeconds, 0),
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  },

  complete: async (videoId: string, durationSeconds: number) => {
    await videoProgressService.save(videoId, durationSeconds, durationSeconds);
  },
};
