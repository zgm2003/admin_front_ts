// Generated from Admin Contract Bundle manifest SHA-256: fd7878e7d401426ebaa2e5acda08f6c1c98c2613ff077408f80575138f8d34e9
// Do not edit manually.

import { createContractSchemaCompiler, type ContractSchema } from '../contract-schema'
import { defineOperation } from '../operations'
import type { operations } from './admin'

const contractSchemas = {
  "AIConversationCreateResult": {
    "additionalProperties": false,
    "properties": {
      "id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      }
    },
    "required": [
      "id"
    ],
    "type": "object"
  },
  "AIConversationDetail": {
    "additionalProperties": false,
    "properties": {
      "agent_id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "agent_name": {
        "type": "string"
      },
      "created_at": {
        "type": "string"
      },
      "id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "last_message_at": {
        "type": "string"
      },
      "title": {
        "type": "string"
      },
      "updated_at": {
        "type": "string"
      }
    },
    "required": [
      "agent_id",
      "agent_name",
      "created_at",
      "id",
      "last_message_at",
      "title",
      "updated_at"
    ],
    "type": "object"
  },
  "AIConversationItem": {
    "additionalProperties": false,
    "properties": {
      "agent_id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "agent_name": {
        "type": "string"
      },
      "id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "last_message_at": {
        "type": "string"
      },
      "title": {
        "type": "string"
      },
      "updated_at": {
        "type": "string"
      }
    },
    "required": [
      "agent_id",
      "agent_name",
      "id",
      "last_message_at",
      "title",
      "updated_at"
    ],
    "type": "object"
  },
  "AIConversationListResult": {
    "additionalProperties": false,
    "properties": {
      "has_more": {
        "type": "boolean"
      },
      "list": {
        "items": {
          "$ref": "#/components/schemas/AIConversationItem"
        },
        "type": "array"
      },
      "next_id": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "next_time": {
        "type": "string"
      }
    },
    "required": [
      "has_more",
      "list",
      "next_id",
      "next_time"
    ],
    "type": "object"
  },
  "AIMessageCancelResult": {
    "additionalProperties": false,
    "properties": {
      "conversation_id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "request_id": {
        "type": "string"
      },
      "status": {
        "const": "canceled",
        "type": "string"
      }
    },
    "required": [
      "conversation_id",
      "request_id",
      "status"
    ],
    "type": "object"
  },
  "AIMessageItem": {
    "additionalProperties": false,
    "properties": {
      "content": {
        "type": "string"
      },
      "content_type": {
        "type": "string"
      },
      "created_at": {
        "type": "string"
      },
      "id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "meta_json": {
        "$ref": "#/components/schemas/AIMessageMeta"
      },
      "role": {
        "enum": [
          1,
          2,
          3
        ],
        "type": "integer"
      },
      "updated_at": {
        "type": "string"
      }
    },
    "required": [
      "id",
      "role",
      "content_type",
      "content",
      "created_at",
      "updated_at"
    ],
    "type": "object"
  },
  "AIMessageListResult": {
    "additionalProperties": false,
    "properties": {
      "has_more": {
        "type": "boolean"
      },
      "list": {
        "items": {
          "$ref": "#/components/schemas/AIMessageItem"
        },
        "type": "array"
      },
      "next_id": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      }
    },
    "required": [
      "has_more",
      "list",
      "next_id"
    ],
    "type": "object"
  },
  "AIMessageMeta": {
    "additionalProperties": false,
    "properties": {
      "attachments": {
        "items": {
          "$ref": "#/components/schemas/AIMessageMetaAttachment"
        },
        "type": "array"
      },
      "runtime_params": {
        "$ref": "#/components/schemas/AIRuntimeParams"
      }
    },
    "type": "object"
  },
  "AIMessageMetaAttachment": {
    "additionalProperties": false,
    "properties": {
      "name": {
        "type": "string"
      },
      "size": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "type": {
        "const": "image",
        "type": "string"
      },
      "url": {
        "type": "string"
      }
    },
    "required": [
      "name",
      "size",
      "type",
      "url"
    ],
    "type": "object"
  },
  "AIMessageSendResult": {
    "additionalProperties": false,
    "properties": {
      "command_id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "conversation_id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "request_id": {
        "type": "string"
      },
      "state": {
        "enum": [
          "pending",
          "claimed",
          "running",
          "succeeded",
          "failed",
          "canceled",
          "outcome_unknown",
          "timed_out"
        ],
        "type": "string"
      },
      "user_message_id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      }
    },
    "required": [
      "command_id",
      "conversation_id",
      "request_id",
      "state",
      "user_message_id"
    ],
    "type": "object"
  },
  "AIRunDetail": {
    "additionalProperties": false,
    "properties": {
      "agent_id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "agent_name": {
        "type": "string"
      },
      "assistant_message": {
        "anyOf": [
          {
            "$ref": "#/components/schemas/AIRunMessageSummary"
          },
          {
            "type": "null"
          }
        ]
      },
      "completion_tokens": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "conversation_id": {
        "anyOf": [
          {
            "format": "int64",
            "minimum": 1,
            "type": "integer"
          },
          {
            "type": "null"
          }
        ]
      },
      "conversation_title": {
        "type": "string"
      },
      "created_at": {
        "type": "string"
      },
      "duration_ms": {
        "anyOf": [
          {
            "format": "int64",
            "minimum": 0,
            "type": "integer"
          },
          {
            "type": "null"
          }
        ]
      },
      "duration_text": {
        "type": "string"
      },
      "error_message": {
        "type": "string"
      },
      "events": {
        "items": {
          "$ref": "#/components/schemas/AIRunEvent"
        },
        "type": "array"
      },
      "finished_at": {
        "type": "string"
      },
      "id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "input_snapshot": {
        "type": "string"
      },
      "knowledge_retrievals": {
        "items": {
          "$ref": "#/components/schemas/AIRunKnowledgeRetrieval"
        },
        "type": "array"
      },
      "model_display_name": {
        "type": "string"
      },
      "model_id": {
        "type": "string"
      },
      "platform": {
        "enum": [
          "admin",
          "app",
          "canvas"
        ],
        "type": "string"
      },
      "prompt_tokens": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "provider_id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "provider_name": {
        "type": "string"
      },
      "request_id": {
        "type": "string"
      },
      "started_at": {
        "type": "string"
      },
      "status": {
        "enum": [
          "running",
          "success",
          "failed",
          "canceled",
          "timeout"
        ],
        "type": "string"
      },
      "status_name": {
        "type": "string"
      },
      "tool_calls": {
        "items": {
          "$ref": "#/components/schemas/AIRunToolCall"
        },
        "type": "array"
      },
      "total_tokens": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "updated_at": {
        "type": "string"
      },
      "user_id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "user_message": {
        "anyOf": [
          {
            "$ref": "#/components/schemas/AIRunMessageSummary"
          },
          {
            "type": "null"
          }
        ]
      },
      "username": {
        "type": "string"
      }
    },
    "required": [
      "agent_id",
      "agent_name",
      "assistant_message",
      "completion_tokens",
      "conversation_id",
      "conversation_title",
      "created_at",
      "duration_ms",
      "duration_text",
      "error_message",
      "events",
      "finished_at",
      "id",
      "input_snapshot",
      "knowledge_retrievals",
      "model_display_name",
      "model_id",
      "platform",
      "prompt_tokens",
      "provider_id",
      "provider_name",
      "request_id",
      "started_at",
      "status",
      "status_name",
      "tool_calls",
      "total_tokens",
      "updated_at",
      "user_id",
      "user_message",
      "username"
    ],
    "type": "object"
  },
  "AIRunEvent": {
    "additionalProperties": false,
    "properties": {
      "created_at": {
        "type": "string"
      },
      "elapsed_ms": {
        "anyOf": [
          {
            "format": "int64",
            "minimum": 0,
            "type": "integer"
          },
          {
            "type": "null"
          }
        ]
      },
      "elapsed_text": {
        "type": "string"
      },
      "event_type": {
        "enum": [
          "start",
          "completed",
          "failed",
          "canceled",
          "timeout"
        ],
        "type": "string"
      },
      "event_type_name": {
        "type": "string"
      },
      "id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "message": {
        "type": "string"
      },
      "seq": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      }
    },
    "required": [
      "created_at",
      "elapsed_ms",
      "elapsed_text",
      "event_type",
      "event_type_name",
      "id",
      "message",
      "seq"
    ],
    "type": "object"
  },
  "AIRunKnowledgeHit": {
    "additionalProperties": false,
    "properties": {
      "chunk_id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "chunk_index": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "content_snapshot": {
        "type": "string"
      },
      "created_at": {
        "type": "string"
      },
      "document_id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "document_title": {
        "type": "string"
      },
      "id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "knowledge_base_id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "knowledge_base_name": {
        "type": "string"
      },
      "rank_no": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "score": {
        "type": "number"
      },
      "skip_reason": {
        "type": "string"
      },
      "status": {
        "enum": [
          1,
          2
        ],
        "type": "integer"
      },
      "status_name": {
        "type": "string"
      }
    },
    "required": [
      "chunk_id",
      "chunk_index",
      "content_snapshot",
      "created_at",
      "document_id",
      "document_title",
      "id",
      "knowledge_base_id",
      "knowledge_base_name",
      "rank_no",
      "score",
      "skip_reason",
      "status",
      "status_name"
    ],
    "type": "object"
  },
  "AIRunKnowledgeRetrieval": {
    "additionalProperties": false,
    "properties": {
      "created_at": {
        "type": "string"
      },
      "duration_ms": {
        "anyOf": [
          {
            "format": "int64",
            "minimum": 0,
            "type": "integer"
          },
          {
            "type": "null"
          }
        ]
      },
      "duration_text": {
        "type": "string"
      },
      "error_message": {
        "type": "string"
      },
      "hits": {
        "items": {
          "$ref": "#/components/schemas/AIRunKnowledgeHit"
        },
        "type": "array"
      },
      "id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "query": {
        "type": "string"
      },
      "run_id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "selected_hits": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "status": {
        "enum": [
          "success",
          "failed",
          "skipped"
        ],
        "type": "string"
      },
      "status_name": {
        "type": "string"
      },
      "total_hits": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      }
    },
    "required": [
      "created_at",
      "duration_ms",
      "duration_text",
      "error_message",
      "hits",
      "id",
      "query",
      "run_id",
      "selected_hits",
      "status",
      "status_name",
      "total_hits"
    ],
    "type": "object"
  },
  "AIRunListItem": {
    "additionalProperties": false,
    "properties": {
      "agent_id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "agent_name": {
        "type": "string"
      },
      "completion_tokens": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "conversation_id": {
        "anyOf": [
          {
            "format": "int64",
            "minimum": 1,
            "type": "integer"
          },
          {
            "type": "null"
          }
        ]
      },
      "conversation_title": {
        "type": "string"
      },
      "created_at": {
        "type": "string"
      },
      "duration_ms": {
        "anyOf": [
          {
            "format": "int64",
            "minimum": 0,
            "type": "integer"
          },
          {
            "type": "null"
          }
        ]
      },
      "duration_text": {
        "type": "string"
      },
      "error_message": {
        "type": "string"
      },
      "id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "input_snapshot": {
        "type": "string"
      },
      "model_display_name": {
        "type": "string"
      },
      "model_id": {
        "type": "string"
      },
      "platform": {
        "enum": [
          "admin",
          "app",
          "canvas"
        ],
        "type": "string"
      },
      "prompt_tokens": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "provider_id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "provider_name": {
        "type": "string"
      },
      "request_id": {
        "type": "string"
      },
      "status": {
        "enum": [
          "running",
          "success",
          "failed",
          "canceled",
          "timeout"
        ],
        "type": "string"
      },
      "status_name": {
        "type": "string"
      },
      "total_tokens": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "user_id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      }
    },
    "required": [
      "agent_id",
      "agent_name",
      "completion_tokens",
      "conversation_id",
      "conversation_title",
      "created_at",
      "duration_ms",
      "duration_text",
      "error_message",
      "id",
      "input_snapshot",
      "model_display_name",
      "model_id",
      "platform",
      "prompt_tokens",
      "provider_id",
      "provider_name",
      "request_id",
      "status",
      "status_name",
      "total_tokens",
      "user_id"
    ],
    "type": "object"
  },
  "AIRunListResult": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/AIRunListItem"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Page"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "AIRunMessageSummary": {
    "additionalProperties": false,
    "properties": {
      "content": {
        "type": "string"
      },
      "content_type": {
        "type": "string"
      },
      "created_at": {
        "type": "string"
      },
      "id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "meta_json": {
        "$ref": "#/components/schemas/JSONValue"
      },
      "role": {
        "enum": [
          1,
          2,
          3
        ],
        "type": "integer"
      }
    },
    "required": [
      "content",
      "content_type",
      "created_at",
      "id",
      "meta_json",
      "role"
    ],
    "type": "object"
  },
  "AIRunPageInit": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/AIRunPageInitDict"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "AIRunPageInitDict": {
    "additionalProperties": false,
    "properties": {
      "agentArr": {
        "items": {
          "$ref": "#/components/schemas/IntOption"
        },
        "type": "array"
      },
      "platform_arr": {
        "items": {
          "$ref": "#/components/schemas/StringOption"
        },
        "type": "array"
      },
      "providerArr": {
        "items": {
          "$ref": "#/components/schemas/IntOption"
        },
        "type": "array"
      },
      "status_arr": {
        "items": {
          "$ref": "#/components/schemas/StringOption"
        },
        "type": "array"
      }
    },
    "required": [
      "agentArr",
      "platform_arr",
      "providerArr",
      "status_arr"
    ],
    "type": "object"
  },
  "AIRunStatsByAgentItem": {
    "additionalProperties": false,
    "properties": {
      "agent_id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "agent_name": {
        "type": "string"
      },
      "avg_duration_ms": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "total_completion_tokens": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "total_prompt_tokens": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "total_runs": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "total_tokens": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      }
    },
    "required": [
      "agent_id",
      "agent_name",
      "avg_duration_ms",
      "total_completion_tokens",
      "total_prompt_tokens",
      "total_runs",
      "total_tokens"
    ],
    "type": "object"
  },
  "AIRunStatsByAgentResult": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/AIRunStatsByAgentItem"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Page"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "AIRunStatsByDateItem": {
    "additionalProperties": false,
    "properties": {
      "avg_duration_ms": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "date": {
        "type": "string"
      },
      "total_completion_tokens": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "total_prompt_tokens": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "total_runs": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "total_tokens": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      }
    },
    "required": [
      "avg_duration_ms",
      "date",
      "total_completion_tokens",
      "total_prompt_tokens",
      "total_runs",
      "total_tokens"
    ],
    "type": "object"
  },
  "AIRunStatsByDateResult": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/AIRunStatsByDateItem"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Page"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "AIRunStatsByUserItem": {
    "additionalProperties": false,
    "properties": {
      "avg_duration_ms": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "total_completion_tokens": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "total_prompt_tokens": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "total_runs": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "total_tokens": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "username": {
        "type": "string"
      }
    },
    "required": [
      "avg_duration_ms",
      "total_completion_tokens",
      "total_prompt_tokens",
      "total_runs",
      "total_tokens",
      "username"
    ],
    "type": "object"
  },
  "AIRunStatsByUserResult": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/AIRunStatsByUserItem"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Page"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "AIRunStatsDateRange": {
    "additionalProperties": false,
    "properties": {
      "end": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "start": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      }
    },
    "required": [
      "end",
      "start"
    ],
    "type": "object"
  },
  "AIRunStatsResult": {
    "additionalProperties": false,
    "properties": {
      "date_range": {
        "$ref": "#/components/schemas/AIRunStatsDateRange"
      },
      "summary": {
        "$ref": "#/components/schemas/AIRunStatsSummary"
      }
    },
    "required": [
      "date_range",
      "summary"
    ],
    "type": "object"
  },
  "AIRunStatsSummary": {
    "additionalProperties": false,
    "properties": {
      "avg_duration_ms": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "fail_runs": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "success_rate": {
        "maximum": 100,
        "minimum": 0,
        "type": "number"
      },
      "total_completion_tokens": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "total_prompt_tokens": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "total_runs": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "total_tokens": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      }
    },
    "required": [
      "avg_duration_ms",
      "fail_runs",
      "success_rate",
      "total_completion_tokens",
      "total_prompt_tokens",
      "total_runs",
      "total_tokens"
    ],
    "type": "object"
  },
  "AIRunToolCall": {
    "additionalProperties": false,
    "properties": {
      "arguments_json": {
        "$ref": "#/components/schemas/JSONValue"
      },
      "call_id": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "duration_ms": {
        "anyOf": [
          {
            "format": "int64",
            "minimum": 0,
            "type": "integer"
          },
          {
            "type": "null"
          }
        ]
      },
      "error_message": {
        "type": "string"
      },
      "finished_at": {
        "type": "string"
      },
      "id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "result_json": {
        "$ref": "#/components/schemas/JSONValue"
      },
      "started_at": {
        "type": "string"
      },
      "status": {
        "enum": [
          "running",
          "success",
          "failed",
          "timeout"
        ],
        "type": "string"
      },
      "tool_code": {
        "type": "string"
      },
      "tool_id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "tool_name": {
        "type": "string"
      }
    },
    "required": [
      "arguments_json",
      "call_id",
      "duration_ms",
      "error_message",
      "finished_at",
      "id",
      "result_json",
      "started_at",
      "status",
      "tool_code",
      "tool_id",
      "tool_name"
    ],
    "type": "object"
  },
  "AIRuntimeParams": {
    "additionalProperties": false,
    "properties": {
      "max_history": {
        "format": "int64",
        "maximum": 50,
        "minimum": 1,
        "type": "integer"
      },
      "max_tokens": {
        "format": "int64",
        "maximum": 200000,
        "minimum": 1,
        "type": "integer"
      },
      "temperature": {
        "maximum": 2,
        "minimum": 0,
        "type": "number"
      }
    },
    "type": "object"
  },
  "AddressTreeNode": {
    "additionalProperties": false,
    "properties": {
      "children": {
        "items": {
          "$ref": "#/components/schemas/AddressTreeNode"
        },
        "type": "array"
      },
      "id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "label": {
        "type": "string"
      },
      "parent_id": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "value": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      }
    },
    "required": [
      "id",
      "parent_id",
      "label",
      "value"
    ],
    "type": "object"
  },
  "ExportTaskItem": {
    "additionalProperties": false,
    "properties": {
      "created_at": {
        "type": "string"
      },
      "error_msg": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "expire_at": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "file_name": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "file_size_text": {
        "type": "string"
      },
      "file_url": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "kind": {
        "type": "string"
      },
      "kind_text": {
        "type": "string"
      },
      "row_count": {
        "anyOf": [
          {
            "format": "int64",
            "minimum": 0,
            "type": "integer"
          },
          {
            "type": "null"
          }
        ]
      },
      "status": {
        "enum": [
          1,
          2,
          3
        ],
        "type": "integer"
      },
      "status_text": {
        "type": "string"
      },
      "title": {
        "type": "string"
      }
    },
    "required": [
      "created_at",
      "error_msg",
      "expire_at",
      "file_name",
      "file_size_text",
      "file_url",
      "id",
      "kind",
      "kind_text",
      "row_count",
      "status",
      "status_text",
      "title"
    ],
    "type": "object"
  },
  "ExportTaskListResult": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/ExportTaskItem"
        },
        "type": "array"
      },
      "next_id": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "page": {
        "$ref": "#/components/schemas/Page"
      }
    },
    "required": [
      "list",
      "next_id",
      "page"
    ],
    "type": "object"
  },
  "ExportTaskStatusCountItem": {
    "additionalProperties": false,
    "properties": {
      "label": {
        "type": "string"
      },
      "num": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "value": {
        "enum": [
          1,
          2,
          3
        ],
        "type": "integer"
      }
    },
    "required": [
      "label",
      "num",
      "value"
    ],
    "type": "object"
  },
  "IntOption": {
    "additionalProperties": false,
    "properties": {
      "label": {
        "type": "string"
      },
      "value": {
        "format": "int64",
        "type": "integer"
      }
    },
    "required": [
      "label",
      "value"
    ],
    "type": "object"
  },
  "JSONValue": {
    "description": "Any valid JSON value explicitly stored in a json.RawMessage field; invalid or absent stored JSON is normalized to an empty object."
  },
  "NotificationItem": {
    "additionalProperties": false,
    "properties": {
      "content": {
        "type": "string"
      },
      "created_at": {
        "type": "string"
      },
      "id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "is_read": {
        "enum": [
          1,
          2
        ],
        "type": "integer"
      },
      "level": {
        "enum": [
          1,
          2
        ],
        "type": "integer"
      },
      "level_text": {
        "type": "string"
      },
      "link": {
        "type": "string"
      },
      "title": {
        "type": "string"
      },
      "type": {
        "enum": [
          1,
          2,
          3,
          4
        ],
        "type": "integer"
      },
      "type_text": {
        "type": "string"
      }
    },
    "required": [
      "content",
      "created_at",
      "id",
      "is_read",
      "level",
      "level_text",
      "link",
      "title",
      "type",
      "type_text"
    ],
    "type": "object"
  },
  "NotificationListResult": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/NotificationItem"
        },
        "type": "array"
      },
      "next_id": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "page": {
        "$ref": "#/components/schemas/Page"
      }
    },
    "required": [
      "list",
      "next_id",
      "page"
    ],
    "type": "object"
  },
  "NotificationPageInit": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/NotificationPageInitDict"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "NotificationPageInitDict": {
    "additionalProperties": false,
    "properties": {
      "notification_level_arr": {
        "items": {
          "$ref": "#/components/schemas/IntOption"
        },
        "type": "array"
      },
      "notification_read_status_arr": {
        "items": {
          "$ref": "#/components/schemas/IntOption"
        },
        "type": "array"
      },
      "notification_type_arr": {
        "items": {
          "$ref": "#/components/schemas/IntOption"
        },
        "type": "array"
      }
    },
    "required": [
      "notification_level_arr",
      "notification_read_status_arr",
      "notification_type_arr"
    ],
    "type": "object"
  },
  "NotificationUnreadCountResult": {
    "additionalProperties": false,
    "properties": {
      "count": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      }
    },
    "required": [
      "count"
    ],
    "type": "object"
  },
  "Page": {
    "additionalProperties": false,
    "properties": {
      "current_page": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "page_size": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "total": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "total_page": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      }
    },
    "required": [
      "current_page",
      "page_size",
      "total",
      "total_page"
    ],
    "type": "object"
  },
  "StringOption": {
    "additionalProperties": false,
    "properties": {
      "label": {
        "type": "string"
      },
      "value": {
        "type": "string"
      }
    },
    "required": [
      "label",
      "value"
    ],
    "type": "object"
  },
  "UserExportResult": {
    "additionalProperties": false,
    "properties": {
      "id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "message": {
        "type": "string"
      }
    },
    "required": [
      "id",
      "message"
    ],
    "type": "object"
  },
  "UserListItem": {
    "additionalProperties": false,
    "properties": {
      "address_id": {
        "format": "int64",
        "minimum": 0,
        "type": "integer"
      },
      "address_show": {
        "type": "string"
      },
      "avatar": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "bio": {
        "type": "string"
      },
      "created_at": {
        "type": "string"
      },
      "detail_address": {
        "type": "string"
      },
      "email": {
        "type": "string"
      },
      "id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "phone": {
        "type": "string"
      },
      "role_id": {
        "format": "int64",
        "minimum": 1,
        "type": "integer"
      },
      "role_name": {
        "type": "string"
      },
      "sex": {
        "enum": [
          0,
          1,
          2
        ],
        "type": "integer"
      },
      "sex_show": {
        "type": "string"
      },
      "status": {
        "enum": [
          1,
          2
        ],
        "type": "integer"
      },
      "username": {
        "type": "string"
      }
    },
    "required": [
      "address_id",
      "address_show",
      "avatar",
      "bio",
      "created_at",
      "detail_address",
      "email",
      "id",
      "phone",
      "role_id",
      "role_name",
      "sex",
      "sex_show",
      "status",
      "username"
    ],
    "type": "object"
  },
  "UserListResult": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/UserListItem"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Page"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "UserPageInit": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/UserPageInitDict"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "UserPageInitDict": {
    "additionalProperties": false,
    "properties": {
      "auth_address_tree": {
        "items": {
          "$ref": "#/components/schemas/AddressTreeNode"
        },
        "type": "array"
      },
      "platformArr": {
        "items": {
          "$ref": "#/components/schemas/StringOption"
        },
        "type": "array"
      },
      "roleArr": {
        "items": {
          "$ref": "#/components/schemas/IntOption"
        },
        "type": "array"
      },
      "sexArr": {
        "items": {
          "$ref": "#/components/schemas/IntOption"
        },
        "type": "array"
      }
    },
    "required": [
      "auth_address_tree",
      "platformArr",
      "roleArr",
      "sexArr"
    ],
    "type": "object"
  }
} as const satisfies Readonly<Record<string, ContractSchema>>

const responseDataSchemas = {
  "delete_api_admin_v1_ai_conversations_id": {
    "additionalProperties": false,
    "properties": {},
    "type": "object"
  },
  "delete_api_admin_v1_export_tasks": {
    "additionalProperties": false,
    "properties": {},
    "type": "object"
  },
  "delete_api_admin_v1_export_tasks_id": {
    "additionalProperties": false,
    "properties": {},
    "type": "object"
  },
  "delete_api_admin_v1_notifications": {
    "additionalProperties": false,
    "properties": {},
    "type": "object"
  },
  "delete_api_admin_v1_notifications_id": {
    "additionalProperties": false,
    "properties": {},
    "type": "object"
  },
  "delete_api_admin_v1_users": {
    "additionalProperties": false,
    "properties": {},
    "type": "object"
  },
  "delete_api_admin_v1_users_id": {
    "additionalProperties": false,
    "properties": {},
    "type": "object"
  },
  "get_api_admin_v1_ai_conversations": {
    "$ref": "#/components/schemas/AIConversationListResult"
  },
  "get_api_admin_v1_ai_conversations_id": {
    "$ref": "#/components/schemas/AIConversationDetail"
  },
  "get_api_admin_v1_ai_conversations_id_messages": {
    "$ref": "#/components/schemas/AIMessageListResult"
  },
  "get_api_admin_v1_ai_runs": {
    "$ref": "#/components/schemas/AIRunListResult"
  },
  "get_api_admin_v1_ai_runs_id": {
    "$ref": "#/components/schemas/AIRunDetail"
  },
  "get_api_admin_v1_ai_runs_page_init": {
    "$ref": "#/components/schemas/AIRunPageInit"
  },
  "get_api_admin_v1_ai_runs_stats": {
    "$ref": "#/components/schemas/AIRunStatsResult"
  },
  "get_api_admin_v1_ai_runs_stats_by_agent": {
    "$ref": "#/components/schemas/AIRunStatsByAgentResult"
  },
  "get_api_admin_v1_ai_runs_stats_by_date": {
    "$ref": "#/components/schemas/AIRunStatsByDateResult"
  },
  "get_api_admin_v1_ai_runs_stats_by_user": {
    "$ref": "#/components/schemas/AIRunStatsByUserResult"
  },
  "get_api_admin_v1_export_tasks": {
    "$ref": "#/components/schemas/ExportTaskListResult"
  },
  "get_api_admin_v1_export_tasks_status_count": {
    "items": {
      "$ref": "#/components/schemas/ExportTaskStatusCountItem"
    },
    "type": "array"
  },
  "get_api_admin_v1_notifications": {
    "$ref": "#/components/schemas/NotificationListResult"
  },
  "get_api_admin_v1_notifications_page_init": {
    "$ref": "#/components/schemas/NotificationPageInit"
  },
  "get_api_admin_v1_notifications_unread_count": {
    "$ref": "#/components/schemas/NotificationUnreadCountResult"
  },
  "get_api_admin_v1_users": {
    "$ref": "#/components/schemas/UserListResult"
  },
  "get_api_admin_v1_users_page_init": {
    "$ref": "#/components/schemas/UserPageInit"
  },
  "patch_api_admin_v1_notifications_id_read": {
    "additionalProperties": false,
    "properties": {},
    "type": "object"
  },
  "patch_api_admin_v1_notifications_read": {
    "additionalProperties": false,
    "properties": {},
    "type": "object"
  },
  "patch_api_admin_v1_users": {
    "additionalProperties": false,
    "properties": {},
    "type": "object"
  },
  "patch_api_admin_v1_users_id_status": {
    "additionalProperties": false,
    "properties": {},
    "type": "object"
  },
  "post_api_admin_v1_ai_conversations": {
    "$ref": "#/components/schemas/AIConversationCreateResult"
  },
  "post_api_admin_v1_ai_conversations_id_messages": {
    "$ref": "#/components/schemas/AIMessageSendResult"
  },
  "post_api_admin_v1_ai_conversations_id_messages_cancel": {
    "$ref": "#/components/schemas/AIMessageCancelResult"
  },
  "post_api_admin_v1_auth_queue_monitor_grants": {
    "additionalProperties": false,
    "properties": {
      "expires_in": {
        "const": 60,
        "type": "integer"
      }
    },
    "required": [
      "expires_in"
    ],
    "type": "object"
  },
  "post_api_admin_v1_auth_realtime_tickets": {
    "additionalProperties": false,
    "properties": {
      "expires_in": {
        "const": 30,
        "type": "integer"
      },
      "ticket": {
        "minLength": 1,
        "type": "string"
      }
    },
    "required": [
      "ticket",
      "expires_in"
    ],
    "type": "object"
  },
  "post_api_admin_v1_users_export": {
    "$ref": "#/components/schemas/UserExportResult"
  },
  "put_api_admin_v1_ai_conversations_id": {
    "additionalProperties": false,
    "properties": {},
    "type": "object"
  },
  "put_api_admin_v1_users_id": {
    "additionalProperties": false,
    "properties": {},
    "type": "object"
  }
} as const satisfies Readonly<Record<string, ContractSchema>>

export type AdminOperationId = keyof typeof responseDataSchemas
type OperationContract<K extends AdminOperationId> = operations[K]
type ParameterName = 'path' | 'query'
type ParametersContract<K extends AdminOperationId> = OperationContract<K> extends { parameters: infer P } ? P : never
type ParameterField<K extends AdminOperationId, N extends ParameterName> =
  ParametersContract<K> extends Record<N, infer Value>
    ? { readonly [P in N]: Value }
    : ParametersContract<K> extends { readonly [P in N]?: infer Value }
      ? [Exclude<Value, undefined>] extends [never]
        ? Record<never, never>
        : { readonly [P in N]?: Exclude<Value, undefined> }
      : Record<never, never>
type RequestBodyField<K extends AdminOperationId> =
  OperationContract<K> extends { requestBody: { content: { 'application/json': infer Body } } }
    ? { readonly body: Body }
    : OperationContract<K> extends { requestBody?: { content: { 'application/json': infer Body } } }
      ? { readonly body?: Body }
      : Record<never, never>
type ResponsesContract<K extends AdminOperationId> = OperationContract<K> extends { responses: infer Responses } ? Responses : never
type SuccessResponse<K extends AdminOperationId> = ResponsesContract<K>[Exclude<keyof ResponsesContract<K>, 'default'>]
type SuccessEnvelope<K extends AdminOperationId> = SuccessResponse<K> extends { content: { 'application/json': infer Envelope } } ? Envelope : never

export type AdminOperationInput<K extends AdminOperationId> =
  ParameterField<K, 'path'> & ParameterField<K, 'query'> & RequestBodyField<K>
export type AdminOperationOutput<K extends AdminOperationId> =
  SuccessEnvelope<K> extends { data: infer Data } ? Data : never

const schemaCompiler = createContractSchemaCompiler(contractSchemas)

export const adminOperations = {
  "delete_api_admin_v1_ai_conversations_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_ai_conversations_id">, AdminOperationOutput<"delete_api_admin_v1_ai_conversations_id">>({
    id: "delete_api_admin_v1_ai_conversations_id",
    method: "DELETE",
    path: "/api/admin/v1/ai-conversations/{id}",
    auth: "required",
    timeout: 'interactive',
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_ai_conversations_id">>(responseDataSchemas["delete_api_admin_v1_ai_conversations_id"]),
    telemetryName: "admin.delete.api.admin.v1.ai.conversations.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_export_tasks": defineOperation<AdminOperationInput<"delete_api_admin_v1_export_tasks">, AdminOperationOutput<"delete_api_admin_v1_export_tasks">>({
    id: "delete_api_admin_v1_export_tasks",
    method: "DELETE",
    path: "/api/admin/v1/export-tasks",
    auth: "required",
    timeout: 'interactive',
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_export_tasks">>(responseDataSchemas["delete_api_admin_v1_export_tasks"]),
    telemetryName: "admin.delete.api.admin.v1.export.tasks",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_export_tasks_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_export_tasks_id">, AdminOperationOutput<"delete_api_admin_v1_export_tasks_id">>({
    id: "delete_api_admin_v1_export_tasks_id",
    method: "DELETE",
    path: "/api/admin/v1/export-tasks/{id}",
    auth: "required",
    timeout: 'interactive',
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_export_tasks_id">>(responseDataSchemas["delete_api_admin_v1_export_tasks_id"]),
    telemetryName: "admin.delete.api.admin.v1.export.tasks.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_notifications": defineOperation<AdminOperationInput<"delete_api_admin_v1_notifications">, AdminOperationOutput<"delete_api_admin_v1_notifications">>({
    id: "delete_api_admin_v1_notifications",
    method: "DELETE",
    path: "/api/admin/v1/notifications",
    auth: "required",
    timeout: 'interactive',
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_notifications">>(responseDataSchemas["delete_api_admin_v1_notifications"]),
    telemetryName: "admin.delete.api.admin.v1.notifications",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_notifications_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_notifications_id">, AdminOperationOutput<"delete_api_admin_v1_notifications_id">>({
    id: "delete_api_admin_v1_notifications_id",
    method: "DELETE",
    path: "/api/admin/v1/notifications/{id}",
    auth: "required",
    timeout: 'interactive',
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_notifications_id">>(responseDataSchemas["delete_api_admin_v1_notifications_id"]),
    telemetryName: "admin.delete.api.admin.v1.notifications.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_users": defineOperation<AdminOperationInput<"delete_api_admin_v1_users">, AdminOperationOutput<"delete_api_admin_v1_users">>({
    id: "delete_api_admin_v1_users",
    method: "DELETE",
    path: "/api/admin/v1/users",
    auth: "required",
    timeout: 'interactive',
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_users">>(responseDataSchemas["delete_api_admin_v1_users"]),
    telemetryName: "admin.delete.api.admin.v1.users",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_users_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_users_id">, AdminOperationOutput<"delete_api_admin_v1_users_id">>({
    id: "delete_api_admin_v1_users_id",
    method: "DELETE",
    path: "/api/admin/v1/users/{id}",
    auth: "required",
    timeout: 'interactive',
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_users_id">>(responseDataSchemas["delete_api_admin_v1_users_id"]),
    telemetryName: "admin.delete.api.admin.v1.users.id",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_conversations": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_conversations">, AdminOperationOutput<"get_api_admin_v1_ai_conversations">>({
    id: "get_api_admin_v1_ai_conversations",
    method: "GET",
    path: "/api/admin/v1/ai-conversations",
    auth: "required",
    timeout: 'interactive',
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_conversations">>(responseDataSchemas["get_api_admin_v1_ai_conversations"]),
    telemetryName: "admin.get.api.admin.v1.ai.conversations",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_conversations_id": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_conversations_id">, AdminOperationOutput<"get_api_admin_v1_ai_conversations_id">>({
    id: "get_api_admin_v1_ai_conversations_id",
    method: "GET",
    path: "/api/admin/v1/ai-conversations/{id}",
    auth: "required",
    timeout: 'interactive',
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_conversations_id">>(responseDataSchemas["get_api_admin_v1_ai_conversations_id"]),
    telemetryName: "admin.get.api.admin.v1.ai.conversations.id",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_conversations_id_messages": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_conversations_id_messages">, AdminOperationOutput<"get_api_admin_v1_ai_conversations_id_messages">>({
    id: "get_api_admin_v1_ai_conversations_id_messages",
    method: "GET",
    path: "/api/admin/v1/ai-conversations/{id}/messages",
    auth: "required",
    timeout: 'interactive',
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_conversations_id_messages">>(responseDataSchemas["get_api_admin_v1_ai_conversations_id_messages"]),
    telemetryName: "admin.get.api.admin.v1.ai.conversations.id.messages",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_runs": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_runs">, AdminOperationOutput<"get_api_admin_v1_ai_runs">>({
    id: "get_api_admin_v1_ai_runs",
    method: "GET",
    path: "/api/admin/v1/ai-runs",
    auth: "required",
    timeout: 'interactive',
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_runs">>(responseDataSchemas["get_api_admin_v1_ai_runs"]),
    telemetryName: "admin.get.api.admin.v1.ai.runs",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_runs_id": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_runs_id">, AdminOperationOutput<"get_api_admin_v1_ai_runs_id">>({
    id: "get_api_admin_v1_ai_runs_id",
    method: "GET",
    path: "/api/admin/v1/ai-runs/{id}",
    auth: "required",
    timeout: 'interactive',
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_runs_id">>(responseDataSchemas["get_api_admin_v1_ai_runs_id"]),
    telemetryName: "admin.get.api.admin.v1.ai.runs.id",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_runs_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_runs_page_init">, AdminOperationOutput<"get_api_admin_v1_ai_runs_page_init">>({
    id: "get_api_admin_v1_ai_runs_page_init",
    method: "GET",
    path: "/api/admin/v1/ai-runs/page-init",
    auth: "required",
    timeout: 'interactive',
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_runs_page_init">>(responseDataSchemas["get_api_admin_v1_ai_runs_page_init"]),
    telemetryName: "admin.get.api.admin.v1.ai.runs.page.init",
  }),
  "get_api_admin_v1_ai_runs_stats": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_runs_stats">, AdminOperationOutput<"get_api_admin_v1_ai_runs_stats">>({
    id: "get_api_admin_v1_ai_runs_stats",
    method: "GET",
    path: "/api/admin/v1/ai-runs/stats",
    auth: "required",
    timeout: 'interactive',
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_runs_stats">>(responseDataSchemas["get_api_admin_v1_ai_runs_stats"]),
    telemetryName: "admin.get.api.admin.v1.ai.runs.stats",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_runs_stats_by_agent": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_runs_stats_by_agent">, AdminOperationOutput<"get_api_admin_v1_ai_runs_stats_by_agent">>({
    id: "get_api_admin_v1_ai_runs_stats_by_agent",
    method: "GET",
    path: "/api/admin/v1/ai-runs/stats/by-agent",
    auth: "required",
    timeout: 'interactive',
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_runs_stats_by_agent">>(responseDataSchemas["get_api_admin_v1_ai_runs_stats_by_agent"]),
    telemetryName: "admin.get.api.admin.v1.ai.runs.stats.by.agent",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_runs_stats_by_date": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_runs_stats_by_date">, AdminOperationOutput<"get_api_admin_v1_ai_runs_stats_by_date">>({
    id: "get_api_admin_v1_ai_runs_stats_by_date",
    method: "GET",
    path: "/api/admin/v1/ai-runs/stats/by-date",
    auth: "required",
    timeout: 'interactive',
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_runs_stats_by_date">>(responseDataSchemas["get_api_admin_v1_ai_runs_stats_by_date"]),
    telemetryName: "admin.get.api.admin.v1.ai.runs.stats.by.date",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_runs_stats_by_user": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_runs_stats_by_user">, AdminOperationOutput<"get_api_admin_v1_ai_runs_stats_by_user">>({
    id: "get_api_admin_v1_ai_runs_stats_by_user",
    method: "GET",
    path: "/api/admin/v1/ai-runs/stats/by-user",
    auth: "required",
    timeout: 'interactive',
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_runs_stats_by_user">>(responseDataSchemas["get_api_admin_v1_ai_runs_stats_by_user"]),
    telemetryName: "admin.get.api.admin.v1.ai.runs.stats.by.user",
    encode: (input) => input,
  }),
  "get_api_admin_v1_export_tasks": defineOperation<AdminOperationInput<"get_api_admin_v1_export_tasks">, AdminOperationOutput<"get_api_admin_v1_export_tasks">>({
    id: "get_api_admin_v1_export_tasks",
    method: "GET",
    path: "/api/admin/v1/export-tasks",
    auth: "required",
    timeout: 'interactive',
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_export_tasks">>(responseDataSchemas["get_api_admin_v1_export_tasks"]),
    telemetryName: "admin.get.api.admin.v1.export.tasks",
    encode: (input) => input,
  }),
  "get_api_admin_v1_export_tasks_status_count": defineOperation<AdminOperationInput<"get_api_admin_v1_export_tasks_status_count">, AdminOperationOutput<"get_api_admin_v1_export_tasks_status_count">>({
    id: "get_api_admin_v1_export_tasks_status_count",
    method: "GET",
    path: "/api/admin/v1/export-tasks/status-count",
    auth: "required",
    timeout: 'interactive',
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_export_tasks_status_count">>(responseDataSchemas["get_api_admin_v1_export_tasks_status_count"]),
    telemetryName: "admin.get.api.admin.v1.export.tasks.status.count",
    encode: (input) => input,
  }),
  "get_api_admin_v1_notifications": defineOperation<AdminOperationInput<"get_api_admin_v1_notifications">, AdminOperationOutput<"get_api_admin_v1_notifications">>({
    id: "get_api_admin_v1_notifications",
    method: "GET",
    path: "/api/admin/v1/notifications",
    auth: "required",
    timeout: 'interactive',
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_notifications">>(responseDataSchemas["get_api_admin_v1_notifications"]),
    telemetryName: "admin.get.api.admin.v1.notifications",
    encode: (input) => input,
  }),
  "get_api_admin_v1_notifications_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_notifications_page_init">, AdminOperationOutput<"get_api_admin_v1_notifications_page_init">>({
    id: "get_api_admin_v1_notifications_page_init",
    method: "GET",
    path: "/api/admin/v1/notifications/page-init",
    auth: "required",
    timeout: 'interactive',
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_notifications_page_init">>(responseDataSchemas["get_api_admin_v1_notifications_page_init"]),
    telemetryName: "admin.get.api.admin.v1.notifications.page.init",
  }),
  "get_api_admin_v1_notifications_unread_count": defineOperation<AdminOperationInput<"get_api_admin_v1_notifications_unread_count">, AdminOperationOutput<"get_api_admin_v1_notifications_unread_count">>({
    id: "get_api_admin_v1_notifications_unread_count",
    method: "GET",
    path: "/api/admin/v1/notifications/unread-count",
    auth: "required",
    timeout: 'interactive',
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_notifications_unread_count">>(responseDataSchemas["get_api_admin_v1_notifications_unread_count"]),
    telemetryName: "admin.get.api.admin.v1.notifications.unread.count",
  }),
  "get_api_admin_v1_users": defineOperation<AdminOperationInput<"get_api_admin_v1_users">, AdminOperationOutput<"get_api_admin_v1_users">>({
    id: "get_api_admin_v1_users",
    method: "GET",
    path: "/api/admin/v1/users",
    auth: "required",
    timeout: 'interactive',
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_users">>(responseDataSchemas["get_api_admin_v1_users"]),
    telemetryName: "admin.get.api.admin.v1.users",
    encode: (input) => input,
  }),
  "get_api_admin_v1_users_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_users_page_init">, AdminOperationOutput<"get_api_admin_v1_users_page_init">>({
    id: "get_api_admin_v1_users_page_init",
    method: "GET",
    path: "/api/admin/v1/users/page-init",
    auth: "required",
    timeout: 'interactive',
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_users_page_init">>(responseDataSchemas["get_api_admin_v1_users_page_init"]),
    telemetryName: "admin.get.api.admin.v1.users.page.init",
  }),
  "patch_api_admin_v1_notifications_id_read": defineOperation<AdminOperationInput<"patch_api_admin_v1_notifications_id_read">, AdminOperationOutput<"patch_api_admin_v1_notifications_id_read">>({
    id: "patch_api_admin_v1_notifications_id_read",
    method: "PATCH",
    path: "/api/admin/v1/notifications/{id}/read",
    auth: "required",
    timeout: 'interactive',
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_notifications_id_read">>(responseDataSchemas["patch_api_admin_v1_notifications_id_read"]),
    telemetryName: "admin.patch.api.admin.v1.notifications.id.read",
    encode: (input) => input,
  }),
  "patch_api_admin_v1_notifications_read": defineOperation<AdminOperationInput<"patch_api_admin_v1_notifications_read">, AdminOperationOutput<"patch_api_admin_v1_notifications_read">>({
    id: "patch_api_admin_v1_notifications_read",
    method: "PATCH",
    path: "/api/admin/v1/notifications/read",
    auth: "required",
    timeout: 'interactive',
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_notifications_read">>(responseDataSchemas["patch_api_admin_v1_notifications_read"]),
    telemetryName: "admin.patch.api.admin.v1.notifications.read",
    encode: (input) => input,
  }),
  "patch_api_admin_v1_users": defineOperation<AdminOperationInput<"patch_api_admin_v1_users">, AdminOperationOutput<"patch_api_admin_v1_users">>({
    id: "patch_api_admin_v1_users",
    method: "PATCH",
    path: "/api/admin/v1/users",
    auth: "required",
    timeout: 'interactive',
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_users">>(responseDataSchemas["patch_api_admin_v1_users"]),
    telemetryName: "admin.patch.api.admin.v1.users",
    encode: (input) => input,
  }),
  "patch_api_admin_v1_users_id_status": defineOperation<AdminOperationInput<"patch_api_admin_v1_users_id_status">, AdminOperationOutput<"patch_api_admin_v1_users_id_status">>({
    id: "patch_api_admin_v1_users_id_status",
    method: "PATCH",
    path: "/api/admin/v1/users/{id}/status",
    auth: "required",
    timeout: 'interactive',
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_users_id_status">>(responseDataSchemas["patch_api_admin_v1_users_id_status"]),
    telemetryName: "admin.patch.api.admin.v1.users.id.status",
    encode: (input) => input,
  }),
  "post_api_admin_v1_ai_conversations": defineOperation<AdminOperationInput<"post_api_admin_v1_ai_conversations">, AdminOperationOutput<"post_api_admin_v1_ai_conversations">>({
    id: "post_api_admin_v1_ai_conversations",
    method: "POST",
    path: "/api/admin/v1/ai-conversations",
    auth: "required",
    timeout: 'interactive',
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_ai_conversations">>(responseDataSchemas["post_api_admin_v1_ai_conversations"]),
    telemetryName: "admin.post.api.admin.v1.ai.conversations",
    encode: (input) => input,
  }),
  "post_api_admin_v1_ai_conversations_id_messages": defineOperation<AdminOperationInput<"post_api_admin_v1_ai_conversations_id_messages">, AdminOperationOutput<"post_api_admin_v1_ai_conversations_id_messages">>({
    id: "post_api_admin_v1_ai_conversations_id_messages",
    method: "POST",
    path: "/api/admin/v1/ai-conversations/{id}/messages",
    auth: "required",
    timeout: 'interactive',
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_ai_conversations_id_messages">>(responseDataSchemas["post_api_admin_v1_ai_conversations_id_messages"]),
    telemetryName: "admin.post.api.admin.v1.ai.conversations.id.messages",
    encode: (input) => input,
  }),
  "post_api_admin_v1_ai_conversations_id_messages_cancel": defineOperation<AdminOperationInput<"post_api_admin_v1_ai_conversations_id_messages_cancel">, AdminOperationOutput<"post_api_admin_v1_ai_conversations_id_messages_cancel">>({
    id: "post_api_admin_v1_ai_conversations_id_messages_cancel",
    method: "POST",
    path: "/api/admin/v1/ai-conversations/{id}/messages/cancel",
    auth: "required",
    timeout: 'interactive',
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_ai_conversations_id_messages_cancel">>(responseDataSchemas["post_api_admin_v1_ai_conversations_id_messages_cancel"]),
    telemetryName: "admin.post.api.admin.v1.ai.conversations.id.messages.cancel",
    encode: (input) => input,
  }),
  "post_api_admin_v1_auth_queue_monitor_grants": defineOperation<AdminOperationInput<"post_api_admin_v1_auth_queue_monitor_grants">, AdminOperationOutput<"post_api_admin_v1_auth_queue_monitor_grants">>({
    id: "post_api_admin_v1_auth_queue_monitor_grants",
    method: "POST",
    path: "/api/admin/v1/auth/queue-monitor-grants",
    auth: "required",
    timeout: 'interactive',
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_auth_queue_monitor_grants">>(responseDataSchemas["post_api_admin_v1_auth_queue_monitor_grants"]),
    telemetryName: "admin.post.api.admin.v1.auth.queue.monitor.grants",
    encode: (input) => input,
  }),
  "post_api_admin_v1_auth_realtime_tickets": defineOperation<AdminOperationInput<"post_api_admin_v1_auth_realtime_tickets">, AdminOperationOutput<"post_api_admin_v1_auth_realtime_tickets">>({
    id: "post_api_admin_v1_auth_realtime_tickets",
    method: "POST",
    path: "/api/admin/v1/auth/realtime-tickets",
    auth: "required",
    timeout: 'interactive',
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_auth_realtime_tickets">>(responseDataSchemas["post_api_admin_v1_auth_realtime_tickets"]),
    telemetryName: "admin.post.api.admin.v1.auth.realtime.tickets",
    encode: (input) => input,
  }),
  "post_api_admin_v1_users_export": defineOperation<AdminOperationInput<"post_api_admin_v1_users_export">, AdminOperationOutput<"post_api_admin_v1_users_export">>({
    id: "post_api_admin_v1_users_export",
    method: "POST",
    path: "/api/admin/v1/users/export",
    auth: "required",
    timeout: 'interactive',
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_users_export">>(responseDataSchemas["post_api_admin_v1_users_export"]),
    telemetryName: "admin.post.api.admin.v1.users.export",
    encode: (input) => input,
  }),
  "put_api_admin_v1_ai_conversations_id": defineOperation<AdminOperationInput<"put_api_admin_v1_ai_conversations_id">, AdminOperationOutput<"put_api_admin_v1_ai_conversations_id">>({
    id: "put_api_admin_v1_ai_conversations_id",
    method: "PUT",
    path: "/api/admin/v1/ai-conversations/{id}",
    auth: "required",
    timeout: 'interactive',
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_ai_conversations_id">>(responseDataSchemas["put_api_admin_v1_ai_conversations_id"]),
    telemetryName: "admin.put.api.admin.v1.ai.conversations.id",
    encode: (input) => input,
  }),
  "put_api_admin_v1_users_id": defineOperation<AdminOperationInput<"put_api_admin_v1_users_id">, AdminOperationOutput<"put_api_admin_v1_users_id">>({
    id: "put_api_admin_v1_users_id",
    method: "PUT",
    path: "/api/admin/v1/users/{id}",
    auth: "required",
    timeout: 'interactive',
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_users_id">>(responseDataSchemas["put_api_admin_v1_users_id"]),
    telemetryName: "admin.put.api.admin.v1.users.id",
    encode: (input) => input,
  }),
} as const
