const { describe, expect, test, beforeEach, afterEach } = require('@jest/globals');
const { setupServer } = require('msw/node');
const { rest, http, graphql, HttpResponse } = require('msw');
const { server } = require('../../mocks/node');




const {
    parseMessage,
    fetchProjectData,
    getRecipients,
} = require('../backstage');

describe('index.js', function () {
    describe('parseMessage', () => {
        test('should parse a valid base64-encoded JSON message', () => {

            const inputData = {
                hello: 'world'
            }

            const cloudEvent = {
                data: {
                    message: {
                        data: Buffer.from(JSON.stringify(inputData)).toString('base64')
                    }
                }
            };

            const parsedResult = parseMessage(cloudEvent);
            expect(parsedResult).toEqual(inputData)
        });

        it('should return undefined if message data is missing', () => {
            const cloudEvent = {
                data: {
                    message: {}
                }
            };

            const parsedResult = parseMessage(cloudEvent);
            expect(parsedResult).toEqual(undefined)

        });

        it('should throw an error for invalid JSON', () => {
            const cloudEvent = {
                data: {
                    message: {
                        data: Buffer.from('invalid json').toString('base64')
                    }
                }
            };
            expect(() => parseMessage(cloudEvent)).toThrow(SyntaxError);
        });
    });


    describe('fetchProjectData', () => {

        beforeAll(() => server.listen());
        afterEach(() => server.resetHandlers());
        afterAll(() => server.close());

        test('fetchProjectData successfully returns project data', async () => {

            const backstageUri = 'https://backstageUri.com';
            const projectId = 'phx-01hz5f5jjef';

            server.use(http.get(`${backstageUri}/api/catalog/entities/by-name/component/default/${projectId}`, () => {
                return HttpResponse.json({
                    "apiVersion": "backstage.io/v1alpha1",
                    "kind": "Component",
                    "metadata": {
                        "name": "phx-01hz5f5jjef",
                        "title": "phx-rad-lab-demo",
                        "annotations": {
                            "backstage.io/source-template": "template:default/rad-lab-gen-ai-create",
                            "cloud.google.com/project": "phx-01hz5f5jjef",
                            "data-science-portal.phac-aspc.gc.ca/budget-alert-recipients": "hello.world@gcp.hc-sc.gc.ca"
                        }
                    },
                    "spec": {
                        "type": "rad-lab-module",
                        "owner": "user:default/hello.world",
                        "lifecycle": "experimental"
                    }
                })
            }),)
            const projectData = await fetchProjectData(projectId, 'token', backstageUri)
            expect(projectData.metadata.name).toEqual(projectId);
        });

        test('fetchProjectData fails to return project data', async () => {

            const backstageUri = 'https://backstageUri.com';
            const projectId = 'phx-01hz5f5jjef';

            server.use(http.get(`${backstageUri}/api/catalog/entities/by-name/component/default/${projectId}`, () => {
                return HttpResponse.status(500);
            }),)

            await expect(fetchProjectData(projectId, 'token', backstageUri)).rejects.toThrow();
        });

    });

    describe('getRecipients', () => {
        it('should return recipients if metadata annotation exists', () => {
            const mockData = {
                metadata: {
                    annotations: {
                        'data-science-portal.phac-aspc.gc.ca/budget-alert-recipients': 'recipient1@example.com, recipient2@example.com'
                    }
                }
            };

            const recipients = getRecipients(mockData);

            expect(recipients).toEqual('recipient1@example.com, recipient2@example.com');
        });

        it('should return undefined if metadata annotation does not exist', () => {
            const mockData = {
                metadata: {
                    annotations: {}
                }
            };

            const recipients = getRecipients(mockData);

            expect(recipients).toBeUndefined();
        });
    });
});

