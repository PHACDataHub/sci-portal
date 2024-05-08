import * as fs from 'fs';
import * as path from 'path';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';
import { provisionNewResourceAction } from './provisioner';

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
  describe('data-science-portal:template:get-context', () => {
    // Initialize the action and mock context

    const configMock = {
      getString: jest.fn(() => true),
    } as any;

    const action = provisionNewResourceAction(configMock);
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
          costCentre: '123456789',
          section32ManagerEmail: 'emailAddress',
          justification: 'justification',
          serviceOwners:
            'jane.doe@gcp.hc-sc.gc.ca, john.doe@gcp.hc-sc.gc.ca, steve.smith@gcp.hc-sc.gc.ca',
          totalBudget: 10000,
        },
      });

      // Verify that writeFileSync was called with the expected file path and content
      expect(
        fs.writeFileSync as jest.MockedFunction<typeof fs.writeFileSync>,
      ).toHaveBeenCalledWith(
        expect.stringMatching(
          path.join(mockContext.workspacePath, 'project.yaml'),
        ),
        expect.any(String),
      );
    });
  });
});
