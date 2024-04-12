import {
  createStorageConfig,
  createWorkspaceConfig,
  provisionNewResourceAction,
} from './provisioner';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';
import fs from 'fs';

// Mock the 'fs' module
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

// Mock uuidv4 function
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid'),
}));

describe('provisioner', () => {
  describe('phac:provisioner:create', () => {
    // Initialize the action and mock context
    const action = provisionNewResourceAction();
    const mockContext = createMockActionContext();

    beforeEach(() => {
      // Reset mock function calls before each test
      jest.clearAllMocks();
    });

    it('run the action', async () => {
      // Execute the action
      await action.handler({
        ...mockContext,
        input: {
          resourceType: 'Storage Bucket',
          resourceName: 'someResourceName',
          billingCode: 'billingCode',
          justificationNote: 'justificationNote',
          retentionPeriod: 'retentionPeriod',
          customRetentionPeriod: 2,
        },
      });

      // Verify that writeFileSync was called with the expected file path and content
      expect(
        fs.writeFileSync as jest.MockedFunction<typeof fs.writeFileSync>,
      ).toHaveBeenCalledWith(
        expect.stringMatching(
          /.*\/tmp\/backstage-tmp-test-dir-.+\/workspace\/mocked-uuid.yaml/,
        ),
        expect.any(String),
      );
    });

    describe('createStorageConfig', () => {
      const mockBucket = {
        resourceType: 'Bucket',
        resourceName: 'test-bucket',
        billingCode: '123456',
        justificationNote: 'Test justification',
        retentionPeriod: '1 Month',
        customRetentionPeriod: undefined,
      };

      it('should create storage configuration with default retention period', () => {
        const requestId = '123';
        const config = createStorageConfig(mockBucket, requestId);
        expect(config.spec.retentionPolicy.retentionPeriod).toBe(2592000);
      });

      it('should create storage configuration with custom retention period', () => {
        const requestId = '123';
        const customRetentionBucket = {
          ...mockBucket,
          retentionPeriod: 'Custom (Specify Below)',
          customRetentionPeriod: 5,
        };
        const config = createStorageConfig(customRetentionBucket, requestId);
        expect(config.spec.retentionPolicy.retentionPeriod).toBe(5 * 86400);
      });
    });

    describe('createWorkspaceConfig', () => {
      it('should create workspace configuration', () => {
        const mockWorkstation = {
          resourceType: 'Workstation',
          resourceName: 'test-workstation',
          billingCode: '654321',
          justificationNote: 'Test workstation justification',
          machineType: 'E2',
        };
        const workspace = createWorkspaceConfig(mockWorkstation);
        expect(workspace.metadata.name).toBe(mockWorkstation.resourceName);
      });
    });
  });
});
