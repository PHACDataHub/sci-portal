import { Config } from '@backstage/config';

interface ProvisionerConfig {
  repo: {
    owner: string;
    name: string;
  };
}

export const getConfig = (config: Config): ProvisionerConfig => {
  return {
    repo: {
      owner: config.getString('backend.plugins.provisioner.repo.owner'),
      name: config.getString('backend.plugins.provisioner.repo.name'),
    },
  };
};

export const validateConfig = (config: Config) => {
  getConfig(config);
};
