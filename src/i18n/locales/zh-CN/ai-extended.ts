export default {
  aiTools: {
      actions: { generate: 'AI生成' },
      filter: { name: '工具名称', code: '工具编码', riskLevel: '风险等级', status: '状态' },
      table: {
        name: '工具名称',
        code: '工具编码',
        description: '描述',
        riskLevel: '风险等级',
        timeout: '超时',
        status: '状态',
        updatedAt: '更新时间'
      },
      form: {
        basicInfo: '基础信息',
        runtimeConfig: '运行配置',
        schemaConfig: 'Schema 配置',
        name: '工具名称',
        code: '工具编码',
        description: '描述',
        riskLevel: '风险等级',
        timeout: '超时毫秒',
        timeoutRange: '超时必须在 100 到 30000 毫秒之间',
        status: '状态',
        parametersJson: '参数JSON Schema',
        resultSchemaJson: '结果JSON Schema',
        invalidJson: '必须为合法JSON对象'
      },
      generate: {
        title: 'AI生成工具草稿',
        agent: '生成智能体',
        agentPlaceholder: '请选择工具生成场景',
        requirement: '工具需求',
        requirementPlaceholder: '说明这个工具要查询或执行什么、需要哪些入参、返回哪些字段、边界是什么。例如：查询当前后台用户数量，只返回总数、启用数、禁用数。',
        codeHint: '工具编码提示',
        submit: '生成草稿',
        failed: 'AI生成工具草稿失败',
        initFailed: 'AI生成初始化失败',
        emptyDraft: 'AI未返回工具草稿',
        needMoreInfo: '还需要补充信息',
        usage: '本次生成消耗 token：{total}（输入 {prompt} / 输出 {completion}）'
      },
      addTitle: '新增AI工具',
      editTitle: '编辑AI工具'
    },
  aiContext: {
    title: '上下文工程', subtitle: '管理索引配置、空间、文档版本并验证实际上下文计划', contractMode: '闭合契约',
    tabs: { spaces: '空间', documents: '文档', profiles: '索引配置', evaluation: '评测' },
    fields: { name: '名称', title: '标题', description: '描述', status: '状态', updatedAt: '更新时间' },
    status: { enabled: '启用', disabled: '停用', retired: '已退役', provisioning: '初始化中', ready: '就绪', rebuilding: '重建中', failed: '失败', queued: '排队中', processing: '处理中' },
    empty: { spaces: '当前配置下没有空间', versions: '暂无文档版本', evaluation: '选择智能体并输入问题后执行评测' },
    profile: { description: '索引配置决定向量与重排模型；建立后策略字段保持只读。', create: '新增索引配置', rename: '重命名索引配置', embeddingModelID: 'Embedding 模型 ID', embeddingModel: 'Embedding 模型', memoryModel: '记忆模型（可选）', rerankerModel: 'Reranker 模型（可选）', dimensions: '向量维度', maxInputTokens: '最大输入 Token', tokenCounter: 'Token 计数器', distance: '距离算法', minScore: '最低稠密分', indexState: '索引状态', generation: '生效代次' },
    space: { create: '新增空间', edit: '编辑空间', selectProfile: '选择索引配置', confirmDelete: '删除空间将同时失去其文档入口，确认继续？' },
    document: { create: '新增文档', sourceFile: '源文件', dropFile: '点击或拖拽文件到这里', confirmDelete: '确认删除该文档？', spaceSummary: '{count} 个文档' },
    version: { create: '上传新版本', history: '不可变版本历史', state: '摄取状态' },
    evaluation: { selectAgent: '选择对话智能体', query: '输入要验证的真实问题', run: '执行评测', outcome: '检索结果', inputBudget: '输入预算', selected: '已选', excluded: '排除', sourceType: '来源类型', source: '来源', citation: '引用', tokens: 'Token 上界', decision: '决策', reason: '排除原因' },
    outcome: { skipped: '已跳过', noHit: '无命中', hit: '命中', degraded: '已降级', failed: '失败' }
  }
}
