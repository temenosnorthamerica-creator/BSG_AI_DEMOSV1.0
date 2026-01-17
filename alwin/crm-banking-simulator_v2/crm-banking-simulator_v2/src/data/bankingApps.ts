import { BankingApplication, APIDefinition, EventDefinition } from '../types';

export const bankingApplications: BankingApplication[] = [
  {
    id: 'onboarding',
    name: 'Customer Onboarding',
    icon: 'UserPlus',
    color: '#10B981',
    description: 'New customer acquisition and account opening journey',
    journeySteps: [
      {
        id: 'lead-capture',
        title: 'Lead Capture',
        description: 'Capture prospect information from various channels',
        status: 'pending',
        icon: 'UserSearch',
        crmActions: [
          {
            id: 'create-lead',
            type: 'api',
            name: 'Create Lead',
            description: 'Create new lead in CRM from bank website or branch',
            endpoint: '/api/crm/leads',
            method: 'POST',
            payload: {
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@email.com',
              phone: '+1234567890',
              source: 'WEBSITE',
              productInterest: 'SAVINGS_ACCOUNT'
            },
            temenosMapping: 'T24.CUSTOMER.PROSPECT'
          }
        ]
      },
      {
        id: 'customer-creation',
        title: 'Customer Creation',
        description: 'Create customer record in Temenos core banking',
        status: 'pending',
        icon: 'UserCheck',
        crmActions: [
          {
            id: 'create-customer',
            type: 'api',
            name: 'Create Customer',
            description: 'Create individual customer via Temenos Party API',
            endpoint: '/irf-provider-container/api/v4.1.0/party/us/customers/individuals',
            method: 'POST',
            payload: {
              header: {},
              body: {
                givenName: '{{$randomFirstName}}',
                middleName: 'A',
                lastName: '{{$randomLastName}}',
                nationalityId: 'US',
                dateOfBirth: '1983-05-01',
                sectorId: 1001,
                communicationDevices: [
                  {
                    emailId: 'test@test.com'
                  }
                ],
                languageId: 1,
                addressLine1: 'asasa'
              }
            },
            temenosMapping: 'PARTY.CUSTOMER.INDIVIDUAL'
          },
          {
            id: 'customer-created-event',
            type: 'event',
            name: 'Customer Created',
            description: 'Event triggered when customer is successfully created',
            eventType: 'inbound',
            payload: {
              customerId: '{{CustLite}}',
              status: 'ACTIVE',
              createdAt: '2024-01-15T10:30:00Z'
            },
            temenosMapping: 'TEMENOS.CUSTOMER.CREATED'
          }
        ]
      },
      {
        id: 'kyc-verification',
        title: 'KYC Verification',
        description: 'Identity verification and document collection',
        status: 'pending',
        icon: 'Shield',
        crmActions: [
          {
            id: 'kyc-request',
            type: 'api',
            name: 'Initiate KYC',
            description: 'Start KYC verification process',
            endpoint: '/api/crm/leads/{leadId}/kyc',
            method: 'POST',
            payload: {
              documentType: 'PASSPORT',
              documentNumber: 'AB123456',
              issuingCountry: 'US'
            },
            temenosMapping: 'T24.KYC.DOCUMENT'
          },
          {
            id: 'kyc-complete-event',
            type: 'event',
            name: 'KYC Completed',
            description: 'Event triggered when KYC verification completes',
            eventType: 'inbound',
            payload: {
              leadId: 'LEAD001',
              kycStatus: 'VERIFIED',
              riskScore: 'LOW'
            },
            temenosMapping: 'TEMENOS.KYC.VERIFIED'
          }
        ]
      },
      {
        id: 'account-creation',
        title: 'Account Creation',
        description: 'Create consumer checking account in Temenos',
        status: 'pending',
        icon: 'Wallet',
        crmActions: [
          {
            id: 'create-account',
            type: 'api',
            name: 'Create Consumer Account',
            description: 'Create consumer checking account via Temenos Holdings API',
            endpoint: '/irf-provider-container/api/v6.1.0/holdings/us/accounts/consumerAccounts',
            method: 'POST',
            payload: {
              header: {
                override: {
                  overrideDetails: [
                    {
                      code: 'O-12549',
                      description: 'Bucket Override O-12549',
                      id: 'AA.INT.SRC.TYP.AND.PAY.MET.MISMATCH',
                      type: 'Override'
                    }
                  ]
                }
              },
              body: {
                customerIds: [
                  {
                    customerId: '{{CustLite}}'
                  }
                ],
                activityId: 'ACCOUNTS-NEW-ARRANGEMENT',
                currencyId: 'USD',
                productId: 'CONS.CHECKING',
                officers: {
                  primaryOfficer: 3
                },
                balance: {
                  shortTitle: 'Investor Checking Account',
                  fdicClassCode: 3,
                  fdicOwnershipCode: 'S',
                  purposeCode: 5,
                  accountType: 'CHECKING'
                },
                statement: {
                  statement1Frequency: 'M0131',
                  attributeNamevalue: 'Print.Option',
                  fqu1PrintAttrValue1: 'ESTATEMENT'
                },
                schedule: [
                  {
                    payment: [
                      {
                        paymentType: 'INTEREST',
                        paymentMethod: 'DUE'
                      },
                      {
                        paymentType: 'CHARGE',
                        paymentMethod: 'DUE'
                      },
                      {
                        paymentType: 'PERIODICCHARGE',
                        paymentMethod: 'DUE'
                      }
                    ]
                  }
                ]
              }
            },
            temenosMapping: 'AA.ARRANGEMENT.ACTIVITY'
          },
          {
            id: 'account-created-event',
            type: 'event',
            name: 'Account Created',
            description: 'Event from Temenos when account is created',
            eventType: 'inbound',
            payload: {
              customerId: '{{CustLite}}',
              accountNumber: '{{AccountId}}',
              accountType: 'CHECKING',
              productId: 'CONS.CHECKING'
            },
            temenosMapping: 'TEMENOS.ACCOUNT.CREATED'
          }
        ]
      },
      {
        id: 'welcome-journey',
        title: 'Welcome Journey',
        description: 'Automated customer engagement and product recommendations',
        status: 'pending',
        icon: 'Heart',
        crmActions: [
          {
            id: 'trigger-welcome',
            type: 'event',
            name: 'Trigger Welcome Campaign',
            description: 'Initiate welcome email series and product suggestions',
            eventType: 'outbound',
            payload: {
              customerId: '{{CustLite}}',
              campaignId: 'WELCOME_2024',
              channels: ['EMAIL', 'SMS', 'PUSH']
            },
            temenosMapping: 'CRM.CAMPAIGN.TRIGGER'
          }
        ]
      }
    ]
  },
  {
    id: 'cards',
    name: 'Cards Management',
    icon: 'CreditCard',
    color: '#3B82F6',
    description: 'Credit and debit card lifecycle management',
    journeySteps: [
      {
        id: 'card-application',
        title: 'Card Application',
        description: 'Customer applies for a new card product',
        status: 'pending',
        icon: 'FileText',
        crmActions: [
          {
            id: 'create-opportunity',
            type: 'api',
            name: 'Create Card Opportunity',
            description: 'Create sales opportunity for card product',
            endpoint: '/api/crm/opportunities',
            method: 'POST',
            payload: {
              customerId: 'CUST001',
              productType: 'CREDIT_CARD',
              productCode: 'PLATINUM_REWARDS',
              requestedLimit: 10000,
              stage: 'QUALIFICATION'
            },
            temenosMapping: 'T24.AA.ARRANGEMENT'
          }
        ]
      },
      {
        id: 'credit-assessment',
        title: 'Credit Assessment',
        description: 'Evaluate customer creditworthiness',
        status: 'pending',
        icon: 'BarChart3',
        crmActions: [
          {
            id: 'credit-check',
            type: 'api',
            name: 'Request Credit Score',
            description: 'Fetch credit score from bureau via Temenos',
            endpoint: '/api/crm/customers/{customerId}/credit-check',
            method: 'GET',
            temenosMapping: 'T24.CREDIT.BUREAU.CHECK'
          },
          {
            id: 'credit-result-event',
            type: 'event',
            name: 'Credit Result Received',
            description: 'Credit assessment result from Temenos',
            eventType: 'inbound',
            payload: {
              customerId: 'CUST001',
              creditScore: 750,
              approvedLimit: 15000,
              decision: 'APPROVED'
            },
            temenosMapping: 'TEMENOS.CREDIT.RESULT'
          }
        ]
      },
      {
        id: 'card-issuance',
        title: 'Card Issuance',
        description: 'Issue and activate the new card',
        status: 'pending',
        icon: 'CreditCard',
        crmActions: [
          {
            id: 'issue-card',
            type: 'api',
            name: 'Issue Card',
            description: 'Trigger card issuance in core banking',
            endpoint: '/api/crm/opportunities/{oppId}/issue-card',
            method: 'POST',
            payload: {
              cardType: 'VIRTUAL_FIRST',
              deliveryAddress: 'HOME'
            },
            temenosMapping: 'T24.CARD.ISSUE'
          },
          {
            id: 'card-issued-event',
            type: 'event',
            name: 'Card Issued',
            description: 'Notification when card is issued',
            eventType: 'inbound',
            payload: {
              cardNumber: '****1234',
              expiryDate: '12/27',
              status: 'ACTIVE'
            },
            temenosMapping: 'TEMENOS.CARD.ISSUED'
          }
        ]
      },
      {
        id: 'card-activation',
        title: 'Card Activation',
        description: 'Customer activates and starts using the card',
        status: 'pending',
        icon: 'CheckCircle',
        crmActions: [
          {
            id: 'activate-card',
            type: 'api',
            name: 'Activate Card',
            description: 'Activate card for transactions',
            endpoint: '/api/crm/cards/{cardId}/activate',
            method: 'POST',
            payload: {
              activationCode: '1234',
              setPin: true
            },
            temenosMapping: 'T24.CARD.ACTIVATE'
          },
          {
            id: 'first-transaction-event',
            type: 'event',
            name: 'First Transaction',
            description: 'Track first card usage for engagement',
            eventType: 'inbound',
            payload: {
              transactionId: 'TXN001',
              amount: 50.00,
              merchant: 'Coffee Shop'
            },
            temenosMapping: 'TEMENOS.CARD.TRANSACTION'
          }
        ]
      }
    ]
  },
  {
    id: 'digital',
    name: 'Digital Banking',
    icon: 'Smartphone',
    color: '#8B5CF6',
    description: 'Mobile and online banking enrollment and services',
    journeySteps: [
      {
        id: 'digital-enrollment',
        title: 'Digital Enrollment',
        description: 'Customer registers for digital banking',
        status: 'pending',
        icon: 'UserCheck',
        crmActions: [
          {
            id: 'enroll-digital',
            type: 'api',
            name: 'Enroll Digital Banking',
            description: 'Register customer for online/mobile banking',
            endpoint: '/api/crm/customers/{customerId}/digital-enroll',
            method: 'POST',
            payload: {
              channels: ['MOBILE', 'WEB'],
              username: 'johndoe',
              mfaMethod: 'SMS'
            },
            temenosMapping: 'T24.DIGITAL.ENROLLMENT'
          }
        ]
      },
      {
        id: 'app-activation',
        title: 'App Activation',
        description: 'First login and app setup',
        status: 'pending',
        icon: 'Smartphone',
        crmActions: [
          {
            id: 'app-login-event',
            type: 'event',
            name: 'First App Login',
            description: 'Track customer first mobile app login',
            eventType: 'inbound',
            payload: {
              customerId: 'CUST001',
              device: 'iOS',
              appVersion: '3.2.1'
            },
            temenosMapping: 'TEMENOS.DIGITAL.LOGIN'
          },
          {
            id: 'setup-alerts',
            type: 'api',
            name: 'Configure Alerts',
            description: 'Set up transaction and balance alerts',
            endpoint: '/api/crm/customers/{customerId}/alerts',
            method: 'POST',
            payload: {
              balanceAlert: { threshold: 100, frequency: 'DAILY' },
              transactionAlert: { enabled: true, minAmount: 50 }
            },
            temenosMapping: 'T24.ALERT.CONFIGURATION'
          }
        ]
      },
      {
        id: 'feature-adoption',
        title: 'Feature Adoption',
        description: 'Track and encourage feature usage',
        status: 'pending',
        icon: 'Layers',
        crmActions: [
          {
            id: 'feature-usage-event',
            type: 'event',
            name: 'Feature Usage Tracked',
            description: 'Monitor digital feature adoption',
            eventType: 'inbound',
            payload: {
              customerId: 'CUST001',
              feature: 'MOBILE_DEPOSIT',
              usageCount: 5
            },
            temenosMapping: 'TEMENOS.DIGITAL.FEATURE'
          },
          {
            id: 'recommend-feature',
            type: 'event',
            name: 'Feature Recommendation',
            description: 'Suggest unused features to customer',
            eventType: 'outbound',
            payload: {
              customerId: 'CUST001',
              recommendedFeature: 'BILL_PAY',
              channel: 'IN_APP'
            },
            temenosMapping: 'CRM.FEATURE.RECOMMEND'
          }
        ]
      },
      {
        id: 'digital-engagement',
        title: 'Digital Engagement',
        description: 'Ongoing customer engagement through digital channels',
        status: 'pending',
        icon: 'MessageCircle',
        crmActions: [
          {
            id: 'send-notification',
            type: 'api',
            name: 'Send Push Notification',
            description: 'Send personalized notification to customer',
            endpoint: '/api/crm/customers/{customerId}/notify',
            method: 'POST',
            payload: {
              type: 'PROMOTIONAL',
              title: 'New Feature Available',
              message: 'Try our new budgeting tool!',
              deepLink: '/features/budget'
            },
            temenosMapping: 'T24.NOTIFICATION.SEND'
          }
        ]
      }
    ]
  },
  {
    id: 'payments',
    name: 'ACH & Wires',
    icon: 'ArrowLeftRight',
    color: '#F59E0B',
    description: 'ACH transfers and wire payment processing',
    journeySteps: [
      {
        id: 'payee-setup',
        title: 'Payee Setup',
        description: 'Customer adds new payment beneficiary',
        status: 'pending',
        icon: 'UserPlus',
        crmActions: [
          {
            id: 'add-payee',
            type: 'api',
            name: 'Add Payee',
            description: 'Register new payment beneficiary',
            endpoint: '/api/crm/customers/{customerId}/payees',
            method: 'POST',
            payload: {
              payeeName: 'ABC Corp',
              accountNumber: '9876543210',
              routingNumber: '021000021',
              payeeType: 'BUSINESS',
              paymentMethod: 'ACH'
            },
            temenosMapping: 'T24.BENEFICIARY'
          }
        ]
      },
      {
        id: 'payment-initiation',
        title: 'Payment Initiation',
        description: 'Customer initiates ACH or wire transfer',
        status: 'pending',
        icon: 'Send',
        crmActions: [
          {
            id: 'initiate-payment',
            type: 'api',
            name: 'Initiate Payment',
            description: 'Create payment instruction',
            endpoint: '/api/crm/payments',
            method: 'POST',
            payload: {
              customerId: 'CUST001',
              payeeId: 'PAYEE001',
              amount: 5000,
              currency: 'USD',
              paymentType: 'ACH',
              purpose: 'Invoice Payment',
              scheduledDate: '2024-01-15'
            },
            temenosMapping: 'T24.FUNDS.TRANSFER'
          },
          {
            id: 'payment-created-event',
            type: 'event',
            name: 'Payment Created',
            description: 'Confirmation of payment creation',
            eventType: 'inbound',
            payload: {
              paymentId: 'PMT001',
              status: 'PENDING_APPROVAL',
              estimatedSettlement: '2024-01-17'
            },
            temenosMapping: 'TEMENOS.PAYMENT.CREATED'
          }
        ]
      },
      {
        id: 'payment-processing',
        title: 'Payment Processing',
        description: 'Payment validation and processing',
        status: 'pending',
        icon: 'RefreshCw',
        crmActions: [
          {
            id: 'payment-status-event',
            type: 'event',
            name: 'Payment Status Update',
            description: 'Real-time payment status from clearing',
            eventType: 'inbound',
            payload: {
              paymentId: 'PMT001',
              status: 'PROCESSING',
              clearingNetwork: 'ACH',
              batchId: 'BATCH20240115'
            },
            temenosMapping: 'TEMENOS.PAYMENT.STATUS'
          },
          {
            id: 'check-payment',
            type: 'api',
            name: 'Check Payment Status',
            description: 'Query current payment status',
            endpoint: '/api/crm/payments/{paymentId}/status',
            method: 'GET',
            temenosMapping: 'T24.PAYMENT.ENQUIRY'
          }
        ]
      },
      {
        id: 'payment-completion',
        title: 'Payment Completion',
        description: 'Payment settled and confirmed',
        status: 'pending',
        icon: 'CheckCircle2',
        crmActions: [
          {
            id: 'payment-complete-event',
            type: 'event',
            name: 'Payment Completed',
            description: 'Final settlement confirmation',
            eventType: 'inbound',
            payload: {
              paymentId: 'PMT001',
              status: 'COMPLETED',
              settledAmount: 5000,
              settledDate: '2024-01-17',
              confirmationNumber: 'ACH20240117001'
            },
            temenosMapping: 'TEMENOS.PAYMENT.SETTLED'
          },
          {
            id: 'send-receipt',
            type: 'event',
            name: 'Send Payment Receipt',
            description: 'Notify customer of successful payment',
            eventType: 'outbound',
            payload: {
              customerId: 'CUST001',
              paymentId: 'PMT001',
              channels: ['EMAIL', 'SMS']
            },
            temenosMapping: 'CRM.NOTIFICATION.PAYMENT'
          }
        ]
      }
    ]
  }
];

export const crmAPIs: APIDefinition[] = [
  {
    name: 'Create Lead',
    endpoint: 'POST /api/crm/leads',
    method: 'POST',
    description: 'Create a new prospect/lead in the CRM system',
    requestPayload: {
      firstName: 'string',
      lastName: 'string',
      email: 'string',
      phone: 'string',
      source: 'WEBSITE | BRANCH | REFERRAL | CAMPAIGN',
      productInterest: 'SAVINGS_ACCOUNT | CHECKING | CREDIT_CARD | LOAN',
      metadata: {
        campaignId: 'string (optional)',
        referralCode: 'string (optional)'
      }
    },
    responsePayload: {
      success: true,
      data: {
        leadId: 'LEAD001',
        status: 'NEW',
        createdAt: '2024-01-15T10:30:00Z',
        assignedTo: 'REP001'
      }
    },
    temenosIntegration: {
      api: 'T24.CUSTOMER.PROSPECT',
      description: 'Maps to Temenos Prospect table for lead tracking'
    }
  },
  {
    name: 'Create Contact',
    endpoint: 'POST /api/crm/contacts',
    method: 'POST',
    description: 'Create or update customer contact information',
    requestPayload: {
      customerId: 'string',
      contactType: 'PRIMARY | SECONDARY | BUSINESS',
      email: 'string',
      phone: 'string',
      address: {
        street: 'string',
        city: 'string',
        state: 'string',
        zipCode: 'string',
        country: 'string'
      },
      preferences: {
        contactMethod: 'EMAIL | SMS | PHONE',
        marketingOptIn: 'boolean'
      }
    },
    responsePayload: {
      success: true,
      data: {
        contactId: 'CONT001',
        customerId: 'CUST001',
        verified: false,
        updatedAt: '2024-01-15T10:30:00Z'
      }
    },
    temenosIntegration: {
      api: 'T24.CUSTOMER',
      description: 'Syncs with Temenos Customer master data'
    }
  },
  {
    name: 'Create Opportunity',
    endpoint: 'POST /api/crm/opportunities',
    method: 'POST',
    description: 'Create a sales opportunity for product cross-sell',
    requestPayload: {
      customerId: 'string',
      productType: 'CREDIT_CARD | LOAN | MORTGAGE | INVESTMENT',
      productCode: 'string',
      estimatedValue: 'number',
      stage: 'QUALIFICATION | PROPOSAL | NEGOTIATION | CLOSED_WON | CLOSED_LOST',
      probability: 'number (0-100)',
      notes: 'string (optional)'
    },
    responsePayload: {
      success: true,
      data: {
        opportunityId: 'OPP001',
        customerId: 'CUST001',
        stage: 'QUALIFICATION',
        createdAt: '2024-01-15T10:30:00Z',
        nextAction: 'Schedule product consultation'
      }
    },
    temenosIntegration: {
      api: 'T24.AA.ARRANGEMENT',
      description: 'Creates arrangement in Temenos when opportunity converts'
    }
  }
];

export const crmEvents: EventDefinition[] = [
  {
    name: 'Customer.Created',
    type: 'inbound',
    description: 'Triggered when a new customer is created in Temenos',
    payload: {
      eventType: 'Customer.Created',
      timestamp: '2024-01-15T10:30:00Z',
      data: {
        customerId: 'CUST001',
        customerType: 'INDIVIDUAL',
        segment: 'RETAIL',
        onboardingChannel: 'DIGITAL'
      }
    },
    temenosEvent: 'TEMENOS.CUSTOMER.CREATED'
  },
  {
    name: 'Account.StatusChanged',
    type: 'inbound',
    description: 'Triggered when account status changes in core banking',
    payload: {
      eventType: 'Account.StatusChanged',
      timestamp: '2024-01-15T10:30:00Z',
      data: {
        accountId: 'ACC001',
        customerId: 'CUST001',
        previousStatus: 'PENDING',
        newStatus: 'ACTIVE'
      }
    },
    temenosEvent: 'TEMENOS.ACCOUNT.STATUS'
  },
  {
    name: 'Campaign.Triggered',
    type: 'outbound',
    description: 'CRM triggers marketing campaign to Temenos for execution',
    payload: {
      eventType: 'Campaign.Triggered',
      timestamp: '2024-01-15T10:30:00Z',
      data: {
        campaignId: 'CAMP001',
        targetCustomers: ['CUST001', 'CUST002'],
        channel: 'EMAIL',
        templateId: 'TEMPLATE_WELCOME'
      }
    },
    temenosEvent: 'CRM.CAMPAIGN.EXECUTE'
  }
];
