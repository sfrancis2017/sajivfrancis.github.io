// Taxonomy: industries, architecture layers, and per-industry vendors.
// Sourced from the original JSX4EA brief; vendor lists are intentionally
// curated (not exhaustive) to keep selections legible.

import type { Industry, Layer, VendorMap } from './types';

export const INDUSTRIES: Industry[] = [
  { id: 'oil_gas',       label: 'Oil & Gas',          icon: '⛽', desc: 'Upstream, midstream & downstream',     accent: '#c2741f' },
  { id: 'financial',     label: 'Financial Services', icon: '🏦', desc: 'Banking, capital markets & insurance', accent: '#3b82f6' },
  { id: 'manufacturing', label: 'Manufacturing',      icon: '🏭', desc: 'Discrete & process manufacturing',     accent: '#10b981' },
  { id: 'healthcare',    label: 'Healthcare',         icon: '🏥', desc: 'Providers, payers & life sciences',    accent: '#dc2626' },
  { id: 'retail_cpg',    label: 'Retail / CPG',       icon: '🛒', desc: 'Retail, e-commerce & consumer goods',  accent: '#7c3aed' },
  { id: 'utilities',     label: 'Utilities',          icon: '⚡', desc: 'Power, gas & water utilities',         accent: '#0891b2' },
];

export const LAYERS: Layer[] = [
  { id: 'source',     label: 'Industry Input Systems',   sublabel: 'Operational source of truth',           icon: '📥', accent: '#6b7280' },
  { id: 'ot',         label: 'OT / Industrial Systems',  sublabel: 'Plant floor & field data',              icon: '🏗️', accent: '#c2741f', onlyFor: ['oil_gas', 'manufacturing', 'utilities'] },
  { id: 'erp',        label: 'ERP Platform',             sublabel: 'Core business system of record',        icon: '🏢', accent: '#0891b2' },
  { id: 'middleware', label: 'Integration / Middleware', sublabel: 'API management & event streaming',     icon: '🔗', accent: '#7c3aed' },
  { id: 'data',       label: 'Data Platform',            sublabel: 'Warehouse, lakehouse & data fabric',   icon: '🗄️', accent: '#047857' },
  { id: 'bi',         label: 'Reporting & BI',           sublabel: 'Analytics & visualization layer',      icon: '📊', accent: '#be185d' },
  { id: 'ai',         label: 'AI Integration Layer',     sublabel: 'Intelligence, automation & LLMs',      icon: '🤖', accent: '#b45309' },
];

export const VENDORS: VendorMap = {
  oil_gas: {
    source: [
      { id: 'quorum',    name: 'Quorum Business Solutions', desc: 'O&G production accounting' },
      { id: 'wellview',  name: 'WellView (Peloton)',         desc: 'Well data management' },
      { id: 'petrel',    name: 'Schlumberger Petrel',        desc: 'Geological modelling' },
      { id: 'landmark',  name: 'Halliburton Landmark',       desc: 'Reservoir engineering' },
      { id: 'p2energy',  name: 'P2 Energy Solutions',        desc: 'Revenue & royalty accounting' },
    ],
    ot: [
      { id: 'pi_system', name: 'AVEVA PI System',         desc: 'Real-time sensor historian' },
      { id: 'honeywell', name: 'Honeywell Experion PKS',  desc: 'Process control & DCS' },
      { id: 'emerson',   name: 'Emerson DeltaV',          desc: 'Process automation' },
      { id: 'abb',       name: 'ABB Ability',             desc: 'Industrial IoT platform' },
      { id: 'ge_proficy',name: 'GE Digital Proficy',      desc: 'Plant operations suite' },
    ],
    erp: [
      { id: 'sap_s4',    name: 'SAP S/4HANA',             desc: 'Industry-leading ERP' },
      { id: 'oracle_fc', name: 'Oracle Fusion Cloud',     desc: 'Cloud ERP suite' },
      { id: 'ifs',       name: 'IFS Cloud',               desc: 'Asset & maintenance focus' },
      { id: 'ms_d365',   name: 'Microsoft Dynamics 365',  desc: 'Cloud ERP + CRM' },
      { id: 'infor_ln',  name: 'Infor M3 / LN',           desc: 'Process industry ERP' },
    ],
    middleware: [
      { id: 'mulesoft',  name: 'MuleSoft Anypoint',          desc: 'API-led connectivity' },
      { id: 'sap_is',    name: 'SAP Integration Suite',      desc: 'SAP-native integration' },
      { id: 'azure_is',  name: 'Azure Integration Services', desc: 'Logic Apps + Service Bus' },
      { id: 'ibm_app',   name: 'IBM App Connect',            desc: 'Enterprise integration' },
      { id: 'confluent', name: 'Confluent (Kafka)',          desc: 'Event streaming platform' },
    ],
    data: [
      { id: 'snowflake', name: 'Snowflake',              desc: 'Cloud data warehouse' },
      { id: 'databricks',name: 'Databricks Lakehouse',   desc: 'Unified analytics platform' },
      { id: 'sap_ds',    name: 'SAP Datasphere',         desc: 'SAP-native data fabric' },
      { id: 'fabric',    name: 'Microsoft Fabric',       desc: 'Unified analytics SaaS' },
      { id: 'teradata',  name: 'Teradata Vantage',       desc: 'Enterprise analytics' },
    ],
    bi: [
      { id: 'sac',       name: 'SAP Analytics Cloud',    desc: 'Planning + BI unified' },
      { id: 'powerbi',   name: 'Microsoft Power BI',     desc: 'Self-service analytics' },
      { id: 'tableau',   name: 'Tableau (Salesforce)',   desc: 'Visual analytics' },
      { id: 'qlik',      name: 'Qlik Sense',             desc: 'Associative analytics' },
      { id: 'spotfire',  name: 'TIBCO Spotfire',         desc: 'O&G analytics specialist' },
    ],
    ai: [
      { id: 'azure_ai',   name: 'Azure AI / Copilot Studio', desc: 'Microsoft AI ecosystem' },
      { id: 'aws_bedrock',name: 'AWS Bedrock',               desc: 'Foundation model platform' },
      { id: 'claude_api', name: 'Anthropic Claude API',      desc: 'Enterprise-grade LLM' },
      { id: 'c3ai',       name: 'C3.ai',                     desc: 'Industrial AI applications' },
      { id: 'palantir',   name: 'Palantir AIP',              desc: 'Operational AI for O&G' },
    ],
  },
  financial: {
    source: [
      { id: 'temenos',   name: 'Temenos Transact',  desc: 'Core banking platform' },
      { id: 'finastra',  name: 'Finastra Fusion',   desc: 'Banking & capital markets' },
      { id: 'murex',     name: 'Murex MX.3',        desc: 'Trading & risk management' },
      { id: 'bloomberg', name: 'Bloomberg B-PIPE',  desc: 'Market data feed' },
      { id: 'simcorp',   name: 'SimCorp Dimension', desc: 'Investment management' },
    ],
    ot: [],
    erp: [
      { id: 'sap_s4',    name: 'SAP S/4HANA',             desc: 'Finance & risk ERP' },
      { id: 'oracle_fc', name: 'Oracle Fusion Cloud',     desc: 'Financial management' },
      { id: 'workday',   name: 'Workday Financial Mgmt',  desc: 'Cloud-native finance' },
      { id: 'ms_d365',   name: 'Microsoft Dynamics 365',  desc: 'Finance & operations' },
      { id: 'sap_fcc',   name: 'SAP Central Finance',     desc: 'Finance consolidation hub' },
    ],
    middleware: [
      { id: 'mulesoft',  name: 'MuleSoft Anypoint',          desc: 'API-led connectivity' },
      { id: 'ibm_app',   name: 'IBM App Connect',            desc: 'FS-grade integration' },
      { id: 'tibco',     name: 'TIBCO BusinessWorks',        desc: 'Capital markets messaging' },
      { id: 'confluent', name: 'Confluent (Kafka)',          desc: 'Real-time event streams' },
      { id: 'azure_is',  name: 'Azure Integration Services', desc: 'Cloud integration' },
    ],
    data: [
      { id: 'snowflake', name: 'Snowflake',            desc: 'Cloud data warehouse' },
      { id: 'databricks',name: 'Databricks Lakehouse', desc: 'Unified analytics' },
      { id: 'teradata',  name: 'Teradata Vantage',     desc: 'Risk analytics workloads' },
      { id: 'fabric',    name: 'Microsoft Fabric',     desc: 'Unified analytics SaaS' },
      { id: 'bigquery',  name: 'Google BigQuery',      desc: 'Serverless warehouse' },
    ],
    bi: [
      { id: 'powerbi',   name: 'Microsoft Power BI',      desc: 'Financial dashboards' },
      { id: 'tableau',   name: 'Tableau',                 desc: 'Risk & performance viz' },
      { id: 'qlik',      name: 'Qlik Sense',              desc: 'Regulatory reporting' },
      { id: 'oracle_ac', name: 'Oracle Analytics Cloud',  desc: 'Integrated FS analytics' },
      { id: 'mstr',      name: 'MicroStrategy',           desc: 'Enterprise BI' },
    ],
    ai: [
      { id: 'azure_ai',   name: 'Azure AI / Copilot',     desc: 'Microsoft AI platform' },
      { id: 'claude_api', name: 'Anthropic Claude API',   desc: 'Document & analysis AI' },
      { id: 'aws_bedrock',name: 'AWS Bedrock',            desc: 'Foundation models' },
      { id: 'ibm_wx',     name: 'IBM watsonx',            desc: 'Trusted AI for FS' },
      { id: 'datarobot',  name: 'DataRobot',              desc: 'Risk model automation' },
    ],
  },
  manufacturing: {
    source: [
      { id: 'ptc_wc',    name: 'PTC Windchill',     desc: 'PLM & product data' },
      { id: 'siemens_tc',name: 'Siemens Teamcenter',desc: 'Product lifecycle mgmt' },
      { id: 'dassault',  name: 'Dassault ENOVIA',   desc: '3D PLM platform' },
      { id: 'arena_plm', name: 'Arena PLM',         desc: 'Cloud PLM for electronics' },
      { id: 'opcenter',  name: 'Siemens Opcenter',  desc: 'Manufacturing execution' },
    ],
    ot: [
      { id: 'siemens_s', name: 'Siemens SIMATIC',      desc: 'PLC & SCADA platform' },
      { id: 'rockwell',  name: 'Rockwell FactoryTalk', desc: 'Production intelligence' },
      { id: 'aveva_ww',  name: 'AVEVA Wonderware',     desc: 'Industrial operations' },
      { id: 'ge_proficy',name: 'GE Digital Proficy',   desc: 'MES & plant operations' },
      { id: 'kepware',   name: 'PTC Kepware',          desc: 'Industrial connectivity' },
    ],
    erp: [
      { id: 'sap_s4',    name: 'SAP S/4HANA',                desc: 'Discrete & process mfg' },
      { id: 'oracle_fc', name: 'Oracle Fusion Cloud',        desc: 'Manufacturing cloud' },
      { id: 'ms_d365',   name: 'Microsoft Dynamics 365',     desc: 'SME manufacturing' },
      { id: 'infor_csi', name: 'Infor CloudSuite Industrial',desc: 'Complex manufacturing' },
      { id: 'epicor',    name: 'Epicor Kinetic',             desc: 'Job shop manufacturing' },
    ],
    middleware: [
      { id: 'mulesoft',  name: 'MuleSoft Anypoint',          desc: 'IT/OT convergence' },
      { id: 'sap_is',    name: 'SAP Integration Suite',      desc: 'SAP-native flows' },
      { id: 'azure_is',  name: 'Azure Integration Services', desc: 'Cloud + edge' },
      { id: 'boomi',     name: 'Boomi (Dell)',               desc: 'Low-code integration' },
      { id: 'confluent', name: 'Confluent (Kafka)',          desc: 'Shop floor event streams' },
    ],
    data: [
      { id: 'snowflake', name: 'Snowflake',            desc: 'Enterprise warehouse' },
      { id: 'databricks',name: 'Databricks Lakehouse', desc: 'IoT + analytics' },
      { id: 'fabric',    name: 'Microsoft Fabric',     desc: 'Azure-native analytics' },
      { id: 'sap_ds',    name: 'SAP Datasphere',       desc: 'SAP data fabric' },
      { id: 'aws_rs',    name: 'AWS Redshift',         desc: 'Columnar analytics' },
    ],
    bi: [
      { id: 'powerbi',    name: 'Power BI',             desc: 'Production dashboards' },
      { id: 'sac',        name: 'SAP Analytics Cloud',  desc: 'Integrated planning' },
      { id: 'tableau',    name: 'Tableau',              desc: 'Supply chain viz' },
      { id: 'qlik',       name: 'Qlik Sense',           desc: 'OEE & quality analytics' },
      { id: 'thoughtspot',name: 'ThoughtSpot',          desc: 'Search-driven analytics' },
    ],
    ai: [
      { id: 'azure_ai',     name: 'Azure AI / Copilot', desc: 'Predictive maintenance' },
      { id: 'aws_bedrock',  name: 'AWS Bedrock',        desc: 'Manufacturing AI' },
      { id: 'databricks_ai',name: 'Databricks AI',      desc: 'Quality ML pipelines' },
      { id: 'c3ai',         name: 'C3.ai',              desc: 'Supply chain AI' },
      { id: 'sap_ai',       name: 'SAP AI Core',        desc: 'Embedded AI in SAP' },
    ],
  },
  healthcare: {
    source: [
      { id: 'epic',     name: 'Epic Systems',     desc: 'Electronic health records' },
      { id: 'cerner',   name: 'Oracle Cerner',    desc: 'Clinical data platform' },
      { id: 'meditech', name: 'Meditech Expanse', desc: 'Community hospital EHR' },
      { id: 'veeva',    name: 'Veeva Vault',      desc: 'Life sciences content' },
      { id: 'hl7_fhir', name: 'HL7 FHIR Sources', desc: 'Interoperability feeds' },
    ],
    ot: [],
    erp: [
      { id: 'oracle_fc', name: 'Oracle Fusion Cloud',          desc: 'Healthcare finance' },
      { id: 'sap_s4',    name: 'SAP S/4HANA',                  desc: 'Large health system ERP' },
      { id: 'workday',   name: 'Workday',                      desc: 'HR & finance cloud' },
      { id: 'infor_hc',  name: 'Infor CloudSuite Healthcare',  desc: 'Healthcare-specific ERP' },
      { id: 'ms_d365',   name: 'Microsoft Dynamics 365',       desc: 'Mid-market healthcare' },
    ],
    middleware: [
      { id: 'mulesoft',  name: 'MuleSoft Anypoint',           desc: 'HL7/FHIR integration' },
      { id: 'azure_hds', name: 'Azure Health Data Services',  desc: 'FHIR-native cloud' },
      { id: 'ibm_app',   name: 'IBM App Connect',             desc: 'Clinical data exchange' },
      { id: 'rhapsody',  name: 'Rhapsody Integration Engine', desc: 'Healthcare interop' },
      { id: 'boomi',     name: 'Boomi',                       desc: 'EDI & HL7 workflows' },
    ],
    data: [
      { id: 'snowflake', name: 'Snowflake',                desc: 'HIPAA-compliant warehouse' },
      { id: 'databricks',name: 'Databricks Lakehouse',     desc: 'Clinical analytics' },
      { id: 'fabric',    name: 'Microsoft Fabric',         desc: 'Azure health analytics' },
      { id: 'aws_hl',    name: 'AWS HealthLake',           desc: 'FHIR datastore' },
      { id: 'oracle_hdi',name: 'Oracle Health Data Intel', desc: 'Clinical intelligence' },
    ],
    bi: [
      { id: 'powerbi',    name: 'Power BI',               desc: 'Clinical ops dashboards' },
      { id: 'tableau',    name: 'Tableau',                desc: 'Population health analytics' },
      { id: 'qlik',       name: 'Qlik Sense',             desc: 'Revenue cycle analytics' },
      { id: 'thoughtspot',name: 'ThoughtSpot',            desc: 'Self-service clinical BI' },
      { id: 'oracle_ac',  name: 'Oracle Analytics Cloud', desc: 'Integrated health BI' },
    ],
    ai: [
      { id: 'azure_ai',   name: 'Azure AI Health Bot',      desc: 'Clinical decision support' },
      { id: 'aws_bedrock',name: 'AWS Bedrock + HealthLake', desc: 'Clinical NLP' },
      { id: 'claude_api', name: 'Anthropic Claude API',     desc: 'Medical documentation AI' },
      { id: 'google_v',   name: 'Google Vertex AI',         desc: 'Med-PaLM integration' },
      { id: 'ibm_wx',     name: 'IBM watsonx',              desc: 'Trusted healthcare AI' },
    ],
  },
  retail_cpg: {
    source: [
      { id: 'manhattan', name: 'Manhattan Associates WMS', desc: 'Warehouse management' },
      { id: 'blueyonder',name: 'Blue Yonder',              desc: 'Supply chain planning' },
      { id: 'relex',     name: 'RELEX Solutions',          desc: 'Demand forecasting' },
      { id: 'o9',        name: 'o9 Solutions',             desc: 'Integrated business planning' },
      { id: 'sf_cc',     name: 'Salesforce Commerce Cloud',desc: 'Omnichannel commerce' },
    ],
    ot: [],
    erp: [
      { id: 'sap_s4',    name: 'SAP S/4HANA',                  desc: 'Retail & CPG ERP' },
      { id: 'oracle_fc', name: 'Oracle Fusion Cloud',          desc: 'Retail cloud ERP' },
      { id: 'ms_d365',   name: 'Microsoft Dynamics 365',       desc: 'Retail operations' },
      { id: 'infor_d',   name: 'Infor CloudSuite Distribution',desc: 'Distribution ERP' },
      { id: 'netsuite',  name: 'Oracle NetSuite',              desc: 'Mid-market retail ERP' },
    ],
    middleware: [
      { id: 'mulesoft',  name: 'MuleSoft Anypoint',          desc: 'Retail API platform' },
      { id: 'boomi',     name: 'Boomi',                      desc: 'EDI & supplier connect' },
      { id: 'azure_is',  name: 'Azure Integration Services', desc: 'Cloud-native flows' },
      { id: 'confluent', name: 'Confluent (Kafka)',          desc: 'Real-time inventory events' },
      { id: 'tibco',     name: 'TIBCO',                      desc: 'Supply chain messaging' },
    ],
    data: [
      { id: 'snowflake', name: 'Snowflake',         desc: 'Retail analytics warehouse' },
      { id: 'databricks',name: 'Databricks',        desc: 'Customer data platform' },
      { id: 'bigquery',  name: 'Google BigQuery',   desc: 'Marketing analytics' },
      { id: 'fabric',    name: 'Microsoft Fabric',  desc: 'Retail intelligence' },
      { id: 'aws_rs',    name: 'AWS Redshift',      desc: 'E-commerce analytics' },
    ],
    bi: [
      { id: 'powerbi',    name: 'Power BI',         desc: 'Sales & inventory BI' },
      { id: 'tableau',    name: 'Tableau',          desc: 'Category management' },
      { id: 'looker',     name: 'Looker (Google)',  desc: 'Embedded retail analytics' },
      { id: 'qlik',       name: 'Qlik Sense',       desc: 'Omnichannel analytics' },
      { id: 'thoughtspot',name: 'ThoughtSpot',      desc: 'AI-driven retail insights' },
    ],
    ai: [
      { id: 'azure_ai',   name: 'Azure AI / Copilot',   desc: 'Retail personalization' },
      { id: 'google_v',   name: 'Google Vertex AI',     desc: 'Recommendations AI' },
      { id: 'aws_bedrock',name: 'AWS Bedrock',          desc: 'Generative AI for retail' },
      { id: 'claude_api', name: 'Anthropic Claude API', desc: 'Product content AI' },
      { id: 'c3ai',       name: 'C3.ai',                desc: 'Demand forecasting AI' },
    ],
  },
  utilities: {
    source: [
      { id: 'itron',    name: 'Itron Smart Grid', desc: 'AMI & meter data mgmt' },
      { id: 'oracle_u', name: 'Oracle Utilities', desc: 'CIS & billing system' },
      { id: 'esri',     name: 'Esri ArcGIS',      desc: 'Geospatial asset registry' },
      { id: 'trimble',  name: 'Trimble Unity',    desc: 'Network management' },
      { id: 'landis',   name: 'Landis+Gyr',       desc: 'Smart metering platform' },
    ],
    ot: [
      { id: 'aveva_ww', name: 'AVEVA Wonderware',         desc: 'Grid SCADA platform' },
      { id: 'ge_adms',  name: 'GE Grid Solutions (ADMS)', desc: 'Distribution management' },
      { id: 'abb_sc',   name: 'ABB Ability SCADA',        desc: 'Substation automation' },
      { id: 'siemens_eg',name: 'Siemens Energy Grid',     desc: 'Smart grid operations' },
      { id: 'pi_system',name: 'AVEVA PI System',          desc: 'Real-time historian' },
    ],
    erp: [
      { id: 'sap_s4',    name: 'SAP S/4HANA',             desc: 'Utilities IS-U / BRIM' },
      { id: 'oracle_fc', name: 'Oracle Fusion Cloud',     desc: 'Asset & finance mgmt' },
      { id: 'ifs',       name: 'IFS Cloud',               desc: 'Asset lifecycle mgmt' },
      { id: 'ms_d365',   name: 'Microsoft Dynamics 365',  desc: 'Field service + finance' },
      { id: 'maximo',    name: 'IBM Maximo APM',          desc: 'Asset performance mgmt' },
    ],
    middleware: [
      { id: 'mulesoft',  name: 'MuleSoft Anypoint',          desc: 'IT/OT integration hub' },
      { id: 'azure_is',  name: 'Azure Integration Services', desc: 'Cloud + edge hybrid' },
      { id: 'ibm_app',   name: 'IBM App Connect',            desc: 'Utility data exchange' },
      { id: 'confluent', name: 'Confluent (Kafka)',          desc: 'Grid event streaming' },
      { id: 'sap_is',    name: 'SAP Integration Suite',      desc: 'SAP-native flows' },
    ],
    data: [
      { id: 'snowflake', name: 'Snowflake',            desc: 'Enterprise warehouse' },
      { id: 'databricks',name: 'Databricks Lakehouse', desc: 'Grid analytics + IoT' },
      { id: 'fabric',    name: 'Microsoft Fabric',     desc: 'Azure-native analytics' },
      { id: 'sap_ds',    name: 'SAP Datasphere',       desc: 'SAP data fabric' },
      { id: 'aws_rs',    name: 'AWS Redshift',         desc: 'Smart grid data lake' },
    ],
    bi: [
      { id: 'powerbi',  name: 'Power BI',                desc: 'Grid operations BI' },
      { id: 'sac',      name: 'SAP Analytics Cloud',     desc: 'Utilities planning' },
      { id: 'tableau',  name: 'Tableau',                 desc: 'Asset performance dashboards' },
      { id: 'esri_ins', name: 'Esri ArcGIS Insights',    desc: 'Spatial analytics' },
      { id: 'qlik',     name: 'Qlik Sense',              desc: 'Outage & risk analytics' },
    ],
    ai: [
      { id: 'azure_ai',   name: 'Azure AI / IoT Hub',  desc: 'Grid anomaly detection' },
      { id: 'aws_bedrock',name: 'AWS Bedrock',         desc: 'Predictive maintenance AI' },
      { id: 'c3ai',       name: 'C3.ai',               desc: 'Energy demand forecasting' },
      { id: 'palantir',   name: 'Palantir AIP',        desc: 'Grid operations AI' },
      { id: 'sap_ai',     name: 'SAP AI Core',         desc: 'Embedded AI in SAP' },
    ],
  },
};

export function getApplicableLayers(industryId: string): Layer[] {
  return LAYERS.filter((l) => !l.onlyFor || l.onlyFor.includes(industryId));
}
