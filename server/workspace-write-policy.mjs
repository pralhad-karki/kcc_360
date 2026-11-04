// Pure serialization policy. No framework, database, transport or role knowledge.
export const WORKSPACE_PAYLOAD_BYTE_LIMIT=2_000_000;
export function workspacePayloadFits(serialized){
 return typeof serialized==='string'&&new TextEncoder().encode(serialized).byteLength<=WORKSPACE_PAYLOAD_BYTE_LIMIT;
}
