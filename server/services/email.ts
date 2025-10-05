import { ConfidentialClientApplication } from '@azure/msal-node';
import axios from 'axios';
import type { Customer, Driver, Job } from '@shared/schema';

interface EmailRecipient {
  email: string;
  name?: string;
}

interface EmailData {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  body: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

interface POCEmailData {
  job: Job & { customer?: Customer; driver?: Driver; vehicle?: any };
  pdfBuffer: Buffer;
}

interface PODEmailData {
  job: Job & { customer?: Customer; driver?: Driver; vehicle?: any };
  pdfBuffer: Buffer;
}

interface InvoiceEmailData {
  job: Job & { customer?: Customer; vehicle?: any };
  customer: Customer;
  invoiceNumber: string;
  totalAmount: string;
  pdfBuffer: Buffer;
  expenseProofsPdf?: Buffer;
}

interface PaymentRequiredEmailData {
  job: Job & { customer?: Customer; vehicle?: any };
  paymentUrl: string;
}

interface BundleInvoiceEmailData {
  bundle: any; // InvoiceBundle with customer and invoices relations
  pdfBuffer: Buffer;
}

interface BundlePaymentConfirmationEmailData {
  bundleNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  totalAmount: string;
  paidAmount: string;
  paidAt: Date;
  invoiceCount: number;
  invoiceNumbers: string[];
}

export class EmailService {
  // OAuth2 configuration for Microsoft 365
  private static async getOAuth2AccessToken(): Promise<string> {
    try {
      const clientConfig = {
        auth: {
          clientId: process.env.AZURE_CLIENT_ID!,
          clientSecret: process.env.AZURE_CLIENT_SECRET!,
          authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`
        }
      };

      const cca = new ConfidentialClientApplication(clientConfig);
      
      const clientCredentialRequest = {
        scopes: ['https://graph.microsoft.com/.default'],
        skipCache: false
      };

      const response = await cca.acquireTokenByClientCredential(clientCredentialRequest);
      
      if (!response) {
        throw new Error('Failed to acquire token');
      }
      
      console.log('🔑 OAuth2 token acquired successfully');
      console.log('🔍 Token details:', { scopes: response.scopes, expiresOn: response.expiresOn });
      return response.accessToken;
    } catch (error) {
      console.error('🚨 OAuth2 token acquisition failed:', error);
      console.log('🔍 OAuth2 Config Check:', {
        clientId: process.env.AZURE_CLIENT_ID?.substring(0, 8) + '...',
        tenantId: process.env.AZURE_TENANT_ID?.substring(0, 8) + '...',
        clientSecretLength: process.env.AZURE_CLIENT_SECRET?.length || 0
      });
      throw new Error(`OAuth2 authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async sendViaGraphAPI(emailData: EmailData): Promise<void> {
    try {
      console.log('📧 Starting Graph API email send process...');
      console.log('📧 Recipients:', emailData.to.map(r => r.email));
      console.log('📧 Subject:', emailData.subject);
      
      const accessToken = await this.getOAuth2AccessToken();
      console.log('📧 Access token acquired, length:', accessToken.length);
      
      // Build recipients
      const toRecipients = emailData.to.map(recipient => ({
        emailAddress: {
          address: recipient.email,
          name: recipient.name || ''
        }
      }));
      
      const ccRecipients = emailData.cc?.map(recipient => ({
        emailAddress: {
          address: recipient.email, 
          name: recipient.name || ''
        }
      })) || [];
      
      const bccRecipients = emailData.bcc?.map(recipient => ({
        emailAddress: {
          address: recipient.email,
          name: recipient.name || ''
        }
      })) || [];

      // Build attachments
      const attachments = emailData.attachments?.map(attachment => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: attachment.filename,
        contentType: attachment.contentType,
        contentBytes: attachment.content.toString('base64')
      })) || [];

      const message = {
        subject: emailData.subject,
        body: {
          contentType: 'HTML',
          content: emailData.body
        },
        toRecipients,
        ccRecipients,
        bccRecipients,
        attachments
      };

      console.log('📧 Sending request to Graph API...');
      console.log('📧 Message payload structure:', {
        subject: message.subject,
        recipientCount: toRecipients.length,
        hasBody: !!message.body.content,
        bodyLength: message.body.content.length
      });

      // For client credentials flow, we need to use /users/{user}/sendMail instead of /me/sendMail
      // Use the authenticated service account email
      const senderEmail = 'info@ovmtransport.com';
      
      const response = await axios.post(
        `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`,
        { message },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('📧 Graph API Response Status:', response.status);
      console.log('📧 Graph API Response Headers:', JSON.stringify(response.headers, null, 2));
      console.log('📧 Email sent successfully via Microsoft Graph API to:', emailData.to.map(r => r.email).join(', '));
    } catch (error: any) {
      console.error('📧 Graph API email failed:', error);
      console.error('📧 Error status:', error?.response?.status);
      console.error('📧 Error statusText:', error?.response?.statusText);
      if (error?.response?.data) {
        console.error('📧 Graph API error details:', JSON.stringify(error.response.data, null, 2));
      }
      if (error?.request) {
        console.error('📧 Request config:', {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers ? Object.keys(error.config.headers) : []
        });
      }
      throw new Error(`Failed to send email via Graph API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async sendEmail(emailData: EmailData): Promise<void> {
    console.log('📧 Using Microsoft 365 OAuth2 authentication for email sending');
    await this.sendViaGraphAPI(emailData);
    console.log('✅ Email sent successfully via OAuth2');
  }

  // Helper method to prepare recipients with CC for multiple emails
  private static prepareRecipientsWithCC(emails: string[], customerName: string): { to: EmailRecipient[], cc: EmailRecipient[] } {
    if (!emails || emails.length === 0) {
      return { to: [], cc: [] };
    }
    
    const to = [{ email: emails[0], name: '' }]; // Primary recipient (no customer name)
    const cc = emails.slice(1).map(email => ({ email, name: '' })); // Additional as CC (no fake names)
    
    return { to, cc };
  }

  static formatAddress(address: any): string {
    if (!address) return 'Address not available';
    
    const parts = [];
    if (address.line1) parts.push(address.line1);
    if (address.line2) parts.push(address.line2);
    if (address.city && address.postcode) {
      parts.push(`${address.city}, ${address.postcode}`);
    } else if (address.city) {
      parts.push(address.city);
    } else if (address.postcode) {
      parts.push(address.postcode);
    }
    
    return parts.join('<br>');
  }

  static async sendPOCEmail(data: POCEmailData): Promise<void> {
    const { job, pdfBuffer } = data;
    
    // Get template from database
    const template = await this.getTemplate('poc_ready');
    if (!template) {
      throw new Error('POC template not found');
    }
    
    let to: EmailRecipient[] = [];
    let cc: EmailRecipient[] = [];
    
    // Use customer's configured POC recipients if available
    if (job.customer?.defaultPocEmails && job.customer.defaultPocEmails.length > 0) {
      const recipientData = this.prepareRecipientsWithCC(job.customer.defaultPocEmails, job.customer.name);
      to = recipientData.to;
      cc = recipientData.cc;
      console.log(`📧 POC Email Recipients - Primary: ${to[0]?.email}, CC: ${cc.length > 0 ? cc.map(r => r.email).join(', ') : 'None'}`);
    } else {
      // Fallback to collection contact and customer email
      if (job.collectionContact.email) {
        to.push({
          email: job.collectionContact.email,
          name: job.collectionContact.name,
        });
      }
      
      if (job.customer?.email && job.customer.email !== job.collectionContact.email) {
        cc.push({
          email: job.customer.email,
          name: job.customer.name,
        });
      }
    }

    if (to.length === 0) {
      throw new Error('No email recipients found for POC');
    }

    // Template variables
    const variables = {
      jobNumber: job.jobNumber,
      vehicleRegistration: job.vehicle?.registration || 'N/A',
      vehicleDetails: job.vehicle ? `${job.vehicle.registration} - ${job.vehicle.make}` : 'Vehicle details not available',
      customerName: job.collectionContact.name,
      collectionDate: new Date().toLocaleDateString('en-GB'),
      driverName: job.driver?.name || 'TBC',
      deliveryAddress: this.formatAddress(job.deliveryAddress),
      deliveryContact: `${job.deliveryContact.name} - ${job.deliveryContact.phone}`,
    };

    const subject = this.replaceVariables(template.subject, variables);
    const body = this.replaceVariables(template.htmlContent, variables);

    await this.sendEmail({
      to,
      cc,
      subject,
      body,
      attachments: [
        {
          filename: `POC_${job.jobNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  static async sendPODEmail(data: PODEmailData): Promise<void> {
    const { job, pdfBuffer } = data;
    
    // Get template from database
    const template = await this.getTemplate('pod_ready');
    if (!template) {
      throw new Error('POD template not found');
    }
    
    let to: EmailRecipient[] = [];
    let cc: EmailRecipient[] = [];
    
    // Use customer's configured POD recipients if available
    if (job.customer?.defaultPodEmails && job.customer.defaultPodEmails.length > 0) {
      const recipientData = this.prepareRecipientsWithCC(job.customer.defaultPodEmails, job.customer.name);
      to = recipientData.to;
      cc = recipientData.cc;
      console.log(`📧 POD Email Recipients - Primary: ${to[0]?.email}, CC: ${cc.length > 0 ? cc.map(r => r.email).join(', ') : 'None'}`);
    } else {
      // Fallback to delivery contact and customer email
      if (job.deliveryContact.email) {
        to.push({
          email: job.deliveryContact.email,
          name: job.deliveryContact.name,
        });
      }
      
      if (job.customer?.email && job.customer.email !== job.deliveryContact.email) {
        cc.push({
          email: job.customer.email,
          name: job.customer.name,
        });
      }
    }

    if (to.length === 0) {
      throw new Error('No email recipients found for POD');
    }

    // Template variables
    const variables = {
      jobNumber: job.jobNumber,
      vehicleRegistration: job.vehicle?.registration || 'N/A',
      vehicleDetails: job.vehicle ? `${job.vehicle.registration} - ${job.vehicle.make}` : 'Vehicle details not available',
      deliveryAddress: this.formatAddress(job.deliveryAddress),
      serviceDate: new Date().toLocaleDateString('en-GB'),
    };

    const subject = this.replaceVariables(template.subject, variables);
    const body = this.replaceVariables(template.htmlContent, variables);

    await this.sendEmail({
      to,
      cc,
      subject,
      body,
      attachments: [
        {
          filename: `POD_${job.jobNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  static async sendInvoiceEmail(data: InvoiceEmailData): Promise<void> {
    const { job, customer, invoiceNumber, totalAmount, pdfBuffer, expenseProofsPdf } = data;
    
    // Get template from database
    const template = await this.getTemplate('invoice_ready');
    if (!template) {
      throw new Error('Invoice template not found');
    }
    
    let to: EmailRecipient[] = [];
    let cc: EmailRecipient[] = [];
    
    // Use customer's configured invoice recipients if available
    if (customer.defaultInvoiceEmails && customer.defaultInvoiceEmails.length > 0) {
      const recipientData = this.prepareRecipientsWithCC(customer.defaultInvoiceEmails, customer.name);
      to = recipientData.to;
      cc = recipientData.cc;
      console.log(`📧 Invoice Email Recipients - Primary: ${to[0]?.email}, CC: ${cc.length > 0 ? cc.map(r => r.email).join(', ') : 'None'}`);
    } else {
      // Fallback to customer email
      if (customer.email) {
        to.push({
          email: customer.email,
          name: customer.name,
        });
      }
    }

    if (to.length === 0) {
      throw new Error('No email recipients found for invoice');
    }

    // Template variables
    const variables = {
      customerName: customer.name,
      invoiceNumber,
      totalAmount,
      jobNumber: job.jobNumber,
      vehicleRegistration: job.vehicle?.registration || 'N/A',
      vehicleDetails: job.vehicle ? `${job.vehicle.registration} - ${job.vehicle.make}` : 'Vehicle details not available',
      serviceDate: new Date().toLocaleDateString('en-GB'),
    };

    const subject = this.replaceVariables(template.subject, variables);
    const body = this.replaceVariables(template.htmlContent, variables);

    const attachments = [
      {
        filename: `Invoice_${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }
    ];

    // Add expense proofs if available
    if (expenseProofsPdf) {
      attachments.push({
        filename: `ExpenseProofs_${invoiceNumber}.pdf`,
        content: expenseProofsPdf,
        contentType: 'application/pdf',
      });
    }

    await this.sendEmail({
      to,
      cc,
      subject,
      body,
      attachments,
    });
  }

  static async sendPaymentRequiredEmail(data: PaymentRequiredEmailData): Promise<void> {
    const { job, paymentUrl } = data;
    
    // Get template from database
    const template = await this.getTemplate('payment_required');
    if (!template) {
      throw new Error('Payment required template not found');
    }
    
    let to: EmailRecipient[] = [];
    let cc: EmailRecipient[] = [];
    
    // Use customer's configured invoice recipients if available
    if (job.customer?.defaultInvoiceEmails && job.customer.defaultInvoiceEmails.length > 0) {
      const recipientData = this.prepareRecipientsWithCC(job.customer.defaultInvoiceEmails, job.customer.name);
      to = recipientData.to;
      cc = recipientData.cc;
      console.log(`📧 Payment Email Recipients - Primary: ${to[0]?.email}, CC: ${cc.length > 0 ? cc.map(r => r.email).join(', ') : 'None'}`);
    } else {
      // Fallback to customer email
      if (job.customer?.email) {
        to.push({
          email: job.customer.email,
          name: job.customer.name,
        });
      }
    }

    if (to.length === 0) {
      throw new Error('No email recipients found for payment notification');
    }

    // Template variables
    const variables = {
      customerName: job.customer?.name || 'Customer',
      jobNumber: job.jobNumber,
      vehicleRegistration: job.vehicle?.registration || 'N/A',
      vehicleDetails: job.vehicle ? `${job.vehicle.registration} - ${job.vehicle.make} ${job.vehicle.colour || ''}` : 'Vehicle details not available',
      totalAmount: job.totalMovementFee || '0.00',
      paymentUrl: paymentUrl,
      collectionAddress: this.formatAddress(job.collectionAddress),
      deliveryAddress: this.formatAddress(job.deliveryAddress),
    };

    const subject = this.replaceVariables(template.subject, variables);
    const body = this.replaceVariables(template.htmlContent, variables);

    await this.sendEmail({
      to,
      cc,
      subject,
      body,
    });
    
    console.log(`✅ Payment required email sent for job ${job.jobNumber}`);
  }

  static async sendBundleInvoiceEmail(data: BundleInvoiceEmailData): Promise<void> {
    const { bundle, pdfBuffer } = data;
    
    // Get template from database
    const template = await this.getTemplate('bundle_invoice_ready');
    if (!template) {
      throw new Error('Bundle invoice template not found');
    }
    
    let to: EmailRecipient[] = [];
    let cc: EmailRecipient[] = [];
    
    // Use customer's configured invoice recipients if available
    if (bundle.customer?.defaultInvoiceEmails && bundle.customer.defaultInvoiceEmails.length > 0) {
      const recipientData = this.prepareRecipientsWithCC(bundle.customer.defaultInvoiceEmails, bundle.customer.name);
      to = recipientData.to;
      cc = recipientData.cc;
      console.log(`📧 Bundle Invoice Email Recipients - Primary: ${to[0]?.email}, CC: ${cc.length > 0 ? cc.map(r => r.email).join(', ') : 'None'}`);
    } else {
      // Fallback to customer email
      if (bundle.customer?.email) {
        to.push({
          email: bundle.customer.email,
          name: bundle.customer.name,
        });
      }
    }

    if (to.length === 0) {
      throw new Error('No email recipients found for bundle invoice');
    }

    // Build invoice list for template
    const invoiceList = bundle.invoices?.map((invoice: any) => {
      const job = invoice.job;
      return {
        invoiceNumber: invoice.invoiceNumber,
        jobNumber: job?.jobNumber || 'N/A',
        vehicleRegistration: job?.vehicle?.registration || 'N/A',
        amount: `£${invoice.totalAmount || '0.00'}`,
        description: job?.vehicle ? `${job.vehicle.registration} - ${job.vehicle.make}` : 'Vehicle transport'
      };
    }) || [];

    // Template variables
    const variables = {
      customerName: bundle.customer?.name || 'Customer',
      bundleNumber: bundle.bundleNumber,
      totalAmount: `£${bundle.totalAmount || '0.00'}`,
      invoiceCount: bundle.invoices?.length?.toString() || '0',
      invoicesList: invoiceList.map((inv: any) => 
        `• Invoice ${inv.invoiceNumber} - Job ${inv.jobNumber} (${inv.vehicleRegistration}) - ${inv.amount}`
      ).join('\n'),
      invoicesTable: invoiceList.map((inv: any) => 
        `<tr><td>${inv.invoiceNumber}</td><td>${inv.jobNumber}</td><td>${inv.description}</td><td>${inv.amount}</td></tr>`
      ).join(''),
      serviceDate: new Date().toLocaleDateString('en-GB'),
      bundleDate: bundle.createdAt ? new Date(bundle.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
    };

    const subject = this.replaceVariables(template.subject, variables);
    const body = this.replaceVariables(template.htmlContent, variables);

    await this.sendEmail({
      to,
      cc,
      subject,
      body,
      attachments: [
        {
          filename: `Bundle_${bundle.bundleNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
    
    console.log(`✅ Bundle invoice email sent for bundle ${bundle.bundleNumber}`);
  }

  static async sendBundlePaymentConfirmationEmail(data: BundlePaymentConfirmationEmailData): Promise<void> {
    const { 
      bundleNumber, 
      customerName, 
      customerEmail, 
      totalAmount, 
      paidAmount, 
      paidAt, 
      invoiceCount, 
      invoiceNumbers 
    } = data;
    
    // Get template from database
    const template = await this.getTemplate('bundle_payment_confirmation');
    if (!template) {
      throw new Error('Bundle payment confirmation template not found');
    }
    
    const to: EmailRecipient[] = [{
      email: customerEmail,
      name: customerName,
    }];

    // Template variables
    const variables = {
      customerName,
      bundleNumber,
      totalAmount: `£${totalAmount}`,
      paidAmount: `£${paidAmount}`,
      paymentDate: paidAt.toLocaleDateString('en-GB'),
      paymentTime: paidAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      invoiceCount: invoiceCount.toString(),
      invoicesList: invoiceNumbers.map(num => `• Invoice ${num}`).join('\n'),
      invoicesTable: invoiceNumbers.map(num => 
        `<tr><td>Invoice ${num}</td><td style="color: #10b981; font-weight: 600;">✓ PAID</td></tr>`
      ).join(''),
    };

    const subject = this.replaceVariables(template.subject, variables);
    const body = this.replaceVariables(template.htmlContent, variables);
    
    await this.sendEmail({
      to,
      subject,
      body,
    });
    
    console.log(`✅ Bundle payment confirmation email sent to ${customerEmail} for bundle ${bundleNumber}`);
  }

  static async sendJobAssignmentEmail(job: any): Promise<void> {
    if (!job.driver?.email) {
      console.log('⚠️ No driver email found, skipping assignment notification');
      return;
    }

    // Get template from database
    const template = await this.getTemplate('job_assignment');
    if (!template) {
      throw new Error('Job assignment template not found');
    }

    const to: EmailRecipient[] = [{
      email: job.driver.email,
      name: job.driver.name,
    }];

    const collectionDate = job.requestedCollectionDate 
      ? new Date(job.requestedCollectionDate).toLocaleDateString('en-GB', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : 'TBC';

    // Template variables
    const variables: Record<string, string> = {
      driverName: job.driver.name,
      jobNumber: job.jobNumber,
      vehicleRegistration: job.vehicle?.registration || 'N/A',
      vehicleDetails: job.vehicle ? `${job.vehicle.registration} (${job.vehicle.make})` : 'Vehicle details not available',
      customerName: job.customer?.name || 'Customer',
      collectionDate: collectionDate,
      collectionAddress: this.formatAddress(job.collectionAddress),
      deliveryAddress: this.formatAddress(job.deliveryAddress),
      collectionContact: job.collectionContact?.name ? `${job.collectionContact.name}${job.collectionContact.phone ? ` - ${job.collectionContact.phone}` : ''}` : '',
      deliveryContact: job.deliveryContact?.name ? `${job.deliveryContact.name}${job.deliveryContact.phone ? ` - ${job.deliveryContact.phone}` : ''}` : '',
    };

    // Add optional fields only if they have values (these are nested in contact objects)
    if (job.collectionContact?.releaseCode) {
      variables.releaseCode = job.collectionContact.releaseCode;
    }
    if (job.collectionContact?.modelPin) {
      variables.modelPin = job.collectionContact.modelPin;
    }
    if (job.collectionContact?.notes) {
      variables.collectionNotes = job.collectionContact.notes;
    }
    if (job.deliveryContact?.notes) {
      variables.deliveryNotes = job.deliveryContact.notes;
    }

    const subject = this.replaceVariables(template.subject, variables);
    let body = this.replaceVariables(template.htmlContent, variables);
    
    // Remove lines with unreplaced variables (empty optional fields)
    body = this.removeUnreplacedVariableLines(body);

    await this.sendEmail({
      to,
      subject,
      body,
    });

    console.log(`✅ Job assignment email sent to ${job.driver.name} (${job.driver.email}) for job ${job.jobNumber}`);
  }

  private static async getTemplate(type: string) {
    const { storage } = await import('../storage');
    return await storage.getEmailTemplateByType(type);
  }

  private static replaceVariables(content: string, variables: Record<string, string>): string {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value || '');
    }
    return result;
  }

  private static removeUnreplacedVariableLines(content: string): string {
    let result = content;
    
    // Remove lines with unreplaced variables: <p>...<strong>Label:</strong> {variable}</p>
    result = result.replace(/<p[^>]*>.*?\{[^}]+\}.*?<\/p>/gi, '');
    
    // Remove lines where label exists but content is empty
    // Pattern matches: <p><strong>Contact:</strong> </p> or <p><strong>Notes:</strong> </p>
    result = result.replace(/<p[^>]*>\s*<strong>[^<]*:<\/strong>\s*<\/p>/gi, '');
    
    return result;
  }
}