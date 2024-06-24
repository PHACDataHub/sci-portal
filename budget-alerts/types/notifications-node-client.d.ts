declare module 'notifications-node-client' {
  interface SendEmailOptions {
    personalisation?: any;
  }

  export class NotifyClient {
    constructor(apiKey: string);
    constructor(apiKey: string, urlBaseOrServiceId: string);
    constructor(apiKey: string, serviceId: string, urlBase: string);

    sendEmail(templateId: string, emailAddress: string, options?: SendEmailOptions);
  }
}
