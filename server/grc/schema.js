/**
 * Veldvolgorde van de GRC-structuren, overgenomen uit de WSDL van GRD.
 *
 * Twee redenen waarom dit hier expliciet staat en niet impliciet in de
 * aanroepende code:
 *
 * 1. Een xsd:sequence is ordegevoelig. Elementen in een andere volgorde dan
 *    het schema voorschrijft worden geweigerd.
 * 2. Binnen deze structuren heeft geen enkel veld minOccurs="0" - ze zijn dus
 *    allemaal verplicht aanwezig, ook als ze leeg zijn. Een veld weglaten is
 *    iets anders dan een veld leeg meesturen.
 *
 * Gecontroleerd tegen GRAC_USER_ACCES_WS op 2026-08-17.
 */

export const REQUEST_HEADER_FIELDS = [
    'Reqtype',
    'Priority',
    'ReqDueDate',
    'ReqInitSystem',
    'Requestorid',
    'Email',
    'RequestReason',
    'Funcarea',
    'Bproc'
];

export const LINE_ITEM_FIELDS = [
    'ItemName',
    'Connector',
    'ProvItemType',
    'ProvType',
    'AssignmentType',
    'ProvStatus',
    'ValidFrom',
    'ValidTo',
    'FfOwner',
    'Comments',
    'ProvAction',
    'RoleType'
];

export const USER_INFO_FIELDS = [
    'Userid',
    'Title',
    'Fname',
    'Lname',
    'SncName',
    'UnsecSnc',
    'Accno',
    'UserGroup',
    'ValidFrom',
    'ValidTo',
    'Empposition',
    'Empjob',
    'Personnelno',
    'Personnelarea',
    'CommMethod',
    'Fax',
    'Email',
    'Telnumber',
    'Department',
    'Company',
    'Location',
    'Costcenter',
    'Printer',
    'Orgunit',
    'Emptype',
    'Manager',
    'ManagerEmail',
    'ManagerFirstname',
    'ManagerLastname',
    'StartMenu',
    'LogonLang',
    'DecNotation',
    'DateFormat',
    'Alias',
    'UserType',
    'Function'
];

/**
 * Aanvraagvelden van GRAC_LOOKUP_WS, in schemavolgorde.
 *
 * Elk veld is een vlag: zet hem op 'X' en de bijbehorende lijst komt terug in
 * het antwoord. De sleutel hieronder is de naam die wij in de API gebruiken,
 * de waarde is het XML-element.
 */
export const LOOKUP_FIELD_ORDER = [
    'BusProc',
    'BusSubProc',
    'CommunicationType',
    'CriticalLevel',
    'EmployeeType',
    'FunctionArea',
    'ItemProvType',
    'Landscape',
    'Language',
    'OmObjectType',
    'Phase',
    'PriorityType',
    'ProjectRelease',
    'RequestCustomFields',
    'RequestType',
    'RoleCustomFields',
    'RoleSensitivity',
    'RoleStatus',
    'RoleType'
];

export const LOOKUP_FLAGS = {
    busProc: 'BusProc',
    busSubProc: 'BusSubProc',
    communicationType: 'CommunicationType',
    criticalLevel: 'CriticalLevel',
    employeeType: 'EmployeeType',
    functionArea: 'FunctionArea',
    itemProvType: 'ItemProvType',
    landscape: 'Landscape',
    omObjectType: 'OmObjectType',
    phase: 'Phase',
    priorityType: 'PriorityType',
    projectRelease: 'ProjectRelease',
    requestCustomFields: 'RequestCustomFields',
    requestType: 'RequestType',
    roleCustomFields: 'RoleCustomFields',
    roleSensitivity: 'RoleSensitivity',
    roleStatus: 'RoleStatus',
    roleType: 'RoleType'
};

/**
 * Zet waarden in schemavolgorde, met een lege string voor wat niet gevuld is.
 * Zo staat elk verplicht element in het bericht zonder dat de aanroeper de
 * hele structuur hoeft te kennen.
 */
export function inSchemaOrder(fieldOrder, values) {
    const result = {};

    for (const name of fieldOrder) {
        const value = values[name];
        result[name] = value === undefined || value === null ? '' : value;
    }

    return result;
}
