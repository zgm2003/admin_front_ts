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
  aiKnowledge: {
      filter: { name: 'Knowledge Name', code: 'Knowledge Code', status: 'Status' },
      nav: { title: 'Knowledge Bases', subtitle: 'Select a base, then manage documents, chunks, and retrieval on the right', total: '{count} knowledge bases', empty: 'No knowledge base', noDescription: 'No description', minScore: 'Min', more: 'More' },
      table: { name: 'Knowledge', code: 'Code', description: 'Description', chunk: 'Chunk/Overlap', retrieval: 'Retrieval', status: 'Status', updatedAt: 'Updated At' },
      actions: { reindex: 'Reindex', retrievalTest: 'Retrieval Test' },
      initFailed: 'Failed to initialize knowledge module',
      form: { name: 'Knowledge Name', code: 'Knowledge Code', description: 'Description', chunkSize: 'Chunk Chars', chunkOverlap: 'Overlap Chars', defaultTopK: 'Default TopK', defaultMinScore: 'Min Score', defaultContext: 'Context Chars', status: 'Status', chunkSizeRange: 'Chunk chars must be between 300 and 8000', topKRange: 'TopK must be between 1 and 20', minScoreRange: 'Min score must be between 0 and 100', contextRange: 'Context chars must be between 1000 and 30000', overlapLessThanSize: 'Overlap must be smaller than chunk size' },
      document: { add: 'Add Document', edit: 'Edit Document', title: 'Document', selectBase: 'Select a knowledge base', selectBaseTip: 'Select a knowledge base from the left to manage documents', currentBase: 'Current Knowledge Base', sourceType: 'Source Type', sourceRef: 'Source Ref', content: 'Content', indexStatus: 'Index Status', error: 'Error', chunks: 'Chunks', reindexDone: 'Index rebuilt', chunkLoadFailed: 'Failed to load chunks' },
      chunk: { index: 'Index', chars: 'Chars', content: 'Content' },
      retrieval: { title: 'Knowledge Retrieval Test', query: 'Query', queryPlaceholder: 'Ask a question, e.g. what is the backend architecture?', queryRequired: 'Query is required', summary: 'Selected {selected} / total {total}', rank: 'Rank', score: 'Score', hitStatus: 'Hit Status', selected: 'Selected', skipped: 'Skipped' },
      addTitle: 'Add Knowledge Base',
      editTitle: 'Edit Knowledge Base'
    }
}
