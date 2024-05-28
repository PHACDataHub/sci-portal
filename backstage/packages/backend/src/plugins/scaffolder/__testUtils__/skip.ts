/**
 * Skip tests on a given platform
 */
export const skip = (platform: NodeJS.Platform) =>
  process.platform === platform ? it.skip : it;
