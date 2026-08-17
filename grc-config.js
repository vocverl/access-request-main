/**
 * SAP GRC Access Control 12.0 Configuratie
 * Vitens Access Request Portal
 *
 * Gebaseerd op: Jira-SAP GRC Scopingsdocument PrePend
 */

const GRC_CONFIG = {
    // Timeout voor aanroepen naar de connector.
    //
    // Serveradres en credentials staan hier bewust NIET meer. De browser
    // praat alleen met zijn eigen origin; de connector kent GRD en houdt het
    // service account in het serverproces. Zie server/config.js en .env.
    server: {
        protocol: 'SOAP',
        version: '12.0',
        timeout: 30000 // 30 seconden
    },

    // SAP GRC Web Services (SOAP)
    // Zie SAP-note 2737236 – Webservice-API voor GRC 12.0
    webservices: {
        // 1. Zoeken naar beschikbare SAP-rollen
        searchRoles: {
            name: 'GRAC_SEARCH_ROLES_WS',
            endpoint: '/sap/bc/srt/rfc/sap/grac_search_roles_ws/002/grac_search_roles_ws/grac_search_roles_ws',
            method: 'POST',
            description: 'Realtime zoeken naar beschikbare SAP-rollen',
            sla: 2000, // 2 seconden
            parameters: {
                // Zie SAP-note 2737236
                searchTerm: 'STRING',
                system: 'STRING',
                roleType: 'STRING',
                applicationDomain: 'STRING'
            },
            returnFields: [
                'RoleName',
                'RoleDesc',
                'System',
                'RoleType',
                'ApplicationDomain'
            ]
        },

        // 2. Access Request indienen
        createRequest: {
            name: 'GRAC_ORG_ASGN_REQUEST_WS',
            endpoint: '/sap/bc/srt/rfc/sap/grac_org_asgn_request_ws/002/grac_org_asgn_request_ws/grac_org_asgn_request_ws',
            method: 'POST',
            description: 'Versturen van gekozen rollen naar SAP GRC - creëert Access Request (ARQ)',
            sla: 3000, // 3 seconden
            parameters: {
                requesterId: 'STRING',      // Aanvrager-ID
                userId: 'STRING',           // Gebruiker-ID (default = aanvrager)
                roles: 'ARRAY',             // Rollenlijst met geldigheidsdata
                validFrom: 'DATE',          // Geldig vanaf datum
                validTo: 'DATE',            // Geldig tot datum
                refTicketNo: 'STRING',      // Referentie Jira-Issue-ID
                justification: 'STRING'     // Reden voor aanvraag
            },
            returnFields: [
                'RequestID'  // Request-ID om op te slaan in custom Jira-veld
            ]
        },

        // 3. Request details ophalen
        getRequestDetails: {
            name: 'GRAC_REQUEST_DETAILS_WS',
            endpoint: '/sap/bc/srt/rfc/sap/grac_request_details_ws/002/grac_request_details_ws/grac_request_details_ws',
            method: 'POST',
            description: 'Ophalen van gedetailleerde informatie over een access request',
            parameters: {
                requestId: 'STRING'
            },
            returnFields: [
                'RequestID',
                'Status',
                'Requester',
                'User',
                'Roles',
                'CreatedDate',
                'ApprovalDate',
                'ProvisioningDate'
            ]
        },

        // 4. Request status ophalen (voor polling)
        getRequestStatus: {
            name: 'GRAC_REQUEST_STATUS_WS',
            endpoint: '/sap/bc/srt/rfc/sap/grac_request_status_ws/002/grac_request_status_ws/grac_request_status_ws',
            method: 'POST',
            description: 'Poll of push vanuit GRC - Statusweergave in Jira',
            pollingInterval: 900000, // 15 minuten (in milliseconden)
            parameters: {
                requestId: 'STRING'
            },
            returnFields: [
                'RequestID',
                'Status',
                'StatusText',
                'LastUpdated'
            ]
        }
    },

    // Status mapping GRC → UI
    statusMapping: {
        'NEW': {
            label: 'Nieuw',
            color: '#4aaedf',
            icon: '📝',
            description: 'Aanvraag is aangemaakt'
        },
        'PENDING_MANAGER': {
            label: 'Wacht op Manager',
            color: '#ff9800',
            icon: '⏳',
            description: 'Wacht op goedkeuring manager'
        },
        'PENDING_ROLE_OWNER': {
            label: 'Wacht op Role Owner',
            color: '#ff9800',
            icon: '⏳',
            description: 'Wacht op goedkeuring role owner'
        },
        'PENDING_RISK_OWNER': {
            label: 'Wacht op Risk Owner',
            color: '#ff9800',
            icon: '⏳',
            description: 'Wacht op goedkeuring risk owner'
        },
        'APPROVED': {
            label: 'Goedgekeurd',
            color: '#4caf50',
            icon: '✅',
            description: 'Aanvraag is goedgekeurd'
        },
        'PROVISIONING': {
            label: 'Wordt ingericht',
            color: '#2196f3',
            icon: '⚙️',
            description: 'Automatische provisioning loopt'
        },
        'PROVISIONED': {
            label: 'Ingericht',
            color: '#4caf50',
            icon: '✅',
            description: 'Rollen zijn succesvol toegewezen'
        },
        'REJECTED': {
            label: 'Afgewezen',
            color: '#d32f2f',
            icon: '❌',
            description: 'Aanvraag is afgewezen'
        },
        'CANCELLED': {
            label: 'Geannuleerd',
            color: '#9e9e9e',
            icon: '🚫',
            description: 'Aanvraag is geannuleerd'
        },
        'ERROR': {
            label: 'Fout',
            color: '#d32f2f',
            icon: '⚠️',
            description: 'Er is een fout opgetreden tijdens verwerking'
        }
    },

    // Goedkeuringsworkflow (alleen ter info - verloopt in SAP GRC)
    // Manager → Role Owner → Risk Owner → Auto-provisioning
    approvalWorkflow: {
        enabled: false, // Workflow verloopt in SAP GRC ARM
        description: 'Goedkeuringsworkflow verloopt in SAP GRC volgens bestaand schema',
        steps: [
            { order: 1, role: 'Manager', description: 'Manager goedkeuring' },
            { order: 2, role: 'Role Owner', description: 'Role owner goedkeuring' },
            { order: 3, role: 'Risk Owner', description: 'Risk owner goedkeuring' },
            { order: 4, role: 'GRC System', description: 'Auto-provisioning naar SAP ECC/S4' }
        ]
    },

    // Performance & SLA eisen
    performance: {
        searchMaxTime: 2000,      // Zoeken ≤ 2 seconden
        submitMaxTime: 3000,      // Submit ≤ 3 seconden
        uptime: 99.5,             // Uptime ≥ 99,5%
        maxRequestsPerDay: 50     // Schaalbaarheid: 50 access requests per dag
    },

    // Security instellingen
    security: {
        protocol: 'HTTPS',
        tlsVersion: '1.2+',
        owaspCompliant: true,
        auditLogging: true,
        encryptCredentials: true
    },

    // Polling configuratie voor status updates
    polling: {
        enabled: true,
        interval: 900000,         // 15 minuten
        maxAttempts: 96,          // 24 uur bij 15 min interval
        stopOnFinalStatus: true,
        finalStatuses: ['PROVISIONED', 'REJECTED', 'CANCELLED', 'ERROR']
    },

    // UI/UX voorkeuren
    ui: {
        language: 'nl',
        dateFormat: 'DD-MM-YYYY',
        timeFormat: 'HH:mm',
        timezone: 'Europe/Amsterdam',
        itemsPerPage: 20,
        enableFilters: true,
        enablePersonalization: true,  // Onthoudt laatste filters
        suggestFrequentRoles: false    // Optioneel - suggereer veelgebruikte rollen
    },

    // Facetten voor zoekresultaten
    searchFacets: {
        system: {
            label: 'Systeem',
            enabled: true
        },
        roleType: {
            label: 'Roltype',
            enabled: true
        },
        applicationDomain: {
            label: 'Applicatiedomein',
            enabled: true
        }
    },

    // Custom Jira velden (voor integratie)
    jiraFields: {
        requestId: 'customfield_10001',     // SAP GRC Request ID
        status: 'customfield_10002',         // SAP GRC Status
        requestedRoles: 'customfield_10003', // Aangevraagde rollen
        lastSync: 'customfield_10004'        // Laatste sync tijdstip
    },

    // Error handling
    errorHandling: {
        retryAttempts: 3,
        retryDelay: 1000,  // 1 seconde tussen retries
        fallbackToLocal: true,
        showUserFriendlyErrors: true
    },

    // Deployment
    deployment: {
        environment: 'datacenter',  // 'datacenter' of 'cloud'
        cloudMigrationPlanned: true,
        version: '1.0.0'
    }
};

// Exporteer configuratie
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GRC_CONFIG;
}
