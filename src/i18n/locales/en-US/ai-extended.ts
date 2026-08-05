export default {
  aiTools: {
      actions: { generate: 'AI Generate' },
      filter: { name: 'Tool Name', code: 'Tool Code', riskLevel: 'Risk', status: 'Status' },
      table: { name: 'Tool Name', code: 'Code', description: 'Description', riskLevel: 'Risk', timeout: 'Timeout', status: 'Status', updatedAt: 'Updated At' },
      form: { basicInfo: 'Basic Info', runtimeConfig: 'Runtime Config', schemaConfig: 'Schema Config', name: 'Tool Name', code: 'Tool Code', description: 'Description', riskLevel: 'Risk', timeout: 'Timeout MS', timeoutRange: 'Timeout must be between 100 and 30000 ms', status: 'Status', parametersJson: 'Parameters JSON Schema', resultSchemaJson: 'Result JSON Schema', invalidJson: ' must be a valid JSON object' },
      generate: { title: 'AI Generate Tool Draft', agent: 'Generator Agent', agentPlaceholder: 'Select agent_generate agent', requirement: 'Tool Requirement', requirementPlaceholder: 'Describe what the tool queries or executes, required inputs, returned fields, and boundaries.', codeHint: 'Tool Code Hint', submit: 'Generate Draft', failed: 'Failed to generate tool draft', initFailed: 'Failed to initialize AI generate', emptyDraft: 'AI returned no draft', needMoreInfo: 'More information needed', usage: 'Tokens used: {total} (prompt {prompt} / completion {completion})' },
      addTitle: 'Add AI Tool',
      editTitle: 'Edit AI Tool'
    },
  aiContext: {
    title: 'Context Engineering', subtitle: 'Manage index profiles, spaces, immutable document versions, and real context plans', contractMode: 'Closed contract',
    tabs: { spaces: 'Spaces', documents: 'Documents', profiles: 'Index Profiles', evaluation: 'Evaluation' },
    fields: { name: 'Name', title: 'Title', description: 'Description', status: 'Status', updatedAt: 'Updated At' },
    status: { enabled: 'Enabled', disabled: 'Disabled', retired: 'Retired', provisioning: 'Provisioning', ready: 'Ready', rebuilding: 'Rebuilding', failed: 'Failed', queued: 'Queued', processing: 'Processing' },
    empty: { spaces: 'No spaces for this profile', versions: 'No document versions', evaluation: 'Select an agent and enter a real query to evaluate' },
    profile: { description: 'Index profiles define vector and rerank models. Policy fields stay read only after creation.', create: 'New Index Profile', rename: 'Rename Index Profile', embeddingModelID: 'Embedding Model ID', embeddingModel: 'Embedding Model', memoryModel: 'Memory Model (optional)', rerankerModel: 'Reranker Model (optional)', dimensions: 'Dimensions', maxInputTokens: 'Max Input Tokens', tokenCounter: 'Token Counter', distance: 'Distance', minScore: 'Dense Min Score', indexState: 'Index State', generation: 'Active Generation' },
    space: { create: 'New Space', edit: 'Edit Space', selectProfile: 'Select index profile', confirmDelete: 'Deleting this space removes its document entry point. Continue?' },
    document: { create: 'New Document', sourceFile: 'Source File', dropFile: 'Click or drag a file here', confirmDelete: 'Delete this document?', spaceSummary: '{count} documents' },
    version: { create: 'Upload Version', history: 'Immutable Version History', state: 'Ingestion State' },
    evaluation: { selectAgent: 'Select chat agent', query: 'Enter a real query to validate', run: 'Evaluate', outcome: 'Retrieval Outcome', inputBudget: 'Input Budget', selected: 'Selected', excluded: 'Excluded', sourceType: 'Source Type', source: 'Source', citation: 'Citation', tokens: 'Token Bound', decision: 'Decision', reason: 'Exclusion Reason' },
    outcome: { skipped: 'Skipped', noHit: 'No Hit', hit: 'Hit', degraded: 'Degraded', failed: 'Failed' }
  }
}
