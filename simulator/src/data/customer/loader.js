// === ZeroOps Customer Data Loader ===
// Single source of truth for all customer data.
// To switch customer: change ACTIVE_CUSTOMER below.

// --- Canon Europa imports ---
import enterpriseCustomer from './enterprise/customer.json';
import enterpriseCredentials from './enterprise/credentials.json';
import enterpriseRoles from './enterprise/roles.json';
import enterpriseIncidents from './enterprise/incidents.json';
import enterpriseRequests from './enterprise/requests.json';
import enterpriseSilentOps from './enterprise/silent_ops.json';
import enterpriseSuggestions from './enterprise/chat_suggestions.json';
import enterpriseMIMTeams from './enterprise/mim_teams.json';
import enterpriseAgents from './enterprise/agents.json';
import enterpriseKB from './enterprise/kb_articles.json';
import enterpriseApps from './enterprise/applications.json';
import enterpriseMetrics from './enterprise/metrics.json';
import enterpriseScenarios from './enterprise/scenarios.json';
import enterpriseIntegrations from './enterprise/integrations.json';
const enterpriseGVIC = null;

// *** CHANGE THIS LINE TO SWITCH CUSTOMER ***
const ACTIVE_CUSTOMER = 'enterprise'; // options: "canon" | "agfa" | "elisa"
// *** END SWITCH ***

const CUSTOMERS = {
  enterprise: {
    customer: enterpriseCustomer,
    credentials: enterpriseCredentials,
    roles: enterpriseRoles,
    incidents: enterpriseIncidents.incidents,
    requests: enterpriseRequests,
    silentOps: enterpriseSilentOps,
    suggestions: enterpriseSuggestions.suggestions,
    mimTeams: enterpriseMIMTeams,
    agents: enterpriseAgents.agents,
    kb: enterpriseKB.articles,
    gvic: enterpriseGVIC,
    apps: enterpriseApps.domains || enterpriseApps.chains,
    metrics: enterpriseMetrics,
    scenarios: enterpriseScenarios.scenarios,
    integrations: enterpriseIntegrations.groups,
  },
};

const C = CUSTOMERS[ACTIVE_CUSTOMER];

// --- Exports ---
export const CUSTOMER = C.customer;
export const ITSM = C.customer?.itsm || 'ITSM';
export const INTEGRATION_GROUPS = C.integrations || [];
export const CREDENTIALS =
  C.credentials?.credentials || C.credentials?.roles || [];
export const ROLES = C.roles?.roles || C.roles || [];
export const NAV_ITEMS = C.roles?.navItems || [];
export const INCIDENTS_DATA = C.incidents;
export const INCIDENT_INTEL = Object.fromEntries(
  (C.incidents || []).map((i) => [i.id, i.intel || {}])
);
export const REQUEST_STATS = C.requests?.stats || C.requests || {};
export const REQUEST_CATALOGUE =
  C.requests?.catalogue || C.requests?.categories || [];
export const REQUEST_QUEUE = C.requests?.queue || [];
export const SILENT_LOG = C.silentOps?.log || [];
export const DAILY_STATS = C.silentOps?.dailyStats || [];
export const CHAT_SUGGESTIONS = C.suggestions;
export const MIM_TEAMS = C.mimTeams;
export const MIM_SME_ROSTER = C.mimTeams?.smeRoster || {};
export const MIM_LIVE_METRICS = C.mimTeams?.liveMetrics || {};
export const MIM_WAR_ROOM_CHAT = C.mimTeams?.warRoomChat || {};
export const MIM_VENDOR_ESCALATIONS = C.mimTeams?.vendorEscalations || {};
export const MIM_TIMELINE = C.mimTeams?.timeline || {};
export const MIM_BROADCAST_TEMPLATES = C.mimTeams?.broadcastTemplates || [];
export const AGENT_DEFS = C.agents;
export const KB_ARTICLES = C.kb;
export const APP_DOMAINS = C.apps;
export const METRICS = C.metrics;
export const SCENARIOS_JSON = C.scenarios;

export const GVIC_KPIS = C.gvic || null;
