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
  aiKnowledge: {
      filter: { name: '知识库名称', code: '知识库编码', status: '状态' },
      nav: {
        title: '知识库',
        subtitle: '先选知识库，再在右侧管理文档、分块和检索',
        total: '共 {count} 个知识库',
        empty: '暂无知识库',
        noDescription: '暂无描述',
        minScore: '最低分',
        more: '更多'
      },
      table: {
        name: '知识库',
        code: '编码',
        description: '描述',
        chunk: '分块/重叠',
        retrieval: '检索配置',
        status: '状态',
        updatedAt: '更新时间'
      },
      actions: { reindex: '重建索引', retrievalTest: '检索测试' },
      initFailed: '知识库初始化失败',
      form: {
        name: '知识库名称',
        code: '知识库编码',
        description: '描述',
        chunkSize: '分块字符数',
        chunkOverlap: '重叠字符数',
        defaultTopK: '默认 TopK',
        defaultMinScore: '最低分',
        defaultContext: '上下文字符数',
        status: '状态',
        chunkSizeRange: '分块字符数必须在 300 到 8000 之间',
        topKRange: 'TopK 必须在 1 到 20 之间',
        minScoreRange: '最低分必须在 0 到 100 之间',
        contextRange: '上下文字符数必须在 1000 到 30000 之间',
        overlapLessThanSize: '分块重叠必须小于分块大小'
      },
      document: {
        add: '新增文档',
        edit: '编辑文档',
        title: '文档',
        selectBase: '请选择知识库',
        selectBaseTip: '左侧选择一个知识库后管理文档',
        currentBase: '当前知识库',
        sourceType: '来源类型',
        sourceRef: '来源引用',
        content: '文档内容',
        indexStatus: '索引状态',
        error: '错误信息',
        chunks: '分块',
        reindexDone: '索引已重建',
        chunkLoadFailed: '分块加载失败'
      },
      chunk: {
        index: '序号',
        chars: '字符数',
        content: '内容'
      },
      retrieval: {
        title: '知识库检索测试',
        query: '检索问题',
        queryPlaceholder: '输入要测试的问题，例如：这个项目后端架构是什么？',
        queryRequired: '检索问题不能为空',
        summary: '选中 {selected} / 命中 {total}',
        rank: '排名',
        score: '分数',
        hitStatus: '命中状态',
        selected: '进入上下文',
        skipped: '已跳过'
      },
      addTitle: '新增知识库',
      editTitle: '编辑知识库'
    }
}
