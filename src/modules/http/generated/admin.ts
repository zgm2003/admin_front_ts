// Generated from Admin Contract Bundle manifest SHA-256: d0a7649f4fe22ac5a095a108e7c8969fa1a626dea50fdf82f1fa19dfc0b8b1fa
// Do not edit manually.
export interface paths {
    "/api/admin/v1/ai-agents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-agents */
        get: operations["get_api_admin_v1_ai_agents"];
        put?: never;
        /** POST /api/admin/v1/ai-agents */
        post: operations["post_api_admin_v1_ai_agents"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-agents/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-agents/:id */
        get: operations["get_api_admin_v1_ai_agents_id"];
        /** PUT /api/admin/v1/ai-agents/:id */
        put: operations["put_api_admin_v1_ai_agents_id"];
        post?: never;
        /** DELETE /api/admin/v1/ai-agents/:id */
        delete: operations["delete_api_admin_v1_ai_agents_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-agents/{id}/knowledge-bases": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-agents/:id/knowledge-bases */
        get: operations["get_api_admin_v1_ai_agents_id_knowledge_bases"];
        /** PUT /api/admin/v1/ai-agents/:id/knowledge-bases */
        put: operations["put_api_admin_v1_ai_agents_id_knowledge_bases"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-agents/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** PATCH /api/admin/v1/ai-agents/:id/status */
        patch: operations["patch_api_admin_v1_ai_agents_id_status"];
        trace?: never;
    };
    "/api/admin/v1/ai-agents/{id}/test": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/ai-agents/:id/test */
        post: operations["post_api_admin_v1_ai_agents_id_test"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-agents/{id}/tools": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-agents/:id/tools */
        get: operations["get_api_admin_v1_ai_agents_id_tools"];
        /** PUT /api/admin/v1/ai-agents/:id/tools */
        put: operations["put_api_admin_v1_ai_agents_id_tools"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-agents/options": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-agents/options */
        get: operations["get_api_admin_v1_ai_agents_options"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-agents/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-agents/page-init */
        get: operations["get_api_admin_v1_ai_agents_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-agents/provider-models/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-agents/provider-models/:id */
        get: operations["get_api_admin_v1_ai_agents_provider_models_id"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-conversations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-conversations */
        get: operations["get_api_admin_v1_ai_conversations"];
        put?: never;
        /** POST /api/admin/v1/ai-conversations */
        post: operations["post_api_admin_v1_ai_conversations"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-conversations/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-conversations/:id */
        get: operations["get_api_admin_v1_ai_conversations_id"];
        /** PUT /api/admin/v1/ai-conversations/:id */
        put: operations["put_api_admin_v1_ai_conversations_id"];
        post?: never;
        /** DELETE /api/admin/v1/ai-conversations/:id */
        delete: operations["delete_api_admin_v1_ai_conversations_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-conversations/{id}/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-conversations/:id/messages */
        get: operations["get_api_admin_v1_ai_conversations_id_messages"];
        put?: never;
        /** POST /api/admin/v1/ai-conversations/:id/messages */
        post: operations["post_api_admin_v1_ai_conversations_id_messages"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-conversations/{id}/messages/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/ai-conversations/:id/messages/cancel */
        post: operations["post_api_admin_v1_ai_conversations_id_messages_cancel"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-knowledge-bases": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-knowledge-bases */
        get: operations["get_api_admin_v1_ai_knowledge_bases"];
        put?: never;
        /** POST /api/admin/v1/ai-knowledge-bases */
        post: operations["post_api_admin_v1_ai_knowledge_bases"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-knowledge-bases/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-knowledge-bases/:id */
        get: operations["get_api_admin_v1_ai_knowledge_bases_id"];
        /** PUT /api/admin/v1/ai-knowledge-bases/:id */
        put: operations["put_api_admin_v1_ai_knowledge_bases_id"];
        post?: never;
        /** DELETE /api/admin/v1/ai-knowledge-bases/:id */
        delete: operations["delete_api_admin_v1_ai_knowledge_bases_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-knowledge-bases/{id}/documents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-knowledge-bases/:id/documents */
        get: operations["get_api_admin_v1_ai_knowledge_bases_id_documents"];
        put?: never;
        /** POST /api/admin/v1/ai-knowledge-bases/:id/documents */
        post: operations["post_api_admin_v1_ai_knowledge_bases_id_documents"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-knowledge-bases/{id}/retrieval-tests": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/ai-knowledge-bases/:id/retrieval-tests */
        post: operations["post_api_admin_v1_ai_knowledge_bases_id_retrieval_tests"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-knowledge-bases/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** PATCH /api/admin/v1/ai-knowledge-bases/:id/status */
        patch: operations["patch_api_admin_v1_ai_knowledge_bases_id_status"];
        trace?: never;
    };
    "/api/admin/v1/ai-knowledge-bases/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-knowledge-bases/page-init */
        get: operations["get_api_admin_v1_ai_knowledge_bases_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-knowledge-documents/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-knowledge-documents/:id */
        get: operations["get_api_admin_v1_ai_knowledge_documents_id"];
        /** PUT /api/admin/v1/ai-knowledge-documents/:id */
        put: operations["put_api_admin_v1_ai_knowledge_documents_id"];
        post?: never;
        /** DELETE /api/admin/v1/ai-knowledge-documents/:id */
        delete: operations["delete_api_admin_v1_ai_knowledge_documents_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-knowledge-documents/{id}/chunks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-knowledge-documents/:id/chunks */
        get: operations["get_api_admin_v1_ai_knowledge_documents_id_chunks"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-knowledge-documents/{id}/reindex": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/ai-knowledge-documents/:id/reindex */
        post: operations["post_api_admin_v1_ai_knowledge_documents_id_reindex"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-knowledge-documents/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** PATCH /api/admin/v1/ai-knowledge-documents/:id/status */
        patch: operations["patch_api_admin_v1_ai_knowledge_documents_id_status"];
        trace?: never;
    };
    "/api/admin/v1/ai-prompts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-prompts */
        get: operations["get_api_admin_v1_ai_prompts"];
        put?: never;
        /** POST /api/admin/v1/ai-prompts */
        post: operations["post_api_admin_v1_ai_prompts"];
        /** DELETE /api/admin/v1/ai-prompts */
        delete: operations["delete_api_admin_v1_ai_prompts"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-prompts/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-prompts/:id */
        get: operations["get_api_admin_v1_ai_prompts_id"];
        /** PUT /api/admin/v1/ai-prompts/:id */
        put: operations["put_api_admin_v1_ai_prompts_id"];
        post?: never;
        /** DELETE /api/admin/v1/ai-prompts/:id */
        delete: operations["delete_api_admin_v1_ai_prompts_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-prompts/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** PATCH /api/admin/v1/ai-prompts/:id/status */
        patch: operations["patch_api_admin_v1_ai_prompts_id_status"];
        trace?: never;
    };
    "/api/admin/v1/ai-prompts/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-prompts/page-init */
        get: operations["get_api_admin_v1_ai_prompts_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-providers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-providers */
        get: operations["get_api_admin_v1_ai_providers"];
        put?: never;
        /** POST /api/admin/v1/ai-providers */
        post: operations["post_api_admin_v1_ai_providers"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-providers/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** PUT /api/admin/v1/ai-providers/:id */
        put: operations["put_api_admin_v1_ai_providers_id"];
        post?: never;
        /** DELETE /api/admin/v1/ai-providers/:id */
        delete: operations["delete_api_admin_v1_ai_providers_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-providers/{id}/model-options": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/ai-providers/:id/model-options */
        post: operations["post_api_admin_v1_ai_providers_id_model_options"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-providers/{id}/models": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-providers/:id/models */
        get: operations["get_api_admin_v1_ai_providers_id_models"];
        /** PUT /api/admin/v1/ai-providers/:id/models */
        put: operations["put_api_admin_v1_ai_providers_id_models"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-providers/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** PATCH /api/admin/v1/ai-providers/:id/status */
        patch: operations["patch_api_admin_v1_ai_providers_id_status"];
        trace?: never;
    };
    "/api/admin/v1/ai-providers/{id}/sync-models": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/ai-providers/:id/sync-models */
        post: operations["post_api_admin_v1_ai_providers_id_sync_models"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-providers/{id}/test": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/ai-providers/:id/test */
        post: operations["post_api_admin_v1_ai_providers_id_test"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-providers/model-options": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/ai-providers/model-options */
        post: operations["post_api_admin_v1_ai_providers_model_options"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-providers/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-providers/page-init */
        get: operations["get_api_admin_v1_ai_providers_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-runs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-runs */
        get: operations["get_api_admin_v1_ai_runs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-runs/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-runs/:id */
        get: operations["get_api_admin_v1_ai_runs_id"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-runs/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-runs/page-init */
        get: operations["get_api_admin_v1_ai_runs_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-runs/stats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-runs/stats */
        get: operations["get_api_admin_v1_ai_runs_stats"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-runs/stats/by-agent": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-runs/stats/by-agent */
        get: operations["get_api_admin_v1_ai_runs_stats_by_agent"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-runs/stats/by-date": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-runs/stats/by-date */
        get: operations["get_api_admin_v1_ai_runs_stats_by_date"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-runs/stats/by-user": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-runs/stats/by-user */
        get: operations["get_api_admin_v1_ai_runs_stats_by_user"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-tools": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-tools */
        get: operations["get_api_admin_v1_ai_tools"];
        put?: never;
        /** POST /api/admin/v1/ai-tools */
        post: operations["post_api_admin_v1_ai_tools"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-tools/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** PUT /api/admin/v1/ai-tools/:id */
        put: operations["put_api_admin_v1_ai_tools_id"];
        post?: never;
        /** DELETE /api/admin/v1/ai-tools/:id */
        delete: operations["delete_api_admin_v1_ai_tools_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-tools/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** PATCH /api/admin/v1/ai-tools/:id/status */
        patch: operations["patch_api_admin_v1_ai_tools_id_status"];
        trace?: never;
    };
    "/api/admin/v1/ai-tools/generate-draft": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/ai-tools/generate-draft */
        post: operations["post_api_admin_v1_ai_tools_generate_draft"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-tools/generate/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-tools/generate/page-init */
        get: operations["get_api_admin_v1_ai_tools_generate_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ai-tools/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ai-tools/page-init */
        get: operations["get_api_admin_v1_ai_tools_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/auth-platforms": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/auth-platforms */
        get: operations["get_api_admin_v1_auth_platforms"];
        put?: never;
        /** POST /api/admin/v1/auth-platforms */
        post: operations["post_api_admin_v1_auth_platforms"];
        /** DELETE /api/admin/v1/auth-platforms */
        delete: operations["delete_api_admin_v1_auth_platforms"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/auth-platforms/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** PUT /api/admin/v1/auth-platforms/:id */
        put: operations["put_api_admin_v1_auth_platforms_id"];
        post?: never;
        /** DELETE /api/admin/v1/auth-platforms/:id */
        delete: operations["delete_api_admin_v1_auth_platforms_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/auth-platforms/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** PATCH /api/admin/v1/auth-platforms/:id/status */
        patch: operations["patch_api_admin_v1_auth_platforms_id_status"];
        trace?: never;
    };
    "/api/admin/v1/auth-platforms/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/auth-platforms/page-init */
        get: operations["get_api_admin_v1_auth_platforms_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/auth/captcha": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/auth/captcha */
        get: operations["get_api_admin_v1_auth_captcha"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/auth/forgot-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/auth/forgot-password */
        post: operations["post_api_admin_v1_auth_forgot_password"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/auth/login */
        post: operations["post_api_admin_v1_auth_login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/auth/login-config": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/auth/login-config */
        get: operations["get_api_admin_v1_auth_login_config"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/auth/logout */
        post: operations["post_api_admin_v1_auth_logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/auth/queue-monitor-grants": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/auth/queue-monitor-grants */
        post: operations["post_api_admin_v1_auth_queue_monitor_grants"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/auth/realtime-tickets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/auth/realtime-tickets */
        post: operations["post_api_admin_v1_auth_realtime_tickets"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/auth/refresh */
        post: operations["post_api_admin_v1_auth_refresh"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/auth/send-code": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/auth/send-code */
        post: operations["post_api_admin_v1_auth_send_code"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/cron-tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/cron-tasks */
        get: operations["get_api_admin_v1_cron_tasks"];
        put?: never;
        /** POST /api/admin/v1/cron-tasks */
        post: operations["post_api_admin_v1_cron_tasks"];
        /** DELETE /api/admin/v1/cron-tasks */
        delete: operations["delete_api_admin_v1_cron_tasks"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/cron-tasks/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** PUT /api/admin/v1/cron-tasks/:id */
        put: operations["put_api_admin_v1_cron_tasks_id"];
        post?: never;
        /** DELETE /api/admin/v1/cron-tasks/:id */
        delete: operations["delete_api_admin_v1_cron_tasks_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/cron-tasks/{id}/logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/cron-tasks/:id/logs */
        get: operations["get_api_admin_v1_cron_tasks_id_logs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/cron-tasks/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** PATCH /api/admin/v1/cron-tasks/:id/status */
        patch: operations["patch_api_admin_v1_cron_tasks_id_status"];
        trace?: never;
    };
    "/api/admin/v1/cron-tasks/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/cron-tasks/page-init */
        get: operations["get_api_admin_v1_cron_tasks_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/export-tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/export-tasks */
        get: operations["get_api_admin_v1_export_tasks"];
        put?: never;
        post?: never;
        /** DELETE /api/admin/v1/export-tasks */
        delete: operations["delete_api_admin_v1_export_tasks"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/export-tasks/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** DELETE /api/admin/v1/export-tasks/:id */
        delete: operations["delete_api_admin_v1_export_tasks_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/export-tasks/status-count": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/export-tasks/status-count */
        get: operations["get_api_admin_v1_export_tasks_status_count"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/mail/config": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/mail/config */
        get: operations["get_api_admin_v1_mail_config"];
        /** PUT /api/admin/v1/mail/config */
        put: operations["put_api_admin_v1_mail_config"];
        post?: never;
        /** DELETE /api/admin/v1/mail/config */
        delete: operations["delete_api_admin_v1_mail_config"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/mail/logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/mail/logs */
        get: operations["get_api_admin_v1_mail_logs"];
        put?: never;
        post?: never;
        /** DELETE /api/admin/v1/mail/logs */
        delete: operations["delete_api_admin_v1_mail_logs"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/mail/logs/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/mail/logs/:id */
        get: operations["get_api_admin_v1_mail_logs_id"];
        put?: never;
        post?: never;
        /** DELETE /api/admin/v1/mail/logs/:id */
        delete: operations["delete_api_admin_v1_mail_logs_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/mail/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/mail/page-init */
        get: operations["get_api_admin_v1_mail_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/mail/templates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/mail/templates */
        get: operations["get_api_admin_v1_mail_templates"];
        put?: never;
        /** POST /api/admin/v1/mail/templates */
        post: operations["post_api_admin_v1_mail_templates"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/mail/templates/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** PUT /api/admin/v1/mail/templates/:id */
        put: operations["put_api_admin_v1_mail_templates_id"];
        post?: never;
        /** DELETE /api/admin/v1/mail/templates/:id */
        delete: operations["delete_api_admin_v1_mail_templates_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/mail/templates/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** PATCH /api/admin/v1/mail/templates/:id/status */
        patch: operations["patch_api_admin_v1_mail_templates_id_status"];
        trace?: never;
    };
    "/api/admin/v1/mail/test": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/mail/test */
        post: operations["post_api_admin_v1_mail_test"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/notification-tasks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/notification-tasks */
        get: operations["get_api_admin_v1_notification_tasks"];
        put?: never;
        /** POST /api/admin/v1/notification-tasks */
        post: operations["post_api_admin_v1_notification_tasks"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/notification-tasks/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** DELETE /api/admin/v1/notification-tasks/:id */
        delete: operations["delete_api_admin_v1_notification_tasks_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/notification-tasks/{id}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** PATCH /api/admin/v1/notification-tasks/:id/cancel */
        patch: operations["patch_api_admin_v1_notification_tasks_id_cancel"];
        trace?: never;
    };
    "/api/admin/v1/notification-tasks/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/notification-tasks/page-init */
        get: operations["get_api_admin_v1_notification_tasks_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/notification-tasks/status-count": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/notification-tasks/status-count */
        get: operations["get_api_admin_v1_notification_tasks_status_count"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/notifications */
        get: operations["get_api_admin_v1_notifications"];
        put?: never;
        post?: never;
        /** DELETE /api/admin/v1/notifications */
        delete: operations["delete_api_admin_v1_notifications"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/notifications/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** DELETE /api/admin/v1/notifications/:id */
        delete: operations["delete_api_admin_v1_notifications_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/notifications/{id}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** PATCH /api/admin/v1/notifications/:id/read */
        patch: operations["patch_api_admin_v1_notifications_id_read"];
        trace?: never;
    };
    "/api/admin/v1/notifications/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/notifications/page-init */
        get: operations["get_api_admin_v1_notifications_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/notifications/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** PATCH /api/admin/v1/notifications/read */
        patch: operations["patch_api_admin_v1_notifications_read"];
        trace?: never;
    };
    "/api/admin/v1/notifications/unread-count": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/notifications/unread-count */
        get: operations["get_api_admin_v1_notifications_unread_count"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/operation-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/operation-logs */
        get: operations["get_api_admin_v1_operation_logs"];
        put?: never;
        post?: never;
        /** DELETE /api/admin/v1/operation-logs */
        delete: operations["delete_api_admin_v1_operation_logs"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/operation-logs/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** DELETE /api/admin/v1/operation-logs/:id */
        delete: operations["delete_api_admin_v1_operation_logs_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/operation-logs/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/operation-logs/page-init */
        get: operations["get_api_admin_v1_operation_logs_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/payment/certificates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/payment/certificates */
        post: operations["post_api_admin_v1_payment_certificates"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/payment/configs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/payment/configs */
        get: operations["get_api_admin_v1_payment_configs"];
        put?: never;
        /** POST /api/admin/v1/payment/configs */
        post: operations["post_api_admin_v1_payment_configs"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/payment/configs/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** PUT /api/admin/v1/payment/configs/:id */
        put: operations["put_api_admin_v1_payment_configs_id"];
        post?: never;
        /** DELETE /api/admin/v1/payment/configs/:id */
        delete: operations["delete_api_admin_v1_payment_configs_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/payment/configs/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** PATCH /api/admin/v1/payment/configs/:id/status */
        patch: operations["patch_api_admin_v1_payment_configs_id_status"];
        trace?: never;
    };
    "/api/admin/v1/payment/configs/{id}/test": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/payment/configs/:id/test */
        post: operations["post_api_admin_v1_payment_configs_id_test"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/payment/configs/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/payment/configs/page-init */
        get: operations["get_api_admin_v1_payment_configs_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/payment/ledger": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/payment/ledger */
        get: operations["get_api_admin_v1_payment_ledger"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/payment/ledger/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/payment/ledger/page-init */
        get: operations["get_api_admin_v1_payment_ledger_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/payment/recharges": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/payment/recharges */
        get: operations["get_api_admin_v1_payment_recharges"];
        put?: never;
        /** POST /api/admin/v1/payment/recharges */
        post: operations["post_api_admin_v1_payment_recharges"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/payment/recharges/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/payment/recharges/:id */
        get: operations["get_api_admin_v1_payment_recharges_id"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/payment/recharges/{id}/pay": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/payment/recharges/:id/pay */
        post: operations["post_api_admin_v1_payment_recharges_id_pay"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/payment/recharges/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/payment/recharges/page-init */
        get: operations["get_api_admin_v1_payment_recharges_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/payment/wallets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/payment/wallets */
        get: operations["get_api_admin_v1_payment_wallets"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/payment/wallets/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/payment/wallets/page-init */
        get: operations["get_api_admin_v1_payment_wallets_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/permissions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/permissions */
        get: operations["get_api_admin_v1_permissions"];
        put?: never;
        /** POST /api/admin/v1/permissions */
        post: operations["post_api_admin_v1_permissions"];
        /** DELETE /api/admin/v1/permissions */
        delete: operations["delete_api_admin_v1_permissions"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/permissions/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** PUT /api/admin/v1/permissions/:id */
        put: operations["put_api_admin_v1_permissions_id"];
        post?: never;
        /** DELETE /api/admin/v1/permissions/:id */
        delete: operations["delete_api_admin_v1_permissions_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/permissions/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** PATCH /api/admin/v1/permissions/:id/status */
        patch: operations["patch_api_admin_v1_permissions_id_status"];
        trace?: never;
    };
    "/api/admin/v1/permissions/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/permissions/page-init */
        get: operations["get_api_admin_v1_permissions_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/ping": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/ping */
        get: operations["get_api_admin_v1_ping"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/profile */
        get: operations["get_api_admin_v1_profile"];
        /** PUT /api/admin/v1/profile */
        put: operations["put_api_admin_v1_profile"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/profile/security/email": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** PUT /api/admin/v1/profile/security/email */
        put: operations["put_api_admin_v1_profile_security_email"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/profile/security/password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** PUT /api/admin/v1/profile/security/password */
        put: operations["put_api_admin_v1_profile_security_password"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/profile/security/phone": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** PUT /api/admin/v1/profile/security/phone */
        put: operations["put_api_admin_v1_profile_security_phone"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/queue-monitor": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/queue-monitor */
        get: operations["get_api_admin_v1_queue_monitor"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/queue-monitor-ui": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/queue-monitor-ui */
        get: operations["get_api_admin_v1_queue_monitor_ui"];
        /** PUT /api/admin/v1/queue-monitor-ui */
        put: operations["put_api_admin_v1_queue_monitor_ui"];
        /** POST /api/admin/v1/queue-monitor-ui */
        post: operations["post_api_admin_v1_queue_monitor_ui"];
        /** DELETE /api/admin/v1/queue-monitor-ui */
        delete: operations["delete_api_admin_v1_queue_monitor_ui"];
        /** OPTIONS /api/admin/v1/queue-monitor-ui */
        options: operations["options_api_admin_v1_queue_monitor_ui"];
        /** HEAD /api/admin/v1/queue-monitor-ui */
        head: operations["head_api_admin_v1_queue_monitor_ui"];
        /** PATCH /api/admin/v1/queue-monitor-ui */
        patch: operations["patch_api_admin_v1_queue_monitor_ui"];
        /** TRACE /api/admin/v1/queue-monitor-ui */
        trace: operations["trace_api_admin_v1_queue_monitor_ui"];
    };
    "/api/admin/v1/queue-monitor-ui/{path}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/queue-monitor-ui/*path */
        get: operations["get_api_admin_v1_queue_monitor_ui_path"];
        /** PUT /api/admin/v1/queue-monitor-ui/*path */
        put: operations["put_api_admin_v1_queue_monitor_ui_path"];
        /** POST /api/admin/v1/queue-monitor-ui/*path */
        post: operations["post_api_admin_v1_queue_monitor_ui_path"];
        /** DELETE /api/admin/v1/queue-monitor-ui/*path */
        delete: operations["delete_api_admin_v1_queue_monitor_ui_path"];
        /** OPTIONS /api/admin/v1/queue-monitor-ui/*path */
        options: operations["options_api_admin_v1_queue_monitor_ui_path"];
        /** HEAD /api/admin/v1/queue-monitor-ui/*path */
        head: operations["head_api_admin_v1_queue_monitor_ui_path"];
        /** PATCH /api/admin/v1/queue-monitor-ui/*path */
        patch: operations["patch_api_admin_v1_queue_monitor_ui_path"];
        /** TRACE /api/admin/v1/queue-monitor-ui/*path */
        trace: operations["trace_api_admin_v1_queue_monitor_ui_path"];
    };
    "/api/admin/v1/queue-monitor/failed": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/queue-monitor/failed */
        get: operations["get_api_admin_v1_queue_monitor_failed"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/realtime/ws": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/realtime/ws */
        get: operations["get_api_admin_v1_realtime_ws"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/roles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/roles */
        get: operations["get_api_admin_v1_roles"];
        put?: never;
        /** POST /api/admin/v1/roles */
        post: operations["post_api_admin_v1_roles"];
        /** DELETE /api/admin/v1/roles */
        delete: operations["delete_api_admin_v1_roles"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/roles/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** PUT /api/admin/v1/roles/:id */
        put: operations["put_api_admin_v1_roles_id"];
        post?: never;
        /** DELETE /api/admin/v1/roles/:id */
        delete: operations["delete_api_admin_v1_roles_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/roles/{id}/default": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** PATCH /api/admin/v1/roles/:id/default */
        patch: operations["patch_api_admin_v1_roles_id_default"];
        trace?: never;
    };
    "/api/admin/v1/roles/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/roles/page-init */
        get: operations["get_api_admin_v1_roles_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/sms/config": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/sms/config */
        get: operations["get_api_admin_v1_sms_config"];
        /** PUT /api/admin/v1/sms/config */
        put: operations["put_api_admin_v1_sms_config"];
        post?: never;
        /** DELETE /api/admin/v1/sms/config */
        delete: operations["delete_api_admin_v1_sms_config"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/sms/logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/sms/logs */
        get: operations["get_api_admin_v1_sms_logs"];
        put?: never;
        post?: never;
        /** DELETE /api/admin/v1/sms/logs */
        delete: operations["delete_api_admin_v1_sms_logs"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/sms/logs/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/sms/logs/:id */
        get: operations["get_api_admin_v1_sms_logs_id"];
        put?: never;
        post?: never;
        /** DELETE /api/admin/v1/sms/logs/:id */
        delete: operations["delete_api_admin_v1_sms_logs_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/sms/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/sms/page-init */
        get: operations["get_api_admin_v1_sms_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/sms/templates": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/sms/templates */
        get: operations["get_api_admin_v1_sms_templates"];
        put?: never;
        /** POST /api/admin/v1/sms/templates */
        post: operations["post_api_admin_v1_sms_templates"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/sms/templates/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** PUT /api/admin/v1/sms/templates/:id */
        put: operations["put_api_admin_v1_sms_templates_id"];
        post?: never;
        /** DELETE /api/admin/v1/sms/templates/:id */
        delete: operations["delete_api_admin_v1_sms_templates_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/sms/templates/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** PATCH /api/admin/v1/sms/templates/:id/status */
        patch: operations["patch_api_admin_v1_sms_templates_id_status"];
        trace?: never;
    };
    "/api/admin/v1/sms/test": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/sms/test */
        post: operations["post_api_admin_v1_sms_test"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/system-logs/files": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/system-logs/files */
        get: operations["get_api_admin_v1_system_logs_files"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/system-logs/files/{name}/lines": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/system-logs/files/:name/lines */
        get: operations["get_api_admin_v1_system_logs_files_name_lines"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/system-logs/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/system-logs/page-init */
        get: operations["get_api_admin_v1_system_logs_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/system-settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/system-settings */
        get: operations["get_api_admin_v1_system_settings"];
        put?: never;
        /** POST /api/admin/v1/system-settings */
        post: operations["post_api_admin_v1_system_settings"];
        /** DELETE /api/admin/v1/system-settings */
        delete: operations["delete_api_admin_v1_system_settings"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/system-settings/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** PUT /api/admin/v1/system-settings/:id */
        put: operations["put_api_admin_v1_system_settings_id"];
        post?: never;
        /** DELETE /api/admin/v1/system-settings/:id */
        delete: operations["delete_api_admin_v1_system_settings_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/system-settings/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** PATCH /api/admin/v1/system-settings/:id/status */
        patch: operations["patch_api_admin_v1_system_settings_id_status"];
        trace?: never;
    };
    "/api/admin/v1/system-settings/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/system-settings/page-init */
        get: operations["get_api_admin_v1_system_settings_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/upload-drivers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/upload-drivers */
        get: operations["get_api_admin_v1_upload_drivers"];
        put?: never;
        /** POST /api/admin/v1/upload-drivers */
        post: operations["post_api_admin_v1_upload_drivers"];
        /** DELETE /api/admin/v1/upload-drivers */
        delete: operations["delete_api_admin_v1_upload_drivers"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/upload-drivers/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** PUT /api/admin/v1/upload-drivers/:id */
        put: operations["put_api_admin_v1_upload_drivers_id"];
        post?: never;
        /** DELETE /api/admin/v1/upload-drivers/:id */
        delete: operations["delete_api_admin_v1_upload_drivers_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/upload-drivers/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/upload-drivers/page-init */
        get: operations["get_api_admin_v1_upload_drivers_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/upload-rules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/upload-rules */
        get: operations["get_api_admin_v1_upload_rules"];
        put?: never;
        /** POST /api/admin/v1/upload-rules */
        post: operations["post_api_admin_v1_upload_rules"];
        /** DELETE /api/admin/v1/upload-rules */
        delete: operations["delete_api_admin_v1_upload_rules"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/upload-rules/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** PUT /api/admin/v1/upload-rules/:id */
        put: operations["put_api_admin_v1_upload_rules_id"];
        post?: never;
        /** DELETE /api/admin/v1/upload-rules/:id */
        delete: operations["delete_api_admin_v1_upload_rules_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/upload-rules/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/upload-rules/page-init */
        get: operations["get_api_admin_v1_upload_rules_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/upload-settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/upload-settings */
        get: operations["get_api_admin_v1_upload_settings"];
        put?: never;
        /** POST /api/admin/v1/upload-settings */
        post: operations["post_api_admin_v1_upload_settings"];
        /** DELETE /api/admin/v1/upload-settings */
        delete: operations["delete_api_admin_v1_upload_settings"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/upload-settings/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** PUT /api/admin/v1/upload-settings/:id */
        put: operations["put_api_admin_v1_upload_settings_id"];
        post?: never;
        /** DELETE /api/admin/v1/upload-settings/:id */
        delete: operations["delete_api_admin_v1_upload_settings_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/upload-settings/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** PATCH /api/admin/v1/upload-settings/:id/status */
        patch: operations["patch_api_admin_v1_upload_settings_id_status"];
        trace?: never;
    };
    "/api/admin/v1/upload-settings/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/upload-settings/page-init */
        get: operations["get_api_admin_v1_upload_settings_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/upload-tokens": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/upload-tokens */
        post: operations["post_api_admin_v1_upload_tokens"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/user-sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/user-sessions */
        get: operations["get_api_admin_v1_user_sessions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/user-sessions/{id}/revoke": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** PATCH /api/admin/v1/user-sessions/:id/revoke */
        patch: operations["patch_api_admin_v1_user_sessions_id_revoke"];
        trace?: never;
    };
    "/api/admin/v1/user-sessions/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/user-sessions/page-init */
        get: operations["get_api_admin_v1_user_sessions_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/user-sessions/revoke": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** PATCH /api/admin/v1/user-sessions/revoke */
        patch: operations["patch_api_admin_v1_user_sessions_revoke"];
        trace?: never;
    };
    "/api/admin/v1/user-sessions/stats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/user-sessions/stats */
        get: operations["get_api_admin_v1_user_sessions_stats"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/users */
        get: operations["get_api_admin_v1_users"];
        put?: never;
        post?: never;
        /** DELETE /api/admin/v1/users */
        delete: operations["delete_api_admin_v1_users"];
        options?: never;
        head?: never;
        /** PATCH /api/admin/v1/users */
        patch: operations["patch_api_admin_v1_users"];
        trace?: never;
    };
    "/api/admin/v1/users/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** PUT /api/admin/v1/users/:id */
        put: operations["put_api_admin_v1_users_id"];
        post?: never;
        /** DELETE /api/admin/v1/users/:id */
        delete: operations["delete_api_admin_v1_users_id"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/users/{id}/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/users/:id/profile */
        get: operations["get_api_admin_v1_users_id_profile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/users/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** PATCH /api/admin/v1/users/:id/status */
        patch: operations["patch_api_admin_v1_users_id_status"];
        trace?: never;
    };
    "/api/admin/v1/users/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/admin/v1/users/export */
        post: operations["post_api_admin_v1_users_export"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/users/login-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/users/login-logs */
        get: operations["get_api_admin_v1_users_login_logs"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/users/login-logs/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/users/login-logs/page-init */
        get: operations["get_api_admin_v1_users_login_logs_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/users/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/users/me */
        get: operations["get_api_admin_v1_users_me"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/users/page-init": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/users/page-init */
        get: operations["get_api_admin_v1_users_page_init"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/wallet/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/wallet/summary */
        get: operations["get_api_admin_v1_wallet_summary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/v1/wallet/transactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /api/admin/v1/wallet/transactions */
        get: operations["get_api_admin_v1_wallet_transactions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/payment/callbacks/alipay": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** POST /api/payment/callbacks/alipay */
        post: operations["post_api_payment_callbacks_alipay"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /health */
        get: operations["get_health"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** GET /ready */
        get: operations["get_ready"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        AddressTreeNode: {
            children?: components["schemas"]["AddressTreeNode"][];
            /** Format: int64 */
            id: number;
            label: string;
            /** Format: int64 */
            parent_id: number;
            /** Format: int64 */
            value: number;
        };
        AIAttachmentRequest: {
            name?: string;
            /** Format: int64 */
            size?: number;
            /** @constant */
            type: "image";
            url: string;
        };
        AIConversationCreateRequest: {
            /** Format: int64 */
            agent_id: number;
            title?: string;
        };
        AIConversationCreateResult: {
            /** Format: int64 */
            id: number;
        };
        AIConversationCreateSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["AIConversationCreateResult"];
            msg: string;
        };
        AIConversationDetail: {
            /** Format: int64 */
            agent_id: number;
            agent_name: string;
            created_at: string;
            /** Format: int64 */
            id: number;
            last_message_at: string;
            title: string;
            updated_at: string;
        };
        AIConversationDetailSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["AIConversationDetail"];
            msg: string;
        };
        AIConversationItem: {
            /** Format: int64 */
            agent_id: number;
            agent_name: string;
            /** Format: int64 */
            id: number;
            last_message_at: string;
            title: string;
            updated_at: string;
        };
        AIConversationListResult: {
            has_more: boolean;
            list: components["schemas"]["AIConversationItem"][];
            /** Format: int64 */
            next_id: number;
            next_time: string;
        };
        AIConversationListSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["AIConversationListResult"];
            msg: string;
        };
        AIConversationUpdateRequest: {
            title: string;
        };
        AIMessageCancelRequest: {
            request_id: string;
        };
        AIMessageCancelResult: {
            /** Format: int64 */
            conversation_id: number;
            request_id: string;
            /** @constant */
            status: "canceled";
        };
        AIMessageCancelSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["AIMessageCancelResult"];
            msg: string;
        };
        AIMessageItem: {
            content: string;
            content_type: string;
            created_at: string;
            /** Format: int64 */
            id: number;
            meta_json?: components["schemas"]["AIMessageMeta"];
            /** @enum {integer} */
            role: 1 | 2 | 3;
            updated_at: string;
        };
        AIMessageListResult: {
            has_more: boolean;
            list: components["schemas"]["AIMessageItem"][];
            /** Format: int64 */
            next_id: number;
        };
        AIMessageListSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["AIMessageListResult"];
            msg: string;
        };
        AIMessageMeta: {
            attachments?: components["schemas"]["AIMessageMetaAttachment"][];
            runtime_params?: components["schemas"]["AIRuntimeParams"];
        };
        AIMessageMetaAttachment: {
            name: string;
            /** Format: int64 */
            size: number;
            /** @constant */
            type: "image";
            url: string;
        };
        /** @description request_id is required; additionally, trimmed content must be non-empty or attachments must contain at least one image. The cross-field rule is also published on the operation. */
        AIMessageSendRequest: {
            attachments?: components["schemas"]["AIAttachmentRequest"][];
            /** @description Trimmed content must be non-empty when attachments is absent or empty. */
            content?: string;
            request_id: string;
            runtime_params?: components["schemas"]["AIRuntimeParams"];
        };
        AIMessageSendResult: {
            /** Format: int64 */
            command_id: number;
            /** Format: int64 */
            conversation_id: number;
            request_id: string;
            /** @enum {string} */
            state: "pending" | "claimed" | "running" | "succeeded" | "failed" | "canceled" | "outcome_unknown" | "timed_out";
            /** Format: int64 */
            user_message_id: number;
        };
        AIMessageSendSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["AIMessageSendResult"];
            msg: string;
        };
        AIRunDetail: {
            /** Format: int64 */
            agent_id: number;
            agent_name: string;
            assistant_message: components["schemas"]["AIRunMessageSummary"] | null;
            /** Format: int64 */
            completion_tokens: number;
            conversation_id: number | null;
            conversation_title: string;
            created_at: string;
            duration_ms: number | null;
            duration_text: string;
            error_message: string;
            events: components["schemas"]["AIRunEvent"][];
            finished_at: string;
            /** Format: int64 */
            id: number;
            input_snapshot: string;
            knowledge_retrievals: components["schemas"]["AIRunKnowledgeRetrieval"][];
            model_display_name: string;
            model_id: string;
            /** @enum {string} */
            platform: "admin" | "app" | "canvas";
            /** Format: int64 */
            prompt_tokens: number;
            /** Format: int64 */
            provider_id: number;
            provider_name: string;
            request_id: string;
            started_at: string;
            /** @enum {string} */
            status: "running" | "success" | "failed" | "canceled" | "timeout";
            status_name: string;
            tool_calls: components["schemas"]["AIRunToolCall"][];
            /** Format: int64 */
            total_tokens: number;
            updated_at: string;
            /** Format: int64 */
            user_id: number;
            user_message: components["schemas"]["AIRunMessageSummary"] | null;
            username: string;
        };
        AIRunDetailSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["AIRunDetail"];
            msg: string;
        };
        AIRunEvent: {
            created_at: string;
            elapsed_ms: number | null;
            elapsed_text: string;
            /** @enum {string} */
            event_type: "start" | "completed" | "failed" | "canceled" | "timeout";
            event_type_name: string;
            /** Format: int64 */
            id: number;
            message: string;
            /** Format: int64 */
            seq: number;
        };
        AIRunKnowledgeHit: {
            /** Format: int64 */
            chunk_id: number;
            /** Format: int64 */
            chunk_index: number;
            content_snapshot: string;
            created_at: string;
            /** Format: int64 */
            document_id: number;
            document_title: string;
            /** Format: int64 */
            id: number;
            /** Format: int64 */
            knowledge_base_id: number;
            knowledge_base_name: string;
            /** Format: int64 */
            rank_no: number;
            score: number;
            skip_reason: string;
            /** @enum {integer} */
            status: 1 | 2;
            status_name: string;
        };
        AIRunKnowledgeRetrieval: {
            created_at: string;
            duration_ms: number | null;
            duration_text: string;
            error_message: string;
            hits: components["schemas"]["AIRunKnowledgeHit"][];
            /** Format: int64 */
            id: number;
            query: string;
            /** Format: int64 */
            run_id: number;
            /** Format: int64 */
            selected_hits: number;
            /** @enum {string} */
            status: "success" | "failed" | "skipped";
            status_name: string;
            /** Format: int64 */
            total_hits: number;
        };
        AIRunListItem: {
            /** Format: int64 */
            agent_id: number;
            agent_name: string;
            /** Format: int64 */
            completion_tokens: number;
            conversation_id: number | null;
            conversation_title: string;
            created_at: string;
            duration_ms: number | null;
            duration_text: string;
            error_message: string;
            /** Format: int64 */
            id: number;
            input_snapshot: string;
            model_display_name: string;
            model_id: string;
            /** @enum {string} */
            platform: "admin" | "app" | "canvas";
            /** Format: int64 */
            prompt_tokens: number;
            /** Format: int64 */
            provider_id: number;
            provider_name: string;
            request_id: string;
            /** @enum {string} */
            status: "running" | "success" | "failed" | "canceled" | "timeout";
            status_name: string;
            /** Format: int64 */
            total_tokens: number;
            /** Format: int64 */
            user_id: number;
        };
        AIRunListResult: {
            list: components["schemas"]["AIRunListItem"][];
            page: components["schemas"]["Page"];
        };
        AIRunListSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["AIRunListResult"];
            msg: string;
        };
        AIRunMessageSummary: {
            content: string;
            content_type: string;
            created_at: string;
            /** Format: int64 */
            id: number;
            meta_json: components["schemas"]["JSONValue"];
            /** @enum {integer} */
            role: 1 | 2 | 3;
        };
        AIRunPageInit: {
            dict: components["schemas"]["AIRunPageInitDict"];
        };
        AIRunPageInitDict: {
            agentArr: components["schemas"]["IntOption"][];
            platform_arr: components["schemas"]["StringOption"][];
            providerArr: components["schemas"]["IntOption"][];
            status_arr: components["schemas"]["StringOption"][];
        };
        AIRunPageInitSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["AIRunPageInit"];
            msg: string;
        };
        AIRunStatsByAgentItem: {
            /** Format: int64 */
            agent_id: number;
            agent_name: string;
            /** Format: int64 */
            avg_duration_ms: number;
            /** Format: int64 */
            total_completion_tokens: number;
            /** Format: int64 */
            total_prompt_tokens: number;
            /** Format: int64 */
            total_runs: number;
            /** Format: int64 */
            total_tokens: number;
        };
        AIRunStatsByAgentResult: {
            list: components["schemas"]["AIRunStatsByAgentItem"][];
            page: components["schemas"]["Page"];
        };
        AIRunStatsByAgentSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["AIRunStatsByAgentResult"];
            msg: string;
        };
        AIRunStatsByDateItem: {
            /** Format: int64 */
            avg_duration_ms: number;
            date: string;
            /** Format: int64 */
            total_completion_tokens: number;
            /** Format: int64 */
            total_prompt_tokens: number;
            /** Format: int64 */
            total_runs: number;
            /** Format: int64 */
            total_tokens: number;
        };
        AIRunStatsByDateResult: {
            list: components["schemas"]["AIRunStatsByDateItem"][];
            page: components["schemas"]["Page"];
        };
        AIRunStatsByDateSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["AIRunStatsByDateResult"];
            msg: string;
        };
        AIRunStatsByUserItem: {
            /** Format: int64 */
            avg_duration_ms: number;
            /** Format: int64 */
            total_completion_tokens: number;
            /** Format: int64 */
            total_prompt_tokens: number;
            /** Format: int64 */
            total_runs: number;
            /** Format: int64 */
            total_tokens: number;
            username: string;
        };
        AIRunStatsByUserResult: {
            list: components["schemas"]["AIRunStatsByUserItem"][];
            page: components["schemas"]["Page"];
        };
        AIRunStatsByUserSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["AIRunStatsByUserResult"];
            msg: string;
        };
        AIRunStatsDateRange: {
            end: string | null;
            start: string | null;
        };
        AIRunStatsMetric: {
            /** Format: int64 */
            avg_duration_ms: number;
            /** Format: int64 */
            total_completion_tokens: number;
            /** Format: int64 */
            total_prompt_tokens: number;
            /** Format: int64 */
            total_runs: number;
            /** Format: int64 */
            total_tokens: number;
        };
        AIRunStatsResult: {
            date_range: components["schemas"]["AIRunStatsDateRange"];
            summary: components["schemas"]["AIRunStatsSummary"];
        };
        AIRunStatsSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["AIRunStatsResult"];
            msg: string;
        };
        AIRunStatsSummary: {
            /** Format: int64 */
            avg_duration_ms: number;
            /** Format: int64 */
            fail_runs: number;
            success_rate: number;
            /** Format: int64 */
            total_completion_tokens: number;
            /** Format: int64 */
            total_prompt_tokens: number;
            /** Format: int64 */
            total_runs: number;
            /** Format: int64 */
            total_tokens: number;
        };
        AIRuntimeParams: {
            /** Format: int64 */
            max_history?: number;
            /** Format: int64 */
            max_tokens?: number;
            temperature?: number;
        };
        AIRunToolCall: {
            arguments_json: components["schemas"]["JSONValue"];
            call_id: string | null;
            duration_ms: number | null;
            error_message: string;
            finished_at: string;
            /** Format: int64 */
            id: number;
            result_json: components["schemas"]["JSONValue"];
            started_at: string;
            /** @enum {string} */
            status: "running" | "success" | "failed" | "timeout";
            tool_code: string;
            /** Format: int64 */
            tool_id: number;
            tool_name: string;
        };
        delete_api_admin_v1_ai_agents_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_ai_knowledge_bases_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_ai_knowledge_documents_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_ai_prompts_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_ai_prompts_Request: {
            ids: number[];
        };
        delete_api_admin_v1_ai_prompts_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_ai_providers_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_ai_tools_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_auth_platforms_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_auth_platforms_Request: {
            ids: number[];
        };
        delete_api_admin_v1_auth_platforms_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_cron_tasks_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_cron_tasks_Request: {
            ids: number[];
        };
        delete_api_admin_v1_cron_tasks_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_mail_config_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_mail_logs_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_mail_logs_Request: {
            ids: number[];
        };
        delete_api_admin_v1_mail_logs_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_mail_templates_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_notification_tasks_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_operation_logs_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_operation_logs_Request: {
            ids: number[];
        };
        delete_api_admin_v1_operation_logs_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_payment_configs_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_permissions_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_permissions_Request: {
            ids: number[];
        };
        delete_api_admin_v1_permissions_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_roles_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_roles_Request: {
            ids: number[];
        };
        delete_api_admin_v1_roles_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_sms_config_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_sms_logs_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_sms_logs_Request: {
            ids: number[];
        };
        delete_api_admin_v1_sms_logs_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_sms_templates_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_system_settings_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_system_settings_Request: {
            ids: number[];
        };
        delete_api_admin_v1_system_settings_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_upload_drivers_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_upload_drivers_Request: {
            ids: number[];
        };
        delete_api_admin_v1_upload_drivers_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_upload_rules_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_upload_rules_Request: {
            ids: number[];
        };
        delete_api_admin_v1_upload_rules_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_upload_settings_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        delete_api_admin_v1_upload_settings_Request: {
            ids: number[];
        };
        delete_api_admin_v1_upload_settings_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        EmptyObject: Record<string, never>;
        EmptySuccessEnvelope: {
            /** @constant */
            code: 0;
            data: Record<string, never>;
            msg: string;
        };
        ErrorEnvelope: {
            code: number;
            data: unknown;
            error: {
                /** @enum {string} */
                category: "authentication" | "authorization" | "canceled" | "conflict" | "dependency" | "internal" | "not_found" | "rate_limit" | "timeout" | "validation";
                code: string;
                request_id?: string;
                retryable: boolean;
                trace_id?: string;
            };
            msg: string;
        };
        /** @description Positive export-task IDs owned by the current user. */
        ExportTaskDeleteBatchRequest: {
            ids: number[];
        };
        ExportTaskItem: {
            created_at: string;
            error_msg: string | null;
            expire_at: string | null;
            file_name: string | null;
            file_size_text: string;
            file_url: string | null;
            /** Format: int64 */
            id: number;
            kind: string;
            kind_text: string;
            row_count: number | null;
            /** @enum {integer} */
            status: 1 | 2 | 3;
            status_text: string;
            title: string;
        };
        ExportTaskListResult: {
            list: components["schemas"]["ExportTaskItem"][];
            /** Format: int64 */
            next_id: number;
            page: components["schemas"]["Page"];
        };
        ExportTaskListSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["ExportTaskListResult"];
            msg: string;
        };
        ExportTaskStatusCountItem: {
            label: string;
            /** Format: int64 */
            num: number;
            /** @enum {integer} */
            value: 1 | 2 | 3;
        };
        ExportTaskStatusCountSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["ExportTaskStatusCountItem"][];
            msg: string;
        };
        GenericObject: {
            [key: string]: unknown;
        };
        get_api_admin_v1_ai_agents_id_knowledge_bases_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_knowledge_AgentKnowledgeBindingsResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_ai_agents_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_agent_DetailResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_ai_agents_id_tools_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_tool_AgentToolsResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_ai_agents_options_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_agent_AgentOptionsResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_ai_agents_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_agent_InitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_ai_agents_provider_models_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_agent_ProviderModelsResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_ai_agents_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_agent_ListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_ai_knowledge_bases_id_documents_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_knowledge_DocumentListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_ai_knowledge_bases_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_knowledge_BaseDetailResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_ai_knowledge_bases_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_knowledge_InitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_ai_knowledge_bases_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_knowledge_BaseListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_ai_knowledge_documents_id_chunks_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_knowledge_ChunkListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_ai_knowledge_documents_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_knowledge_DocumentDetailResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_ai_prompts_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_prompt_Item_Output"];
            msg: string;
        };
        get_api_admin_v1_ai_prompts_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_prompt_PageInitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_ai_prompts_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_prompt_ListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_ai_providers_id_models_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_provider_ProviderModelsResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_ai_providers_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_provider_InitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_ai_providers_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_provider_ListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_ai_tools_generate_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_tool_GeneratePageInitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_ai_tools_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_tool_InitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_ai_tools_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_tool_ListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_auth_captcha_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_auth_ChallengeResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_auth_login_config_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_auth_LoginConfigResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_auth_platforms_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_auth_platform_InitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_auth_platforms_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_auth_platform_ListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_cron_tasks_id_logs_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_crontask_LogsResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_cron_tasks_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_crontask_InitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_cron_tasks_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_crontask_ListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_mail_config_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_mail_ConfigResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_mail_logs_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_mail_LogDTO_Output"];
            msg: string;
        };
        get_api_admin_v1_mail_logs_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_mail_LogListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_mail_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_mail_PageInitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_mail_templates_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_mail_TemplateDTO_Output"][];
            msg: string;
        };
        get_api_admin_v1_notification_tasks_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_notification_task_InitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_notification_tasks_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_notification_task_ListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_notification_tasks_status_count_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_notification_task_StatusCountItem_Output"][];
            msg: string;
        };
        get_api_admin_v1_operation_logs_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_operationlog_InitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_operation_logs_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_operationlog_ListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_payment_configs_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_payment_ConfigPageInitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_payment_configs_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_payment_ConfigListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_payment_ledger_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_payment_wallet_LedgerPageInitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_payment_ledger_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_payment_wallet_TransactionListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_payment_recharges_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_payment_RechargeDetail_Output"];
            msg: string;
        };
        get_api_admin_v1_payment_recharges_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_payment_RechargePageInitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_payment_recharges_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_payment_RechargeListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_payment_wallets_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_payment_wallet_WalletUsersPageInitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_payment_wallets_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_payment_wallet_WalletUserListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_permissions_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_permission_InitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_permissions_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_permission_PermissionListItem_Output"][];
            msg: string;
        };
        get_api_admin_v1_profile_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_user_ProfileResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_roles_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_role_InitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_roles_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_role_ListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_sms_config_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_sms_ConfigResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_sms_logs_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_sms_LogDTO_Output"];
            msg: string;
        };
        get_api_admin_v1_sms_logs_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_sms_LogListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_sms_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_sms_PageInitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_sms_templates_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_sms_TemplateDTO_Output"][];
            msg: string;
        };
        get_api_admin_v1_system_logs_files_name_lines_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_systemlog_LinesResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_system_logs_files_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_systemlog_FilesResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_system_logs_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_systemlog_InitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_system_settings_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_systemsetting_InitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_system_settings_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_systemsetting_ListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_upload_drivers_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_uploadconfig_DriverPageInitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_upload_drivers_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_uploadconfig_DriverListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_upload_rules_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_uploadconfig_RulePageInitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_upload_rules_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_uploadconfig_RuleListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_upload_settings_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_uploadconfig_SettingPageInitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_upload_settings_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_uploadconfig_SettingListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_user_sessions_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_auth_SessionPageInitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_user_sessions_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_auth_SessionListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_user_sessions_stats_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_auth_SessionStatsResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_users_id_profile_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_user_ProfileResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_users_login_logs_page_init_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_auth_LoginLogPageInitResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_users_login_logs_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_auth_LoginLogListResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_wallet_summary_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_payment_wallet_SummaryResponse_Output"];
            msg: string;
        };
        get_api_admin_v1_wallet_transactions_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_payment_wallet_TransactionListResponse_Output"];
            msg: string;
        };
        Go_internal_infra_ai_TestConnectionResult_Output: {
            latency_ms: number;
            message: string;
            ok: boolean;
            status: string;
        };
        Go_internal_module_ai_agent_AgentDTO_Output: {
            avatar: string;
            created_at: string;
            engine_type: string;
            id: number;
            model_display_name: string;
            model_id: string;
            name: string;
            provider_id: number;
            provider_name: string;
            scene_names: string[];
            scenes: string[];
            status: number;
            status_name: string;
            system_prompt: string;
            updated_at: string;
        };
        Go_internal_module_ai_agent_AgentOption_Output: {
            avatar: string;
            id: number;
            name: string;
            system_prompt: string;
        };
        Go_internal_module_ai_agent_AgentOptionsResponse_Output: {
            list: components["schemas"]["Go_internal_module_ai_agent_AgentOption_Output"][];
        };
        Go_internal_module_ai_agent_DetailResponse_Output: {
            avatar: string;
            created_at: string;
            engine_type: string;
            id: number;
            model_display_name: string;
            model_id: string;
            name: string;
            provider_id: number;
            provider_name: string;
            scene_names: string[];
            scenes: string[];
            status: number;
            status_name: string;
            system_prompt: string;
            updated_at: string;
        };
        Go_internal_module_ai_agent_EngineOption_Output: {
            engine_type: string;
            label: string;
            value: number;
        };
        Go_internal_module_ai_agent_InitDict_Output: {
            common_status_arr: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
            provider_model_options: components["schemas"]["Go_internal_module_ai_agent_ModelOption_Output"][];
            provider_options: components["schemas"]["Go_internal_module_ai_agent_EngineOption_Output"][];
            scene_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
        };
        Go_internal_module_ai_agent_InitResponse_Output: {
            dict: components["schemas"]["Go_internal_module_ai_agent_InitDict_Output"];
        };
        Go_internal_module_ai_agent_ListResponse_Output: {
            list: components["schemas"]["Go_internal_module_ai_agent_AgentDTO_Output"][];
            page: components["schemas"]["Go_internal_module_ai_agent_Page_Output"];
        };
        Go_internal_module_ai_agent_ModelOption_Output: {
            display_name: string;
            label: string;
            model_id: string;
            provider_id: number;
            value: string;
        };
        Go_internal_module_ai_agent_Page_Output: {
            current_page: number;
            page_size: number;
            total: number;
            total_page: number;
        };
        Go_internal_module_ai_agent_ProviderModelDTO_Output: {
            created_at: string;
            display_name: string;
            id: number;
            model_id: string;
            provider_id: number;
            status: number;
            status_name: string;
            updated_at: string;
        };
        Go_internal_module_ai_agent_ProviderModelsResponse_Output: {
            list: components["schemas"]["Go_internal_module_ai_agent_ProviderModelDTO_Output"][];
        };
        Go_internal_module_ai_knowledge_AgentKnowledgeBindingInput_Input: {
            knowledge_base_id?: number;
            max_context_chars?: number;
            min_score?: number | null;
            status?: number;
            top_k?: number;
        };
        Go_internal_module_ai_knowledge_AgentKnowledgeBindingItem_Output: {
            id?: number;
            knowledge_base_id: number;
            knowledge_base_name: string;
            max_context_chars: number;
            min_score: number;
            status: number;
            status_name: string;
            top_k: number;
        };
        Go_internal_module_ai_knowledge_AgentKnowledgeBindingsResponse_Output: {
            agent_id: number;
            base_options: components["schemas"]["Go_internal_module_ai_knowledge_KnowledgeBaseOption_Output"][];
            bindings: components["schemas"]["Go_internal_module_ai_knowledge_AgentKnowledgeBindingItem_Output"][];
        };
        Go_internal_module_ai_knowledge_BaseDetailResponse_Output: {
            chunk_overlap_chars: number;
            chunk_size_chars: number;
            code: string;
            created_at: string;
            default_max_context_chars: number;
            default_min_score: number;
            default_top_k: number;
            description: string;
            id: number;
            name: string;
            status: number;
            status_name: string;
            updated_at: string;
        };
        Go_internal_module_ai_knowledge_BaseDTO_Output: {
            chunk_overlap_chars: number;
            chunk_size_chars: number;
            code: string;
            created_at: string;
            default_max_context_chars: number;
            default_min_score: number;
            default_top_k: number;
            description: string;
            id: number;
            name: string;
            status: number;
            status_name: string;
            updated_at: string;
        };
        Go_internal_module_ai_knowledge_BaseListResponse_Output: {
            list: components["schemas"]["Go_internal_module_ai_knowledge_BaseDTO_Output"][];
            page: components["schemas"]["Go_internal_module_ai_knowledge_Page_Output"];
        };
        Go_internal_module_ai_knowledge_ChunkDTO_Output: {
            chunk_index: number;
            content: string;
            content_chars: number;
            created_at: string;
            document_id: number;
            id: number;
            knowledge_base_id: number;
            status: number;
            status_name: string;
            title: string;
            updated_at: string;
        };
        Go_internal_module_ai_knowledge_ChunkListResponse_Output: {
            list: components["schemas"]["Go_internal_module_ai_knowledge_ChunkDTO_Output"][];
        };
        Go_internal_module_ai_knowledge_DocumentDetailResponse_Output: {
            content: string;
            created_at: string;
            error_message: string;
            id: number;
            index_status: string;
            index_status_name: string;
            knowledge_base_id: number;
            last_indexed_at: string;
            source_ref: string;
            source_type: string;
            source_type_name: string;
            status: number;
            status_name: string;
            title: string;
            updated_at: string;
        };
        Go_internal_module_ai_knowledge_DocumentDTO_Output: {
            created_at: string;
            error_message: string;
            id: number;
            index_status: string;
            index_status_name: string;
            knowledge_base_id: number;
            last_indexed_at: string;
            source_ref: string;
            source_type: string;
            source_type_name: string;
            status: number;
            status_name: string;
            title: string;
            updated_at: string;
        };
        Go_internal_module_ai_knowledge_DocumentListResponse_Output: {
            list: components["schemas"]["Go_internal_module_ai_knowledge_DocumentDTO_Output"][];
            page: components["schemas"]["Go_internal_module_ai_knowledge_Page_Output"];
        };
        Go_internal_module_ai_knowledge_InitDict_Output: {
            common_status_arr: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
            index_status_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
            source_type_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
        };
        Go_internal_module_ai_knowledge_InitResponse_Output: {
            dict: components["schemas"]["Go_internal_module_ai_knowledge_InitDict_Output"];
        };
        Go_internal_module_ai_knowledge_KnowledgeBaseOption_Output: {
            default_max_context_chars: number;
            default_min_score: number;
            default_top_k: number;
            description: string;
            label: string;
            value: number;
        };
        Go_internal_module_ai_knowledge_Page_Output: {
            current_page: number;
            page_size: number;
            total: number;
            total_page: number;
        };
        Go_internal_module_ai_knowledge_RetrievalHit_Output: {
            chunk_id: number;
            chunk_index: number;
            content: string;
            content_chars: number;
            document_id: number;
            document_title: string;
            knowledge_base_id: number;
            knowledge_base_name: string;
            rank_no: number;
            score: number;
            skip_reason: string;
            status: number;
        };
        Go_internal_module_ai_knowledge_RetrievalResult_Output: {
            hits: components["schemas"]["Go_internal_module_ai_knowledge_RetrievalHit_Output"][];
            query: string;
            selected: components["schemas"]["Go_internal_module_ai_knowledge_SelectedHit_Output"][];
            selected_hits: number;
            status: string;
            total_hits: number;
        };
        Go_internal_module_ai_knowledge_SelectedHit_Output: {
            chunk_id: number;
            chunk_index: number;
            content: string;
            document_id: number;
            document_title: string;
            knowledge_base_id: number;
            knowledge_base_name: string;
            rank_no: number;
            ref: string;
            score: number;
        };
        Go_internal_module_ai_prompt_Item_Output: {
            category: string;
            cover_url: string;
            created_at: string;
            id: number;
            preview: string;
            prompt: string;
            slug: string;
            source_url: string;
            status: number;
            tags_json: string;
            title: string;
            updated_at: string;
        };
        Go_internal_module_ai_prompt_ListResponse_Output: {
            list: components["schemas"]["Go_internal_module_ai_prompt_Item_Output"][];
            page: components["schemas"]["Go_internal_module_ai_prompt_Page_Output"];
        };
        Go_internal_module_ai_prompt_Page_Output: {
            current_page: number;
            page_size: number;
            total: number;
            total_page: number;
        };
        Go_internal_module_ai_prompt_PageInitResponse_Output: {
            common_status_arr: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
        };
        Go_internal_module_ai_provider_InitDict_Output: {
            common_status_arr: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
            engine_type_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
            health_status_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
            model_sync_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
        };
        Go_internal_module_ai_provider_InitResponse_Output: {
            dict: components["schemas"]["Go_internal_module_ai_provider_InitDict_Output"];
        };
        Go_internal_module_ai_provider_ListResponse_Output: {
            list: components["schemas"]["Go_internal_module_ai_provider_ProviderDTO_Output"][];
            page: components["schemas"]["Go_internal_module_ai_provider_Page_Output"];
        };
        Go_internal_module_ai_provider_ModelOptionDTO_Output: {
            display_name: string;
            model_id: string;
            owned_by: string;
        };
        Go_internal_module_ai_provider_ModelOptionsResponse_Output: {
            list: components["schemas"]["Go_internal_module_ai_provider_ModelOptionDTO_Output"][];
        };
        Go_internal_module_ai_provider_Page_Output: {
            current_page: number;
            page_size: number;
            total: number;
            total_page: number;
        };
        Go_internal_module_ai_provider_ProviderDTO_Output: {
            api_key_masked: string;
            base_url: string;
            base_url_effective: string;
            created_at: string;
            enabled_model_count: number;
            engine_type: string;
            engine_type_name: string;
            health_status: string;
            id: number;
            last_check_error: string;
            last_checked_at: string;
            last_model_sync_at: string;
            last_model_sync_error: string;
            last_model_sync_status: string;
            models: components["schemas"]["Go_internal_module_ai_provider_ProviderModelDTO_Output"][];
            name: string;
            status: number;
            status_name: string;
            updated_at: string;
        };
        Go_internal_module_ai_provider_ProviderModelDTO_Output: {
            created_at: string;
            display_name: string;
            id: number;
            model_id: string;
            provider_id: number;
            status: number;
            status_name: string;
            updated_at: string;
        };
        Go_internal_module_ai_provider_ProviderModelsResponse_Output: {
            list: components["schemas"]["Go_internal_module_ai_provider_ProviderModelDTO_Output"][];
        };
        Go_internal_module_ai_tool_AgentToolsResponse_Output: {
            active_tool_ids: number[];
            agent_id: number;
            tool_ids: number[];
        };
        Go_internal_module_ai_tool_GenerateAgentOption_Output: {
            label: string;
            value: number;
        };
        Go_internal_module_ai_tool_GenerateDraftResponse_Output: {
            clarifying_questions: string[];
            draft: components["schemas"]["Go_internal_module_ai_tool_GeneratedToolDraft_Output"] | null;
            ok: boolean;
            usage?: components["schemas"]["Go_internal_module_ai_tool_GenerateUsage_Output"] | null;
            warnings: string[];
        };
        Go_internal_module_ai_tool_GeneratedToolDraft_Output: {
            code: string;
            description: string;
            name: string;
            parameters_json: unknown;
            result_schema_json: unknown;
            risk_level: string;
            status: number;
            timeout_ms: number;
        };
        Go_internal_module_ai_tool_GeneratePageInitResponse_Output: {
            agent_options: components["schemas"]["Go_internal_module_ai_tool_GenerateAgentOption_Output"][];
        };
        Go_internal_module_ai_tool_GenerateUsage_Output: {
            completion_tokens: number;
            prompt_tokens: number;
            total_tokens: number;
        };
        Go_internal_module_ai_tool_InitDict_Output: {
            common_status_arr: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
            risk_level_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
        };
        Go_internal_module_ai_tool_InitResponse_Output: {
            dict: components["schemas"]["Go_internal_module_ai_tool_InitDict_Output"];
        };
        Go_internal_module_ai_tool_ListResponse_Output: {
            list: components["schemas"]["Go_internal_module_ai_tool_ToolDTO_Output"][];
            page: components["schemas"]["Go_internal_module_ai_tool_Page_Output"];
        };
        Go_internal_module_ai_tool_Page_Output: {
            current_page: number;
            page_size: number;
            total: number;
            total_page: number;
        };
        Go_internal_module_ai_tool_ToolDTO_Output: {
            code: string;
            created_at: string;
            description: string;
            id: number;
            name: string;
            parameters_json: unknown;
            result_schema_json: unknown;
            risk_level: string;
            risk_level_name: string;
            status: number;
            status_name: string;
            timeout_ms: number;
            updated_at: string;
        };
        Go_internal_module_auth_ChallengeResponse_Output: {
            captcha_id: string;
            captcha_type: string;
            expires_in: number;
            image_height: number;
            image_width: number;
            master_image: string;
            tile_height: number;
            tile_image: string;
            tile_width: number;
            tile_x: number;
            tile_y: number;
        };
        Go_internal_module_auth_LoginConfigResponse_Output: {
            allow_register: boolean;
            captcha_enabled: boolean;
            captcha_type: string;
            login_type_arr: components["schemas"]["Go_internal_module_auth_LoginTypeOption_Output"][];
        };
        Go_internal_module_auth_LoginLogListItem_Output: {
            created_at: string;
            id: number;
            ip: string;
            is_success: number;
            login_account: string;
            login_type: string;
            login_type_name: string;
            platform: string;
            platform_name: string;
            reason: string;
            ua: string;
            user_id: number | null;
            user_name: string;
        };
        Go_internal_module_auth_LoginLogListResponse_Output: {
            list: components["schemas"]["Go_internal_module_auth_LoginLogListItem_Output"][];
            page: components["schemas"]["Go_internal_module_auth_LoginLogPage_Output"];
        };
        Go_internal_module_auth_LoginLogPage_Output: {
            current_page: number;
            page_size: number;
            total: number;
            total_page: number;
        };
        Go_internal_module_auth_LoginLogPageInitDict_Output: {
            login_type_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
            platformArr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
        };
        Go_internal_module_auth_LoginLogPageInitResponse_Output: {
            dict: components["schemas"]["Go_internal_module_auth_LoginLogPageInitDict_Output"];
        };
        Go_internal_module_auth_LoginTypeOption_Output: {
            label: string;
            value: string;
        };
        Go_internal_module_auth_platform_InitDict_Output: {
            auth_platform_captcha_type_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
            auth_platform_login_type_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
            common_status_arr: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
        };
        Go_internal_module_auth_platform_InitResponse_Output: {
            dict: components["schemas"]["Go_internal_module_auth_platform_InitDict_Output"];
        };
        Go_internal_module_auth_platform_ListItem_Output: {
            access_ttl: number;
            allow_register: number;
            bind_device: number;
            bind_ip: number;
            bind_platform: number;
            captcha_type: string;
            code: string;
            created_at: string;
            id: number;
            login_types: string[];
            max_sessions: number;
            name: string;
            refresh_ttl: number;
            single_session: number;
            status: number;
            status_name: string;
            updated_at: string;
        };
        Go_internal_module_auth_platform_ListResponse_Output: {
            list: components["schemas"]["Go_internal_module_auth_platform_ListItem_Output"][];
            page: components["schemas"]["Go_internal_module_auth_platform_Page_Output"];
        };
        Go_internal_module_auth_platform_Page_Output: {
            current_page: number;
            page_size: number;
            total: number;
            total_page: number;
        };
        Go_internal_module_auth_SessionBatchRevokeResponse_Output: {
            count: number;
            skipped_already_revoked: number;
            skipped_current: number;
        };
        Go_internal_module_auth_SessionListItem_Output: {
            created_at: string;
            device_id: string;
            expires_at: string;
            id: number;
            ip: string;
            last_seen_at: string;
            platform: string;
            platform_name: string;
            refresh_expires_at: string;
            revoked_at: string | null;
            status: string;
            ua: string;
            user_id: number;
            username: string;
        };
        Go_internal_module_auth_SessionListResponse_Output: {
            list: components["schemas"]["Go_internal_module_auth_SessionListItem_Output"][];
            page: components["schemas"]["Go_internal_module_auth_SessionPage_Output"];
        };
        Go_internal_module_auth_SessionOption_string_Output: {
            label: string;
            value: string;
        };
        Go_internal_module_auth_SessionPage_Output: {
            current_page: number;
            page_size: number;
            total: number;
            total_page: number;
        };
        Go_internal_module_auth_SessionPageInitDict_Output: {
            platformArr: components["schemas"]["Go_internal_module_auth_SessionOption_string_Output"][];
            statusArr: components["schemas"]["Go_internal_module_auth_SessionOption_string_Output"][];
        };
        Go_internal_module_auth_SessionPageInitResponse_Output: {
            dict: components["schemas"]["Go_internal_module_auth_SessionPageInitDict_Output"];
        };
        Go_internal_module_auth_SessionRevokeResponse_Output: {
            id: number;
            revoked: boolean;
        };
        Go_internal_module_auth_SessionStatsResponse_Output: {
            platform_distribution: {
                [key: string]: number;
            };
            total_active: number;
        };
        Go_internal_module_auth_transport_admin_captchaAnswerRequest_Input: {
            x?: number;
            y?: number;
        };
        Go_internal_module_auth_transport_admin_CredentialResponse_Output: {
            access_token: string;
            expires_in: number;
        };
        Go_internal_module_crontask_InitDict_Output: {
            cron_preset_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
            cron_task_log_status_arr: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
            cron_task_status_arr: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
        };
        Go_internal_module_crontask_InitResponse_Output: {
            dict: components["schemas"]["Go_internal_module_crontask_InitDict_Output"];
        };
        Go_internal_module_crontask_ListItem_Output: {
            created_at: string;
            cron: string;
            cron_readable: string;
            description: string;
            handler: string;
            id: number;
            name: string;
            next_run_time: string;
            status: number;
            status_name: string;
            title: string;
            updated_at: string;
        };
        Go_internal_module_crontask_ListResponse_Output: {
            list: components["schemas"]["Go_internal_module_crontask_ListItem_Output"][];
            page: components["schemas"]["Go_internal_module_crontask_Page_Output"];
        };
        Go_internal_module_crontask_LogItem_Output: {
            created_at: string;
            duration_ms: number | null;
            end_time: string | null;
            error_msg: string | null;
            id: number;
            result: string | null;
            start_time: string | null;
            status: number;
            status_name: string;
            task_id: number;
            task_name: string;
        };
        Go_internal_module_crontask_LogsResponse_Output: {
            list: components["schemas"]["Go_internal_module_crontask_LogItem_Output"][];
            next_id: number;
            next_time: string;
            page: components["schemas"]["Go_internal_module_crontask_Page_Output"];
        };
        Go_internal_module_crontask_Page_Output: {
            current_page: number;
            page_size: number;
            total: number;
            total_page: number;
        };
        Go_internal_module_mail_ConfigResponse_Output: {
            configured: boolean;
            created_at: string | null;
            endpoint: string;
            from_email: string;
            from_name: string;
            id: number | null;
            last_test_at: string | null;
            last_test_error: string;
            region: string;
            reply_to: string;
            secret_id_hint: string;
            secret_key_hint: string;
            status: number;
            updated_at: string | null;
            verify_code_ttl_minutes: number;
        };
        Go_internal_module_mail_LogDTO_Output: {
            created_at: string;
            duration_ms: number;
            error_code: string;
            error_message: string;
            id: number;
            scene: string;
            sent_at: string | null;
            status: number;
            subject: string;
            template?: components["schemas"]["Go_internal_module_mail_LogTemplateDTO_Output"] | null;
            template_id: number | null;
            tencent_message_id: string;
            tencent_request_id: string;
            to_email: string;
            updated_at: string;
        };
        Go_internal_module_mail_LogListResponse_Output: {
            list: components["schemas"]["Go_internal_module_mail_LogDTO_Output"][];
            page: components["schemas"]["Go_internal_module_mail_Page_Output"];
        };
        Go_internal_module_mail_LogTemplateDTO_Output: {
            id: number;
            name: string;
            scene: string;
            status: number;
            tencent_template_id: number;
            variables: string[];
        };
        Go_internal_module_mail_Page_Output: {
            current_page: number;
            page_size: number;
            total: number;
            total_page: number;
        };
        Go_internal_module_mail_PageInitDict_Output: {
            common_status_arr: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
            default_endpoint: string;
            default_region: string;
            default_ttl_minutes: number;
            mail_log_scene_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
            mail_log_status_arr: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
            mail_region_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
            mail_scene_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
        };
        Go_internal_module_mail_PageInitResponse_Output: {
            dict: components["schemas"]["Go_internal_module_mail_PageInitDict_Output"];
        };
        Go_internal_module_mail_TemplateDTO_Output: {
            created_at: string;
            id: number;
            name: string;
            sample_variables: {
                [key: string]: string;
            };
            scene: string;
            status: number;
            subject: string;
            tencent_template_id: number;
            updated_at: string;
            variables: string[];
        };
        Go_internal_module_notification_task_CreateResponse_Output: {
            id: number;
            queued: boolean;
        };
        Go_internal_module_notification_task_InitDict_Output: {
            notification_level_arr: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
            notification_target_type_arr: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
            notification_task_status_arr: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
            notification_type_arr: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
            platformArr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
        };
        Go_internal_module_notification_task_InitResponse_Output: {
            dict: components["schemas"]["Go_internal_module_notification_task_InitDict_Output"];
        };
        Go_internal_module_notification_task_ListItem_Output: {
            content: string;
            created_at: string;
            error_msg: string | null;
            id: number;
            level: number;
            level_text: string;
            link: string;
            platform: string;
            platform_text: string;
            send_at: string | null;
            sent_count: number;
            status: number;
            status_text: string;
            target_type: number;
            target_type_text: string;
            title: string;
            total_count: number;
            type: number;
            type_text: string;
        };
        Go_internal_module_notification_task_ListResponse_Output: {
            list: components["schemas"]["Go_internal_module_notification_task_ListItem_Output"][];
            page: components["schemas"]["Go_internal_module_notification_task_Page_Output"];
        };
        Go_internal_module_notification_task_Page_Output: {
            current_page: number;
            page_size: number;
            total: number;
            total_page: number;
        };
        Go_internal_module_notification_task_StatusCountItem_Output: {
            label: string;
            num: number;
            value: number;
        };
        Go_internal_module_operationlog_InitResponse_Output: Record<string, never>;
        Go_internal_module_operationlog_ListItem_Output: {
            action: string;
            created_at: string;
            id: number;
            is_success: number;
            request_data: string;
            response_data: string;
            user_email: string;
            user_name: string;
        };
        Go_internal_module_operationlog_ListResponse_Output: {
            list: components["schemas"]["Go_internal_module_operationlog_ListItem_Output"][];
            page: components["schemas"]["Go_internal_module_operationlog_Page_Output"];
        };
        Go_internal_module_operationlog_Page_Output: {
            current_page: number;
            page_size: number;
            total: number;
            total_page: number;
        };
        Go_internal_module_payment_CertificateUploadResponse_Output: {
            file_name: string;
            path: string;
            sha256: string;
            size: number;
        };
        Go_internal_module_payment_ConfigListItem_Output: {
            app_cert_path: string;
            app_id: string;
            code: string;
            created_at: string;
            enabled_methods: string[];
            enabled_methods_text: string;
            environment: string;
            environment_text: string;
            id: number;
            name: string;
            notify_url: string;
            platform_cert_path: string;
            private_key_hint: string;
            provider: string;
            provider_text: string;
            remark: string;
            root_cert_path: string;
            sort: number;
            status: number;
            status_text: string;
            updated_at: string;
        };
        Go_internal_module_payment_ConfigListResponse_Output: {
            list: components["schemas"]["Go_internal_module_payment_ConfigListItem_Output"][];
            page: components["schemas"]["Go_internal_module_payment_Page_Output"];
        };
        Go_internal_module_payment_ConfigPageInitDict_Output: {
            certificate_type_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
            common_status_arr: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
            enabled_method_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
            environment_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
            provider_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
        };
        Go_internal_module_payment_ConfigPageInitResponse_Output: {
            dict: components["schemas"]["Go_internal_module_payment_ConfigPageInitDict_Output"];
        };
        Go_internal_module_payment_ConfigTestResponse_Output: {
            checks: string[];
            message: string;
            ok: boolean;
        };
        Go_internal_module_payment_Page_Output: {
            current_page: number;
            page_size: number;
            total: number;
            total_page: number;
        };
        Go_internal_module_payment_RechargeDetail_Output: {
            alipay_trade_no: string;
            amount_cents: number;
            amount_text: string;
            created_at: string;
            credited_at: string;
            failure_reason: string;
            id: number;
            package_code: string;
            package_name: string;
            paid_at: string;
            pay_url: string;
            payment_order_no: string;
            recharge_no: string;
            status: string;
            status_text: string;
            updated_at: string;
        };
        Go_internal_module_payment_RechargeListItem_Output: {
            amount_cents: number;
            amount_text: string;
            created_at: string;
            credited_at: string;
            id: number;
            package_code: string;
            package_name: string;
            paid_at: string;
            pay_url: string;
            payment_order_no: string;
            recharge_no: string;
            status: string;
            status_text: string;
            updated_at: string;
        };
        Go_internal_module_payment_RechargeListResponse_Output: {
            list: components["schemas"]["Go_internal_module_payment_RechargeListItem_Output"][];
            page: components["schemas"]["Go_internal_module_payment_Page_Output"];
        };
        Go_internal_module_payment_RechargePackageItem_Output: {
            amount_cents: number;
            amount_text: string;
            badge: string;
            code: string;
            name: string;
        };
        Go_internal_module_payment_RechargePageInitDict_Output: {
            status_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
        };
        Go_internal_module_payment_RechargePageInitResponse_Output: {
            dict: components["schemas"]["Go_internal_module_payment_RechargePageInitDict_Output"];
            packages: components["schemas"]["Go_internal_module_payment_RechargePackageItem_Output"][];
            payment_method: components["schemas"]["Go_internal_module_payment_RechargePaymentMethod_Output"];
            recent: components["schemas"]["Go_internal_module_payment_RechargeListItem_Output"][];
            wallet: components["schemas"]["Go_internal_module_payment_WalletSummary_Output"];
        };
        Go_internal_module_payment_RechargePaymentMethod_Output: {
            enabled: boolean;
            label: string;
            provider: string;
        };
        Go_internal_module_payment_RechargePayResponse_Output: {
            id: number;
            pay_url: string;
            payment_order_no: string;
            recharge_no: string;
            status: string;
        };
        Go_internal_module_payment_wallet_LedgerPageInitResponse_Output: {
            dict: components["schemas"]["Go_internal_module_payment_wallet_WalletDict_Output"];
        };
        Go_internal_module_payment_wallet_Page_Output: {
            current_page: number;
            page_size: number;
            total: number;
            total_page: number;
        };
        Go_internal_module_payment_wallet_SummaryResponse_Output: {
            balance_cents: number;
            balance_text: string;
            total_consume_cents: number;
            total_consume_text: string;
            total_recharge_cents: number;
            total_recharge_text: string;
        };
        Go_internal_module_payment_wallet_TransactionItem_Output: {
            account: string;
            amount_cents: number;
            amount_text: string;
            balance_after_cents: number;
            balance_after_text: string;
            balance_before_cents: number;
            balance_before_text: string;
            created_at: string;
            direction: string;
            direction_text: string;
            id: number;
            remark: string;
            source_id: number;
            source_type: string;
            source_type_text: string;
            transaction_no: string;
            user_id: number;
            username: string;
        };
        Go_internal_module_payment_wallet_TransactionListResponse_Output: {
            list: components["schemas"]["Go_internal_module_payment_wallet_TransactionItem_Output"][];
            page: components["schemas"]["Go_internal_module_payment_wallet_Page_Output"];
        };
        Go_internal_module_payment_wallet_WalletDict_Output: {
            direction_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
            source_type_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
        };
        Go_internal_module_payment_wallet_WalletUserItem_Output: {
            account: string;
            balance_cents: number;
            balance_text: string;
            id: number;
            total_consume_cents: number;
            total_consume_text: string;
            total_recharge_cents: number;
            total_recharge_text: string;
            updated_at: string;
            user_id: number;
            username: string;
            wallet_id: number;
        };
        Go_internal_module_payment_wallet_WalletUserListResponse_Output: {
            list: components["schemas"]["Go_internal_module_payment_wallet_WalletUserItem_Output"][];
            page: components["schemas"]["Go_internal_module_payment_wallet_Page_Output"];
        };
        Go_internal_module_payment_wallet_WalletUsersPageInitResponse_Output: Record<string, never>;
        Go_internal_module_payment_WalletSummary_Output: {
            balance_cents: number;
            balance_text: string;
            total_consume_cents: number;
            total_consume_text: string;
            total_recharge_cents: number;
            total_recharge_text: string;
        };
        Go_internal_module_permission_InitResponse_Output: {
            dict: components["schemas"]["Go_internal_module_permission_PermissionDict_Output"];
        };
        Go_internal_module_permission_PermissionDict_Output: {
            permission_platform_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
            permission_tree: components["schemas"]["Go_internal_module_permission_PermissionTreeNode_Output"][];
            permission_type_arr: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
        };
        Go_internal_module_permission_PermissionListItem_Output: {
            children?: components["schemas"]["Go_internal_module_permission_PermissionListItem_Output"][];
            code: string;
            component: string;
            i18n_key: string;
            icon: string;
            id: number;
            name: string;
            parent_id: number;
            path: string;
            show_menu: number;
            sort: number;
            status: number;
            type: number;
            type_name: string;
        };
        Go_internal_module_permission_PermissionTreeNode_Output: {
            children?: components["schemas"]["Go_internal_module_permission_PermissionTreeNode_Output"][];
            code?: string;
            id: number;
            label: string;
            parent_id: number;
            platform: string;
            type: number;
            value: number;
        };
        Go_internal_module_role_InitDict_Output: {
            permission_platform_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
            permission_tree: components["schemas"]["Go_internal_module_permission_PermissionTreeNode_Output"][];
        };
        Go_internal_module_role_InitResponse_Output: {
            dict: components["schemas"]["Go_internal_module_role_InitDict_Output"];
        };
        Go_internal_module_role_ListItem_Output: {
            created_at: string;
            id: number;
            is_default: number;
            name: string;
            permission_id: number[];
            updated_at: string;
        };
        Go_internal_module_role_ListResponse_Output: {
            list: components["schemas"]["Go_internal_module_role_ListItem_Output"][];
            page: components["schemas"]["Go_internal_module_role_Page_Output"];
        };
        Go_internal_module_role_Page_Output: {
            current_page: number;
            page_size: number;
            total: number;
            total_page: number;
        };
        Go_internal_module_sms_ConfigResponse_Output: {
            configured: boolean;
            created_at: string | null;
            endpoint: string;
            id: number | null;
            last_test_at: string | null;
            last_test_error: string;
            region: string;
            secret_id_hint: string;
            secret_key_hint: string;
            sign_name: string;
            sms_sdk_app_id: string;
            status: number;
            updated_at: string | null;
            verify_code_ttl_minutes: number;
        };
        Go_internal_module_sms_LogDTO_Output: {
            created_at: string;
            duration_ms: number;
            error_code: string;
            error_message: string;
            id: number;
            scene: string;
            sent_at: string | null;
            status: number;
            template?: components["schemas"]["Go_internal_module_sms_LogTemplateDTO_Output"] | null;
            template_id: number | null;
            tencent_fee: number;
            tencent_request_id: string;
            tencent_serial_no: string;
            to_phone: string;
            updated_at: string;
        };
        Go_internal_module_sms_LogListResponse_Output: {
            list: components["schemas"]["Go_internal_module_sms_LogDTO_Output"][];
            page: components["schemas"]["Go_internal_module_sms_Page_Output"];
        };
        Go_internal_module_sms_LogTemplateDTO_Output: {
            id: number;
            name: string;
            scene: string;
            status: number;
            tencent_template_id: string;
            variables: string[];
        };
        Go_internal_module_sms_Page_Output: {
            current_page: number;
            page_size: number;
            total: number;
            total_page: number;
        };
        Go_internal_module_sms_PageInitDict_Output: {
            common_status_arr: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
            default_endpoint: string;
            default_region: string;
            default_ttl_minutes: number;
            sms_log_scene_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
            sms_log_status_arr: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
            sms_region_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
            sms_scene_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
        };
        Go_internal_module_sms_PageInitResponse_Output: {
            dict: components["schemas"]["Go_internal_module_sms_PageInitDict_Output"];
        };
        Go_internal_module_sms_TemplateDTO_Output: {
            created_at: string;
            id: number;
            name: string;
            sample_variables: {
                [key: string]: string;
            };
            scene: string;
            status: number;
            tencent_template_id: string;
            updated_at: string;
            variables: string[];
        };
        Go_internal_module_systemlog_FileItem_Output: {
            mtime: string;
            name: string;
            size: number;
            size_human: string;
        };
        Go_internal_module_systemlog_FilesResponse_Output: {
            list: components["schemas"]["Go_internal_module_systemlog_FileItem_Output"][];
        };
        Go_internal_module_systemlog_InitDict_Output: {
            log_level_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
            log_tail_arr: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
        };
        Go_internal_module_systemlog_InitResponse_Output: {
            dict: components["schemas"]["Go_internal_module_systemlog_InitDict_Output"];
        };
        Go_internal_module_systemlog_LineItem_Output: {
            content: string;
            level: string;
            number: number;
        };
        Go_internal_module_systemlog_LinesResponse_Output: {
            filename: string;
            lines: components["schemas"]["Go_internal_module_systemlog_LineItem_Output"][];
            total: number;
        };
        Go_internal_module_systemsetting_InitDict_Output: {
            system_setting_value_type_arr: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
        };
        Go_internal_module_systemsetting_InitResponse_Output: {
            dict: components["schemas"]["Go_internal_module_systemsetting_InitDict_Output"];
        };
        Go_internal_module_systemsetting_ListItem_Output: {
            created_at: string;
            id: number;
            is_del: number;
            remark: string;
            setting_key: string;
            setting_value: string;
            status: number;
            status_name: string;
            updated_at: string;
            value_type: number;
            value_type_name: string;
        };
        Go_internal_module_systemsetting_ListResponse_Output: {
            list: components["schemas"]["Go_internal_module_systemsetting_ListItem_Output"][];
            page: components["schemas"]["Go_internal_module_systemsetting_Page_Output"];
        };
        Go_internal_module_systemsetting_Page_Output: {
            current_page: number;
            page_size: number;
            total: number;
            total_page: number;
        };
        Go_internal_module_uploadconfig_DriverItem_Output: {
            appid: string | null;
            bucket: string;
            bucket_domain: string | null;
            created_at: string;
            driver: string;
            driver_show: string;
            endpoint: string | null;
            id: number;
            region: string;
            role_arn: string | null;
            secret_id_hint: string;
            secret_key_hint: string;
            updated_at: string;
        };
        Go_internal_module_uploadconfig_DriverListResponse_Output: {
            list: components["schemas"]["Go_internal_module_uploadconfig_DriverItem_Output"][];
            page: components["schemas"]["Go_internal_module_uploadconfig_Page_Output"];
        };
        Go_internal_module_uploadconfig_DriverPageInitDict_Output: {
            upload_driver_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
        };
        Go_internal_module_uploadconfig_DriverPageInitResponse_Output: {
            dict: components["schemas"]["Go_internal_module_uploadconfig_DriverPageInitDict_Output"];
        };
        Go_internal_module_uploadconfig_Page_Output: {
            current_page: number;
            page_size: number;
            total: number;
            total_page: number;
        };
        Go_internal_module_uploadconfig_RuleItem_Output: {
            created_at: string;
            file_exts: string[];
            id: number;
            image_exts: string[];
            max_size_mb: number;
            title: string;
            updated_at: string;
        };
        Go_internal_module_uploadconfig_RuleListResponse_Output: {
            list: components["schemas"]["Go_internal_module_uploadconfig_RuleItem_Output"][];
            page: components["schemas"]["Go_internal_module_uploadconfig_Page_Output"];
        };
        Go_internal_module_uploadconfig_RulePageInitDict_Output: {
            upload_file_ext_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
            upload_image_ext_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
        };
        Go_internal_module_uploadconfig_RulePageInitResponse_Output: {
            dict: components["schemas"]["Go_internal_module_uploadconfig_RulePageInitDict_Output"];
        };
        Go_internal_module_uploadconfig_SettingItem_Output: {
            created_at: string;
            driver_id: number;
            driver_name: string;
            id: number;
            remark: string;
            rule_id: number;
            rule_name: string;
            status: number;
            status_name: string;
            updated_at: string;
        };
        Go_internal_module_uploadconfig_SettingListResponse_Output: {
            list: components["schemas"]["Go_internal_module_uploadconfig_SettingItem_Output"][];
            page: components["schemas"]["Go_internal_module_uploadconfig_Page_Output"];
        };
        Go_internal_module_uploadconfig_SettingPageInitDict_Output: {
            common_status_arr: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
            upload_driver_list: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
            upload_rule_list: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
        };
        Go_internal_module_uploadconfig_SettingPageInitResponse_Output: {
            dict: components["schemas"]["Go_internal_module_uploadconfig_SettingPageInitDict_Output"];
        };
        Go_internal_module_uploadtoken_CreateResponse_Output: {
            bucket: string;
            bucket_domain: string | null;
            credentials: components["schemas"]["Go_internal_module_uploadtoken_CredentialsDTO_Output"];
            expired_time: number;
            key: string;
            provider: string;
            region: string;
            rule: components["schemas"]["Go_internal_module_uploadtoken_UploadRuleDTO_Output"];
            start_time: number;
            upload_path: string;
        };
        Go_internal_module_uploadtoken_CredentialsDTO_Output: {
            session_token: string;
            tmp_secret_id: string;
            tmp_secret_key: string;
        };
        Go_internal_module_uploadtoken_UploadRuleDTO_Output: {
            file_exts: string[];
            image_exts: string[];
            max_size_mb: number;
        };
        Go_internal_module_user_AddressTreeNode_Output: {
            children?: components["schemas"]["Go_internal_module_user_AddressTreeNode_Output"][];
            id: number;
            label: string;
            parent_id: number;
            value: number;
        };
        Go_internal_module_user_ProfileDetail_Output: {
            address_id: number;
            avatar: string;
            bio: string;
            birthday: string;
            detail_address: string;
            email: string;
            has_password: boolean;
            is_self: number;
            phone: string;
            role_id: number;
            role_name: string;
            sex: number;
            user_id: number;
            username: string;
        };
        Go_internal_module_user_ProfileDict_Output: {
            auth_address_tree: components["schemas"]["Go_internal_module_user_AddressTreeNode_Output"][];
            sexArr: components["schemas"]["Go_internal_shared_dict_Option_int_Output"][];
            verify_type_arr: components["schemas"]["Go_internal_shared_dict_Option_string_Output"][];
        };
        Go_internal_module_user_ProfileResponse_Output: {
            dict: components["schemas"]["Go_internal_module_user_ProfileDict_Output"];
            profile: components["schemas"]["Go_internal_module_user_ProfileDetail_Output"];
        };
        Go_internal_server_adminroute_EmptyData_Output: Record<string, never>;
        Go_internal_server_adminroute_IDData_Output: {
            id: number;
        };
        Go_internal_shared_dict_Option_int_Output: {
            label: string;
            value: number;
        };
        Go_internal_shared_dict_Option_string_Output: {
            label: string;
            value: string;
        };
        IntOption: {
            label: string;
            /** Format: int64 */
            value: number;
        };
        /** @description Any valid JSON value explicitly stored in a json.RawMessage field; invalid or absent stored JSON is normalized to an empty object. */
        JSONValue: unknown;
        /** @description Positive notification IDs owned by the current user. */
        NotificationDeleteBatchRequest: {
            ids: number[];
        };
        NotificationItem: {
            content: string;
            created_at: string;
            /** Format: int64 */
            id: number;
            /** @enum {integer} */
            is_read: 1 | 2;
            /** @enum {integer} */
            level: 1 | 2;
            level_text: string;
            link: string;
            title: string;
            /** @enum {integer} */
            type: 1 | 2 | 3 | 4;
            type_text: string;
        };
        NotificationListResult: {
            list: components["schemas"]["NotificationItem"][];
            /** Format: int64 */
            next_id: number;
            page: components["schemas"]["Page"];
        };
        NotificationListSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["NotificationListResult"];
            msg: string;
        };
        NotificationPageInit: {
            dict: components["schemas"]["NotificationPageInitDict"];
        };
        NotificationPageInitDict: {
            notification_level_arr: components["schemas"]["IntOption"][];
            notification_read_status_arr: components["schemas"]["IntOption"][];
            notification_type_arr: components["schemas"]["IntOption"][];
        };
        NotificationPageInitSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["NotificationPageInit"];
            msg: string;
        };
        NotificationReadRequest: {
            ids?: number[];
        };
        NotificationUnreadCountResult: {
            /** Format: int64 */
            count: number;
        };
        NotificationUnreadCountSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["NotificationUnreadCountResult"];
            msg: string;
        };
        Page: {
            /** Format: int64 */
            current_page: number;
            /** Format: int64 */
            page_size: number;
            /** Format: int64 */
            total: number;
            /** Format: int64 */
            total_page: number;
        };
        patch_api_admin_v1_ai_agents_id_status_Request: {
            /** @enum {integer} */
            status: 1 | 2;
        };
        patch_api_admin_v1_ai_agents_id_status_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        patch_api_admin_v1_ai_knowledge_bases_id_status_Request: {
            /** @enum {integer} */
            status: 1 | 2;
        };
        patch_api_admin_v1_ai_knowledge_bases_id_status_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        patch_api_admin_v1_ai_knowledge_documents_id_status_Request: {
            /** @enum {integer} */
            status: 1 | 2;
        };
        patch_api_admin_v1_ai_knowledge_documents_id_status_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        patch_api_admin_v1_ai_prompts_id_status_Request: {
            /** @enum {integer} */
            status: 1 | 2;
        };
        patch_api_admin_v1_ai_prompts_id_status_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        patch_api_admin_v1_ai_providers_id_status_Request: {
            /** @enum {integer} */
            status: 1 | 2;
        };
        patch_api_admin_v1_ai_providers_id_status_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        patch_api_admin_v1_ai_tools_id_status_Request: {
            /** @enum {integer} */
            status: 1 | 2;
        };
        patch_api_admin_v1_ai_tools_id_status_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        patch_api_admin_v1_auth_platforms_id_status_Request: {
            /** @enum {integer} */
            status: 1 | 2;
        };
        patch_api_admin_v1_auth_platforms_id_status_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        patch_api_admin_v1_cron_tasks_id_status_Request: {
            /** @enum {integer} */
            status: 1 | 2;
        };
        patch_api_admin_v1_cron_tasks_id_status_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        patch_api_admin_v1_mail_templates_id_status_Request: {
            /** @enum {integer} */
            status: 1 | 2;
        };
        patch_api_admin_v1_mail_templates_id_status_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        patch_api_admin_v1_notification_tasks_id_cancel_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        patch_api_admin_v1_payment_configs_id_status_Request: {
            /** @enum {integer} */
            status: 1 | 2;
        };
        patch_api_admin_v1_payment_configs_id_status_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        patch_api_admin_v1_permissions_id_status_Request: {
            /** @enum {integer} */
            status: 1 | 2;
        };
        patch_api_admin_v1_permissions_id_status_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        patch_api_admin_v1_roles_id_default_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        patch_api_admin_v1_sms_templates_id_status_Request: {
            status: number;
        };
        patch_api_admin_v1_sms_templates_id_status_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        patch_api_admin_v1_system_settings_id_status_Request: {
            /** @enum {integer} */
            status: 1 | 2;
        };
        patch_api_admin_v1_system_settings_id_status_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        patch_api_admin_v1_upload_settings_id_status_Request: {
            /** @enum {integer} */
            status: 1 | 2;
        };
        patch_api_admin_v1_upload_settings_id_status_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        patch_api_admin_v1_user_sessions_id_revoke_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_auth_SessionRevokeResponse_Output"];
            msg: string;
        };
        patch_api_admin_v1_user_sessions_revoke_Request: {
            ids: number[];
        };
        patch_api_admin_v1_user_sessions_revoke_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_auth_SessionBatchRevokeResponse_Output"];
            msg: string;
        };
        post_api_admin_v1_ai_agents_id_test_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_infra_ai_TestConnectionResult_Output"];
            msg: string;
        };
        post_api_admin_v1_ai_agents_Request: {
            avatar?: string;
            model_id: string;
            name: string;
            provider_id: number;
            scenes: string[];
            /** @enum {integer} */
            status: 1 | 2;
            system_prompt?: string;
        };
        post_api_admin_v1_ai_agents_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_IDData_Output"];
            msg: string;
        };
        post_api_admin_v1_ai_knowledge_bases_id_documents_Request: {
            content: string;
            source_ref?: string;
            /** @enum {string} */
            source_type?: "text" | "markdown" | "file";
            /** @enum {integer} */
            status: 1 | 2;
            title: string;
        };
        post_api_admin_v1_ai_knowledge_bases_id_documents_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_IDData_Output"];
            msg: string;
        };
        post_api_admin_v1_ai_knowledge_bases_id_retrieval_tests_Request: {
            max_context_chars?: number;
            min_score?: number | null;
            query: string;
            top_k?: number;
        };
        post_api_admin_v1_ai_knowledge_bases_id_retrieval_tests_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_knowledge_RetrievalResult_Output"];
            msg: string;
        };
        post_api_admin_v1_ai_knowledge_bases_Request: {
            chunk_overlap_chars?: number;
            chunk_size_chars: number;
            code: string;
            default_max_context_chars: number;
            default_min_score?: number;
            default_top_k: number;
            description?: string;
            name: string;
            /** @enum {integer} */
            status: 1 | 2;
        };
        post_api_admin_v1_ai_knowledge_bases_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_IDData_Output"];
            msg: string;
        };
        post_api_admin_v1_ai_knowledge_documents_id_reindex_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        post_api_admin_v1_ai_prompts_Request: {
            category?: string;
            cover_url?: string;
            preview?: string;
            prompt: string;
            slug: string;
            source_url?: string;
            /** @enum {integer} */
            status?: 0 | 1 | 2;
            tags_json?: string;
            title: string;
        };
        post_api_admin_v1_ai_prompts_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_IDData_Output"];
            msg: string;
        };
        post_api_admin_v1_ai_providers_id_model_options_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_provider_ModelOptionsResponse_Output"];
            msg: string;
        };
        post_api_admin_v1_ai_providers_id_sync_models_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_provider_ModelOptionsResponse_Output"];
            msg: string;
        };
        post_api_admin_v1_ai_providers_id_test_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_infra_ai_TestConnectionResult_Output"];
            msg: string;
        };
        post_api_admin_v1_ai_providers_model_options_Request: {
            api_key: string;
            base_url?: string;
            /** @enum {string} */
            engine_type: "openai";
        };
        post_api_admin_v1_ai_providers_model_options_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_provider_ModelOptionsResponse_Output"];
            msg: string;
        };
        post_api_admin_v1_ai_providers_Request: {
            api_key?: string;
            base_url?: string;
            /** @enum {string} */
            engine_type: "openai";
            model_display_names?: {
                [key: string]: string;
            };
            model_ids: string[];
            name: string;
            /** @enum {integer} */
            status: 1 | 2;
        };
        post_api_admin_v1_ai_providers_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_IDData_Output"];
            msg: string;
        };
        post_api_admin_v1_ai_tools_generate_draft_Request: {
            agent_id: number;
            code_hint?: string;
            requirement: string;
        };
        post_api_admin_v1_ai_tools_generate_draft_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_ai_tool_GenerateDraftResponse_Output"];
            msg: string;
        };
        post_api_admin_v1_ai_tools_Request: {
            code: string;
            description?: string;
            name: string;
            parameters_json: unknown;
            result_schema_json: unknown;
            /** @enum {string} */
            risk_level: "low" | "medium" | "high";
            /** @enum {integer} */
            status: 1 | 2;
            timeout_ms: number;
        };
        post_api_admin_v1_ai_tools_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_IDData_Output"];
            msg: string;
        };
        post_api_admin_v1_auth_forgot_password_Request: {
            account: string;
            code: string;
            confirm_password: string;
            new_password: string;
        };
        post_api_admin_v1_auth_forgot_password_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        post_api_admin_v1_auth_login_Request: {
            code?: string;
            login_account: string;
            /** @enum {string} */
            login_type: "email" | "phone" | "password";
            password?: string;
        };
        post_api_admin_v1_auth_login_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_auth_transport_admin_CredentialResponse_Output"];
            msg: string;
        };
        post_api_admin_v1_auth_logout_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        post_api_admin_v1_auth_platforms_Request: {
            access_ttl: number;
            /** @enum {integer} */
            allow_register: 1 | 2;
            /** @enum {integer} */
            bind_device: 1 | 2;
            /** @enum {integer} */
            bind_ip: 1 | 2;
            /** @enum {integer} */
            bind_platform: 1 | 2;
            /** @enum {string} */
            captcha_type: "slide";
            code: string;
            login_types: ("email" | "phone" | "password")[];
            max_sessions?: number;
            name: string;
            refresh_ttl: number;
            /** @enum {integer} */
            single_session: 1 | 2;
        };
        post_api_admin_v1_auth_platforms_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_IDData_Output"];
            msg: string;
        };
        post_api_admin_v1_auth_refresh_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_auth_transport_admin_CredentialResponse_Output"];
            msg: string;
        };
        post_api_admin_v1_auth_send_code_Request: {
            account: string;
            captcha_answer?: components["schemas"]["Go_internal_module_auth_transport_admin_captchaAnswerRequest_Input"] | null;
            captcha_id?: string;
            /** @enum {string} */
            login_type?: "email" | "phone" | "password";
            /** @enum {string} */
            scene: "login" | "forget" | "bind_phone" | "bind_email" | "change_password";
        };
        post_api_admin_v1_auth_send_code_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        post_api_admin_v1_cron_tasks_Request: {
            cron: string;
            cron_readable?: string;
            description?: string;
            handler?: string;
            name: string;
            /** @enum {integer} */
            status: 1 | 2;
            title: string;
        };
        post_api_admin_v1_cron_tasks_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_crontask_ListItem_Output"];
            msg: string;
        };
        post_api_admin_v1_mail_templates_Request: {
            name: string;
            sample_variables: {
                [key: string]: string;
            };
            scene: string;
            /** @enum {integer} */
            status: 1 | 2;
            subject: string;
            tencent_template_id: number;
            variables: string[];
        };
        post_api_admin_v1_mail_templates_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_IDData_Output"];
            msg: string;
        };
        post_api_admin_v1_mail_test_Request: {
            template_scene: string;
            /** Format: email */
            to_email: string;
        };
        post_api_admin_v1_mail_test_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        post_api_admin_v1_notification_tasks_Request: {
            content?: string;
            /** @enum {integer} */
            level?: 1 | 2;
            link?: string;
            /** @enum {string} */
            platform?: "all" | "admin" | "app";
            send_at?: string;
            target_ids?: number[];
            /** @enum {integer} */
            target_type: 1 | 2 | 3;
            title: string;
            /** @enum {integer} */
            type?: 1 | 2 | 3 | 4;
        };
        post_api_admin_v1_notification_tasks_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_notification_task_CreateResponse_Output"];
            msg: string;
        };
        post_api_admin_v1_payment_certificates_Request: {
            /** @enum {string} */
            cert_type: "app_cert" | "platform_cert" | "root_cert";
            config_code: string;
            /** Format: byte */
            file: string;
        };
        post_api_admin_v1_payment_certificates_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_payment_CertificateUploadResponse_Output"];
            msg: string;
        };
        post_api_admin_v1_payment_configs_id_test_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_payment_ConfigTestResponse_Output"];
            msg: string;
        };
        post_api_admin_v1_payment_configs_Request: {
            app_cert_path: string;
            app_id: string;
            app_private_key?: string;
            code: string;
            enabled_methods: string[];
            /** @enum {string} */
            environment: "sandbox" | "production";
            name: string;
            notify_url: string;
            platform_cert_path: string;
            /** @enum {string} */
            provider: "alipay";
            remark?: string;
            root_cert_path: string;
            sort?: number;
            /** @enum {integer} */
            status: 1 | 2;
        };
        post_api_admin_v1_payment_configs_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_IDData_Output"];
            msg: string;
        };
        post_api_admin_v1_payment_recharges_id_pay_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_payment_RechargePayResponse_Output"];
            msg: string;
        };
        post_api_admin_v1_payment_recharges_Request: {
            package_code: string;
            /** @enum {string} */
            pay_method: "web" | "h5";
            return_url: string;
        };
        post_api_admin_v1_payment_recharges_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_payment_RechargePayResponse_Output"];
            msg: string;
        };
        post_api_admin_v1_permissions_Request: {
            code?: string;
            component?: string;
            i18n_key?: string;
            icon?: string;
            name: string;
            parent_id?: number;
            path?: string;
            /** @enum {string} */
            platform: "admin" | "app" | "canvas";
            /** @enum {integer} */
            show_menu?: 1 | 2;
            sort: number;
            /** @enum {integer} */
            type: 1 | 2 | 3;
        };
        post_api_admin_v1_permissions_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_IDData_Output"];
            msg: string;
        };
        post_api_admin_v1_roles_Request: {
            name: string;
            permission_id?: number[];
        };
        post_api_admin_v1_roles_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_IDData_Output"];
            msg: string;
        };
        post_api_admin_v1_sms_templates_Request: {
            name: string;
            sample_variables: {
                [key: string]: string;
            };
            scene: string;
            status: number;
            tencent_template_id: string;
            variables: string[];
        };
        post_api_admin_v1_sms_templates_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_IDData_Output"];
            msg: string;
        };
        post_api_admin_v1_sms_test_Request: {
            template_scene: string;
            to_phone: string;
        };
        post_api_admin_v1_sms_test_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        post_api_admin_v1_system_settings_Request: {
            key: string;
            remark?: string;
            /** @enum {integer} */
            type: 1 | 2 | 3 | 4;
            value?: string;
        };
        post_api_admin_v1_system_settings_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_IDData_Output"];
            msg: string;
        };
        post_api_admin_v1_upload_drivers_Request: {
            appid?: string;
            bucket: string;
            bucket_domain?: string;
            /** @enum {string} */
            driver: "cos";
            endpoint?: string;
            region: string;
            role_arn?: string;
            secret_id: string;
            secret_key: string;
        };
        post_api_admin_v1_upload_drivers_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_IDData_Output"];
            msg: string;
        };
        post_api_admin_v1_upload_rules_Request: {
            file_exts?: ("docx" | "pdf" | "txt" | "html" | "zip" | "tar" | "doc" | "css" | "csv" | "ppt" | "xlsx" | "xls" | "xml")[];
            image_exts?: ("jpeg" | "jpg" | "gif" | "png" | "svg" | "ico" | "doc" | "psd" | "bmp" | "tiff" | "webp" | "tif" | "pjpeg")[];
            max_size_mb: number;
            title: string;
        };
        post_api_admin_v1_upload_rules_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_IDData_Output"];
            msg: string;
        };
        post_api_admin_v1_upload_settings_Request: {
            driver_id: number;
            remark?: string;
            rule_id: number;
            /** @enum {integer} */
            status: 1 | 2;
        };
        post_api_admin_v1_upload_settings_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_IDData_Output"];
            msg: string;
        };
        post_api_admin_v1_upload_tokens_Request: {
            /** @enum {string} */
            file_kind: "image" | "file";
            file_name: string;
            file_size: number;
            /** @enum {string} */
            folder: "avatars" | "images" | "videos" | "cover_images" | "ai-agents" | "ai_chat_images" | "exports" | "reconcile_reports";
        };
        post_api_admin_v1_upload_tokens_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_module_uploadtoken_CreateResponse_Output"];
            msg: string;
        };
        put_api_admin_v1_ai_agents_id_knowledge_bases_Request: {
            bindings?: components["schemas"]["Go_internal_module_ai_knowledge_AgentKnowledgeBindingInput_Input"][];
        };
        put_api_admin_v1_ai_agents_id_knowledge_bases_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_ai_agents_id_Request: {
            avatar?: string;
            model_id: string;
            name: string;
            provider_id: number;
            scenes: string[];
            /** @enum {integer} */
            status: 1 | 2;
            system_prompt?: string;
        };
        put_api_admin_v1_ai_agents_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_ai_agents_id_tools_Request: {
            tool_ids?: number[];
        };
        put_api_admin_v1_ai_agents_id_tools_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_ai_knowledge_bases_id_Request: {
            chunk_overlap_chars?: number;
            chunk_size_chars: number;
            code: string;
            default_max_context_chars: number;
            default_min_score?: number;
            default_top_k: number;
            description?: string;
            name: string;
            /** @enum {integer} */
            status: 1 | 2;
        };
        put_api_admin_v1_ai_knowledge_bases_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_ai_knowledge_documents_id_Request: {
            content: string;
            source_ref?: string;
            /** @enum {string} */
            source_type?: "text" | "markdown" | "file";
            /** @enum {integer} */
            status: 1 | 2;
            title: string;
        };
        put_api_admin_v1_ai_knowledge_documents_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_ai_prompts_id_Request: {
            category?: string;
            cover_url?: string;
            preview?: string;
            prompt: string;
            slug: string;
            source_url?: string;
            /** @enum {integer} */
            status?: 0 | 1 | 2;
            tags_json?: string;
            title: string;
        };
        put_api_admin_v1_ai_prompts_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_ai_providers_id_models_Request: {
            model_display_names?: {
                [key: string]: string;
            };
            model_ids: string[];
            statuses?: {
                [key: string]: number;
            };
        };
        put_api_admin_v1_ai_providers_id_models_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_ai_providers_id_Request: {
            api_key?: string;
            base_url?: string;
            /** @enum {string} */
            engine_type: "openai";
            model_display_names?: {
                [key: string]: string;
            };
            model_ids: string[];
            name: string;
            /** @enum {integer} */
            status: 1 | 2;
        };
        put_api_admin_v1_ai_providers_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_ai_tools_id_Request: {
            code: string;
            description?: string;
            name: string;
            parameters_json: unknown;
            result_schema_json: unknown;
            /** @enum {string} */
            risk_level: "low" | "medium" | "high";
            /** @enum {integer} */
            status: 1 | 2;
            timeout_ms: number;
        };
        put_api_admin_v1_ai_tools_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_auth_platforms_id_Request: {
            access_ttl: number;
            /** @enum {integer} */
            allow_register: 1 | 2;
            /** @enum {integer} */
            bind_device: 1 | 2;
            /** @enum {integer} */
            bind_ip: 1 | 2;
            /** @enum {integer} */
            bind_platform: 1 | 2;
            /** @enum {string} */
            captcha_type: "slide";
            login_types: ("email" | "phone" | "password")[];
            max_sessions?: number;
            name: string;
            refresh_ttl: number;
            /** @enum {integer} */
            single_session: 1 | 2;
        };
        put_api_admin_v1_auth_platforms_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_cron_tasks_id_Request: {
            cron: string;
            cron_readable?: string;
            description?: string;
            handler?: string;
            name: string;
            /** @enum {integer} */
            status: 1 | 2;
            title: string;
        };
        put_api_admin_v1_cron_tasks_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_mail_config_Request: {
            endpoint?: string;
            /** Format: email */
            from_email: string;
            from_name?: string;
            region: string;
            /** Format: email */
            reply_to?: string;
            secret_id?: string;
            secret_key?: string;
            /** @enum {integer} */
            status: 1 | 2;
            verify_code_ttl_minutes: number;
        };
        put_api_admin_v1_mail_config_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_mail_templates_id_Request: {
            name: string;
            sample_variables: {
                [key: string]: string;
            };
            scene: string;
            /** @enum {integer} */
            status: 1 | 2;
            subject: string;
            tencent_template_id: number;
            variables: string[];
        };
        put_api_admin_v1_mail_templates_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_payment_configs_id_Request: {
            app_cert_path: string;
            app_id: string;
            app_private_key?: string;
            code: string;
            enabled_methods: string[];
            /** @enum {string} */
            environment: "sandbox" | "production";
            name: string;
            notify_url: string;
            platform_cert_path: string;
            /** @enum {string} */
            provider: "alipay";
            remark?: string;
            root_cert_path: string;
            sort?: number;
            /** @enum {integer} */
            status: 1 | 2;
        };
        put_api_admin_v1_payment_configs_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_permissions_id_Request: {
            code?: string;
            component?: string;
            i18n_key?: string;
            icon?: string;
            name: string;
            parent_id?: number;
            path?: string;
            /** @enum {string} */
            platform: "admin" | "app" | "canvas";
            /** @enum {integer} */
            show_menu?: 1 | 2;
            sort: number;
            /** @enum {integer} */
            type: 1 | 2 | 3;
        };
        put_api_admin_v1_permissions_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_profile_Request: {
            address_id: number | null;
            avatar?: string;
            bio?: string;
            birthday?: string | null;
            detail_address?: string;
            /** @enum {integer} */
            sex?: 0 | 1 | 2;
            username: string;
        };
        put_api_admin_v1_profile_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_profile_security_email_Request: {
            code: string;
            /** Format: email */
            email: string;
        };
        put_api_admin_v1_profile_security_email_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_profile_security_password_Request: {
            account?: string;
            code?: string;
            confirm_password: string;
            new_password: string;
            old_password?: string;
            /** @enum {string} */
            verify_type: "password" | "code";
        };
        put_api_admin_v1_profile_security_password_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_profile_security_phone_Request: {
            code: string;
            phone: string;
        };
        put_api_admin_v1_profile_security_phone_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_roles_id_Request: {
            name: string;
            permission_id?: number[];
        };
        put_api_admin_v1_roles_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_sms_config_Request: {
            endpoint?: string;
            region?: string;
            secret_id?: string;
            secret_key?: string;
            sign_name: string;
            sms_sdk_app_id: string;
            status: number;
            verify_code_ttl_minutes: number;
        };
        put_api_admin_v1_sms_config_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_sms_templates_id_Request: {
            name: string;
            sample_variables: {
                [key: string]: string;
            };
            scene: string;
            status: number;
            tencent_template_id: string;
            variables: string[];
        };
        put_api_admin_v1_sms_templates_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_system_settings_id_Request: {
            remark?: string;
            /** @enum {integer} */
            type: 1 | 2 | 3 | 4;
            value?: string;
        };
        put_api_admin_v1_system_settings_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_upload_drivers_id_Request: {
            appid?: string;
            bucket: string;
            bucket_domain?: string;
            /** @enum {string} */
            driver: "cos";
            endpoint?: string;
            region: string;
            role_arn?: string;
            secret_id?: string;
            secret_key?: string;
        };
        put_api_admin_v1_upload_drivers_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_upload_rules_id_Request: {
            file_exts?: ("docx" | "pdf" | "txt" | "html" | "zip" | "tar" | "doc" | "css" | "csv" | "ppt" | "xlsx" | "xls" | "xml")[];
            image_exts?: ("jpeg" | "jpg" | "gif" | "png" | "svg" | "ico" | "doc" | "psd" | "bmp" | "tiff" | "webp" | "tif" | "pjpeg")[];
            max_size_mb: number;
            title: string;
        };
        put_api_admin_v1_upload_rules_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        put_api_admin_v1_upload_settings_id_Request: {
            driver_id: number;
            remark?: string;
            rule_id: number;
            /** @enum {integer} */
            status: 1 | 2;
        };
        put_api_admin_v1_upload_settings_id_ResponseEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["Go_internal_server_adminroute_EmptyData_Output"];
            msg: string;
        };
        QueueMonitorGrantSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: {
                /** @constant */
                expires_in: 60;
            };
            msg: string;
        };
        RealtimeTicketSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: {
                /** @constant */
                expires_in: 30;
                ticket: string;
            };
            msg: string;
        };
        StringOption: {
            label: string;
            value: string;
        };
        SuccessEnvelope: {
            /** @constant */
            code: 0;
            data: unknown;
            msg: string;
        };
        /** @description Positive user IDs to delete. */
        UserBatchDeleteRequest: {
            ids: number[];
        };
        /** @description Exactly one field-specific variant is accepted. */
        UserBatchProfileRequest: {
            /** @constant */
            field: "sex";
            ids: number[];
            /** @enum {integer} */
            sex: 0 | 1 | 2;
        } | {
            /** Format: int64 */
            address_id: number;
            /** @constant */
            field: "address_id";
            ids: number[];
        } | {
            detail_address?: string;
            /** @constant */
            field: "detail_address";
            ids: number[];
        };
        /** @description Positive user IDs included in this export task. */
        UserExportRequest: {
            ids: number[];
        };
        UserExportResult: {
            /** Format: int64 */
            id: number;
            message: string;
        };
        UserExportSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["UserExportResult"];
            msg: string;
        };
        UserListItem: {
            /** Format: int64 */
            address_id: number;
            address_show: string;
            avatar: string | null;
            bio: string;
            created_at: string;
            detail_address: string;
            email: string;
            /** Format: int64 */
            id: number;
            phone: string;
            /** Format: int64 */
            role_id: number;
            role_name: string;
            /** @enum {integer} */
            sex: 0 | 1 | 2;
            sex_show: string;
            /** @enum {integer} */
            status: 1 | 2;
            username: string;
        };
        UserListResult: {
            list: components["schemas"]["UserListItem"][];
            page: components["schemas"]["Page"];
        };
        UserListSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["UserListResult"];
            msg: string;
        };
        UserPageInit: {
            dict: components["schemas"]["UserPageInitDict"];
        };
        UserPageInitDict: {
            auth_address_tree: components["schemas"]["AddressTreeNode"][];
            platformArr: components["schemas"]["StringOption"][];
            roleArr: components["schemas"]["IntOption"][];
            sexArr: components["schemas"]["IntOption"][];
        };
        UserPageInitSuccessEnvelope: {
            /** @constant */
            code: 0;
            data: components["schemas"]["UserPageInit"];
            msg: string;
        };
        UserStatusRequest: {
            /** @enum {integer} */
            status: 1 | 2;
        };
        UserUpdateRequest: {
            /** Format: int64 */
            address_id: number;
            avatar?: string;
            bio?: string;
            detail_address?: string;
            /** Format: int64 */
            role_id: number;
            /** @enum {integer} */
            sex?: 0 | 1 | 2;
            username: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    get_api_admin_v1_ai_agents: {
        parameters: {
            query?: {
                current_page?: number;
                name?: string;
                page_size?: number;
                provider_id?: number;
                scene?: string;
                status?: 1 | 2;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_ai_agents_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_ai_agents: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_ai_agents_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_ai_agents_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_agents_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_ai_agents_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_ai_agents_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_ai_agents_id_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_ai_agents_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_ai_agents_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_ai_agents_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_agents_id_knowledge_bases: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_ai_agents_id_knowledge_bases_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_ai_agents_id_knowledge_bases: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_ai_agents_id_knowledge_bases_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_ai_agents_id_knowledge_bases_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_ai_agents_id_status: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["patch_api_admin_v1_ai_agents_id_status_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["patch_api_admin_v1_ai_agents_id_status_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_ai_agents_id_test: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_ai_agents_id_test_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_agents_id_tools: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_ai_agents_id_tools_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_ai_agents_id_tools: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_ai_agents_id_tools_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_ai_agents_id_tools_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_agents_options: {
        parameters: {
            query?: {
                scene?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_ai_agents_options_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_agents_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_ai_agents_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_agents_provider_models_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_ai_agents_provider_models_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_conversations: {
        parameters: {
            query?: {
                /** @description Agent ID filter. */
                agent_id?: number;
                /** @description Conversation cursor ID; must accompany before_time. */
                before_id?: number;
                /** @description Conversation cursor time; must accompany before_id. */
                before_time?: string;
                /** @description Maximum conversations returned. */
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AIConversationListSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_ai_conversations: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AIConversationCreateRequest"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AIConversationCreateSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_conversations_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AIConversationDetailSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_ai_conversations_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AIConversationUpdateRequest"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmptySuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_ai_conversations_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmptySuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_conversations_id_messages: {
        parameters: {
            query?: {
                /** @description Message cursor ID. */
                before_id?: number;
                /** @description Maximum messages returned. */
                limit?: number;
            };
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AIMessageListSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_ai_conversations_id_messages: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AIMessageSendRequest"];
            };
        };
        responses: {
            /** @description Successful response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AIMessageSendSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_ai_conversations_id_messages_cancel: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AIMessageCancelRequest"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AIMessageCancelSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_knowledge_bases: {
        parameters: {
            query?: {
                code?: string;
                current_page?: number;
                name?: string;
                page_size?: number;
                status?: 1 | 2;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_ai_knowledge_bases_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_ai_knowledge_bases: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_ai_knowledge_bases_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_ai_knowledge_bases_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_knowledge_bases_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_ai_knowledge_bases_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_ai_knowledge_bases_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_ai_knowledge_bases_id_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_ai_knowledge_bases_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_ai_knowledge_bases_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_ai_knowledge_bases_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_knowledge_bases_id_documents: {
        parameters: {
            query?: {
                current_page?: number;
                page_size?: number;
                status?: 1 | 2;
                title?: string;
            };
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_ai_knowledge_bases_id_documents_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_ai_knowledge_bases_id_documents: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_ai_knowledge_bases_id_documents_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_ai_knowledge_bases_id_documents_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_ai_knowledge_bases_id_retrieval_tests: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_ai_knowledge_bases_id_retrieval_tests_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_ai_knowledge_bases_id_retrieval_tests_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_ai_knowledge_bases_id_status: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["patch_api_admin_v1_ai_knowledge_bases_id_status_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["patch_api_admin_v1_ai_knowledge_bases_id_status_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_knowledge_bases_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_ai_knowledge_bases_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_knowledge_documents_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_ai_knowledge_documents_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_ai_knowledge_documents_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_ai_knowledge_documents_id_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_ai_knowledge_documents_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_ai_knowledge_documents_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_ai_knowledge_documents_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_knowledge_documents_id_chunks: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_ai_knowledge_documents_id_chunks_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_ai_knowledge_documents_id_reindex: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_ai_knowledge_documents_id_reindex_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_ai_knowledge_documents_id_status: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["patch_api_admin_v1_ai_knowledge_documents_id_status_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["patch_api_admin_v1_ai_knowledge_documents_id_status_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_prompts: {
        parameters: {
            query?: {
                category?: string;
                current_page?: number;
                keyword?: string;
                page_size?: number;
                status?: 1 | 2;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_ai_prompts_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_ai_prompts: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_ai_prompts_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_ai_prompts_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_ai_prompts: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["delete_api_admin_v1_ai_prompts_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_ai_prompts_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_prompts_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_ai_prompts_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_ai_prompts_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_ai_prompts_id_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_ai_prompts_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_ai_prompts_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_ai_prompts_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_ai_prompts_id_status: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["patch_api_admin_v1_ai_prompts_id_status_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["patch_api_admin_v1_ai_prompts_id_status_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_prompts_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_ai_prompts_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_providers: {
        parameters: {
            query?: {
                current_page?: number;
                engine_type?: "openai";
                name?: string;
                page_size?: number;
                status?: 1 | 2;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_ai_providers_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_ai_providers: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_ai_providers_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_ai_providers_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_ai_providers_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_ai_providers_id_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_ai_providers_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_ai_providers_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_ai_providers_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_ai_providers_id_model_options: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_ai_providers_id_model_options_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_providers_id_models: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_ai_providers_id_models_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_ai_providers_id_models: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_ai_providers_id_models_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_ai_providers_id_models_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_ai_providers_id_status: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["patch_api_admin_v1_ai_providers_id_status_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["patch_api_admin_v1_ai_providers_id_status_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_ai_providers_id_sync_models: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_ai_providers_id_sync_models_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_ai_providers_id_test: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_ai_providers_id_test_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_ai_providers_model_options: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_ai_providers_model_options_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_ai_providers_model_options_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_providers_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_ai_providers_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_runs: {
        parameters: {
            query?: {
                /** @description Agent ID filter. */
                agent_id?: number;
                /** @description One-based page number. */
                current_page?: number;
                /** @description Inclusive creation-time upper bound. */
                date_end?: string;
                /** @description Inclusive creation-time lower bound. */
                date_start?: string;
                /** @description Number of rows per page. */
                page_size?: number;
                /** @description Origin platform filter. */
                platform?: "admin" | "app" | "canvas";
                /** @description Provider ID filter. */
                provider_id?: number;
                /** @description Request ID search. */
                request_id?: string;
                /** @description Run status filter. */
                status?: "running" | "success" | "failed" | "canceled" | "timeout";
                /** @description User ID filter. */
                user_id?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AIRunListSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_runs_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AIRunDetailSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_runs_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AIRunPageInitSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_runs_stats: {
        parameters: {
            query?: {
                /** @description Agent ID filter. */
                agent_id?: number;
                /** @description Inclusive creation-time upper bound. */
                date_end?: string;
                /** @description Inclusive creation-time lower bound. */
                date_start?: string;
                /** @description Origin platform filter. */
                platform?: "admin" | "app" | "canvas";
                /** @description Provider ID filter. */
                provider_id?: number;
                /** @description User ID filter. */
                user_id?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AIRunStatsSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_runs_stats_by_agent: {
        parameters: {
            query?: {
                /** @description Agent ID filter. */
                agent_id?: number;
                /** @description One-based page number. */
                current_page?: number;
                /** @description Inclusive creation-time upper bound. */
                date_end?: string;
                /** @description Inclusive creation-time lower bound. */
                date_start?: string;
                /** @description Number of rows per page. */
                page_size?: number;
                /** @description Origin platform filter. */
                platform?: "admin" | "app" | "canvas";
                /** @description Provider ID filter. */
                provider_id?: number;
                /** @description User ID filter. */
                user_id?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AIRunStatsByAgentSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_runs_stats_by_date: {
        parameters: {
            query?: {
                /** @description Agent ID filter. */
                agent_id?: number;
                /** @description One-based page number. */
                current_page?: number;
                /** @description Inclusive creation-time upper bound. */
                date_end?: string;
                /** @description Inclusive creation-time lower bound. */
                date_start?: string;
                /** @description Number of rows per page. */
                page_size?: number;
                /** @description Origin platform filter. */
                platform?: "admin" | "app" | "canvas";
                /** @description Provider ID filter. */
                provider_id?: number;
                /** @description User ID filter. */
                user_id?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AIRunStatsByDateSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_runs_stats_by_user: {
        parameters: {
            query?: {
                /** @description Agent ID filter. */
                agent_id?: number;
                /** @description One-based page number. */
                current_page?: number;
                /** @description Inclusive creation-time upper bound. */
                date_end?: string;
                /** @description Inclusive creation-time lower bound. */
                date_start?: string;
                /** @description Number of rows per page. */
                page_size?: number;
                /** @description Origin platform filter. */
                platform?: "admin" | "app" | "canvas";
                /** @description Provider ID filter. */
                provider_id?: number;
                /** @description User ID filter. */
                user_id?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AIRunStatsByUserSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_tools: {
        parameters: {
            query?: {
                code?: string;
                current_page?: number;
                name?: string;
                page_size?: number;
                risk_level?: "low" | "medium" | "high";
                status?: 1 | 2;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_ai_tools_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_ai_tools: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_ai_tools_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_ai_tools_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_ai_tools_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_ai_tools_id_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_ai_tools_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_ai_tools_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_ai_tools_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_ai_tools_id_status: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["patch_api_admin_v1_ai_tools_id_status_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["patch_api_admin_v1_ai_tools_id_status_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_ai_tools_generate_draft: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_ai_tools_generate_draft_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_ai_tools_generate_draft_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_tools_generate_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_ai_tools_generate_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ai_tools_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_ai_tools_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_auth_platforms: {
        parameters: {
            query: {
                current_page: number;
                name?: string;
                page_size: number;
                status?: 1 | 2;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_auth_platforms_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_auth_platforms: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_auth_platforms_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_auth_platforms_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_auth_platforms: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["delete_api_admin_v1_auth_platforms_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_auth_platforms_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_auth_platforms_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_auth_platforms_id_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_auth_platforms_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_auth_platforms_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_auth_platforms_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_auth_platforms_id_status: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["patch_api_admin_v1_auth_platforms_id_status_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["patch_api_admin_v1_auth_platforms_id_status_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_auth_platforms_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_auth_platforms_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_auth_captcha: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_auth_captcha_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_auth_forgot_password: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_auth_forgot_password_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_auth_forgot_password_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_auth_login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_auth_login_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_auth_login_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_auth_login_config: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_auth_login_config_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_auth_logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_auth_logout_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_auth_queue_monitor_grants: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["EmptyObject"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["QueueMonitorGrantSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_auth_realtime_tickets: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["EmptyObject"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RealtimeTicketSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_auth_refresh: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_auth_refresh_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_auth_send_code: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_auth_send_code_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_auth_send_code_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_cron_tasks: {
        parameters: {
            query: {
                current_page: number;
                name?: string;
                page_size: number;
                status?: 1 | 2;
                title?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_cron_tasks_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_cron_tasks: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_cron_tasks_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_cron_tasks_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_cron_tasks: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["delete_api_admin_v1_cron_tasks_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_cron_tasks_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_cron_tasks_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_cron_tasks_id_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_cron_tasks_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_cron_tasks_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_cron_tasks_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_cron_tasks_id_logs: {
        parameters: {
            query: {
                before_id?: number;
                before_time?: string;
                current_page: number;
                end_date?: string;
                page_size: number;
                start_date?: string;
                status?: 1 | 2 | 3;
            };
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_cron_tasks_id_logs_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_cron_tasks_id_status: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["patch_api_admin_v1_cron_tasks_id_status_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["patch_api_admin_v1_cron_tasks_id_status_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_cron_tasks_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_cron_tasks_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_export_tasks: {
        parameters: {
            query?: {
                /** @description Cursor ID for records before this export task. */
                before_id?: number;
                /** @description One-based page number. */
                current_page?: number;
                /** @description File-name search. */
                file_name?: string;
                /** @description Export kind filter. */
                kind?: string;
                /** @description Number of rows per page. */
                page_size?: number;
                /** @description Export status filter. */
                status?: 1 | 2 | 3;
                /** @description Export title search. */
                title?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExportTaskListSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_export_tasks: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ExportTaskDeleteBatchRequest"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmptySuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_export_tasks_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmptySuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_export_tasks_status_count: {
        parameters: {
            query?: {
                /** @description File-name search. */
                file_name?: string;
                /** @description Export kind filter. */
                kind?: string;
                /** @description Export title search. */
                title?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExportTaskStatusCountSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_mail_config: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_mail_config_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_mail_config: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_mail_config_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_mail_config_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_mail_config: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_mail_config_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_mail_logs: {
        parameters: {
            query?: {
                created_at_end?: string;
                created_at_start?: string;
                current_page?: number;
                page_size?: number;
                scene?: string;
                status?: number;
                to_email?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_mail_logs_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_mail_logs: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["delete_api_admin_v1_mail_logs_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_mail_logs_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_mail_logs_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_mail_logs_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_mail_logs_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_mail_logs_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_mail_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_mail_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_mail_templates: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_mail_templates_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_mail_templates: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_mail_templates_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_mail_templates_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_mail_templates_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_mail_templates_id_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_mail_templates_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_mail_templates_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_mail_templates_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_mail_templates_id_status: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["patch_api_admin_v1_mail_templates_id_status_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["patch_api_admin_v1_mail_templates_id_status_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_mail_test: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_mail_test_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_mail_test_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_notification_tasks: {
        parameters: {
            query: {
                current_page: number;
                page_size: number;
                status?: 1 | 2 | 3 | 4;
                title?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_notification_tasks_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_notification_tasks: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_notification_tasks_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_notification_tasks_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_notification_tasks_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_notification_tasks_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_notification_tasks_id_cancel: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["patch_api_admin_v1_notification_tasks_id_cancel_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_notification_tasks_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_notification_tasks_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_notification_tasks_status_count: {
        parameters: {
            query?: {
                title?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_notification_tasks_status_count_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_notifications: {
        parameters: {
            query: {
                /** @description Cursor ID for records before this notification. */
                before_id?: number;
                /** @description One-based page number. */
                current_page: number;
                /** @description Read-state filter: 1 read, 2 unread. */
                is_read?: 1 | 2;
                /** @description Title/content keyword search. */
                keyword?: string;
                /** @description Notification level filter. */
                level?: 1 | 2;
                /** @description Number of rows per page. */
                page_size: number;
                /** @description Notification type filter. */
                type?: 1 | 2 | 3 | 4;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotificationListSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_notifications: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["NotificationDeleteBatchRequest"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmptySuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_notifications_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmptySuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_notifications_id_read: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmptySuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_notifications_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotificationPageInitSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_notifications_read: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["NotificationReadRequest"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmptySuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_notifications_unread_count: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotificationUnreadCountSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_operation_logs: {
        parameters: {
            query: {
                action?: string;
                current_page: number;
                date?: string;
                page_size: number;
                user_id?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_operation_logs_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_operation_logs: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["delete_api_admin_v1_operation_logs_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_operation_logs_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_operation_logs_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_operation_logs_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_operation_logs_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_operation_logs_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_payment_certificates: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["post_api_admin_v1_payment_certificates_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_payment_certificates_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_payment_configs: {
        parameters: {
            query?: {
                current_page?: number;
                environment?: "sandbox" | "production";
                name?: string;
                page_size?: number;
                provider?: "alipay";
                status?: 1 | 2;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_payment_configs_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_payment_configs: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_payment_configs_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_payment_configs_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_payment_configs_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_payment_configs_id_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_payment_configs_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_payment_configs_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_payment_configs_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_payment_configs_id_status: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["patch_api_admin_v1_payment_configs_id_status_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["patch_api_admin_v1_payment_configs_id_status_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_payment_configs_id_test: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_payment_configs_id_test_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_payment_configs_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_payment_configs_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_payment_ledger: {
        parameters: {
            query?: {
                current_page?: number;
                date_end?: string;
                date_start?: string;
                direction?: string;
                keyword?: string;
                page_size?: number;
                source_type?: string;
                user_id?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_payment_ledger_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_payment_ledger_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_payment_ledger_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_payment_recharges: {
        parameters: {
            query?: {
                current_page?: number;
                date_end?: string;
                date_start?: string;
                keyword?: string;
                page_size?: number;
                status?: "pending" | "paying" | "paid" | "credited" | "closed" | "failed";
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_payment_recharges_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_payment_recharges: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_payment_recharges_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_payment_recharges_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_payment_recharges_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_payment_recharges_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_payment_recharges_id_pay: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_payment_recharges_id_pay_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_payment_recharges_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_payment_recharges_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_payment_wallets: {
        parameters: {
            query?: {
                current_page?: number;
                keyword?: string;
                page_size?: number;
                user_id?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_payment_wallets_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_payment_wallets_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_payment_wallets_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_permissions: {
        parameters: {
            query: {
                name?: string;
                path?: string;
                platform: "admin" | "app" | "canvas";
                type?: 1 | 2 | 3;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_permissions_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_permissions: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_permissions_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_permissions_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_permissions: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["delete_api_admin_v1_permissions_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_permissions_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_permissions_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_permissions_id_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_permissions_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_permissions_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_permissions_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_permissions_id_status: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["patch_api_admin_v1_permissions_id_status_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["patch_api_admin_v1_permissions_id_status_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_permissions_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_permissions_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_ping: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_profile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_profile_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_profile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_profile_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_profile_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_profile_security_email: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_profile_security_email_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_profile_security_email_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_profile_security_password: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_profile_security_password_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_profile_security_password_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_profile_security_phone: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_profile_security_phone_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_profile_security_phone_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_queue_monitor: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_queue_monitor_ui: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_queue_monitor_ui: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["GenericObject"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_queue_monitor_ui: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["GenericObject"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_queue_monitor_ui: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["GenericObject"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    options_api_admin_v1_queue_monitor_ui: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    head_api_admin_v1_queue_monitor_ui: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_queue_monitor_ui: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["GenericObject"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    trace_api_admin_v1_queue_monitor_ui: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_queue_monitor_ui_path: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                path: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_queue_monitor_ui_path: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                path: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["GenericObject"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_queue_monitor_ui_path: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                path: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["GenericObject"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_queue_monitor_ui_path: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                path: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["GenericObject"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    options_api_admin_v1_queue_monitor_ui_path: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                path: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    head_api_admin_v1_queue_monitor_ui_path: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                path: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_queue_monitor_ui_path: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                path: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["GenericObject"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    trace_api_admin_v1_queue_monitor_ui_path: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                path: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_queue_monitor_failed: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_realtime_ws: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description WebSocket protocol switch */
            101: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_roles: {
        parameters: {
            query: {
                current_page: number;
                name?: string;
                page_size: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_roles_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_roles: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_roles_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_roles_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_roles: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["delete_api_admin_v1_roles_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_roles_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_roles_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_roles_id_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_roles_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_roles_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_roles_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_roles_id_default: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["patch_api_admin_v1_roles_id_default_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_roles_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_roles_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_sms_config: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_sms_config_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_sms_config: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_sms_config_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_sms_config_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_sms_config: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_sms_config_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_sms_logs: {
        parameters: {
            query?: {
                created_at_end?: string;
                created_at_start?: string;
                current_page?: number;
                page_size?: number;
                scene?: string;
                status?: number;
                to_phone?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_sms_logs_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_sms_logs: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["delete_api_admin_v1_sms_logs_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_sms_logs_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_sms_logs_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_sms_logs_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_sms_logs_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_sms_logs_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_sms_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_sms_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_sms_templates: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_sms_templates_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_sms_templates: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_sms_templates_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_sms_templates_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_sms_templates_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_sms_templates_id_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_sms_templates_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_sms_templates_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_sms_templates_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_sms_templates_id_status: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["patch_api_admin_v1_sms_templates_id_status_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["patch_api_admin_v1_sms_templates_id_status_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_sms_test: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_sms_test_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_sms_test_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_system_logs_files: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_system_logs_files_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_system_logs_files_name_lines: {
        parameters: {
            query?: {
                keyword?: string;
                level?: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";
                tail?: number;
            };
            header?: never;
            path: {
                name: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_system_logs_files_name_lines_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_system_logs_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_system_logs_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_system_settings: {
        parameters: {
            query: {
                current_page: number;
                key?: string;
                page_size: number;
                status?: 1 | 2;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_system_settings_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_system_settings: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_system_settings_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_system_settings_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_system_settings: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["delete_api_admin_v1_system_settings_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_system_settings_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_system_settings_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_system_settings_id_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_system_settings_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_system_settings_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_system_settings_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_system_settings_id_status: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["patch_api_admin_v1_system_settings_id_status_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["patch_api_admin_v1_system_settings_id_status_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_system_settings_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_system_settings_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_upload_drivers: {
        parameters: {
            query: {
                current_page: number;
                driver?: "cos";
                page_size: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_upload_drivers_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_upload_drivers: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_upload_drivers_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_upload_drivers_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_upload_drivers: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["delete_api_admin_v1_upload_drivers_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_upload_drivers_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_upload_drivers_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_upload_drivers_id_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_upload_drivers_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_upload_drivers_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_upload_drivers_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_upload_drivers_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_upload_drivers_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_upload_rules: {
        parameters: {
            query: {
                current_page: number;
                page_size: number;
                title?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_upload_rules_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_upload_rules: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_upload_rules_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_upload_rules_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_upload_rules: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["delete_api_admin_v1_upload_rules_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_upload_rules_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_upload_rules_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_upload_rules_id_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_upload_rules_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_upload_rules_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_upload_rules_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_upload_rules_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_upload_rules_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_upload_settings: {
        parameters: {
            query: {
                current_page: number;
                driver_id?: number;
                page_size: number;
                remark?: string;
                rule_id?: number;
                status?: 1 | 2;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_upload_settings_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_upload_settings: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_upload_settings_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_upload_settings_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_upload_settings: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["delete_api_admin_v1_upload_settings_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_upload_settings_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_upload_settings_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["put_api_admin_v1_upload_settings_id_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["put_api_admin_v1_upload_settings_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_upload_settings_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["delete_api_admin_v1_upload_settings_id_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_upload_settings_id_status: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["patch_api_admin_v1_upload_settings_id_status_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["patch_api_admin_v1_upload_settings_id_status_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_upload_settings_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_upload_settings_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_upload_tokens: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["post_api_admin_v1_upload_tokens_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["post_api_admin_v1_upload_tokens_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_user_sessions: {
        parameters: {
            query?: {
                current_page?: number;
                page_size?: number;
                platform?: string;
                status?: string;
                username?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_user_sessions_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_user_sessions_id_revoke: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["patch_api_admin_v1_user_sessions_id_revoke_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_user_sessions_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_user_sessions_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_user_sessions_revoke: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["patch_api_admin_v1_user_sessions_revoke_Request"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["patch_api_admin_v1_user_sessions_revoke_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_user_sessions_stats: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_user_sessions_stats_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_users: {
        parameters: {
            query: {
                /** @description Comma-separated positive address IDs. */
                address_id?: string;
                /** @description One-based page number. */
                current_page: number;
                /** @description Comma-separated start/end creation-time pair; ignored when date_start or date_end is present. */
                date?: string;
                /** @description Inclusive creation-time upper bound. */
                date_end?: string;
                /** @description Inclusive creation-time lower bound. */
                date_start?: string;
                /** @description Detail-address search. */
                detail_address?: string;
                /** @description Email search. */
                email?: string;
                /** @description General user keyword search. */
                keyword?: string;
                /** @description Number of rows per page. */
                page_size: number;
                /** @description Role ID filter. */
                role_id?: number;
                /** @description Sex filter. */
                sex?: 0 | 1 | 2;
                /** @description Username search. */
                username?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserListSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_users: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserBatchDeleteRequest"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmptySuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_users: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserBatchProfileRequest"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmptySuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    put_api_admin_v1_users_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserUpdateRequest"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmptySuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    delete_api_admin_v1_users_id: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmptySuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_users_id_profile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_users_id_profile_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    patch_api_admin_v1_users_id_status: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserStatusRequest"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["EmptySuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_admin_v1_users_export: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserExportRequest"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserExportSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_users_login_logs: {
        parameters: {
            query?: {
                current_page?: number;
                date_end?: string;
                date_start?: string;
                ip?: string;
                is_success?: number;
                login_account?: string;
                login_type?: string;
                page_size?: number;
                platform?: string;
                user_id?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_users_login_logs_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_users_login_logs_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_users_login_logs_page_init_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_users_me: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_users_page_init: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserPageInitSuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_wallet_summary: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_wallet_summary_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_api_admin_v1_wallet_transactions: {
        parameters: {
            query?: {
                current_page?: number;
                date_end?: string;
                date_start?: string;
                direction?: string;
                keyword?: string;
                page_size?: number;
                source_type?: string;
                user_id?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["get_api_admin_v1_wallet_transactions_ResponseEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    post_api_payment_callbacks_alipay: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/x-www-form-urlencoded": components["schemas"]["GenericObject"];
            };
        };
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_health: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
    get_ready: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessEnvelope"];
                };
            };
            /** @description Classified safe error response */
            default: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ErrorEnvelope"];
                };
            };
        };
    };
}
