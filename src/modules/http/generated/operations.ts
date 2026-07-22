// Generated from Admin Contract Bundle manifest SHA-256: 904e26a5cbee47c65b8890f5bab90502586ef9182f8d829ad5a9833510ef7c88
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
          "admin"
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
          "admin"
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
  "Go_internal_infra_ai_TestConnectionResult_Output": {
    "additionalProperties": false,
    "properties": {
      "latency_ms": {
        "type": "integer"
      },
      "message": {
        "type": "string"
      },
      "ok": {
        "type": "boolean"
      },
      "status": {
        "type": "string"
      }
    },
    "required": [
      "latency_ms",
      "message",
      "ok",
      "status"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_agent_AgentDTO_Output": {
    "additionalProperties": false,
    "properties": {
      "avatar": {
        "type": "string"
      },
      "created_at": {
        "type": "string"
      },
      "engine_type": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "model_display_name": {
        "type": "string"
      },
      "model_id": {
        "type": "string"
      },
      "name": {
        "type": "string"
      },
      "provider_id": {
        "type": "integer"
      },
      "provider_name": {
        "type": "string"
      },
      "scene_names": {
        "items": {
          "type": "string"
        },
        "type": "array"
      },
      "scenes": {
        "items": {
          "type": "string"
        },
        "type": "array"
      },
      "status": {
        "type": "integer"
      },
      "status_name": {
        "type": "string"
      },
      "system_prompt": {
        "type": "string"
      },
      "updated_at": {
        "type": "string"
      }
    },
    "required": [
      "avatar",
      "created_at",
      "engine_type",
      "id",
      "model_display_name",
      "model_id",
      "name",
      "provider_id",
      "provider_name",
      "scene_names",
      "scenes",
      "status",
      "status_name",
      "system_prompt",
      "updated_at"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_agent_AgentOption_Output": {
    "additionalProperties": false,
    "properties": {
      "avatar": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "name": {
        "type": "string"
      },
      "system_prompt": {
        "type": "string"
      }
    },
    "required": [
      "avatar",
      "id",
      "name",
      "system_prompt"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_agent_AgentOptionsResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_ai_agent_AgentOption_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "list"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_agent_DetailResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "avatar": {
        "type": "string"
      },
      "created_at": {
        "type": "string"
      },
      "engine_type": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "model_display_name": {
        "type": "string"
      },
      "model_id": {
        "type": "string"
      },
      "name": {
        "type": "string"
      },
      "provider_id": {
        "type": "integer"
      },
      "provider_name": {
        "type": "string"
      },
      "scene_names": {
        "items": {
          "type": "string"
        },
        "type": "array"
      },
      "scenes": {
        "items": {
          "type": "string"
        },
        "type": "array"
      },
      "status": {
        "type": "integer"
      },
      "status_name": {
        "type": "string"
      },
      "system_prompt": {
        "type": "string"
      },
      "updated_at": {
        "type": "string"
      }
    },
    "required": [
      "avatar",
      "created_at",
      "engine_type",
      "id",
      "model_display_name",
      "model_id",
      "name",
      "provider_id",
      "provider_name",
      "scene_names",
      "scenes",
      "status",
      "status_name",
      "system_prompt",
      "updated_at"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_agent_EngineOption_Output": {
    "additionalProperties": false,
    "properties": {
      "engine_type": {
        "type": "string"
      },
      "label": {
        "type": "string"
      },
      "value": {
        "type": "integer"
      }
    },
    "required": [
      "engine_type",
      "label",
      "value"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_agent_InitDict_Output": {
    "additionalProperties": false,
    "properties": {
      "common_status_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      },
      "provider_model_options": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_ai_agent_ModelOption_Output"
        },
        "type": "array"
      },
      "provider_options": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_ai_agent_EngineOption_Output"
        },
        "type": "array"
      },
      "scene_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "common_status_arr",
      "provider_model_options",
      "provider_options",
      "scene_arr"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_agent_InitResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/Go_internal_module_ai_agent_InitDict_Output"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_agent_ListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_ai_agent_AgentDTO_Output"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_ai_agent_Page_Output"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_agent_ModelOption_Output": {
    "additionalProperties": false,
    "properties": {
      "display_name": {
        "type": "string"
      },
      "label": {
        "type": "string"
      },
      "model_id": {
        "type": "string"
      },
      "provider_id": {
        "type": "integer"
      },
      "value": {
        "type": "string"
      }
    },
    "required": [
      "display_name",
      "label",
      "model_id",
      "provider_id",
      "value"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_agent_Page_Output": {
    "additionalProperties": false,
    "properties": {
      "current_page": {
        "type": "integer"
      },
      "page_size": {
        "type": "integer"
      },
      "total": {
        "type": "integer"
      },
      "total_page": {
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
  "Go_internal_module_ai_agent_ProviderModelDTO_Output": {
    "additionalProperties": false,
    "properties": {
      "created_at": {
        "type": "string"
      },
      "display_name": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "model_id": {
        "type": "string"
      },
      "provider_id": {
        "type": "integer"
      },
      "status": {
        "type": "integer"
      },
      "status_name": {
        "type": "string"
      },
      "updated_at": {
        "type": "string"
      }
    },
    "required": [
      "created_at",
      "display_name",
      "id",
      "model_id",
      "provider_id",
      "status",
      "status_name",
      "updated_at"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_agent_ProviderModelsResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_ai_agent_ProviderModelDTO_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "list"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_knowledge_AgentKnowledgeBindingItem_Output": {
    "additionalProperties": false,
    "properties": {
      "id": {
        "type": "integer"
      },
      "knowledge_base_id": {
        "type": "integer"
      },
      "knowledge_base_name": {
        "type": "string"
      },
      "max_context_chars": {
        "type": "integer"
      },
      "min_score": {
        "type": "number"
      },
      "status": {
        "type": "integer"
      },
      "status_name": {
        "type": "string"
      },
      "top_k": {
        "type": "integer"
      }
    },
    "required": [
      "knowledge_base_id",
      "knowledge_base_name",
      "max_context_chars",
      "min_score",
      "status",
      "status_name",
      "top_k"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_knowledge_AgentKnowledgeBindingsResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "agent_id": {
        "type": "integer"
      },
      "base_options": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_ai_knowledge_KnowledgeBaseOption_Output"
        },
        "type": "array"
      },
      "bindings": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_ai_knowledge_AgentKnowledgeBindingItem_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "agent_id",
      "base_options",
      "bindings"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_knowledge_BaseDTO_Output": {
    "additionalProperties": false,
    "properties": {
      "chunk_overlap_chars": {
        "type": "integer"
      },
      "chunk_size_chars": {
        "type": "integer"
      },
      "code": {
        "type": "string"
      },
      "created_at": {
        "type": "string"
      },
      "default_max_context_chars": {
        "type": "integer"
      },
      "default_min_score": {
        "type": "number"
      },
      "default_top_k": {
        "type": "integer"
      },
      "description": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "name": {
        "type": "string"
      },
      "status": {
        "type": "integer"
      },
      "status_name": {
        "type": "string"
      },
      "updated_at": {
        "type": "string"
      }
    },
    "required": [
      "chunk_overlap_chars",
      "chunk_size_chars",
      "code",
      "created_at",
      "default_max_context_chars",
      "default_min_score",
      "default_top_k",
      "description",
      "id",
      "name",
      "status",
      "status_name",
      "updated_at"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_knowledge_BaseDetailResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "chunk_overlap_chars": {
        "type": "integer"
      },
      "chunk_size_chars": {
        "type": "integer"
      },
      "code": {
        "type": "string"
      },
      "created_at": {
        "type": "string"
      },
      "default_max_context_chars": {
        "type": "integer"
      },
      "default_min_score": {
        "type": "number"
      },
      "default_top_k": {
        "type": "integer"
      },
      "description": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "name": {
        "type": "string"
      },
      "status": {
        "type": "integer"
      },
      "status_name": {
        "type": "string"
      },
      "updated_at": {
        "type": "string"
      }
    },
    "required": [
      "chunk_overlap_chars",
      "chunk_size_chars",
      "code",
      "created_at",
      "default_max_context_chars",
      "default_min_score",
      "default_top_k",
      "description",
      "id",
      "name",
      "status",
      "status_name",
      "updated_at"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_knowledge_BaseListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_ai_knowledge_BaseDTO_Output"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_ai_knowledge_Page_Output"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_knowledge_ChunkDTO_Output": {
    "additionalProperties": false,
    "properties": {
      "chunk_index": {
        "type": "integer"
      },
      "content": {
        "type": "string"
      },
      "content_chars": {
        "type": "integer"
      },
      "created_at": {
        "type": "string"
      },
      "document_id": {
        "type": "integer"
      },
      "id": {
        "type": "integer"
      },
      "knowledge_base_id": {
        "type": "integer"
      },
      "status": {
        "type": "integer"
      },
      "status_name": {
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
      "chunk_index",
      "content",
      "content_chars",
      "created_at",
      "document_id",
      "id",
      "knowledge_base_id",
      "status",
      "status_name",
      "title",
      "updated_at"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_knowledge_ChunkListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_ai_knowledge_ChunkDTO_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "list"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_knowledge_DocumentDTO_Output": {
    "additionalProperties": false,
    "properties": {
      "created_at": {
        "type": "string"
      },
      "error_message": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "index_status": {
        "type": "string"
      },
      "index_status_name": {
        "type": "string"
      },
      "knowledge_base_id": {
        "type": "integer"
      },
      "last_indexed_at": {
        "type": "string"
      },
      "source_ref": {
        "type": "string"
      },
      "source_type": {
        "type": "string"
      },
      "source_type_name": {
        "type": "string"
      },
      "status": {
        "type": "integer"
      },
      "status_name": {
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
      "created_at",
      "error_message",
      "id",
      "index_status",
      "index_status_name",
      "knowledge_base_id",
      "last_indexed_at",
      "source_ref",
      "source_type",
      "source_type_name",
      "status",
      "status_name",
      "title",
      "updated_at"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_knowledge_DocumentDetailResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "content": {
        "type": "string"
      },
      "created_at": {
        "type": "string"
      },
      "error_message": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "index_status": {
        "type": "string"
      },
      "index_status_name": {
        "type": "string"
      },
      "knowledge_base_id": {
        "type": "integer"
      },
      "last_indexed_at": {
        "type": "string"
      },
      "source_ref": {
        "type": "string"
      },
      "source_type": {
        "type": "string"
      },
      "source_type_name": {
        "type": "string"
      },
      "status": {
        "type": "integer"
      },
      "status_name": {
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
      "content",
      "created_at",
      "error_message",
      "id",
      "index_status",
      "index_status_name",
      "knowledge_base_id",
      "last_indexed_at",
      "source_ref",
      "source_type",
      "source_type_name",
      "status",
      "status_name",
      "title",
      "updated_at"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_knowledge_DocumentListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_ai_knowledge_DocumentDTO_Output"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_ai_knowledge_Page_Output"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_knowledge_InitDict_Output": {
    "additionalProperties": false,
    "properties": {
      "common_status_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      },
      "index_status_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      },
      "source_type_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "common_status_arr",
      "index_status_arr",
      "source_type_arr"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_knowledge_InitResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/Go_internal_module_ai_knowledge_InitDict_Output"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_knowledge_KnowledgeBaseOption_Output": {
    "additionalProperties": false,
    "properties": {
      "default_max_context_chars": {
        "type": "integer"
      },
      "default_min_score": {
        "type": "number"
      },
      "default_top_k": {
        "type": "integer"
      },
      "description": {
        "type": "string"
      },
      "label": {
        "type": "string"
      },
      "value": {
        "type": "integer"
      }
    },
    "required": [
      "default_max_context_chars",
      "default_min_score",
      "default_top_k",
      "description",
      "label",
      "value"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_knowledge_Page_Output": {
    "additionalProperties": false,
    "properties": {
      "current_page": {
        "type": "integer"
      },
      "page_size": {
        "type": "integer"
      },
      "total": {
        "type": "integer"
      },
      "total_page": {
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
  "Go_internal_module_ai_knowledge_RetrievalHit_Output": {
    "additionalProperties": false,
    "properties": {
      "chunk_id": {
        "type": "integer"
      },
      "chunk_index": {
        "type": "integer"
      },
      "content": {
        "type": "string"
      },
      "content_chars": {
        "type": "integer"
      },
      "document_id": {
        "type": "integer"
      },
      "document_title": {
        "type": "string"
      },
      "knowledge_base_id": {
        "type": "integer"
      },
      "knowledge_base_name": {
        "type": "string"
      },
      "rank_no": {
        "type": "integer"
      },
      "score": {
        "type": "number"
      },
      "skip_reason": {
        "type": "string"
      },
      "status": {
        "type": "integer"
      }
    },
    "required": [
      "chunk_id",
      "chunk_index",
      "content",
      "content_chars",
      "document_id",
      "document_title",
      "knowledge_base_id",
      "knowledge_base_name",
      "rank_no",
      "score",
      "skip_reason",
      "status"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_knowledge_RetrievalResult_Output": {
    "additionalProperties": false,
    "properties": {
      "hits": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_ai_knowledge_RetrievalHit_Output"
        },
        "type": "array"
      },
      "query": {
        "type": "string"
      },
      "selected": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_ai_knowledge_SelectedHit_Output"
        },
        "type": "array"
      },
      "selected_hits": {
        "type": "integer"
      },
      "status": {
        "type": "string"
      },
      "total_hits": {
        "type": "integer"
      }
    },
    "required": [
      "hits",
      "query",
      "selected",
      "selected_hits",
      "status",
      "total_hits"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_knowledge_SelectedHit_Output": {
    "additionalProperties": false,
    "properties": {
      "chunk_id": {
        "type": "integer"
      },
      "chunk_index": {
        "type": "integer"
      },
      "content": {
        "type": "string"
      },
      "document_id": {
        "type": "integer"
      },
      "document_title": {
        "type": "string"
      },
      "knowledge_base_id": {
        "type": "integer"
      },
      "knowledge_base_name": {
        "type": "string"
      },
      "rank_no": {
        "type": "integer"
      },
      "ref": {
        "type": "string"
      },
      "score": {
        "type": "number"
      }
    },
    "required": [
      "chunk_id",
      "chunk_index",
      "content",
      "document_id",
      "document_title",
      "knowledge_base_id",
      "knowledge_base_name",
      "rank_no",
      "ref",
      "score"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_provider_InitDict_Output": {
    "additionalProperties": false,
    "properties": {
      "common_status_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      },
      "engine_type_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      },
      "health_status_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      },
      "model_sync_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "common_status_arr",
      "engine_type_arr",
      "health_status_arr",
      "model_sync_arr"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_provider_InitResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/Go_internal_module_ai_provider_InitDict_Output"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_provider_ListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_ai_provider_ProviderDTO_Output"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_ai_provider_Page_Output"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_provider_ModelOptionDTO_Output": {
    "additionalProperties": false,
    "properties": {
      "display_name": {
        "type": "string"
      },
      "model_id": {
        "type": "string"
      },
      "owned_by": {
        "type": "string"
      }
    },
    "required": [
      "display_name",
      "model_id",
      "owned_by"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_provider_ModelOptionsResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_ai_provider_ModelOptionDTO_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "list"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_provider_Page_Output": {
    "additionalProperties": false,
    "properties": {
      "current_page": {
        "type": "integer"
      },
      "page_size": {
        "type": "integer"
      },
      "total": {
        "type": "integer"
      },
      "total_page": {
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
  "Go_internal_module_ai_provider_ProviderDTO_Output": {
    "additionalProperties": false,
    "properties": {
      "api_key_masked": {
        "type": "string"
      },
      "base_url": {
        "type": "string"
      },
      "base_url_effective": {
        "type": "string"
      },
      "created_at": {
        "type": "string"
      },
      "enabled_model_count": {
        "type": "integer"
      },
      "engine_type": {
        "type": "string"
      },
      "engine_type_name": {
        "type": "string"
      },
      "health_status": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "last_check_error": {
        "type": "string"
      },
      "last_checked_at": {
        "type": "string"
      },
      "last_model_sync_at": {
        "type": "string"
      },
      "last_model_sync_error": {
        "type": "string"
      },
      "last_model_sync_status": {
        "type": "string"
      },
      "models": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_ai_provider_ProviderModelDTO_Output"
        },
        "type": "array"
      },
      "name": {
        "type": "string"
      },
      "status": {
        "type": "integer"
      },
      "status_name": {
        "type": "string"
      },
      "updated_at": {
        "type": "string"
      }
    },
    "required": [
      "api_key_masked",
      "base_url",
      "base_url_effective",
      "created_at",
      "enabled_model_count",
      "engine_type",
      "engine_type_name",
      "health_status",
      "id",
      "last_check_error",
      "last_checked_at",
      "last_model_sync_at",
      "last_model_sync_error",
      "last_model_sync_status",
      "models",
      "name",
      "status",
      "status_name",
      "updated_at"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_provider_ProviderModelDTO_Output": {
    "additionalProperties": false,
    "properties": {
      "created_at": {
        "type": "string"
      },
      "display_name": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "model_id": {
        "type": "string"
      },
      "provider_id": {
        "type": "integer"
      },
      "status": {
        "type": "integer"
      },
      "status_name": {
        "type": "string"
      },
      "updated_at": {
        "type": "string"
      }
    },
    "required": [
      "created_at",
      "display_name",
      "id",
      "model_id",
      "provider_id",
      "status",
      "status_name",
      "updated_at"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_provider_ProviderModelsResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_ai_provider_ProviderModelDTO_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "list"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_tool_AgentToolsResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "active_tool_ids": {
        "items": {
          "type": "integer"
        },
        "type": "array"
      },
      "agent_id": {
        "type": "integer"
      },
      "tool_ids": {
        "items": {
          "type": "integer"
        },
        "type": "array"
      }
    },
    "required": [
      "active_tool_ids",
      "agent_id",
      "tool_ids"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_tool_GenerateAgentOption_Output": {
    "additionalProperties": false,
    "properties": {
      "label": {
        "type": "string"
      },
      "value": {
        "type": "integer"
      }
    },
    "required": [
      "label",
      "value"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_tool_GenerateDraftResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "clarifying_questions": {
        "items": {
          "type": "string"
        },
        "type": "array"
      },
      "draft": {
        "anyOf": [
          {
            "$ref": "#/components/schemas/Go_internal_module_ai_tool_GeneratedToolDraft_Output"
          },
          {
            "type": "null"
          }
        ]
      },
      "ok": {
        "type": "boolean"
      },
      "usage": {
        "anyOf": [
          {
            "$ref": "#/components/schemas/Go_internal_module_ai_tool_GenerateUsage_Output"
          },
          {
            "type": "null"
          }
        ]
      },
      "warnings": {
        "items": {
          "type": "string"
        },
        "type": "array"
      }
    },
    "required": [
      "clarifying_questions",
      "draft",
      "ok",
      "warnings"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_tool_GeneratePageInitResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "agent_options": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_ai_tool_GenerateAgentOption_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "agent_options"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_tool_GenerateUsage_Output": {
    "additionalProperties": false,
    "properties": {
      "completion_tokens": {
        "type": "integer"
      },
      "prompt_tokens": {
        "type": "integer"
      },
      "total_tokens": {
        "type": "integer"
      }
    },
    "required": [
      "completion_tokens",
      "prompt_tokens",
      "total_tokens"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_tool_GeneratedToolDraft_Output": {
    "additionalProperties": false,
    "properties": {
      "code": {
        "type": "string"
      },
      "description": {
        "type": "string"
      },
      "name": {
        "type": "string"
      },
      "parameters_json": {},
      "result_schema_json": {},
      "risk_level": {
        "type": "string"
      },
      "status": {
        "type": "integer"
      },
      "timeout_ms": {
        "type": "integer"
      }
    },
    "required": [
      "code",
      "description",
      "name",
      "parameters_json",
      "result_schema_json",
      "risk_level",
      "status",
      "timeout_ms"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_tool_InitDict_Output": {
    "additionalProperties": false,
    "properties": {
      "common_status_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      },
      "risk_level_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "common_status_arr",
      "risk_level_arr"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_tool_InitResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/Go_internal_module_ai_tool_InitDict_Output"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_tool_ListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_ai_tool_ToolDTO_Output"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_ai_tool_Page_Output"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_ai_tool_Page_Output": {
    "additionalProperties": false,
    "properties": {
      "current_page": {
        "type": "integer"
      },
      "page_size": {
        "type": "integer"
      },
      "total": {
        "type": "integer"
      },
      "total_page": {
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
  "Go_internal_module_ai_tool_ToolDTO_Output": {
    "additionalProperties": false,
    "properties": {
      "code": {
        "type": "string"
      },
      "created_at": {
        "type": "string"
      },
      "description": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "name": {
        "type": "string"
      },
      "parameters_json": {},
      "result_schema_json": {},
      "risk_level": {
        "type": "string"
      },
      "risk_level_name": {
        "type": "string"
      },
      "status": {
        "type": "integer"
      },
      "status_name": {
        "type": "string"
      },
      "timeout_ms": {
        "type": "integer"
      },
      "updated_at": {
        "type": "string"
      }
    },
    "required": [
      "code",
      "created_at",
      "description",
      "id",
      "name",
      "parameters_json",
      "result_schema_json",
      "risk_level",
      "risk_level_name",
      "status",
      "status_name",
      "timeout_ms",
      "updated_at"
    ],
    "type": "object"
  },
  "Go_internal_module_auth_ChallengeResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "captcha_id": {
        "type": "string"
      },
      "captcha_type": {
        "type": "string"
      },
      "expires_in": {
        "type": "integer"
      },
      "image_height": {
        "type": "integer"
      },
      "image_width": {
        "type": "integer"
      },
      "master_image": {
        "type": "string"
      },
      "tile_height": {
        "type": "integer"
      },
      "tile_image": {
        "type": "string"
      },
      "tile_width": {
        "type": "integer"
      },
      "tile_x": {
        "type": "integer"
      },
      "tile_y": {
        "type": "integer"
      }
    },
    "required": [
      "captcha_id",
      "captcha_type",
      "expires_in",
      "image_height",
      "image_width",
      "master_image",
      "tile_height",
      "tile_image",
      "tile_width",
      "tile_x",
      "tile_y"
    ],
    "type": "object"
  },
  "Go_internal_module_auth_LoginConfigResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "allow_register": {
        "type": "boolean"
      },
      "captcha_enabled": {
        "type": "boolean"
      },
      "captcha_type": {
        "type": "string"
      },
      "login_type_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_auth_LoginTypeOption_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "allow_register",
      "captcha_enabled",
      "captcha_type",
      "login_type_arr"
    ],
    "type": "object"
  },
  "Go_internal_module_auth_LoginLogListItem_Output": {
    "additionalProperties": false,
    "properties": {
      "created_at": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "ip": {
        "type": "string"
      },
      "is_success": {
        "type": "integer"
      },
      "login_account": {
        "type": "string"
      },
      "login_type": {
        "type": "string"
      },
      "login_type_name": {
        "type": "string"
      },
      "platform": {
        "type": "string"
      },
      "platform_name": {
        "type": "string"
      },
      "reason": {
        "type": "string"
      },
      "ua": {
        "type": "string"
      },
      "user_id": {
        "anyOf": [
          {
            "type": "integer"
          },
          {
            "type": "null"
          }
        ]
      },
      "user_name": {
        "type": "string"
      }
    },
    "required": [
      "created_at",
      "id",
      "ip",
      "is_success",
      "login_account",
      "login_type",
      "login_type_name",
      "platform",
      "platform_name",
      "reason",
      "ua",
      "user_id",
      "user_name"
    ],
    "type": "object"
  },
  "Go_internal_module_auth_LoginLogListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_auth_LoginLogListItem_Output"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_auth_LoginLogPage_Output"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_auth_LoginLogPageInitDict_Output": {
    "additionalProperties": false,
    "properties": {
      "login_type_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      },
      "platformArr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "login_type_arr",
      "platformArr"
    ],
    "type": "object"
  },
  "Go_internal_module_auth_LoginLogPageInitResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/Go_internal_module_auth_LoginLogPageInitDict_Output"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "Go_internal_module_auth_LoginLogPage_Output": {
    "additionalProperties": false,
    "properties": {
      "current_page": {
        "type": "integer"
      },
      "page_size": {
        "type": "integer"
      },
      "total": {
        "type": "integer"
      },
      "total_page": {
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
  "Go_internal_module_auth_LoginTypeOption_Output": {
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
  "Go_internal_module_auth_SessionBatchRevokeResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "count": {
        "type": "integer"
      },
      "skipped_already_revoked": {
        "type": "integer"
      },
      "skipped_current": {
        "type": "integer"
      }
    },
    "required": [
      "count",
      "skipped_already_revoked",
      "skipped_current"
    ],
    "type": "object"
  },
  "Go_internal_module_auth_SessionListItem_Output": {
    "additionalProperties": false,
    "properties": {
      "created_at": {
        "type": "string"
      },
      "device_id": {
        "type": "string"
      },
      "expires_at": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "ip": {
        "type": "string"
      },
      "last_seen_at": {
        "type": "string"
      },
      "platform": {
        "type": "string"
      },
      "platform_name": {
        "type": "string"
      },
      "refresh_expires_at": {
        "type": "string"
      },
      "revoked_at": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "status": {
        "type": "string"
      },
      "ua": {
        "type": "string"
      },
      "user_id": {
        "type": "integer"
      },
      "username": {
        "type": "string"
      }
    },
    "required": [
      "created_at",
      "device_id",
      "expires_at",
      "id",
      "ip",
      "last_seen_at",
      "platform",
      "platform_name",
      "refresh_expires_at",
      "revoked_at",
      "status",
      "ua",
      "user_id",
      "username"
    ],
    "type": "object"
  },
  "Go_internal_module_auth_SessionListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_auth_SessionListItem_Output"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_auth_SessionPage_Output"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_auth_SessionOption_string_Output": {
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
  "Go_internal_module_auth_SessionPageInitDict_Output": {
    "additionalProperties": false,
    "properties": {
      "platformArr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_auth_SessionOption_string_Output"
        },
        "type": "array"
      },
      "statusArr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_auth_SessionOption_string_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "platformArr",
      "statusArr"
    ],
    "type": "object"
  },
  "Go_internal_module_auth_SessionPageInitResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/Go_internal_module_auth_SessionPageInitDict_Output"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "Go_internal_module_auth_SessionPage_Output": {
    "additionalProperties": false,
    "properties": {
      "current_page": {
        "type": "integer"
      },
      "page_size": {
        "type": "integer"
      },
      "total": {
        "type": "integer"
      },
      "total_page": {
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
  "Go_internal_module_auth_SessionRevokeResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "id": {
        "type": "integer"
      },
      "revoked": {
        "type": "boolean"
      }
    },
    "required": [
      "id",
      "revoked"
    ],
    "type": "object"
  },
  "Go_internal_module_auth_SessionStatsResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "platform_distribution": {
        "additionalProperties": {
          "type": "integer"
        },
        "type": "object"
      },
      "total_active": {
        "type": "integer"
      }
    },
    "required": [
      "platform_distribution",
      "total_active"
    ],
    "type": "object"
  },
  "Go_internal_module_auth_platform_InitDict_Output": {
    "additionalProperties": false,
    "properties": {
      "auth_platform_captcha_type_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      },
      "auth_platform_login_type_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      },
      "common_status_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "auth_platform_captcha_type_arr",
      "auth_platform_login_type_arr",
      "common_status_arr"
    ],
    "type": "object"
  },
  "Go_internal_module_auth_platform_InitResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/Go_internal_module_auth_platform_InitDict_Output"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "Go_internal_module_auth_platform_ListItem_Output": {
    "additionalProperties": false,
    "properties": {
      "access_ttl": {
        "type": "integer"
      },
      "allow_register": {
        "type": "integer"
      },
      "bind_device": {
        "type": "integer"
      },
      "bind_ip": {
        "type": "integer"
      },
      "bind_platform": {
        "type": "integer"
      },
      "captcha_type": {
        "type": "string"
      },
      "code": {
        "type": "string"
      },
      "created_at": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "login_types": {
        "items": {
          "type": "string"
        },
        "type": "array"
      },
      "max_sessions": {
        "type": "integer"
      },
      "name": {
        "type": "string"
      },
      "refresh_ttl": {
        "type": "integer"
      },
      "status": {
        "type": "integer"
      },
      "status_name": {
        "type": "string"
      },
      "updated_at": {
        "type": "string"
      }
    },
    "required": [
      "access_ttl",
      "allow_register",
      "bind_device",
      "bind_ip",
      "bind_platform",
      "captcha_type",
      "code",
      "created_at",
      "id",
      "login_types",
      "max_sessions",
      "name",
      "refresh_ttl",
      "status",
      "status_name",
      "updated_at"
    ],
    "type": "object"
  },
  "Go_internal_module_auth_platform_ListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_auth_platform_ListItem_Output"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_auth_platform_Page_Output"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_auth_platform_Page_Output": {
    "additionalProperties": false,
    "properties": {
      "current_page": {
        "type": "integer"
      },
      "page_size": {
        "type": "integer"
      },
      "total": {
        "type": "integer"
      },
      "total_page": {
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
  "Go_internal_module_auth_transport_admin_CredentialResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "access_token": {
        "type": "string"
      },
      "expires_in": {
        "type": "integer"
      }
    },
    "required": [
      "access_token",
      "expires_in"
    ],
    "type": "object"
  },
  "Go_internal_module_crontask_InitDict_Output": {
    "additionalProperties": false,
    "properties": {
      "cron_preset_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      },
      "cron_task_log_status_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      },
      "cron_task_status_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "cron_preset_arr",
      "cron_task_log_status_arr",
      "cron_task_status_arr"
    ],
    "type": "object"
  },
  "Go_internal_module_crontask_InitResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/Go_internal_module_crontask_InitDict_Output"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "Go_internal_module_crontask_ListItem_Output": {
    "additionalProperties": false,
    "properties": {
      "created_at": {
        "type": "string"
      },
      "cron": {
        "type": "string"
      },
      "cron_readable": {
        "type": "string"
      },
      "description": {
        "type": "string"
      },
      "handler": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "name": {
        "type": "string"
      },
      "next_run_time": {
        "type": "string"
      },
      "status": {
        "type": "integer"
      },
      "status_name": {
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
      "created_at",
      "cron",
      "cron_readable",
      "description",
      "handler",
      "id",
      "name",
      "next_run_time",
      "status",
      "status_name",
      "title",
      "updated_at"
    ],
    "type": "object"
  },
  "Go_internal_module_crontask_ListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_crontask_ListItem_Output"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_crontask_Page_Output"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_crontask_LogItem_Output": {
    "additionalProperties": false,
    "properties": {
      "created_at": {
        "type": "string"
      },
      "duration_ms": {
        "anyOf": [
          {
            "type": "integer"
          },
          {
            "type": "null"
          }
        ]
      },
      "end_time": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
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
      "id": {
        "type": "integer"
      },
      "result": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "start_time": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "status": {
        "type": "integer"
      },
      "status_name": {
        "type": "string"
      },
      "task_id": {
        "type": "integer"
      },
      "task_name": {
        "type": "string"
      }
    },
    "required": [
      "created_at",
      "duration_ms",
      "end_time",
      "error_msg",
      "id",
      "result",
      "start_time",
      "status",
      "status_name",
      "task_id",
      "task_name"
    ],
    "type": "object"
  },
  "Go_internal_module_crontask_LogsResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_crontask_LogItem_Output"
        },
        "type": "array"
      },
      "next_id": {
        "type": "integer"
      },
      "next_time": {
        "type": "string"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_crontask_Page_Output"
      }
    },
    "required": [
      "list",
      "next_id",
      "next_time",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_crontask_Page_Output": {
    "additionalProperties": false,
    "properties": {
      "current_page": {
        "type": "integer"
      },
      "page_size": {
        "type": "integer"
      },
      "total": {
        "type": "integer"
      },
      "total_page": {
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
  "Go_internal_module_mail_ConfigResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "configured": {
        "type": "boolean"
      },
      "created_at": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "endpoint": {
        "type": "string"
      },
      "from_email": {
        "type": "string"
      },
      "from_name": {
        "type": "string"
      },
      "id": {
        "anyOf": [
          {
            "type": "integer"
          },
          {
            "type": "null"
          }
        ]
      },
      "last_test_at": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "last_test_error": {
        "type": "string"
      },
      "region": {
        "type": "string"
      },
      "reply_to": {
        "type": "string"
      },
      "secret_id_hint": {
        "type": "string"
      },
      "secret_key_hint": {
        "type": "string"
      },
      "status": {
        "type": "integer"
      },
      "updated_at": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "verify_code_ttl_minutes": {
        "type": "integer"
      }
    },
    "required": [
      "configured",
      "created_at",
      "endpoint",
      "from_email",
      "from_name",
      "id",
      "last_test_at",
      "last_test_error",
      "region",
      "reply_to",
      "secret_id_hint",
      "secret_key_hint",
      "status",
      "updated_at",
      "verify_code_ttl_minutes"
    ],
    "type": "object"
  },
  "Go_internal_module_mail_LogDTO_Output": {
    "additionalProperties": false,
    "properties": {
      "created_at": {
        "type": "string"
      },
      "duration_ms": {
        "type": "integer"
      },
      "error_code": {
        "type": "string"
      },
      "error_message": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "scene": {
        "type": "string"
      },
      "sent_at": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "status": {
        "type": "integer"
      },
      "subject": {
        "type": "string"
      },
      "template": {
        "anyOf": [
          {
            "$ref": "#/components/schemas/Go_internal_module_mail_LogTemplateDTO_Output"
          },
          {
            "type": "null"
          }
        ]
      },
      "template_id": {
        "anyOf": [
          {
            "type": "integer"
          },
          {
            "type": "null"
          }
        ]
      },
      "tencent_message_id": {
        "type": "string"
      },
      "tencent_request_id": {
        "type": "string"
      },
      "to_email": {
        "type": "string"
      },
      "updated_at": {
        "type": "string"
      }
    },
    "required": [
      "created_at",
      "duration_ms",
      "error_code",
      "error_message",
      "id",
      "scene",
      "sent_at",
      "status",
      "subject",
      "template_id",
      "tencent_message_id",
      "tencent_request_id",
      "to_email",
      "updated_at"
    ],
    "type": "object"
  },
  "Go_internal_module_mail_LogListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_mail_LogDTO_Output"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_mail_Page_Output"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_mail_LogTemplateDTO_Output": {
    "additionalProperties": false,
    "properties": {
      "id": {
        "type": "integer"
      },
      "name": {
        "type": "string"
      },
      "scene": {
        "type": "string"
      },
      "status": {
        "type": "integer"
      },
      "tencent_template_id": {
        "type": "integer"
      },
      "variables": {
        "items": {
          "type": "string"
        },
        "type": "array"
      }
    },
    "required": [
      "id",
      "name",
      "scene",
      "status",
      "tencent_template_id",
      "variables"
    ],
    "type": "object"
  },
  "Go_internal_module_mail_PageInitDict_Output": {
    "additionalProperties": false,
    "properties": {
      "common_status_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      },
      "default_endpoint": {
        "type": "string"
      },
      "default_region": {
        "type": "string"
      },
      "default_ttl_minutes": {
        "type": "integer"
      },
      "mail_log_scene_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      },
      "mail_log_status_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      },
      "mail_region_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      },
      "mail_scene_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "common_status_arr",
      "default_endpoint",
      "default_region",
      "default_ttl_minutes",
      "mail_log_scene_arr",
      "mail_log_status_arr",
      "mail_region_arr",
      "mail_scene_arr"
    ],
    "type": "object"
  },
  "Go_internal_module_mail_PageInitResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/Go_internal_module_mail_PageInitDict_Output"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "Go_internal_module_mail_Page_Output": {
    "additionalProperties": false,
    "properties": {
      "current_page": {
        "type": "integer"
      },
      "page_size": {
        "type": "integer"
      },
      "total": {
        "type": "integer"
      },
      "total_page": {
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
  "Go_internal_module_mail_TemplateDTO_Output": {
    "additionalProperties": false,
    "properties": {
      "created_at": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "name": {
        "type": "string"
      },
      "sample_variables": {
        "additionalProperties": {
          "type": "string"
        },
        "type": "object"
      },
      "scene": {
        "type": "string"
      },
      "status": {
        "type": "integer"
      },
      "subject": {
        "type": "string"
      },
      "tencent_template_id": {
        "type": "integer"
      },
      "updated_at": {
        "type": "string"
      },
      "variables": {
        "items": {
          "type": "string"
        },
        "type": "array"
      }
    },
    "required": [
      "created_at",
      "id",
      "name",
      "sample_variables",
      "scene",
      "status",
      "subject",
      "tencent_template_id",
      "updated_at",
      "variables"
    ],
    "type": "object"
  },
  "Go_internal_module_notification_task_CreateResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "id": {
        "type": "integer"
      },
      "queued": {
        "type": "boolean"
      }
    },
    "required": [
      "id",
      "queued"
    ],
    "type": "object"
  },
  "Go_internal_module_notification_task_InitDict_Output": {
    "additionalProperties": false,
    "properties": {
      "notification_level_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      },
      "notification_target_type_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      },
      "notification_task_status_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      },
      "notification_type_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      },
      "platformArr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "notification_level_arr",
      "notification_target_type_arr",
      "notification_task_status_arr",
      "notification_type_arr",
      "platformArr"
    ],
    "type": "object"
  },
  "Go_internal_module_notification_task_InitResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/Go_internal_module_notification_task_InitDict_Output"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "Go_internal_module_notification_task_ListItem_Output": {
    "additionalProperties": false,
    "properties": {
      "content": {
        "type": "string"
      },
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
      "id": {
        "type": "integer"
      },
      "level": {
        "type": "integer"
      },
      "level_text": {
        "type": "string"
      },
      "link": {
        "type": "string"
      },
      "platform": {
        "type": "string"
      },
      "platform_text": {
        "type": "string"
      },
      "send_at": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "sent_count": {
        "type": "integer"
      },
      "status": {
        "type": "integer"
      },
      "status_text": {
        "type": "string"
      },
      "target_type": {
        "type": "integer"
      },
      "target_type_text": {
        "type": "string"
      },
      "title": {
        "type": "string"
      },
      "total_count": {
        "type": "integer"
      },
      "type": {
        "type": "integer"
      },
      "type_text": {
        "type": "string"
      }
    },
    "required": [
      "content",
      "created_at",
      "error_msg",
      "id",
      "level",
      "level_text",
      "link",
      "platform",
      "platform_text",
      "send_at",
      "sent_count",
      "status",
      "status_text",
      "target_type",
      "target_type_text",
      "title",
      "total_count",
      "type",
      "type_text"
    ],
    "type": "object"
  },
  "Go_internal_module_notification_task_ListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_notification_task_ListItem_Output"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_notification_task_Page_Output"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_notification_task_Page_Output": {
    "additionalProperties": false,
    "properties": {
      "current_page": {
        "type": "integer"
      },
      "page_size": {
        "type": "integer"
      },
      "total": {
        "type": "integer"
      },
      "total_page": {
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
  "Go_internal_module_notification_task_StatusCountItem_Output": {
    "additionalProperties": false,
    "properties": {
      "label": {
        "type": "string"
      },
      "num": {
        "type": "integer"
      },
      "value": {
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
  "Go_internal_module_operationlog_InitResponse_Output": {
    "additionalProperties": false,
    "properties": {},
    "type": "object"
  },
  "Go_internal_module_operationlog_ListItem_Output": {
    "additionalProperties": false,
    "properties": {
      "action": {
        "type": "string"
      },
      "created_at": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "is_success": {
        "type": "integer"
      },
      "request_data": {
        "type": "string"
      },
      "response_data": {
        "type": "string"
      },
      "user_email": {
        "type": "string"
      },
      "user_name": {
        "type": "string"
      }
    },
    "required": [
      "action",
      "created_at",
      "id",
      "is_success",
      "request_data",
      "response_data",
      "user_email",
      "user_name"
    ],
    "type": "object"
  },
  "Go_internal_module_operationlog_ListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_operationlog_ListItem_Output"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_operationlog_Page_Output"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_operationlog_Page_Output": {
    "additionalProperties": false,
    "properties": {
      "current_page": {
        "type": "integer"
      },
      "page_size": {
        "type": "integer"
      },
      "total": {
        "type": "integer"
      },
      "total_page": {
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
  "Go_internal_module_payment_CertificateUploadResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "file_name": {
        "type": "string"
      },
      "path": {
        "type": "string"
      },
      "sha256": {
        "type": "string"
      },
      "size": {
        "type": "integer"
      }
    },
    "required": [
      "file_name",
      "path",
      "sha256",
      "size"
    ],
    "type": "object"
  },
  "Go_internal_module_payment_ConfigListItem_Output": {
    "additionalProperties": false,
    "properties": {
      "app_cert_path": {
        "type": "string"
      },
      "app_id": {
        "type": "string"
      },
      "code": {
        "type": "string"
      },
      "created_at": {
        "type": "string"
      },
      "enabled_methods": {
        "items": {
          "type": "string"
        },
        "type": "array"
      },
      "enabled_methods_text": {
        "type": "string"
      },
      "environment": {
        "type": "string"
      },
      "environment_text": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "name": {
        "type": "string"
      },
      "notify_url": {
        "type": "string"
      },
      "platform_cert_path": {
        "type": "string"
      },
      "private_key_hint": {
        "type": "string"
      },
      "provider": {
        "type": "string"
      },
      "provider_text": {
        "type": "string"
      },
      "remark": {
        "type": "string"
      },
      "root_cert_path": {
        "type": "string"
      },
      "sort": {
        "type": "integer"
      },
      "status": {
        "type": "integer"
      },
      "status_text": {
        "type": "string"
      },
      "updated_at": {
        "type": "string"
      }
    },
    "required": [
      "app_cert_path",
      "app_id",
      "code",
      "created_at",
      "enabled_methods",
      "enabled_methods_text",
      "environment",
      "environment_text",
      "id",
      "name",
      "notify_url",
      "platform_cert_path",
      "private_key_hint",
      "provider",
      "provider_text",
      "remark",
      "root_cert_path",
      "sort",
      "status",
      "status_text",
      "updated_at"
    ],
    "type": "object"
  },
  "Go_internal_module_payment_ConfigListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_payment_ConfigListItem_Output"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_payment_Page_Output"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_payment_ConfigPageInitDict_Output": {
    "additionalProperties": false,
    "properties": {
      "certificate_type_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      },
      "common_status_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      },
      "enabled_method_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      },
      "environment_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      },
      "provider_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "certificate_type_arr",
      "common_status_arr",
      "enabled_method_arr",
      "environment_arr",
      "provider_arr"
    ],
    "type": "object"
  },
  "Go_internal_module_payment_ConfigPageInitResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/Go_internal_module_payment_ConfigPageInitDict_Output"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "Go_internal_module_payment_ConfigTestResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "checks": {
        "items": {
          "type": "string"
        },
        "type": "array"
      },
      "message": {
        "type": "string"
      },
      "ok": {
        "type": "boolean"
      }
    },
    "required": [
      "checks",
      "message",
      "ok"
    ],
    "type": "object"
  },
  "Go_internal_module_payment_Page_Output": {
    "additionalProperties": false,
    "properties": {
      "current_page": {
        "type": "integer"
      },
      "page_size": {
        "type": "integer"
      },
      "total": {
        "type": "integer"
      },
      "total_page": {
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
  "Go_internal_module_payment_RechargeDetail_Output": {
    "additionalProperties": false,
    "properties": {
      "alipay_trade_no": {
        "type": "string"
      },
      "amount_cents": {
        "type": "integer"
      },
      "amount_text": {
        "type": "string"
      },
      "created_at": {
        "type": "string"
      },
      "credited_at": {
        "type": "string"
      },
      "failure_reason": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "package_code": {
        "type": "string"
      },
      "package_name": {
        "type": "string"
      },
      "paid_at": {
        "type": "string"
      },
      "pay_url": {
        "type": "string"
      },
      "payment_order_no": {
        "type": "string"
      },
      "recharge_no": {
        "type": "string"
      },
      "status": {
        "type": "string"
      },
      "status_text": {
        "type": "string"
      },
      "updated_at": {
        "type": "string"
      }
    },
    "required": [
      "alipay_trade_no",
      "amount_cents",
      "amount_text",
      "created_at",
      "credited_at",
      "failure_reason",
      "id",
      "package_code",
      "package_name",
      "paid_at",
      "pay_url",
      "payment_order_no",
      "recharge_no",
      "status",
      "status_text",
      "updated_at"
    ],
    "type": "object"
  },
  "Go_internal_module_payment_RechargeListItem_Output": {
    "additionalProperties": false,
    "properties": {
      "amount_cents": {
        "type": "integer"
      },
      "amount_text": {
        "type": "string"
      },
      "created_at": {
        "type": "string"
      },
      "credited_at": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "package_code": {
        "type": "string"
      },
      "package_name": {
        "type": "string"
      },
      "paid_at": {
        "type": "string"
      },
      "pay_url": {
        "type": "string"
      },
      "payment_order_no": {
        "type": "string"
      },
      "recharge_no": {
        "type": "string"
      },
      "status": {
        "type": "string"
      },
      "status_text": {
        "type": "string"
      },
      "updated_at": {
        "type": "string"
      }
    },
    "required": [
      "amount_cents",
      "amount_text",
      "created_at",
      "credited_at",
      "id",
      "package_code",
      "package_name",
      "paid_at",
      "pay_url",
      "payment_order_no",
      "recharge_no",
      "status",
      "status_text",
      "updated_at"
    ],
    "type": "object"
  },
  "Go_internal_module_payment_RechargeListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_payment_RechargeListItem_Output"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_payment_Page_Output"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_payment_RechargePackageItem_Output": {
    "additionalProperties": false,
    "properties": {
      "amount_cents": {
        "type": "integer"
      },
      "amount_text": {
        "type": "string"
      },
      "badge": {
        "type": "string"
      },
      "code": {
        "type": "string"
      },
      "name": {
        "type": "string"
      }
    },
    "required": [
      "amount_cents",
      "amount_text",
      "badge",
      "code",
      "name"
    ],
    "type": "object"
  },
  "Go_internal_module_payment_RechargePageInitDict_Output": {
    "additionalProperties": false,
    "properties": {
      "status_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "status_arr"
    ],
    "type": "object"
  },
  "Go_internal_module_payment_RechargePageInitResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/Go_internal_module_payment_RechargePageInitDict_Output"
      },
      "packages": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_payment_RechargePackageItem_Output"
        },
        "type": "array"
      },
      "payment_method": {
        "$ref": "#/components/schemas/Go_internal_module_payment_RechargePaymentMethod_Output"
      },
      "recent": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_payment_RechargeListItem_Output"
        },
        "type": "array"
      },
      "wallet": {
        "$ref": "#/components/schemas/Go_internal_module_payment_WalletSummary_Output"
      }
    },
    "required": [
      "dict",
      "packages",
      "payment_method",
      "recent",
      "wallet"
    ],
    "type": "object"
  },
  "Go_internal_module_payment_RechargePayResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "id": {
        "type": "integer"
      },
      "pay_url": {
        "type": "string"
      },
      "payment_order_no": {
        "type": "string"
      },
      "recharge_no": {
        "type": "string"
      },
      "status": {
        "type": "string"
      }
    },
    "required": [
      "id",
      "pay_url",
      "payment_order_no",
      "recharge_no",
      "status"
    ],
    "type": "object"
  },
  "Go_internal_module_payment_RechargePaymentMethod_Output": {
    "additionalProperties": false,
    "properties": {
      "enabled": {
        "type": "boolean"
      },
      "label": {
        "type": "string"
      },
      "provider": {
        "type": "string"
      }
    },
    "required": [
      "enabled",
      "label",
      "provider"
    ],
    "type": "object"
  },
  "Go_internal_module_payment_WalletSummary_Output": {
    "additionalProperties": false,
    "properties": {
      "balance_cents": {
        "type": "integer"
      },
      "balance_text": {
        "type": "string"
      },
      "total_consume_cents": {
        "type": "integer"
      },
      "total_consume_text": {
        "type": "string"
      },
      "total_recharge_cents": {
        "type": "integer"
      },
      "total_recharge_text": {
        "type": "string"
      }
    },
    "required": [
      "balance_cents",
      "balance_text",
      "total_consume_cents",
      "total_consume_text",
      "total_recharge_cents",
      "total_recharge_text"
    ],
    "type": "object"
  },
  "Go_internal_module_payment_wallet_LedgerPageInitResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/Go_internal_module_payment_wallet_WalletDict_Output"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "Go_internal_module_payment_wallet_Page_Output": {
    "additionalProperties": false,
    "properties": {
      "current_page": {
        "type": "integer"
      },
      "page_size": {
        "type": "integer"
      },
      "total": {
        "type": "integer"
      },
      "total_page": {
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
  "Go_internal_module_payment_wallet_SummaryResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "balance_cents": {
        "type": "integer"
      },
      "balance_text": {
        "type": "string"
      },
      "total_consume_cents": {
        "type": "integer"
      },
      "total_consume_text": {
        "type": "string"
      },
      "total_recharge_cents": {
        "type": "integer"
      },
      "total_recharge_text": {
        "type": "string"
      }
    },
    "required": [
      "balance_cents",
      "balance_text",
      "total_consume_cents",
      "total_consume_text",
      "total_recharge_cents",
      "total_recharge_text"
    ],
    "type": "object"
  },
  "Go_internal_module_payment_wallet_TransactionItem_Output": {
    "additionalProperties": false,
    "properties": {
      "account": {
        "type": "string"
      },
      "amount_cents": {
        "type": "integer"
      },
      "amount_text": {
        "type": "string"
      },
      "balance_after_cents": {
        "type": "integer"
      },
      "balance_after_text": {
        "type": "string"
      },
      "balance_before_cents": {
        "type": "integer"
      },
      "balance_before_text": {
        "type": "string"
      },
      "created_at": {
        "type": "string"
      },
      "direction": {
        "type": "string"
      },
      "direction_text": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "remark": {
        "type": "string"
      },
      "source_id": {
        "type": "integer"
      },
      "source_type": {
        "type": "string"
      },
      "source_type_text": {
        "type": "string"
      },
      "transaction_no": {
        "type": "string"
      },
      "user_id": {
        "type": "integer"
      },
      "username": {
        "type": "string"
      }
    },
    "required": [
      "account",
      "amount_cents",
      "amount_text",
      "balance_after_cents",
      "balance_after_text",
      "balance_before_cents",
      "balance_before_text",
      "created_at",
      "direction",
      "direction_text",
      "id",
      "remark",
      "source_id",
      "source_type",
      "source_type_text",
      "transaction_no",
      "user_id",
      "username"
    ],
    "type": "object"
  },
  "Go_internal_module_payment_wallet_TransactionListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_payment_wallet_TransactionItem_Output"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_payment_wallet_Page_Output"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_payment_wallet_WalletDict_Output": {
    "additionalProperties": false,
    "properties": {
      "direction_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      },
      "source_type_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "direction_arr",
      "source_type_arr"
    ],
    "type": "object"
  },
  "Go_internal_module_payment_wallet_WalletUserItem_Output": {
    "additionalProperties": false,
    "properties": {
      "account": {
        "type": "string"
      },
      "balance_cents": {
        "type": "integer"
      },
      "balance_text": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "total_consume_cents": {
        "type": "integer"
      },
      "total_consume_text": {
        "type": "string"
      },
      "total_recharge_cents": {
        "type": "integer"
      },
      "total_recharge_text": {
        "type": "string"
      },
      "updated_at": {
        "type": "string"
      },
      "user_id": {
        "type": "integer"
      },
      "username": {
        "type": "string"
      },
      "wallet_id": {
        "type": "integer"
      }
    },
    "required": [
      "account",
      "balance_cents",
      "balance_text",
      "id",
      "total_consume_cents",
      "total_consume_text",
      "total_recharge_cents",
      "total_recharge_text",
      "updated_at",
      "user_id",
      "username",
      "wallet_id"
    ],
    "type": "object"
  },
  "Go_internal_module_payment_wallet_WalletUserListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_payment_wallet_WalletUserItem_Output"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_payment_wallet_Page_Output"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_payment_wallet_WalletUsersPageInitResponse_Output": {
    "additionalProperties": false,
    "properties": {},
    "type": "object"
  },
  "Go_internal_module_permission_InitResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/Go_internal_module_permission_PermissionDict_Output"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "Go_internal_module_permission_PermissionDict_Output": {
    "additionalProperties": false,
    "properties": {
      "permission_platform_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      },
      "permission_tree": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_permission_PermissionTreeNode_Output"
        },
        "type": "array"
      },
      "permission_type_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "permission_platform_arr",
      "permission_tree",
      "permission_type_arr"
    ],
    "type": "object"
  },
  "Go_internal_module_permission_PermissionListItem_Output": {
    "additionalProperties": false,
    "properties": {
      "children": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_permission_PermissionListItem_Output"
        },
        "type": "array"
      },
      "code": {
        "type": "string"
      },
      "component": {
        "type": "string"
      },
      "i18n_key": {
        "type": "string"
      },
      "icon": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "name": {
        "type": "string"
      },
      "parent_id": {
        "type": "integer"
      },
      "path": {
        "type": "string"
      },
      "show_menu": {
        "type": "integer"
      },
      "sort": {
        "type": "integer"
      },
      "status": {
        "type": "integer"
      },
      "type": {
        "type": "integer"
      },
      "type_name": {
        "type": "string"
      }
    },
    "required": [
      "code",
      "component",
      "i18n_key",
      "icon",
      "id",
      "name",
      "parent_id",
      "path",
      "show_menu",
      "sort",
      "status",
      "type",
      "type_name"
    ],
    "type": "object"
  },
  "Go_internal_module_permission_PermissionTreeNode_Output": {
    "additionalProperties": false,
    "properties": {
      "children": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_permission_PermissionTreeNode_Output"
        },
        "type": "array"
      },
      "code": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "label": {
        "type": "string"
      },
      "parent_id": {
        "type": "integer"
      },
      "platform": {
        "type": "string"
      },
      "type": {
        "type": "integer"
      },
      "value": {
        "type": "integer"
      }
    },
    "required": [
      "id",
      "label",
      "parent_id",
      "platform",
      "type",
      "value"
    ],
    "type": "object"
  },
  "Go_internal_module_role_InitDict_Output": {
    "additionalProperties": false,
    "properties": {
      "permission_platform_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      },
      "permission_tree": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_permission_PermissionTreeNode_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "permission_platform_arr",
      "permission_tree"
    ],
    "type": "object"
  },
  "Go_internal_module_role_InitResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/Go_internal_module_role_InitDict_Output"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "Go_internal_module_role_ListItem_Output": {
    "additionalProperties": false,
    "properties": {
      "created_at": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "is_default": {
        "type": "integer"
      },
      "name": {
        "type": "string"
      },
      "permission_id": {
        "items": {
          "type": "integer"
        },
        "type": "array"
      },
      "updated_at": {
        "type": "string"
      }
    },
    "required": [
      "created_at",
      "id",
      "is_default",
      "name",
      "permission_id",
      "updated_at"
    ],
    "type": "object"
  },
  "Go_internal_module_role_ListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_role_ListItem_Output"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_role_Page_Output"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_role_Page_Output": {
    "additionalProperties": false,
    "properties": {
      "current_page": {
        "type": "integer"
      },
      "page_size": {
        "type": "integer"
      },
      "total": {
        "type": "integer"
      },
      "total_page": {
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
  "Go_internal_module_sms_ConfigResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "configured": {
        "type": "boolean"
      },
      "created_at": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "endpoint": {
        "type": "string"
      },
      "id": {
        "anyOf": [
          {
            "type": "integer"
          },
          {
            "type": "null"
          }
        ]
      },
      "last_test_at": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "last_test_error": {
        "type": "string"
      },
      "region": {
        "type": "string"
      },
      "secret_id_hint": {
        "type": "string"
      },
      "secret_key_hint": {
        "type": "string"
      },
      "sign_name": {
        "type": "string"
      },
      "sms_sdk_app_id": {
        "type": "string"
      },
      "status": {
        "type": "integer"
      },
      "updated_at": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "verify_code_ttl_minutes": {
        "type": "integer"
      }
    },
    "required": [
      "configured",
      "created_at",
      "endpoint",
      "id",
      "last_test_at",
      "last_test_error",
      "region",
      "secret_id_hint",
      "secret_key_hint",
      "sign_name",
      "sms_sdk_app_id",
      "status",
      "updated_at",
      "verify_code_ttl_minutes"
    ],
    "type": "object"
  },
  "Go_internal_module_sms_LogDTO_Output": {
    "additionalProperties": false,
    "properties": {
      "created_at": {
        "type": "string"
      },
      "duration_ms": {
        "type": "integer"
      },
      "error_code": {
        "type": "string"
      },
      "error_message": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "scene": {
        "type": "string"
      },
      "sent_at": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "status": {
        "type": "integer"
      },
      "template": {
        "anyOf": [
          {
            "$ref": "#/components/schemas/Go_internal_module_sms_LogTemplateDTO_Output"
          },
          {
            "type": "null"
          }
        ]
      },
      "template_id": {
        "anyOf": [
          {
            "type": "integer"
          },
          {
            "type": "null"
          }
        ]
      },
      "tencent_fee": {
        "type": "integer"
      },
      "tencent_request_id": {
        "type": "string"
      },
      "tencent_serial_no": {
        "type": "string"
      },
      "to_phone": {
        "type": "string"
      },
      "updated_at": {
        "type": "string"
      }
    },
    "required": [
      "created_at",
      "duration_ms",
      "error_code",
      "error_message",
      "id",
      "scene",
      "sent_at",
      "status",
      "template_id",
      "tencent_fee",
      "tencent_request_id",
      "tencent_serial_no",
      "to_phone",
      "updated_at"
    ],
    "type": "object"
  },
  "Go_internal_module_sms_LogListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_sms_LogDTO_Output"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_sms_Page_Output"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_sms_LogTemplateDTO_Output": {
    "additionalProperties": false,
    "properties": {
      "id": {
        "type": "integer"
      },
      "name": {
        "type": "string"
      },
      "scene": {
        "type": "string"
      },
      "status": {
        "type": "integer"
      },
      "tencent_template_id": {
        "type": "string"
      },
      "variables": {
        "items": {
          "type": "string"
        },
        "type": "array"
      }
    },
    "required": [
      "id",
      "name",
      "scene",
      "status",
      "tencent_template_id",
      "variables"
    ],
    "type": "object"
  },
  "Go_internal_module_sms_PageInitDict_Output": {
    "additionalProperties": false,
    "properties": {
      "common_status_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      },
      "default_endpoint": {
        "type": "string"
      },
      "default_region": {
        "type": "string"
      },
      "default_ttl_minutes": {
        "type": "integer"
      },
      "sms_log_scene_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      },
      "sms_log_status_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      },
      "sms_region_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      },
      "sms_scene_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "common_status_arr",
      "default_endpoint",
      "default_region",
      "default_ttl_minutes",
      "sms_log_scene_arr",
      "sms_log_status_arr",
      "sms_region_arr",
      "sms_scene_arr"
    ],
    "type": "object"
  },
  "Go_internal_module_sms_PageInitResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/Go_internal_module_sms_PageInitDict_Output"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "Go_internal_module_sms_Page_Output": {
    "additionalProperties": false,
    "properties": {
      "current_page": {
        "type": "integer"
      },
      "page_size": {
        "type": "integer"
      },
      "total": {
        "type": "integer"
      },
      "total_page": {
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
  "Go_internal_module_sms_TemplateDTO_Output": {
    "additionalProperties": false,
    "properties": {
      "created_at": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "name": {
        "type": "string"
      },
      "sample_variables": {
        "additionalProperties": {
          "type": "string"
        },
        "type": "object"
      },
      "scene": {
        "type": "string"
      },
      "status": {
        "type": "integer"
      },
      "tencent_template_id": {
        "type": "string"
      },
      "updated_at": {
        "type": "string"
      },
      "variables": {
        "items": {
          "type": "string"
        },
        "type": "array"
      }
    },
    "required": [
      "created_at",
      "id",
      "name",
      "sample_variables",
      "scene",
      "status",
      "tencent_template_id",
      "updated_at",
      "variables"
    ],
    "type": "object"
  },
  "Go_internal_module_systemlog_FileItem_Output": {
    "additionalProperties": false,
    "properties": {
      "mtime": {
        "type": "string"
      },
      "name": {
        "type": "string"
      },
      "size": {
        "type": "integer"
      },
      "size_human": {
        "type": "string"
      }
    },
    "required": [
      "mtime",
      "name",
      "size",
      "size_human"
    ],
    "type": "object"
  },
  "Go_internal_module_systemlog_FilesResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_systemlog_FileItem_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "list"
    ],
    "type": "object"
  },
  "Go_internal_module_systemlog_InitDict_Output": {
    "additionalProperties": false,
    "properties": {
      "log_level_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      },
      "log_tail_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "log_level_arr",
      "log_tail_arr"
    ],
    "type": "object"
  },
  "Go_internal_module_systemlog_InitResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/Go_internal_module_systemlog_InitDict_Output"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "Go_internal_module_systemlog_LineItem_Output": {
    "additionalProperties": false,
    "properties": {
      "content": {
        "type": "string"
      },
      "level": {
        "type": "string"
      },
      "number": {
        "type": "integer"
      }
    },
    "required": [
      "content",
      "level",
      "number"
    ],
    "type": "object"
  },
  "Go_internal_module_systemlog_LinesResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "filename": {
        "type": "string"
      },
      "lines": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_systemlog_LineItem_Output"
        },
        "type": "array"
      },
      "total": {
        "type": "integer"
      }
    },
    "required": [
      "filename",
      "lines",
      "total"
    ],
    "type": "object"
  },
  "Go_internal_module_systemsetting_InitDict_Output": {
    "additionalProperties": false,
    "properties": {
      "system_setting_value_type_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "system_setting_value_type_arr"
    ],
    "type": "object"
  },
  "Go_internal_module_systemsetting_InitResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/Go_internal_module_systemsetting_InitDict_Output"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "Go_internal_module_systemsetting_ListItem_Output": {
    "additionalProperties": false,
    "properties": {
      "created_at": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "is_del": {
        "type": "integer"
      },
      "remark": {
        "type": "string"
      },
      "setting_key": {
        "type": "string"
      },
      "setting_value": {
        "type": "string"
      },
      "status": {
        "type": "integer"
      },
      "status_name": {
        "type": "string"
      },
      "updated_at": {
        "type": "string"
      },
      "value_type": {
        "type": "integer"
      },
      "value_type_name": {
        "type": "string"
      }
    },
    "required": [
      "created_at",
      "id",
      "is_del",
      "remark",
      "setting_key",
      "setting_value",
      "status",
      "status_name",
      "updated_at",
      "value_type",
      "value_type_name"
    ],
    "type": "object"
  },
  "Go_internal_module_systemsetting_ListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_systemsetting_ListItem_Output"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_systemsetting_Page_Output"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_systemsetting_Page_Output": {
    "additionalProperties": false,
    "properties": {
      "current_page": {
        "type": "integer"
      },
      "page_size": {
        "type": "integer"
      },
      "total": {
        "type": "integer"
      },
      "total_page": {
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
  "Go_internal_module_uploadconfig_DriverItem_Output": {
    "additionalProperties": false,
    "properties": {
      "appid": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "bucket": {
        "type": "string"
      },
      "bucket_domain": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "created_at": {
        "type": "string"
      },
      "driver": {
        "type": "string"
      },
      "driver_show": {
        "type": "string"
      },
      "endpoint": {
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
        "type": "integer"
      },
      "region": {
        "type": "string"
      },
      "role_arn": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "secret_id_hint": {
        "type": "string"
      },
      "secret_key_hint": {
        "type": "string"
      },
      "updated_at": {
        "type": "string"
      }
    },
    "required": [
      "appid",
      "bucket",
      "bucket_domain",
      "created_at",
      "driver",
      "driver_show",
      "endpoint",
      "id",
      "region",
      "role_arn",
      "secret_id_hint",
      "secret_key_hint",
      "updated_at"
    ],
    "type": "object"
  },
  "Go_internal_module_uploadconfig_DriverListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_uploadconfig_DriverItem_Output"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_uploadconfig_Page_Output"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_uploadconfig_DriverPageInitDict_Output": {
    "additionalProperties": false,
    "properties": {
      "upload_driver_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "upload_driver_arr"
    ],
    "type": "object"
  },
  "Go_internal_module_uploadconfig_DriverPageInitResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/Go_internal_module_uploadconfig_DriverPageInitDict_Output"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "Go_internal_module_uploadconfig_Page_Output": {
    "additionalProperties": false,
    "properties": {
      "current_page": {
        "type": "integer"
      },
      "page_size": {
        "type": "integer"
      },
      "total": {
        "type": "integer"
      },
      "total_page": {
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
  "Go_internal_module_uploadconfig_RuleItem_Output": {
    "additionalProperties": false,
    "properties": {
      "created_at": {
        "type": "string"
      },
      "file_exts": {
        "items": {
          "type": "string"
        },
        "type": "array"
      },
      "id": {
        "type": "integer"
      },
      "image_exts": {
        "items": {
          "type": "string"
        },
        "type": "array"
      },
      "max_size_mb": {
        "type": "integer"
      },
      "title": {
        "type": "string"
      },
      "updated_at": {
        "type": "string"
      }
    },
    "required": [
      "created_at",
      "file_exts",
      "id",
      "image_exts",
      "max_size_mb",
      "title",
      "updated_at"
    ],
    "type": "object"
  },
  "Go_internal_module_uploadconfig_RuleListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_uploadconfig_RuleItem_Output"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_uploadconfig_Page_Output"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_uploadconfig_RulePageInitDict_Output": {
    "additionalProperties": false,
    "properties": {
      "upload_file_ext_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      },
      "upload_image_ext_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "upload_file_ext_arr",
      "upload_image_ext_arr"
    ],
    "type": "object"
  },
  "Go_internal_module_uploadconfig_RulePageInitResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/Go_internal_module_uploadconfig_RulePageInitDict_Output"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "Go_internal_module_uploadconfig_SettingItem_Output": {
    "additionalProperties": false,
    "properties": {
      "created_at": {
        "type": "string"
      },
      "driver_id": {
        "type": "integer"
      },
      "driver_name": {
        "type": "string"
      },
      "id": {
        "type": "integer"
      },
      "remark": {
        "type": "string"
      },
      "rule_id": {
        "type": "integer"
      },
      "rule_name": {
        "type": "string"
      },
      "status": {
        "type": "integer"
      },
      "status_name": {
        "type": "string"
      },
      "updated_at": {
        "type": "string"
      }
    },
    "required": [
      "created_at",
      "driver_id",
      "driver_name",
      "id",
      "remark",
      "rule_id",
      "rule_name",
      "status",
      "status_name",
      "updated_at"
    ],
    "type": "object"
  },
  "Go_internal_module_uploadconfig_SettingListResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_uploadconfig_SettingItem_Output"
        },
        "type": "array"
      },
      "page": {
        "$ref": "#/components/schemas/Go_internal_module_uploadconfig_Page_Output"
      }
    },
    "required": [
      "list",
      "page"
    ],
    "type": "object"
  },
  "Go_internal_module_uploadconfig_SettingPageInitDict_Output": {
    "additionalProperties": false,
    "properties": {
      "common_status_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      },
      "upload_driver_list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      },
      "upload_rule_list": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "common_status_arr",
      "upload_driver_list",
      "upload_rule_list"
    ],
    "type": "object"
  },
  "Go_internal_module_uploadconfig_SettingPageInitResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/Go_internal_module_uploadconfig_SettingPageInitDict_Output"
      }
    },
    "required": [
      "dict"
    ],
    "type": "object"
  },
  "Go_internal_module_uploadtoken_CreateResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "bucket": {
        "type": "string"
      },
      "bucket_domain": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "null"
          }
        ]
      },
      "credentials": {
        "$ref": "#/components/schemas/Go_internal_module_uploadtoken_CredentialsDTO_Output"
      },
      "expired_time": {
        "type": "integer"
      },
      "key": {
        "type": "string"
      },
      "provider": {
        "type": "string"
      },
      "region": {
        "type": "string"
      },
      "rule": {
        "$ref": "#/components/schemas/Go_internal_module_uploadtoken_UploadRuleDTO_Output"
      },
      "start_time": {
        "type": "integer"
      },
      "upload_path": {
        "type": "string"
      }
    },
    "required": [
      "bucket",
      "bucket_domain",
      "credentials",
      "expired_time",
      "key",
      "provider",
      "region",
      "rule",
      "start_time",
      "upload_path"
    ],
    "type": "object"
  },
  "Go_internal_module_uploadtoken_CredentialsDTO_Output": {
    "additionalProperties": false,
    "properties": {
      "session_token": {
        "type": "string"
      },
      "tmp_secret_id": {
        "type": "string"
      },
      "tmp_secret_key": {
        "type": "string"
      }
    },
    "required": [
      "session_token",
      "tmp_secret_id",
      "tmp_secret_key"
    ],
    "type": "object"
  },
  "Go_internal_module_uploadtoken_UploadRuleDTO_Output": {
    "additionalProperties": false,
    "properties": {
      "file_exts": {
        "items": {
          "type": "string"
        },
        "type": "array"
      },
      "image_exts": {
        "items": {
          "type": "string"
        },
        "type": "array"
      },
      "max_size_mb": {
        "type": "integer"
      }
    },
    "required": [
      "file_exts",
      "image_exts",
      "max_size_mb"
    ],
    "type": "object"
  },
  "Go_internal_module_user_AddressTreeNode_Output": {
    "additionalProperties": false,
    "properties": {
      "children": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_user_AddressTreeNode_Output"
        },
        "type": "array"
      },
      "id": {
        "type": "integer"
      },
      "label": {
        "type": "string"
      },
      "parent_id": {
        "type": "integer"
      },
      "value": {
        "type": "integer"
      }
    },
    "required": [
      "id",
      "label",
      "parent_id",
      "value"
    ],
    "type": "object"
  },
  "Go_internal_module_user_ProfileDetail_Output": {
    "additionalProperties": false,
    "properties": {
      "address_id": {
        "type": "integer"
      },
      "avatar": {
        "type": "string"
      },
      "bio": {
        "type": "string"
      },
      "birthday": {
        "type": "string"
      },
      "detail_address": {
        "type": "string"
      },
      "email": {
        "type": "string"
      },
      "has_password": {
        "type": "boolean"
      },
      "is_self": {
        "type": "integer"
      },
      "phone": {
        "type": "string"
      },
      "role_id": {
        "type": "integer"
      },
      "role_name": {
        "type": "string"
      },
      "sex": {
        "type": "integer"
      },
      "user_id": {
        "type": "integer"
      },
      "username": {
        "type": "string"
      }
    },
    "required": [
      "address_id",
      "avatar",
      "bio",
      "birthday",
      "detail_address",
      "email",
      "has_password",
      "is_self",
      "phone",
      "role_id",
      "role_name",
      "sex",
      "user_id",
      "username"
    ],
    "type": "object"
  },
  "Go_internal_module_user_ProfileDict_Output": {
    "additionalProperties": false,
    "properties": {
      "auth_address_tree": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_module_user_AddressTreeNode_Output"
        },
        "type": "array"
      },
      "sexArr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_int_Output"
        },
        "type": "array"
      },
      "verify_type_arr": {
        "items": {
          "$ref": "#/components/schemas/Go_internal_shared_dict_Option_string_Output"
        },
        "type": "array"
      }
    },
    "required": [
      "auth_address_tree",
      "sexArr",
      "verify_type_arr"
    ],
    "type": "object"
  },
  "Go_internal_module_user_ProfileResponse_Output": {
    "additionalProperties": false,
    "properties": {
      "dict": {
        "$ref": "#/components/schemas/Go_internal_module_user_ProfileDict_Output"
      },
      "profile": {
        "$ref": "#/components/schemas/Go_internal_module_user_ProfileDetail_Output"
      }
    },
    "required": [
      "dict",
      "profile"
    ],
    "type": "object"
  },
  "Go_internal_server_adminroute_EmptyData_Output": {
    "additionalProperties": false,
    "properties": {},
    "type": "object"
  },
  "Go_internal_server_adminroute_IDData_Output": {
    "additionalProperties": false,
    "properties": {
      "id": {
        "type": "integer"
      }
    },
    "required": [
      "id"
    ],
    "type": "object"
  },
  "Go_internal_shared_dict_Option_int_Output": {
    "additionalProperties": false,
    "properties": {
      "label": {
        "type": "string"
      },
      "value": {
        "type": "integer"
      }
    },
    "required": [
      "label",
      "value"
    ],
    "type": "object"
  },
  "Go_internal_shared_dict_Option_string_Output": {
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
  "delete_api_admin_v1_ai_agents_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_ai_conversations_id": {
    "additionalProperties": false,
    "properties": {},
    "type": "object"
  },
  "delete_api_admin_v1_ai_knowledge_bases_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_ai_knowledge_documents_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_ai_providers_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_ai_tools_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_auth_platforms": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_auth_platforms_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_cron_tasks": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_cron_tasks_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
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
  "delete_api_admin_v1_mail_config": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_mail_logs": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_mail_logs_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_mail_templates_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_notification_tasks_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
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
  "delete_api_admin_v1_operation_logs": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_operation_logs_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_payment_configs_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_permissions": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_permissions_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_roles": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_roles_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_sms_config": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_sms_logs": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_sms_logs_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_sms_templates_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_system_settings": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_system_settings_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_upload_drivers": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_upload_drivers_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_upload_rules": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_upload_rules_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_upload_settings": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "delete_api_admin_v1_upload_settings_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
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
  "get_api_admin_v1_ai_agents": {
    "$ref": "#/components/schemas/Go_internal_module_ai_agent_ListResponse_Output"
  },
  "get_api_admin_v1_ai_agents_id": {
    "$ref": "#/components/schemas/Go_internal_module_ai_agent_DetailResponse_Output"
  },
  "get_api_admin_v1_ai_agents_id_knowledge_bases": {
    "$ref": "#/components/schemas/Go_internal_module_ai_knowledge_AgentKnowledgeBindingsResponse_Output"
  },
  "get_api_admin_v1_ai_agents_id_tools": {
    "$ref": "#/components/schemas/Go_internal_module_ai_tool_AgentToolsResponse_Output"
  },
  "get_api_admin_v1_ai_agents_options": {
    "$ref": "#/components/schemas/Go_internal_module_ai_agent_AgentOptionsResponse_Output"
  },
  "get_api_admin_v1_ai_agents_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_ai_agent_InitResponse_Output"
  },
  "get_api_admin_v1_ai_agents_provider_models_id": {
    "$ref": "#/components/schemas/Go_internal_module_ai_agent_ProviderModelsResponse_Output"
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
  "get_api_admin_v1_ai_knowledge_bases": {
    "$ref": "#/components/schemas/Go_internal_module_ai_knowledge_BaseListResponse_Output"
  },
  "get_api_admin_v1_ai_knowledge_bases_id": {
    "$ref": "#/components/schemas/Go_internal_module_ai_knowledge_BaseDetailResponse_Output"
  },
  "get_api_admin_v1_ai_knowledge_bases_id_documents": {
    "$ref": "#/components/schemas/Go_internal_module_ai_knowledge_DocumentListResponse_Output"
  },
  "get_api_admin_v1_ai_knowledge_bases_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_ai_knowledge_InitResponse_Output"
  },
  "get_api_admin_v1_ai_knowledge_documents_id": {
    "$ref": "#/components/schemas/Go_internal_module_ai_knowledge_DocumentDetailResponse_Output"
  },
  "get_api_admin_v1_ai_knowledge_documents_id_chunks": {
    "$ref": "#/components/schemas/Go_internal_module_ai_knowledge_ChunkListResponse_Output"
  },
  "get_api_admin_v1_ai_providers": {
    "$ref": "#/components/schemas/Go_internal_module_ai_provider_ListResponse_Output"
  },
  "get_api_admin_v1_ai_providers_id_models": {
    "$ref": "#/components/schemas/Go_internal_module_ai_provider_ProviderModelsResponse_Output"
  },
  "get_api_admin_v1_ai_providers_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_ai_provider_InitResponse_Output"
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
  "get_api_admin_v1_ai_tools": {
    "$ref": "#/components/schemas/Go_internal_module_ai_tool_ListResponse_Output"
  },
  "get_api_admin_v1_ai_tools_generate_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_ai_tool_GeneratePageInitResponse_Output"
  },
  "get_api_admin_v1_ai_tools_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_ai_tool_InitResponse_Output"
  },
  "get_api_admin_v1_auth_captcha": {
    "$ref": "#/components/schemas/Go_internal_module_auth_ChallengeResponse_Output"
  },
  "get_api_admin_v1_auth_login_config": {
    "$ref": "#/components/schemas/Go_internal_module_auth_LoginConfigResponse_Output"
  },
  "get_api_admin_v1_auth_platforms": {
    "$ref": "#/components/schemas/Go_internal_module_auth_platform_ListResponse_Output"
  },
  "get_api_admin_v1_auth_platforms_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_auth_platform_InitResponse_Output"
  },
  "get_api_admin_v1_cron_tasks": {
    "$ref": "#/components/schemas/Go_internal_module_crontask_ListResponse_Output"
  },
  "get_api_admin_v1_cron_tasks_id_logs": {
    "$ref": "#/components/schemas/Go_internal_module_crontask_LogsResponse_Output"
  },
  "get_api_admin_v1_cron_tasks_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_crontask_InitResponse_Output"
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
  "get_api_admin_v1_mail_config": {
    "$ref": "#/components/schemas/Go_internal_module_mail_ConfigResponse_Output"
  },
  "get_api_admin_v1_mail_logs": {
    "$ref": "#/components/schemas/Go_internal_module_mail_LogListResponse_Output"
  },
  "get_api_admin_v1_mail_logs_id": {
    "$ref": "#/components/schemas/Go_internal_module_mail_LogDTO_Output"
  },
  "get_api_admin_v1_mail_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_mail_PageInitResponse_Output"
  },
  "get_api_admin_v1_mail_templates": {
    "items": {
      "$ref": "#/components/schemas/Go_internal_module_mail_TemplateDTO_Output"
    },
    "type": "array"
  },
  "get_api_admin_v1_notification_tasks": {
    "$ref": "#/components/schemas/Go_internal_module_notification_task_ListResponse_Output"
  },
  "get_api_admin_v1_notification_tasks_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_notification_task_InitResponse_Output"
  },
  "get_api_admin_v1_notification_tasks_status_count": {
    "items": {
      "$ref": "#/components/schemas/Go_internal_module_notification_task_StatusCountItem_Output"
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
  "get_api_admin_v1_operation_logs": {
    "$ref": "#/components/schemas/Go_internal_module_operationlog_ListResponse_Output"
  },
  "get_api_admin_v1_operation_logs_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_operationlog_InitResponse_Output"
  },
  "get_api_admin_v1_payment_configs": {
    "$ref": "#/components/schemas/Go_internal_module_payment_ConfigListResponse_Output"
  },
  "get_api_admin_v1_payment_configs_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_payment_ConfigPageInitResponse_Output"
  },
  "get_api_admin_v1_payment_ledger": {
    "$ref": "#/components/schemas/Go_internal_module_payment_wallet_TransactionListResponse_Output"
  },
  "get_api_admin_v1_payment_ledger_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_payment_wallet_LedgerPageInitResponse_Output"
  },
  "get_api_admin_v1_payment_recharges": {
    "$ref": "#/components/schemas/Go_internal_module_payment_RechargeListResponse_Output"
  },
  "get_api_admin_v1_payment_recharges_id": {
    "$ref": "#/components/schemas/Go_internal_module_payment_RechargeDetail_Output"
  },
  "get_api_admin_v1_payment_recharges_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_payment_RechargePageInitResponse_Output"
  },
  "get_api_admin_v1_payment_wallets": {
    "$ref": "#/components/schemas/Go_internal_module_payment_wallet_WalletUserListResponse_Output"
  },
  "get_api_admin_v1_payment_wallets_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_payment_wallet_WalletUsersPageInitResponse_Output"
  },
  "get_api_admin_v1_permissions": {
    "items": {
      "$ref": "#/components/schemas/Go_internal_module_permission_PermissionListItem_Output"
    },
    "type": "array"
  },
  "get_api_admin_v1_permissions_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_permission_InitResponse_Output"
  },
  "get_api_admin_v1_profile": {
    "$ref": "#/components/schemas/Go_internal_module_user_ProfileResponse_Output"
  },
  "get_api_admin_v1_roles": {
    "$ref": "#/components/schemas/Go_internal_module_role_ListResponse_Output"
  },
  "get_api_admin_v1_roles_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_role_InitResponse_Output"
  },
  "get_api_admin_v1_sms_config": {
    "$ref": "#/components/schemas/Go_internal_module_sms_ConfigResponse_Output"
  },
  "get_api_admin_v1_sms_logs": {
    "$ref": "#/components/schemas/Go_internal_module_sms_LogListResponse_Output"
  },
  "get_api_admin_v1_sms_logs_id": {
    "$ref": "#/components/schemas/Go_internal_module_sms_LogDTO_Output"
  },
  "get_api_admin_v1_sms_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_sms_PageInitResponse_Output"
  },
  "get_api_admin_v1_sms_templates": {
    "items": {
      "$ref": "#/components/schemas/Go_internal_module_sms_TemplateDTO_Output"
    },
    "type": "array"
  },
  "get_api_admin_v1_system_logs_files": {
    "$ref": "#/components/schemas/Go_internal_module_systemlog_FilesResponse_Output"
  },
  "get_api_admin_v1_system_logs_files_name_lines": {
    "$ref": "#/components/schemas/Go_internal_module_systemlog_LinesResponse_Output"
  },
  "get_api_admin_v1_system_logs_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_systemlog_InitResponse_Output"
  },
  "get_api_admin_v1_system_settings": {
    "$ref": "#/components/schemas/Go_internal_module_systemsetting_ListResponse_Output"
  },
  "get_api_admin_v1_system_settings_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_systemsetting_InitResponse_Output"
  },
  "get_api_admin_v1_upload_drivers": {
    "$ref": "#/components/schemas/Go_internal_module_uploadconfig_DriverListResponse_Output"
  },
  "get_api_admin_v1_upload_drivers_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_uploadconfig_DriverPageInitResponse_Output"
  },
  "get_api_admin_v1_upload_rules": {
    "$ref": "#/components/schemas/Go_internal_module_uploadconfig_RuleListResponse_Output"
  },
  "get_api_admin_v1_upload_rules_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_uploadconfig_RulePageInitResponse_Output"
  },
  "get_api_admin_v1_upload_settings": {
    "$ref": "#/components/schemas/Go_internal_module_uploadconfig_SettingListResponse_Output"
  },
  "get_api_admin_v1_upload_settings_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_uploadconfig_SettingPageInitResponse_Output"
  },
  "get_api_admin_v1_user_sessions": {
    "$ref": "#/components/schemas/Go_internal_module_auth_SessionListResponse_Output"
  },
  "get_api_admin_v1_user_sessions_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_auth_SessionPageInitResponse_Output"
  },
  "get_api_admin_v1_user_sessions_stats": {
    "$ref": "#/components/schemas/Go_internal_module_auth_SessionStatsResponse_Output"
  },
  "get_api_admin_v1_users": {
    "$ref": "#/components/schemas/UserListResult"
  },
  "get_api_admin_v1_users_id_profile": {
    "$ref": "#/components/schemas/Go_internal_module_user_ProfileResponse_Output"
  },
  "get_api_admin_v1_users_login_logs": {
    "$ref": "#/components/schemas/Go_internal_module_auth_LoginLogListResponse_Output"
  },
  "get_api_admin_v1_users_login_logs_page_init": {
    "$ref": "#/components/schemas/Go_internal_module_auth_LoginLogPageInitResponse_Output"
  },
  "get_api_admin_v1_users_page_init": {
    "$ref": "#/components/schemas/UserPageInit"
  },
  "get_api_admin_v1_wallet_summary": {
    "$ref": "#/components/schemas/Go_internal_module_payment_wallet_SummaryResponse_Output"
  },
  "get_api_admin_v1_wallet_transactions": {
    "$ref": "#/components/schemas/Go_internal_module_payment_wallet_TransactionListResponse_Output"
  },
  "patch_api_admin_v1_ai_agents_id_status": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "patch_api_admin_v1_ai_knowledge_bases_id_status": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "patch_api_admin_v1_ai_knowledge_documents_id_status": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "patch_api_admin_v1_ai_providers_id_status": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "patch_api_admin_v1_ai_tools_id_status": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "patch_api_admin_v1_auth_platforms_id_status": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "patch_api_admin_v1_cron_tasks_id_status": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "patch_api_admin_v1_mail_templates_id_status": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "patch_api_admin_v1_notification_tasks_id_cancel": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
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
  "patch_api_admin_v1_payment_configs_id_status": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "patch_api_admin_v1_permissions_id_status": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "patch_api_admin_v1_roles_id_default": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "patch_api_admin_v1_sms_templates_id_status": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "patch_api_admin_v1_system_settings_id_status": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "patch_api_admin_v1_upload_settings_id_status": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "patch_api_admin_v1_user_sessions_id_revoke": {
    "$ref": "#/components/schemas/Go_internal_module_auth_SessionRevokeResponse_Output"
  },
  "patch_api_admin_v1_user_sessions_revoke": {
    "$ref": "#/components/schemas/Go_internal_module_auth_SessionBatchRevokeResponse_Output"
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
  "post_api_admin_v1_ai_agents": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_IDData_Output"
  },
  "post_api_admin_v1_ai_agents_id_test": {
    "$ref": "#/components/schemas/Go_internal_infra_ai_TestConnectionResult_Output"
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
  "post_api_admin_v1_ai_knowledge_bases": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_IDData_Output"
  },
  "post_api_admin_v1_ai_knowledge_bases_id_documents": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_IDData_Output"
  },
  "post_api_admin_v1_ai_knowledge_bases_id_retrieval_tests": {
    "$ref": "#/components/schemas/Go_internal_module_ai_knowledge_RetrievalResult_Output"
  },
  "post_api_admin_v1_ai_knowledge_documents_id_reindex": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "post_api_admin_v1_ai_providers": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_IDData_Output"
  },
  "post_api_admin_v1_ai_providers_id_model_options": {
    "$ref": "#/components/schemas/Go_internal_module_ai_provider_ModelOptionsResponse_Output"
  },
  "post_api_admin_v1_ai_providers_id_sync_models": {
    "$ref": "#/components/schemas/Go_internal_module_ai_provider_ModelOptionsResponse_Output"
  },
  "post_api_admin_v1_ai_providers_id_test": {
    "$ref": "#/components/schemas/Go_internal_infra_ai_TestConnectionResult_Output"
  },
  "post_api_admin_v1_ai_providers_model_options": {
    "$ref": "#/components/schemas/Go_internal_module_ai_provider_ModelOptionsResponse_Output"
  },
  "post_api_admin_v1_ai_tools": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_IDData_Output"
  },
  "post_api_admin_v1_ai_tools_generate_draft": {
    "$ref": "#/components/schemas/Go_internal_module_ai_tool_GenerateDraftResponse_Output"
  },
  "post_api_admin_v1_auth_forgot_password": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "post_api_admin_v1_auth_login": {
    "$ref": "#/components/schemas/Go_internal_module_auth_transport_admin_CredentialResponse_Output"
  },
  "post_api_admin_v1_auth_logout": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "post_api_admin_v1_auth_platforms": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_IDData_Output"
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
  "post_api_admin_v1_auth_refresh": {
    "$ref": "#/components/schemas/Go_internal_module_auth_transport_admin_CredentialResponse_Output"
  },
  "post_api_admin_v1_auth_send_code": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "post_api_admin_v1_cron_tasks": {
    "$ref": "#/components/schemas/Go_internal_module_crontask_ListItem_Output"
  },
  "post_api_admin_v1_mail_templates": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_IDData_Output"
  },
  "post_api_admin_v1_mail_test": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "post_api_admin_v1_notification_tasks": {
    "$ref": "#/components/schemas/Go_internal_module_notification_task_CreateResponse_Output"
  },
  "post_api_admin_v1_payment_certificates": {
    "$ref": "#/components/schemas/Go_internal_module_payment_CertificateUploadResponse_Output"
  },
  "post_api_admin_v1_payment_configs": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_IDData_Output"
  },
  "post_api_admin_v1_payment_configs_id_test": {
    "$ref": "#/components/schemas/Go_internal_module_payment_ConfigTestResponse_Output"
  },
  "post_api_admin_v1_payment_recharges": {
    "$ref": "#/components/schemas/Go_internal_module_payment_RechargePayResponse_Output"
  },
  "post_api_admin_v1_payment_recharges_id_pay": {
    "$ref": "#/components/schemas/Go_internal_module_payment_RechargePayResponse_Output"
  },
  "post_api_admin_v1_permissions": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_IDData_Output"
  },
  "post_api_admin_v1_roles": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_IDData_Output"
  },
  "post_api_admin_v1_sms_templates": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_IDData_Output"
  },
  "post_api_admin_v1_sms_test": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "post_api_admin_v1_system_settings": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_IDData_Output"
  },
  "post_api_admin_v1_upload_drivers": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_IDData_Output"
  },
  "post_api_admin_v1_upload_rules": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_IDData_Output"
  },
  "post_api_admin_v1_upload_settings": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_IDData_Output"
  },
  "post_api_admin_v1_upload_tokens": {
    "$ref": "#/components/schemas/Go_internal_module_uploadtoken_CreateResponse_Output"
  },
  "post_api_admin_v1_users_export": {
    "$ref": "#/components/schemas/UserExportResult"
  },
  "put_api_admin_v1_ai_agents_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_ai_agents_id_knowledge_bases": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_ai_agents_id_tools": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_ai_conversations_id": {
    "additionalProperties": false,
    "properties": {},
    "type": "object"
  },
  "put_api_admin_v1_ai_knowledge_bases_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_ai_knowledge_documents_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_ai_providers_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_ai_providers_id_models": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_ai_tools_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_auth_platforms_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_cron_tasks_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_mail_config": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_mail_templates_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_payment_configs_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_permissions_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_profile": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_profile_security_email": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_profile_security_password": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_profile_security_phone": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_roles_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_sms_config": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_sms_templates_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_system_settings_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_upload_drivers_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_upload_rules_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
  },
  "put_api_admin_v1_upload_settings_id": {
    "$ref": "#/components/schemas/Go_internal_server_adminroute_EmptyData_Output"
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
type MultipartBinaryFieldByOperation = {
  "post_api_admin_v1_payment_certificates": "file"
}
type MultipartBody<K extends keyof MultipartBinaryFieldByOperation, Body> = {
  [P in keyof Body]: P extends MultipartBinaryFieldByOperation[K] ? Blob : Body[P]
}
type RequestBodyField<K extends AdminOperationId> =
  OperationContract<K> extends { requestBody: { content: { 'multipart/form-data': infer Body } } }
    ? { readonly body: K extends keyof MultipartBinaryFieldByOperation ? MultipartBody<K, Body> : Body }
    : OperationContract<K> extends { requestBody?: { content: { 'multipart/form-data': infer Body } } }
      ? { readonly body?: K extends keyof MultipartBinaryFieldByOperation ? MultipartBody<K, Body> : Body }
      : OperationContract<K> extends { requestBody: { content: { 'application/json': infer Body } } }
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

function encode_post_api_admin_v1_payment_certificates_multipart(
  body: AdminOperationInput<"post_api_admin_v1_payment_certificates">['body'],
): FormData {
  const form = new FormData()
  form.append("cert_type", body["cert_type"])
  form.append("config_code", body["config_code"])
  form.append("file", body["file"])
  return form
}

export const adminOperations = {
  "delete_api_admin_v1_ai_agents_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_ai_agents_id">, AdminOperationOutput<"delete_api_admin_v1_ai_agents_id">>({
    id: "delete_api_admin_v1_ai_agents_id",
    method: "DELETE",
    path: "/api/admin/v1/ai-agents/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_ai_agents_id">>(responseDataSchemas["delete_api_admin_v1_ai_agents_id"]),
    telemetryName: "admin.delete.api.admin.v1.ai.agents.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_ai_conversations_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_ai_conversations_id">, AdminOperationOutput<"delete_api_admin_v1_ai_conversations_id">>({
    id: "delete_api_admin_v1_ai_conversations_id",
    method: "DELETE",
    path: "/api/admin/v1/ai-conversations/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_ai_conversations_id">>(responseDataSchemas["delete_api_admin_v1_ai_conversations_id"]),
    telemetryName: "admin.delete.api.admin.v1.ai.conversations.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_ai_knowledge_bases_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_ai_knowledge_bases_id">, AdminOperationOutput<"delete_api_admin_v1_ai_knowledge_bases_id">>({
    id: "delete_api_admin_v1_ai_knowledge_bases_id",
    method: "DELETE",
    path: "/api/admin/v1/ai-knowledge-bases/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_ai_knowledge_bases_id">>(responseDataSchemas["delete_api_admin_v1_ai_knowledge_bases_id"]),
    telemetryName: "admin.delete.api.admin.v1.ai.knowledge.bases.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_ai_knowledge_documents_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_ai_knowledge_documents_id">, AdminOperationOutput<"delete_api_admin_v1_ai_knowledge_documents_id">>({
    id: "delete_api_admin_v1_ai_knowledge_documents_id",
    method: "DELETE",
    path: "/api/admin/v1/ai-knowledge-documents/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_ai_knowledge_documents_id">>(responseDataSchemas["delete_api_admin_v1_ai_knowledge_documents_id"]),
    telemetryName: "admin.delete.api.admin.v1.ai.knowledge.documents.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_ai_providers_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_ai_providers_id">, AdminOperationOutput<"delete_api_admin_v1_ai_providers_id">>({
    id: "delete_api_admin_v1_ai_providers_id",
    method: "DELETE",
    path: "/api/admin/v1/ai-providers/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_ai_providers_id">>(responseDataSchemas["delete_api_admin_v1_ai_providers_id"]),
    telemetryName: "admin.delete.api.admin.v1.ai.providers.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_ai_tools_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_ai_tools_id">, AdminOperationOutput<"delete_api_admin_v1_ai_tools_id">>({
    id: "delete_api_admin_v1_ai_tools_id",
    method: "DELETE",
    path: "/api/admin/v1/ai-tools/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_ai_tools_id">>(responseDataSchemas["delete_api_admin_v1_ai_tools_id"]),
    telemetryName: "admin.delete.api.admin.v1.ai.tools.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_auth_platforms": defineOperation<AdminOperationInput<"delete_api_admin_v1_auth_platforms">, AdminOperationOutput<"delete_api_admin_v1_auth_platforms">>({
    id: "delete_api_admin_v1_auth_platforms",
    method: "DELETE",
    path: "/api/admin/v1/auth-platforms",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_auth_platforms">>(responseDataSchemas["delete_api_admin_v1_auth_platforms"]),
    telemetryName: "admin.delete.api.admin.v1.auth.platforms",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_auth_platforms_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_auth_platforms_id">, AdminOperationOutput<"delete_api_admin_v1_auth_platforms_id">>({
    id: "delete_api_admin_v1_auth_platforms_id",
    method: "DELETE",
    path: "/api/admin/v1/auth-platforms/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_auth_platforms_id">>(responseDataSchemas["delete_api_admin_v1_auth_platforms_id"]),
    telemetryName: "admin.delete.api.admin.v1.auth.platforms.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_cron_tasks": defineOperation<AdminOperationInput<"delete_api_admin_v1_cron_tasks">, AdminOperationOutput<"delete_api_admin_v1_cron_tasks">>({
    id: "delete_api_admin_v1_cron_tasks",
    method: "DELETE",
    path: "/api/admin/v1/cron-tasks",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_cron_tasks">>(responseDataSchemas["delete_api_admin_v1_cron_tasks"]),
    telemetryName: "admin.delete.api.admin.v1.cron.tasks",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_cron_tasks_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_cron_tasks_id">, AdminOperationOutput<"delete_api_admin_v1_cron_tasks_id">>({
    id: "delete_api_admin_v1_cron_tasks_id",
    method: "DELETE",
    path: "/api/admin/v1/cron-tasks/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_cron_tasks_id">>(responseDataSchemas["delete_api_admin_v1_cron_tasks_id"]),
    telemetryName: "admin.delete.api.admin.v1.cron.tasks.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_export_tasks": defineOperation<AdminOperationInput<"delete_api_admin_v1_export_tasks">, AdminOperationOutput<"delete_api_admin_v1_export_tasks">>({
    id: "delete_api_admin_v1_export_tasks",
    method: "DELETE",
    path: "/api/admin/v1/export-tasks",
    auth: "required",
    timeout: "interactive",
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
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_export_tasks_id">>(responseDataSchemas["delete_api_admin_v1_export_tasks_id"]),
    telemetryName: "admin.delete.api.admin.v1.export.tasks.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_mail_config": defineOperation<AdminOperationInput<"delete_api_admin_v1_mail_config">, AdminOperationOutput<"delete_api_admin_v1_mail_config">>({
    id: "delete_api_admin_v1_mail_config",
    method: "DELETE",
    path: "/api/admin/v1/mail/config",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_mail_config">>(responseDataSchemas["delete_api_admin_v1_mail_config"]),
    telemetryName: "admin.delete.api.admin.v1.mail.config",
  }),
  "delete_api_admin_v1_mail_logs": defineOperation<AdminOperationInput<"delete_api_admin_v1_mail_logs">, AdminOperationOutput<"delete_api_admin_v1_mail_logs">>({
    id: "delete_api_admin_v1_mail_logs",
    method: "DELETE",
    path: "/api/admin/v1/mail/logs",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_mail_logs">>(responseDataSchemas["delete_api_admin_v1_mail_logs"]),
    telemetryName: "admin.delete.api.admin.v1.mail.logs",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_mail_logs_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_mail_logs_id">, AdminOperationOutput<"delete_api_admin_v1_mail_logs_id">>({
    id: "delete_api_admin_v1_mail_logs_id",
    method: "DELETE",
    path: "/api/admin/v1/mail/logs/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_mail_logs_id">>(responseDataSchemas["delete_api_admin_v1_mail_logs_id"]),
    telemetryName: "admin.delete.api.admin.v1.mail.logs.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_mail_templates_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_mail_templates_id">, AdminOperationOutput<"delete_api_admin_v1_mail_templates_id">>({
    id: "delete_api_admin_v1_mail_templates_id",
    method: "DELETE",
    path: "/api/admin/v1/mail/templates/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_mail_templates_id">>(responseDataSchemas["delete_api_admin_v1_mail_templates_id"]),
    telemetryName: "admin.delete.api.admin.v1.mail.templates.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_notification_tasks_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_notification_tasks_id">, AdminOperationOutput<"delete_api_admin_v1_notification_tasks_id">>({
    id: "delete_api_admin_v1_notification_tasks_id",
    method: "DELETE",
    path: "/api/admin/v1/notification-tasks/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_notification_tasks_id">>(responseDataSchemas["delete_api_admin_v1_notification_tasks_id"]),
    telemetryName: "admin.delete.api.admin.v1.notification.tasks.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_notifications": defineOperation<AdminOperationInput<"delete_api_admin_v1_notifications">, AdminOperationOutput<"delete_api_admin_v1_notifications">>({
    id: "delete_api_admin_v1_notifications",
    method: "DELETE",
    path: "/api/admin/v1/notifications",
    auth: "required",
    timeout: "interactive",
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
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_notifications_id">>(responseDataSchemas["delete_api_admin_v1_notifications_id"]),
    telemetryName: "admin.delete.api.admin.v1.notifications.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_operation_logs": defineOperation<AdminOperationInput<"delete_api_admin_v1_operation_logs">, AdminOperationOutput<"delete_api_admin_v1_operation_logs">>({
    id: "delete_api_admin_v1_operation_logs",
    method: "DELETE",
    path: "/api/admin/v1/operation-logs",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_operation_logs">>(responseDataSchemas["delete_api_admin_v1_operation_logs"]),
    telemetryName: "admin.delete.api.admin.v1.operation.logs",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_operation_logs_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_operation_logs_id">, AdminOperationOutput<"delete_api_admin_v1_operation_logs_id">>({
    id: "delete_api_admin_v1_operation_logs_id",
    method: "DELETE",
    path: "/api/admin/v1/operation-logs/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_operation_logs_id">>(responseDataSchemas["delete_api_admin_v1_operation_logs_id"]),
    telemetryName: "admin.delete.api.admin.v1.operation.logs.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_payment_configs_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_payment_configs_id">, AdminOperationOutput<"delete_api_admin_v1_payment_configs_id">>({
    id: "delete_api_admin_v1_payment_configs_id",
    method: "DELETE",
    path: "/api/admin/v1/payment/configs/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_payment_configs_id">>(responseDataSchemas["delete_api_admin_v1_payment_configs_id"]),
    telemetryName: "admin.delete.api.admin.v1.payment.configs.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_permissions": defineOperation<AdminOperationInput<"delete_api_admin_v1_permissions">, AdminOperationOutput<"delete_api_admin_v1_permissions">>({
    id: "delete_api_admin_v1_permissions",
    method: "DELETE",
    path: "/api/admin/v1/permissions",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_permissions">>(responseDataSchemas["delete_api_admin_v1_permissions"]),
    telemetryName: "admin.delete.api.admin.v1.permissions",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_permissions_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_permissions_id">, AdminOperationOutput<"delete_api_admin_v1_permissions_id">>({
    id: "delete_api_admin_v1_permissions_id",
    method: "DELETE",
    path: "/api/admin/v1/permissions/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_permissions_id">>(responseDataSchemas["delete_api_admin_v1_permissions_id"]),
    telemetryName: "admin.delete.api.admin.v1.permissions.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_roles": defineOperation<AdminOperationInput<"delete_api_admin_v1_roles">, AdminOperationOutput<"delete_api_admin_v1_roles">>({
    id: "delete_api_admin_v1_roles",
    method: "DELETE",
    path: "/api/admin/v1/roles",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_roles">>(responseDataSchemas["delete_api_admin_v1_roles"]),
    telemetryName: "admin.delete.api.admin.v1.roles",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_roles_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_roles_id">, AdminOperationOutput<"delete_api_admin_v1_roles_id">>({
    id: "delete_api_admin_v1_roles_id",
    method: "DELETE",
    path: "/api/admin/v1/roles/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_roles_id">>(responseDataSchemas["delete_api_admin_v1_roles_id"]),
    telemetryName: "admin.delete.api.admin.v1.roles.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_sms_config": defineOperation<AdminOperationInput<"delete_api_admin_v1_sms_config">, AdminOperationOutput<"delete_api_admin_v1_sms_config">>({
    id: "delete_api_admin_v1_sms_config",
    method: "DELETE",
    path: "/api/admin/v1/sms/config",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_sms_config">>(responseDataSchemas["delete_api_admin_v1_sms_config"]),
    telemetryName: "admin.delete.api.admin.v1.sms.config",
  }),
  "delete_api_admin_v1_sms_logs": defineOperation<AdminOperationInput<"delete_api_admin_v1_sms_logs">, AdminOperationOutput<"delete_api_admin_v1_sms_logs">>({
    id: "delete_api_admin_v1_sms_logs",
    method: "DELETE",
    path: "/api/admin/v1/sms/logs",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_sms_logs">>(responseDataSchemas["delete_api_admin_v1_sms_logs"]),
    telemetryName: "admin.delete.api.admin.v1.sms.logs",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_sms_logs_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_sms_logs_id">, AdminOperationOutput<"delete_api_admin_v1_sms_logs_id">>({
    id: "delete_api_admin_v1_sms_logs_id",
    method: "DELETE",
    path: "/api/admin/v1/sms/logs/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_sms_logs_id">>(responseDataSchemas["delete_api_admin_v1_sms_logs_id"]),
    telemetryName: "admin.delete.api.admin.v1.sms.logs.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_sms_templates_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_sms_templates_id">, AdminOperationOutput<"delete_api_admin_v1_sms_templates_id">>({
    id: "delete_api_admin_v1_sms_templates_id",
    method: "DELETE",
    path: "/api/admin/v1/sms/templates/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_sms_templates_id">>(responseDataSchemas["delete_api_admin_v1_sms_templates_id"]),
    telemetryName: "admin.delete.api.admin.v1.sms.templates.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_system_settings": defineOperation<AdminOperationInput<"delete_api_admin_v1_system_settings">, AdminOperationOutput<"delete_api_admin_v1_system_settings">>({
    id: "delete_api_admin_v1_system_settings",
    method: "DELETE",
    path: "/api/admin/v1/system-settings",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_system_settings">>(responseDataSchemas["delete_api_admin_v1_system_settings"]),
    telemetryName: "admin.delete.api.admin.v1.system.settings",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_system_settings_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_system_settings_id">, AdminOperationOutput<"delete_api_admin_v1_system_settings_id">>({
    id: "delete_api_admin_v1_system_settings_id",
    method: "DELETE",
    path: "/api/admin/v1/system-settings/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_system_settings_id">>(responseDataSchemas["delete_api_admin_v1_system_settings_id"]),
    telemetryName: "admin.delete.api.admin.v1.system.settings.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_upload_drivers": defineOperation<AdminOperationInput<"delete_api_admin_v1_upload_drivers">, AdminOperationOutput<"delete_api_admin_v1_upload_drivers">>({
    id: "delete_api_admin_v1_upload_drivers",
    method: "DELETE",
    path: "/api/admin/v1/upload-drivers",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_upload_drivers">>(responseDataSchemas["delete_api_admin_v1_upload_drivers"]),
    telemetryName: "admin.delete.api.admin.v1.upload.drivers",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_upload_drivers_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_upload_drivers_id">, AdminOperationOutput<"delete_api_admin_v1_upload_drivers_id">>({
    id: "delete_api_admin_v1_upload_drivers_id",
    method: "DELETE",
    path: "/api/admin/v1/upload-drivers/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_upload_drivers_id">>(responseDataSchemas["delete_api_admin_v1_upload_drivers_id"]),
    telemetryName: "admin.delete.api.admin.v1.upload.drivers.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_upload_rules": defineOperation<AdminOperationInput<"delete_api_admin_v1_upload_rules">, AdminOperationOutput<"delete_api_admin_v1_upload_rules">>({
    id: "delete_api_admin_v1_upload_rules",
    method: "DELETE",
    path: "/api/admin/v1/upload-rules",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_upload_rules">>(responseDataSchemas["delete_api_admin_v1_upload_rules"]),
    telemetryName: "admin.delete.api.admin.v1.upload.rules",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_upload_rules_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_upload_rules_id">, AdminOperationOutput<"delete_api_admin_v1_upload_rules_id">>({
    id: "delete_api_admin_v1_upload_rules_id",
    method: "DELETE",
    path: "/api/admin/v1/upload-rules/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_upload_rules_id">>(responseDataSchemas["delete_api_admin_v1_upload_rules_id"]),
    telemetryName: "admin.delete.api.admin.v1.upload.rules.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_upload_settings": defineOperation<AdminOperationInput<"delete_api_admin_v1_upload_settings">, AdminOperationOutput<"delete_api_admin_v1_upload_settings">>({
    id: "delete_api_admin_v1_upload_settings",
    method: "DELETE",
    path: "/api/admin/v1/upload-settings",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_upload_settings">>(responseDataSchemas["delete_api_admin_v1_upload_settings"]),
    telemetryName: "admin.delete.api.admin.v1.upload.settings",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_upload_settings_id": defineOperation<AdminOperationInput<"delete_api_admin_v1_upload_settings_id">, AdminOperationOutput<"delete_api_admin_v1_upload_settings_id">>({
    id: "delete_api_admin_v1_upload_settings_id",
    method: "DELETE",
    path: "/api/admin/v1/upload-settings/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_upload_settings_id">>(responseDataSchemas["delete_api_admin_v1_upload_settings_id"]),
    telemetryName: "admin.delete.api.admin.v1.upload.settings.id",
    encode: (input) => input,
  }),
  "delete_api_admin_v1_users": defineOperation<AdminOperationInput<"delete_api_admin_v1_users">, AdminOperationOutput<"delete_api_admin_v1_users">>({
    id: "delete_api_admin_v1_users",
    method: "DELETE",
    path: "/api/admin/v1/users",
    auth: "required",
    timeout: "interactive",
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
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"delete_api_admin_v1_users_id">>(responseDataSchemas["delete_api_admin_v1_users_id"]),
    telemetryName: "admin.delete.api.admin.v1.users.id",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_agents": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_agents">, AdminOperationOutput<"get_api_admin_v1_ai_agents">>({
    id: "get_api_admin_v1_ai_agents",
    method: "GET",
    path: "/api/admin/v1/ai-agents",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_agents">>(responseDataSchemas["get_api_admin_v1_ai_agents"]),
    telemetryName: "admin.get.api.admin.v1.ai.agents",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_agents_id": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_agents_id">, AdminOperationOutput<"get_api_admin_v1_ai_agents_id">>({
    id: "get_api_admin_v1_ai_agents_id",
    method: "GET",
    path: "/api/admin/v1/ai-agents/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_agents_id">>(responseDataSchemas["get_api_admin_v1_ai_agents_id"]),
    telemetryName: "admin.get.api.admin.v1.ai.agents.id",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_agents_id_knowledge_bases": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_agents_id_knowledge_bases">, AdminOperationOutput<"get_api_admin_v1_ai_agents_id_knowledge_bases">>({
    id: "get_api_admin_v1_ai_agents_id_knowledge_bases",
    method: "GET",
    path: "/api/admin/v1/ai-agents/{id}/knowledge-bases",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_agents_id_knowledge_bases">>(responseDataSchemas["get_api_admin_v1_ai_agents_id_knowledge_bases"]),
    telemetryName: "admin.get.api.admin.v1.ai.agents.id.knowledge.bases",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_agents_id_tools": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_agents_id_tools">, AdminOperationOutput<"get_api_admin_v1_ai_agents_id_tools">>({
    id: "get_api_admin_v1_ai_agents_id_tools",
    method: "GET",
    path: "/api/admin/v1/ai-agents/{id}/tools",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_agents_id_tools">>(responseDataSchemas["get_api_admin_v1_ai_agents_id_tools"]),
    telemetryName: "admin.get.api.admin.v1.ai.agents.id.tools",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_agents_options": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_agents_options">, AdminOperationOutput<"get_api_admin_v1_ai_agents_options">>({
    id: "get_api_admin_v1_ai_agents_options",
    method: "GET",
    path: "/api/admin/v1/ai-agents/options",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_agents_options">>(responseDataSchemas["get_api_admin_v1_ai_agents_options"]),
    telemetryName: "admin.get.api.admin.v1.ai.agents.options",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_agents_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_agents_page_init">, AdminOperationOutput<"get_api_admin_v1_ai_agents_page_init">>({
    id: "get_api_admin_v1_ai_agents_page_init",
    method: "GET",
    path: "/api/admin/v1/ai-agents/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_agents_page_init">>(responseDataSchemas["get_api_admin_v1_ai_agents_page_init"]),
    telemetryName: "admin.get.api.admin.v1.ai.agents.page.init",
  }),
  "get_api_admin_v1_ai_agents_provider_models_id": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_agents_provider_models_id">, AdminOperationOutput<"get_api_admin_v1_ai_agents_provider_models_id">>({
    id: "get_api_admin_v1_ai_agents_provider_models_id",
    method: "GET",
    path: "/api/admin/v1/ai-agents/provider-models/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_agents_provider_models_id">>(responseDataSchemas["get_api_admin_v1_ai_agents_provider_models_id"]),
    telemetryName: "admin.get.api.admin.v1.ai.agents.provider.models.id",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_conversations": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_conversations">, AdminOperationOutput<"get_api_admin_v1_ai_conversations">>({
    id: "get_api_admin_v1_ai_conversations",
    method: "GET",
    path: "/api/admin/v1/ai-conversations",
    auth: "required",
    timeout: "interactive",
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
    timeout: "interactive",
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
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_conversations_id_messages">>(responseDataSchemas["get_api_admin_v1_ai_conversations_id_messages"]),
    telemetryName: "admin.get.api.admin.v1.ai.conversations.id.messages",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_knowledge_bases": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_knowledge_bases">, AdminOperationOutput<"get_api_admin_v1_ai_knowledge_bases">>({
    id: "get_api_admin_v1_ai_knowledge_bases",
    method: "GET",
    path: "/api/admin/v1/ai-knowledge-bases",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_knowledge_bases">>(responseDataSchemas["get_api_admin_v1_ai_knowledge_bases"]),
    telemetryName: "admin.get.api.admin.v1.ai.knowledge.bases",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_knowledge_bases_id": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_knowledge_bases_id">, AdminOperationOutput<"get_api_admin_v1_ai_knowledge_bases_id">>({
    id: "get_api_admin_v1_ai_knowledge_bases_id",
    method: "GET",
    path: "/api/admin/v1/ai-knowledge-bases/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_knowledge_bases_id">>(responseDataSchemas["get_api_admin_v1_ai_knowledge_bases_id"]),
    telemetryName: "admin.get.api.admin.v1.ai.knowledge.bases.id",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_knowledge_bases_id_documents": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_knowledge_bases_id_documents">, AdminOperationOutput<"get_api_admin_v1_ai_knowledge_bases_id_documents">>({
    id: "get_api_admin_v1_ai_knowledge_bases_id_documents",
    method: "GET",
    path: "/api/admin/v1/ai-knowledge-bases/{id}/documents",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_knowledge_bases_id_documents">>(responseDataSchemas["get_api_admin_v1_ai_knowledge_bases_id_documents"]),
    telemetryName: "admin.get.api.admin.v1.ai.knowledge.bases.id.documents",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_knowledge_bases_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_knowledge_bases_page_init">, AdminOperationOutput<"get_api_admin_v1_ai_knowledge_bases_page_init">>({
    id: "get_api_admin_v1_ai_knowledge_bases_page_init",
    method: "GET",
    path: "/api/admin/v1/ai-knowledge-bases/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_knowledge_bases_page_init">>(responseDataSchemas["get_api_admin_v1_ai_knowledge_bases_page_init"]),
    telemetryName: "admin.get.api.admin.v1.ai.knowledge.bases.page.init",
  }),
  "get_api_admin_v1_ai_knowledge_documents_id": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_knowledge_documents_id">, AdminOperationOutput<"get_api_admin_v1_ai_knowledge_documents_id">>({
    id: "get_api_admin_v1_ai_knowledge_documents_id",
    method: "GET",
    path: "/api/admin/v1/ai-knowledge-documents/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_knowledge_documents_id">>(responseDataSchemas["get_api_admin_v1_ai_knowledge_documents_id"]),
    telemetryName: "admin.get.api.admin.v1.ai.knowledge.documents.id",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_knowledge_documents_id_chunks": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_knowledge_documents_id_chunks">, AdminOperationOutput<"get_api_admin_v1_ai_knowledge_documents_id_chunks">>({
    id: "get_api_admin_v1_ai_knowledge_documents_id_chunks",
    method: "GET",
    path: "/api/admin/v1/ai-knowledge-documents/{id}/chunks",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_knowledge_documents_id_chunks">>(responseDataSchemas["get_api_admin_v1_ai_knowledge_documents_id_chunks"]),
    telemetryName: "admin.get.api.admin.v1.ai.knowledge.documents.id.chunks",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_providers": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_providers">, AdminOperationOutput<"get_api_admin_v1_ai_providers">>({
    id: "get_api_admin_v1_ai_providers",
    method: "GET",
    path: "/api/admin/v1/ai-providers",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_providers">>(responseDataSchemas["get_api_admin_v1_ai_providers"]),
    telemetryName: "admin.get.api.admin.v1.ai.providers",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_providers_id_models": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_providers_id_models">, AdminOperationOutput<"get_api_admin_v1_ai_providers_id_models">>({
    id: "get_api_admin_v1_ai_providers_id_models",
    method: "GET",
    path: "/api/admin/v1/ai-providers/{id}/models",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_providers_id_models">>(responseDataSchemas["get_api_admin_v1_ai_providers_id_models"]),
    telemetryName: "admin.get.api.admin.v1.ai.providers.id.models",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_providers_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_providers_page_init">, AdminOperationOutput<"get_api_admin_v1_ai_providers_page_init">>({
    id: "get_api_admin_v1_ai_providers_page_init",
    method: "GET",
    path: "/api/admin/v1/ai-providers/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_providers_page_init">>(responseDataSchemas["get_api_admin_v1_ai_providers_page_init"]),
    telemetryName: "admin.get.api.admin.v1.ai.providers.page.init",
  }),
  "get_api_admin_v1_ai_runs": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_runs">, AdminOperationOutput<"get_api_admin_v1_ai_runs">>({
    id: "get_api_admin_v1_ai_runs",
    method: "GET",
    path: "/api/admin/v1/ai-runs",
    auth: "required",
    timeout: "interactive",
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
    timeout: "interactive",
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
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_runs_page_init">>(responseDataSchemas["get_api_admin_v1_ai_runs_page_init"]),
    telemetryName: "admin.get.api.admin.v1.ai.runs.page.init",
  }),
  "get_api_admin_v1_ai_runs_stats": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_runs_stats">, AdminOperationOutput<"get_api_admin_v1_ai_runs_stats">>({
    id: "get_api_admin_v1_ai_runs_stats",
    method: "GET",
    path: "/api/admin/v1/ai-runs/stats",
    auth: "required",
    timeout: "interactive",
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
    timeout: "interactive",
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
    timeout: "interactive",
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
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_runs_stats_by_user">>(responseDataSchemas["get_api_admin_v1_ai_runs_stats_by_user"]),
    telemetryName: "admin.get.api.admin.v1.ai.runs.stats.by.user",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_tools": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_tools">, AdminOperationOutput<"get_api_admin_v1_ai_tools">>({
    id: "get_api_admin_v1_ai_tools",
    method: "GET",
    path: "/api/admin/v1/ai-tools",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_tools">>(responseDataSchemas["get_api_admin_v1_ai_tools"]),
    telemetryName: "admin.get.api.admin.v1.ai.tools",
    encode: (input) => input,
  }),
  "get_api_admin_v1_ai_tools_generate_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_tools_generate_page_init">, AdminOperationOutput<"get_api_admin_v1_ai_tools_generate_page_init">>({
    id: "get_api_admin_v1_ai_tools_generate_page_init",
    method: "GET",
    path: "/api/admin/v1/ai-tools/generate/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_tools_generate_page_init">>(responseDataSchemas["get_api_admin_v1_ai_tools_generate_page_init"]),
    telemetryName: "admin.get.api.admin.v1.ai.tools.generate.page.init",
  }),
  "get_api_admin_v1_ai_tools_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_ai_tools_page_init">, AdminOperationOutput<"get_api_admin_v1_ai_tools_page_init">>({
    id: "get_api_admin_v1_ai_tools_page_init",
    method: "GET",
    path: "/api/admin/v1/ai-tools/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_ai_tools_page_init">>(responseDataSchemas["get_api_admin_v1_ai_tools_page_init"]),
    telemetryName: "admin.get.api.admin.v1.ai.tools.page.init",
  }),
  "get_api_admin_v1_auth_captcha": defineOperation<AdminOperationInput<"get_api_admin_v1_auth_captcha">, AdminOperationOutput<"get_api_admin_v1_auth_captcha">>({
    id: "get_api_admin_v1_auth_captcha",
    method: "GET",
    path: "/api/admin/v1/auth/captcha",
    auth: "public",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_auth_captcha">>(responseDataSchemas["get_api_admin_v1_auth_captcha"]),
    telemetryName: "admin.get.api.admin.v1.auth.captcha",
  }),
  "get_api_admin_v1_auth_login_config": defineOperation<AdminOperationInput<"get_api_admin_v1_auth_login_config">, AdminOperationOutput<"get_api_admin_v1_auth_login_config">>({
    id: "get_api_admin_v1_auth_login_config",
    method: "GET",
    path: "/api/admin/v1/auth/login-config",
    auth: "public",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_auth_login_config">>(responseDataSchemas["get_api_admin_v1_auth_login_config"]),
    telemetryName: "admin.get.api.admin.v1.auth.login.config",
  }),
  "get_api_admin_v1_auth_platforms": defineOperation<AdminOperationInput<"get_api_admin_v1_auth_platforms">, AdminOperationOutput<"get_api_admin_v1_auth_platforms">>({
    id: "get_api_admin_v1_auth_platforms",
    method: "GET",
    path: "/api/admin/v1/auth-platforms",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_auth_platforms">>(responseDataSchemas["get_api_admin_v1_auth_platforms"]),
    telemetryName: "admin.get.api.admin.v1.auth.platforms",
    encode: (input) => input,
  }),
  "get_api_admin_v1_auth_platforms_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_auth_platforms_page_init">, AdminOperationOutput<"get_api_admin_v1_auth_platforms_page_init">>({
    id: "get_api_admin_v1_auth_platforms_page_init",
    method: "GET",
    path: "/api/admin/v1/auth-platforms/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_auth_platforms_page_init">>(responseDataSchemas["get_api_admin_v1_auth_platforms_page_init"]),
    telemetryName: "admin.get.api.admin.v1.auth.platforms.page.init",
  }),
  "get_api_admin_v1_cron_tasks": defineOperation<AdminOperationInput<"get_api_admin_v1_cron_tasks">, AdminOperationOutput<"get_api_admin_v1_cron_tasks">>({
    id: "get_api_admin_v1_cron_tasks",
    method: "GET",
    path: "/api/admin/v1/cron-tasks",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_cron_tasks">>(responseDataSchemas["get_api_admin_v1_cron_tasks"]),
    telemetryName: "admin.get.api.admin.v1.cron.tasks",
    encode: (input) => input,
  }),
  "get_api_admin_v1_cron_tasks_id_logs": defineOperation<AdminOperationInput<"get_api_admin_v1_cron_tasks_id_logs">, AdminOperationOutput<"get_api_admin_v1_cron_tasks_id_logs">>({
    id: "get_api_admin_v1_cron_tasks_id_logs",
    method: "GET",
    path: "/api/admin/v1/cron-tasks/{id}/logs",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_cron_tasks_id_logs">>(responseDataSchemas["get_api_admin_v1_cron_tasks_id_logs"]),
    telemetryName: "admin.get.api.admin.v1.cron.tasks.id.logs",
    encode: (input) => input,
  }),
  "get_api_admin_v1_cron_tasks_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_cron_tasks_page_init">, AdminOperationOutput<"get_api_admin_v1_cron_tasks_page_init">>({
    id: "get_api_admin_v1_cron_tasks_page_init",
    method: "GET",
    path: "/api/admin/v1/cron-tasks/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_cron_tasks_page_init">>(responseDataSchemas["get_api_admin_v1_cron_tasks_page_init"]),
    telemetryName: "admin.get.api.admin.v1.cron.tasks.page.init",
  }),
  "get_api_admin_v1_export_tasks": defineOperation<AdminOperationInput<"get_api_admin_v1_export_tasks">, AdminOperationOutput<"get_api_admin_v1_export_tasks">>({
    id: "get_api_admin_v1_export_tasks",
    method: "GET",
    path: "/api/admin/v1/export-tasks",
    auth: "required",
    timeout: "interactive",
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
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_export_tasks_status_count">>(responseDataSchemas["get_api_admin_v1_export_tasks_status_count"]),
    telemetryName: "admin.get.api.admin.v1.export.tasks.status.count",
    encode: (input) => input,
  }),
  "get_api_admin_v1_mail_config": defineOperation<AdminOperationInput<"get_api_admin_v1_mail_config">, AdminOperationOutput<"get_api_admin_v1_mail_config">>({
    id: "get_api_admin_v1_mail_config",
    method: "GET",
    path: "/api/admin/v1/mail/config",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_mail_config">>(responseDataSchemas["get_api_admin_v1_mail_config"]),
    telemetryName: "admin.get.api.admin.v1.mail.config",
  }),
  "get_api_admin_v1_mail_logs": defineOperation<AdminOperationInput<"get_api_admin_v1_mail_logs">, AdminOperationOutput<"get_api_admin_v1_mail_logs">>({
    id: "get_api_admin_v1_mail_logs",
    method: "GET",
    path: "/api/admin/v1/mail/logs",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_mail_logs">>(responseDataSchemas["get_api_admin_v1_mail_logs"]),
    telemetryName: "admin.get.api.admin.v1.mail.logs",
    encode: (input) => input,
  }),
  "get_api_admin_v1_mail_logs_id": defineOperation<AdminOperationInput<"get_api_admin_v1_mail_logs_id">, AdminOperationOutput<"get_api_admin_v1_mail_logs_id">>({
    id: "get_api_admin_v1_mail_logs_id",
    method: "GET",
    path: "/api/admin/v1/mail/logs/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_mail_logs_id">>(responseDataSchemas["get_api_admin_v1_mail_logs_id"]),
    telemetryName: "admin.get.api.admin.v1.mail.logs.id",
    encode: (input) => input,
  }),
  "get_api_admin_v1_mail_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_mail_page_init">, AdminOperationOutput<"get_api_admin_v1_mail_page_init">>({
    id: "get_api_admin_v1_mail_page_init",
    method: "GET",
    path: "/api/admin/v1/mail/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_mail_page_init">>(responseDataSchemas["get_api_admin_v1_mail_page_init"]),
    telemetryName: "admin.get.api.admin.v1.mail.page.init",
  }),
  "get_api_admin_v1_mail_templates": defineOperation<AdminOperationInput<"get_api_admin_v1_mail_templates">, AdminOperationOutput<"get_api_admin_v1_mail_templates">>({
    id: "get_api_admin_v1_mail_templates",
    method: "GET",
    path: "/api/admin/v1/mail/templates",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_mail_templates">>(responseDataSchemas["get_api_admin_v1_mail_templates"]),
    telemetryName: "admin.get.api.admin.v1.mail.templates",
  }),
  "get_api_admin_v1_notification_tasks": defineOperation<AdminOperationInput<"get_api_admin_v1_notification_tasks">, AdminOperationOutput<"get_api_admin_v1_notification_tasks">>({
    id: "get_api_admin_v1_notification_tasks",
    method: "GET",
    path: "/api/admin/v1/notification-tasks",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_notification_tasks">>(responseDataSchemas["get_api_admin_v1_notification_tasks"]),
    telemetryName: "admin.get.api.admin.v1.notification.tasks",
    encode: (input) => input,
  }),
  "get_api_admin_v1_notification_tasks_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_notification_tasks_page_init">, AdminOperationOutput<"get_api_admin_v1_notification_tasks_page_init">>({
    id: "get_api_admin_v1_notification_tasks_page_init",
    method: "GET",
    path: "/api/admin/v1/notification-tasks/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_notification_tasks_page_init">>(responseDataSchemas["get_api_admin_v1_notification_tasks_page_init"]),
    telemetryName: "admin.get.api.admin.v1.notification.tasks.page.init",
  }),
  "get_api_admin_v1_notification_tasks_status_count": defineOperation<AdminOperationInput<"get_api_admin_v1_notification_tasks_status_count">, AdminOperationOutput<"get_api_admin_v1_notification_tasks_status_count">>({
    id: "get_api_admin_v1_notification_tasks_status_count",
    method: "GET",
    path: "/api/admin/v1/notification-tasks/status-count",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_notification_tasks_status_count">>(responseDataSchemas["get_api_admin_v1_notification_tasks_status_count"]),
    telemetryName: "admin.get.api.admin.v1.notification.tasks.status.count",
    encode: (input) => input,
  }),
  "get_api_admin_v1_notifications": defineOperation<AdminOperationInput<"get_api_admin_v1_notifications">, AdminOperationOutput<"get_api_admin_v1_notifications">>({
    id: "get_api_admin_v1_notifications",
    method: "GET",
    path: "/api/admin/v1/notifications",
    auth: "required",
    timeout: "interactive",
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
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_notifications_page_init">>(responseDataSchemas["get_api_admin_v1_notifications_page_init"]),
    telemetryName: "admin.get.api.admin.v1.notifications.page.init",
  }),
  "get_api_admin_v1_notifications_unread_count": defineOperation<AdminOperationInput<"get_api_admin_v1_notifications_unread_count">, AdminOperationOutput<"get_api_admin_v1_notifications_unread_count">>({
    id: "get_api_admin_v1_notifications_unread_count",
    method: "GET",
    path: "/api/admin/v1/notifications/unread-count",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_notifications_unread_count">>(responseDataSchemas["get_api_admin_v1_notifications_unread_count"]),
    telemetryName: "admin.get.api.admin.v1.notifications.unread.count",
  }),
  "get_api_admin_v1_operation_logs": defineOperation<AdminOperationInput<"get_api_admin_v1_operation_logs">, AdminOperationOutput<"get_api_admin_v1_operation_logs">>({
    id: "get_api_admin_v1_operation_logs",
    method: "GET",
    path: "/api/admin/v1/operation-logs",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_operation_logs">>(responseDataSchemas["get_api_admin_v1_operation_logs"]),
    telemetryName: "admin.get.api.admin.v1.operation.logs",
    encode: (input) => input,
  }),
  "get_api_admin_v1_operation_logs_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_operation_logs_page_init">, AdminOperationOutput<"get_api_admin_v1_operation_logs_page_init">>({
    id: "get_api_admin_v1_operation_logs_page_init",
    method: "GET",
    path: "/api/admin/v1/operation-logs/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_operation_logs_page_init">>(responseDataSchemas["get_api_admin_v1_operation_logs_page_init"]),
    telemetryName: "admin.get.api.admin.v1.operation.logs.page.init",
  }),
  "get_api_admin_v1_payment_configs": defineOperation<AdminOperationInput<"get_api_admin_v1_payment_configs">, AdminOperationOutput<"get_api_admin_v1_payment_configs">>({
    id: "get_api_admin_v1_payment_configs",
    method: "GET",
    path: "/api/admin/v1/payment/configs",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_payment_configs">>(responseDataSchemas["get_api_admin_v1_payment_configs"]),
    telemetryName: "admin.get.api.admin.v1.payment.configs",
    encode: (input) => input,
  }),
  "get_api_admin_v1_payment_configs_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_payment_configs_page_init">, AdminOperationOutput<"get_api_admin_v1_payment_configs_page_init">>({
    id: "get_api_admin_v1_payment_configs_page_init",
    method: "GET",
    path: "/api/admin/v1/payment/configs/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_payment_configs_page_init">>(responseDataSchemas["get_api_admin_v1_payment_configs_page_init"]),
    telemetryName: "admin.get.api.admin.v1.payment.configs.page.init",
  }),
  "get_api_admin_v1_payment_ledger": defineOperation<AdminOperationInput<"get_api_admin_v1_payment_ledger">, AdminOperationOutput<"get_api_admin_v1_payment_ledger">>({
    id: "get_api_admin_v1_payment_ledger",
    method: "GET",
    path: "/api/admin/v1/payment/ledger",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_payment_ledger">>(responseDataSchemas["get_api_admin_v1_payment_ledger"]),
    telemetryName: "admin.get.api.admin.v1.payment.ledger",
    encode: (input) => input,
  }),
  "get_api_admin_v1_payment_ledger_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_payment_ledger_page_init">, AdminOperationOutput<"get_api_admin_v1_payment_ledger_page_init">>({
    id: "get_api_admin_v1_payment_ledger_page_init",
    method: "GET",
    path: "/api/admin/v1/payment/ledger/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_payment_ledger_page_init">>(responseDataSchemas["get_api_admin_v1_payment_ledger_page_init"]),
    telemetryName: "admin.get.api.admin.v1.payment.ledger.page.init",
  }),
  "get_api_admin_v1_payment_recharges": defineOperation<AdminOperationInput<"get_api_admin_v1_payment_recharges">, AdminOperationOutput<"get_api_admin_v1_payment_recharges">>({
    id: "get_api_admin_v1_payment_recharges",
    method: "GET",
    path: "/api/admin/v1/payment/recharges",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_payment_recharges">>(responseDataSchemas["get_api_admin_v1_payment_recharges"]),
    telemetryName: "admin.get.api.admin.v1.payment.recharges",
    encode: (input) => input,
  }),
  "get_api_admin_v1_payment_recharges_id": defineOperation<AdminOperationInput<"get_api_admin_v1_payment_recharges_id">, AdminOperationOutput<"get_api_admin_v1_payment_recharges_id">>({
    id: "get_api_admin_v1_payment_recharges_id",
    method: "GET",
    path: "/api/admin/v1/payment/recharges/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_payment_recharges_id">>(responseDataSchemas["get_api_admin_v1_payment_recharges_id"]),
    telemetryName: "admin.get.api.admin.v1.payment.recharges.id",
    encode: (input) => input,
  }),
  "get_api_admin_v1_payment_recharges_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_payment_recharges_page_init">, AdminOperationOutput<"get_api_admin_v1_payment_recharges_page_init">>({
    id: "get_api_admin_v1_payment_recharges_page_init",
    method: "GET",
    path: "/api/admin/v1/payment/recharges/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_payment_recharges_page_init">>(responseDataSchemas["get_api_admin_v1_payment_recharges_page_init"]),
    telemetryName: "admin.get.api.admin.v1.payment.recharges.page.init",
  }),
  "get_api_admin_v1_payment_wallets": defineOperation<AdminOperationInput<"get_api_admin_v1_payment_wallets">, AdminOperationOutput<"get_api_admin_v1_payment_wallets">>({
    id: "get_api_admin_v1_payment_wallets",
    method: "GET",
    path: "/api/admin/v1/payment/wallets",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_payment_wallets">>(responseDataSchemas["get_api_admin_v1_payment_wallets"]),
    telemetryName: "admin.get.api.admin.v1.payment.wallets",
    encode: (input) => input,
  }),
  "get_api_admin_v1_payment_wallets_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_payment_wallets_page_init">, AdminOperationOutput<"get_api_admin_v1_payment_wallets_page_init">>({
    id: "get_api_admin_v1_payment_wallets_page_init",
    method: "GET",
    path: "/api/admin/v1/payment/wallets/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_payment_wallets_page_init">>(responseDataSchemas["get_api_admin_v1_payment_wallets_page_init"]),
    telemetryName: "admin.get.api.admin.v1.payment.wallets.page.init",
  }),
  "get_api_admin_v1_permissions": defineOperation<AdminOperationInput<"get_api_admin_v1_permissions">, AdminOperationOutput<"get_api_admin_v1_permissions">>({
    id: "get_api_admin_v1_permissions",
    method: "GET",
    path: "/api/admin/v1/permissions",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_permissions">>(responseDataSchemas["get_api_admin_v1_permissions"]),
    telemetryName: "admin.get.api.admin.v1.permissions",
    encode: (input) => input,
  }),
  "get_api_admin_v1_permissions_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_permissions_page_init">, AdminOperationOutput<"get_api_admin_v1_permissions_page_init">>({
    id: "get_api_admin_v1_permissions_page_init",
    method: "GET",
    path: "/api/admin/v1/permissions/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_permissions_page_init">>(responseDataSchemas["get_api_admin_v1_permissions_page_init"]),
    telemetryName: "admin.get.api.admin.v1.permissions.page.init",
  }),
  "get_api_admin_v1_profile": defineOperation<AdminOperationInput<"get_api_admin_v1_profile">, AdminOperationOutput<"get_api_admin_v1_profile">>({
    id: "get_api_admin_v1_profile",
    method: "GET",
    path: "/api/admin/v1/profile",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_profile">>(responseDataSchemas["get_api_admin_v1_profile"]),
    telemetryName: "admin.get.api.admin.v1.profile",
  }),
  "get_api_admin_v1_roles": defineOperation<AdminOperationInput<"get_api_admin_v1_roles">, AdminOperationOutput<"get_api_admin_v1_roles">>({
    id: "get_api_admin_v1_roles",
    method: "GET",
    path: "/api/admin/v1/roles",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_roles">>(responseDataSchemas["get_api_admin_v1_roles"]),
    telemetryName: "admin.get.api.admin.v1.roles",
    encode: (input) => input,
  }),
  "get_api_admin_v1_roles_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_roles_page_init">, AdminOperationOutput<"get_api_admin_v1_roles_page_init">>({
    id: "get_api_admin_v1_roles_page_init",
    method: "GET",
    path: "/api/admin/v1/roles/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_roles_page_init">>(responseDataSchemas["get_api_admin_v1_roles_page_init"]),
    telemetryName: "admin.get.api.admin.v1.roles.page.init",
  }),
  "get_api_admin_v1_sms_config": defineOperation<AdminOperationInput<"get_api_admin_v1_sms_config">, AdminOperationOutput<"get_api_admin_v1_sms_config">>({
    id: "get_api_admin_v1_sms_config",
    method: "GET",
    path: "/api/admin/v1/sms/config",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_sms_config">>(responseDataSchemas["get_api_admin_v1_sms_config"]),
    telemetryName: "admin.get.api.admin.v1.sms.config",
  }),
  "get_api_admin_v1_sms_logs": defineOperation<AdminOperationInput<"get_api_admin_v1_sms_logs">, AdminOperationOutput<"get_api_admin_v1_sms_logs">>({
    id: "get_api_admin_v1_sms_logs",
    method: "GET",
    path: "/api/admin/v1/sms/logs",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_sms_logs">>(responseDataSchemas["get_api_admin_v1_sms_logs"]),
    telemetryName: "admin.get.api.admin.v1.sms.logs",
    encode: (input) => input,
  }),
  "get_api_admin_v1_sms_logs_id": defineOperation<AdminOperationInput<"get_api_admin_v1_sms_logs_id">, AdminOperationOutput<"get_api_admin_v1_sms_logs_id">>({
    id: "get_api_admin_v1_sms_logs_id",
    method: "GET",
    path: "/api/admin/v1/sms/logs/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_sms_logs_id">>(responseDataSchemas["get_api_admin_v1_sms_logs_id"]),
    telemetryName: "admin.get.api.admin.v1.sms.logs.id",
    encode: (input) => input,
  }),
  "get_api_admin_v1_sms_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_sms_page_init">, AdminOperationOutput<"get_api_admin_v1_sms_page_init">>({
    id: "get_api_admin_v1_sms_page_init",
    method: "GET",
    path: "/api/admin/v1/sms/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_sms_page_init">>(responseDataSchemas["get_api_admin_v1_sms_page_init"]),
    telemetryName: "admin.get.api.admin.v1.sms.page.init",
  }),
  "get_api_admin_v1_sms_templates": defineOperation<AdminOperationInput<"get_api_admin_v1_sms_templates">, AdminOperationOutput<"get_api_admin_v1_sms_templates">>({
    id: "get_api_admin_v1_sms_templates",
    method: "GET",
    path: "/api/admin/v1/sms/templates",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_sms_templates">>(responseDataSchemas["get_api_admin_v1_sms_templates"]),
    telemetryName: "admin.get.api.admin.v1.sms.templates",
  }),
  "get_api_admin_v1_system_logs_files": defineOperation<AdminOperationInput<"get_api_admin_v1_system_logs_files">, AdminOperationOutput<"get_api_admin_v1_system_logs_files">>({
    id: "get_api_admin_v1_system_logs_files",
    method: "GET",
    path: "/api/admin/v1/system-logs/files",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_system_logs_files">>(responseDataSchemas["get_api_admin_v1_system_logs_files"]),
    telemetryName: "admin.get.api.admin.v1.system.logs.files",
  }),
  "get_api_admin_v1_system_logs_files_name_lines": defineOperation<AdminOperationInput<"get_api_admin_v1_system_logs_files_name_lines">, AdminOperationOutput<"get_api_admin_v1_system_logs_files_name_lines">>({
    id: "get_api_admin_v1_system_logs_files_name_lines",
    method: "GET",
    path: "/api/admin/v1/system-logs/files/{name}/lines",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_system_logs_files_name_lines">>(responseDataSchemas["get_api_admin_v1_system_logs_files_name_lines"]),
    telemetryName: "admin.get.api.admin.v1.system.logs.files.name.lines",
    encode: (input) => input,
  }),
  "get_api_admin_v1_system_logs_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_system_logs_page_init">, AdminOperationOutput<"get_api_admin_v1_system_logs_page_init">>({
    id: "get_api_admin_v1_system_logs_page_init",
    method: "GET",
    path: "/api/admin/v1/system-logs/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_system_logs_page_init">>(responseDataSchemas["get_api_admin_v1_system_logs_page_init"]),
    telemetryName: "admin.get.api.admin.v1.system.logs.page.init",
  }),
  "get_api_admin_v1_system_settings": defineOperation<AdminOperationInput<"get_api_admin_v1_system_settings">, AdminOperationOutput<"get_api_admin_v1_system_settings">>({
    id: "get_api_admin_v1_system_settings",
    method: "GET",
    path: "/api/admin/v1/system-settings",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_system_settings">>(responseDataSchemas["get_api_admin_v1_system_settings"]),
    telemetryName: "admin.get.api.admin.v1.system.settings",
    encode: (input) => input,
  }),
  "get_api_admin_v1_system_settings_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_system_settings_page_init">, AdminOperationOutput<"get_api_admin_v1_system_settings_page_init">>({
    id: "get_api_admin_v1_system_settings_page_init",
    method: "GET",
    path: "/api/admin/v1/system-settings/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_system_settings_page_init">>(responseDataSchemas["get_api_admin_v1_system_settings_page_init"]),
    telemetryName: "admin.get.api.admin.v1.system.settings.page.init",
  }),
  "get_api_admin_v1_upload_drivers": defineOperation<AdminOperationInput<"get_api_admin_v1_upload_drivers">, AdminOperationOutput<"get_api_admin_v1_upload_drivers">>({
    id: "get_api_admin_v1_upload_drivers",
    method: "GET",
    path: "/api/admin/v1/upload-drivers",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_upload_drivers">>(responseDataSchemas["get_api_admin_v1_upload_drivers"]),
    telemetryName: "admin.get.api.admin.v1.upload.drivers",
    encode: (input) => input,
  }),
  "get_api_admin_v1_upload_drivers_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_upload_drivers_page_init">, AdminOperationOutput<"get_api_admin_v1_upload_drivers_page_init">>({
    id: "get_api_admin_v1_upload_drivers_page_init",
    method: "GET",
    path: "/api/admin/v1/upload-drivers/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_upload_drivers_page_init">>(responseDataSchemas["get_api_admin_v1_upload_drivers_page_init"]),
    telemetryName: "admin.get.api.admin.v1.upload.drivers.page.init",
  }),
  "get_api_admin_v1_upload_rules": defineOperation<AdminOperationInput<"get_api_admin_v1_upload_rules">, AdminOperationOutput<"get_api_admin_v1_upload_rules">>({
    id: "get_api_admin_v1_upload_rules",
    method: "GET",
    path: "/api/admin/v1/upload-rules",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_upload_rules">>(responseDataSchemas["get_api_admin_v1_upload_rules"]),
    telemetryName: "admin.get.api.admin.v1.upload.rules",
    encode: (input) => input,
  }),
  "get_api_admin_v1_upload_rules_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_upload_rules_page_init">, AdminOperationOutput<"get_api_admin_v1_upload_rules_page_init">>({
    id: "get_api_admin_v1_upload_rules_page_init",
    method: "GET",
    path: "/api/admin/v1/upload-rules/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_upload_rules_page_init">>(responseDataSchemas["get_api_admin_v1_upload_rules_page_init"]),
    telemetryName: "admin.get.api.admin.v1.upload.rules.page.init",
  }),
  "get_api_admin_v1_upload_settings": defineOperation<AdminOperationInput<"get_api_admin_v1_upload_settings">, AdminOperationOutput<"get_api_admin_v1_upload_settings">>({
    id: "get_api_admin_v1_upload_settings",
    method: "GET",
    path: "/api/admin/v1/upload-settings",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_upload_settings">>(responseDataSchemas["get_api_admin_v1_upload_settings"]),
    telemetryName: "admin.get.api.admin.v1.upload.settings",
    encode: (input) => input,
  }),
  "get_api_admin_v1_upload_settings_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_upload_settings_page_init">, AdminOperationOutput<"get_api_admin_v1_upload_settings_page_init">>({
    id: "get_api_admin_v1_upload_settings_page_init",
    method: "GET",
    path: "/api/admin/v1/upload-settings/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_upload_settings_page_init">>(responseDataSchemas["get_api_admin_v1_upload_settings_page_init"]),
    telemetryName: "admin.get.api.admin.v1.upload.settings.page.init",
  }),
  "get_api_admin_v1_user_sessions": defineOperation<AdminOperationInput<"get_api_admin_v1_user_sessions">, AdminOperationOutput<"get_api_admin_v1_user_sessions">>({
    id: "get_api_admin_v1_user_sessions",
    method: "GET",
    path: "/api/admin/v1/user-sessions",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_user_sessions">>(responseDataSchemas["get_api_admin_v1_user_sessions"]),
    telemetryName: "admin.get.api.admin.v1.user.sessions",
    encode: (input) => input,
  }),
  "get_api_admin_v1_user_sessions_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_user_sessions_page_init">, AdminOperationOutput<"get_api_admin_v1_user_sessions_page_init">>({
    id: "get_api_admin_v1_user_sessions_page_init",
    method: "GET",
    path: "/api/admin/v1/user-sessions/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_user_sessions_page_init">>(responseDataSchemas["get_api_admin_v1_user_sessions_page_init"]),
    telemetryName: "admin.get.api.admin.v1.user.sessions.page.init",
  }),
  "get_api_admin_v1_user_sessions_stats": defineOperation<AdminOperationInput<"get_api_admin_v1_user_sessions_stats">, AdminOperationOutput<"get_api_admin_v1_user_sessions_stats">>({
    id: "get_api_admin_v1_user_sessions_stats",
    method: "GET",
    path: "/api/admin/v1/user-sessions/stats",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_user_sessions_stats">>(responseDataSchemas["get_api_admin_v1_user_sessions_stats"]),
    telemetryName: "admin.get.api.admin.v1.user.sessions.stats",
  }),
  "get_api_admin_v1_users": defineOperation<AdminOperationInput<"get_api_admin_v1_users">, AdminOperationOutput<"get_api_admin_v1_users">>({
    id: "get_api_admin_v1_users",
    method: "GET",
    path: "/api/admin/v1/users",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_users">>(responseDataSchemas["get_api_admin_v1_users"]),
    telemetryName: "admin.get.api.admin.v1.users",
    encode: (input) => input,
  }),
  "get_api_admin_v1_users_id_profile": defineOperation<AdminOperationInput<"get_api_admin_v1_users_id_profile">, AdminOperationOutput<"get_api_admin_v1_users_id_profile">>({
    id: "get_api_admin_v1_users_id_profile",
    method: "GET",
    path: "/api/admin/v1/users/{id}/profile",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_users_id_profile">>(responseDataSchemas["get_api_admin_v1_users_id_profile"]),
    telemetryName: "admin.get.api.admin.v1.users.id.profile",
    encode: (input) => input,
  }),
  "get_api_admin_v1_users_login_logs": defineOperation<AdminOperationInput<"get_api_admin_v1_users_login_logs">, AdminOperationOutput<"get_api_admin_v1_users_login_logs">>({
    id: "get_api_admin_v1_users_login_logs",
    method: "GET",
    path: "/api/admin/v1/users/login-logs",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_users_login_logs">>(responseDataSchemas["get_api_admin_v1_users_login_logs"]),
    telemetryName: "admin.get.api.admin.v1.users.login.logs",
    encode: (input) => input,
  }),
  "get_api_admin_v1_users_login_logs_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_users_login_logs_page_init">, AdminOperationOutput<"get_api_admin_v1_users_login_logs_page_init">>({
    id: "get_api_admin_v1_users_login_logs_page_init",
    method: "GET",
    path: "/api/admin/v1/users/login-logs/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_users_login_logs_page_init">>(responseDataSchemas["get_api_admin_v1_users_login_logs_page_init"]),
    telemetryName: "admin.get.api.admin.v1.users.login.logs.page.init",
  }),
  "get_api_admin_v1_users_page_init": defineOperation<AdminOperationInput<"get_api_admin_v1_users_page_init">, AdminOperationOutput<"get_api_admin_v1_users_page_init">>({
    id: "get_api_admin_v1_users_page_init",
    method: "GET",
    path: "/api/admin/v1/users/page-init",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_users_page_init">>(responseDataSchemas["get_api_admin_v1_users_page_init"]),
    telemetryName: "admin.get.api.admin.v1.users.page.init",
  }),
  "get_api_admin_v1_wallet_summary": defineOperation<AdminOperationInput<"get_api_admin_v1_wallet_summary">, AdminOperationOutput<"get_api_admin_v1_wallet_summary">>({
    id: "get_api_admin_v1_wallet_summary",
    method: "GET",
    path: "/api/admin/v1/wallet/summary",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_wallet_summary">>(responseDataSchemas["get_api_admin_v1_wallet_summary"]),
    telemetryName: "admin.get.api.admin.v1.wallet.summary",
  }),
  "get_api_admin_v1_wallet_transactions": defineOperation<AdminOperationInput<"get_api_admin_v1_wallet_transactions">, AdminOperationOutput<"get_api_admin_v1_wallet_transactions">>({
    id: "get_api_admin_v1_wallet_transactions",
    method: "GET",
    path: "/api/admin/v1/wallet/transactions",
    auth: "required",
    timeout: "interactive",
    replay: "safe",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"get_api_admin_v1_wallet_transactions">>(responseDataSchemas["get_api_admin_v1_wallet_transactions"]),
    telemetryName: "admin.get.api.admin.v1.wallet.transactions",
    encode: (input) => input,
  }),
  "patch_api_admin_v1_ai_agents_id_status": defineOperation<AdminOperationInput<"patch_api_admin_v1_ai_agents_id_status">, AdminOperationOutput<"patch_api_admin_v1_ai_agents_id_status">>({
    id: "patch_api_admin_v1_ai_agents_id_status",
    method: "PATCH",
    path: "/api/admin/v1/ai-agents/{id}/status",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_ai_agents_id_status">>(responseDataSchemas["patch_api_admin_v1_ai_agents_id_status"]),
    telemetryName: "admin.patch.api.admin.v1.ai.agents.id.status",
    encode: (input) => input,
  }),
  "patch_api_admin_v1_ai_knowledge_bases_id_status": defineOperation<AdminOperationInput<"patch_api_admin_v1_ai_knowledge_bases_id_status">, AdminOperationOutput<"patch_api_admin_v1_ai_knowledge_bases_id_status">>({
    id: "patch_api_admin_v1_ai_knowledge_bases_id_status",
    method: "PATCH",
    path: "/api/admin/v1/ai-knowledge-bases/{id}/status",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_ai_knowledge_bases_id_status">>(responseDataSchemas["patch_api_admin_v1_ai_knowledge_bases_id_status"]),
    telemetryName: "admin.patch.api.admin.v1.ai.knowledge.bases.id.status",
    encode: (input) => input,
  }),
  "patch_api_admin_v1_ai_knowledge_documents_id_status": defineOperation<AdminOperationInput<"patch_api_admin_v1_ai_knowledge_documents_id_status">, AdminOperationOutput<"patch_api_admin_v1_ai_knowledge_documents_id_status">>({
    id: "patch_api_admin_v1_ai_knowledge_documents_id_status",
    method: "PATCH",
    path: "/api/admin/v1/ai-knowledge-documents/{id}/status",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_ai_knowledge_documents_id_status">>(responseDataSchemas["patch_api_admin_v1_ai_knowledge_documents_id_status"]),
    telemetryName: "admin.patch.api.admin.v1.ai.knowledge.documents.id.status",
    encode: (input) => input,
  }),
  "patch_api_admin_v1_ai_providers_id_status": defineOperation<AdminOperationInput<"patch_api_admin_v1_ai_providers_id_status">, AdminOperationOutput<"patch_api_admin_v1_ai_providers_id_status">>({
    id: "patch_api_admin_v1_ai_providers_id_status",
    method: "PATCH",
    path: "/api/admin/v1/ai-providers/{id}/status",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_ai_providers_id_status">>(responseDataSchemas["patch_api_admin_v1_ai_providers_id_status"]),
    telemetryName: "admin.patch.api.admin.v1.ai.providers.id.status",
    encode: (input) => input,
  }),
  "patch_api_admin_v1_ai_tools_id_status": defineOperation<AdminOperationInput<"patch_api_admin_v1_ai_tools_id_status">, AdminOperationOutput<"patch_api_admin_v1_ai_tools_id_status">>({
    id: "patch_api_admin_v1_ai_tools_id_status",
    method: "PATCH",
    path: "/api/admin/v1/ai-tools/{id}/status",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_ai_tools_id_status">>(responseDataSchemas["patch_api_admin_v1_ai_tools_id_status"]),
    telemetryName: "admin.patch.api.admin.v1.ai.tools.id.status",
    encode: (input) => input,
  }),
  "patch_api_admin_v1_auth_platforms_id_status": defineOperation<AdminOperationInput<"patch_api_admin_v1_auth_platforms_id_status">, AdminOperationOutput<"patch_api_admin_v1_auth_platforms_id_status">>({
    id: "patch_api_admin_v1_auth_platforms_id_status",
    method: "PATCH",
    path: "/api/admin/v1/auth-platforms/{id}/status",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_auth_platforms_id_status">>(responseDataSchemas["patch_api_admin_v1_auth_platforms_id_status"]),
    telemetryName: "admin.patch.api.admin.v1.auth.platforms.id.status",
    encode: (input) => input,
  }),
  "patch_api_admin_v1_cron_tasks_id_status": defineOperation<AdminOperationInput<"patch_api_admin_v1_cron_tasks_id_status">, AdminOperationOutput<"patch_api_admin_v1_cron_tasks_id_status">>({
    id: "patch_api_admin_v1_cron_tasks_id_status",
    method: "PATCH",
    path: "/api/admin/v1/cron-tasks/{id}/status",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_cron_tasks_id_status">>(responseDataSchemas["patch_api_admin_v1_cron_tasks_id_status"]),
    telemetryName: "admin.patch.api.admin.v1.cron.tasks.id.status",
    encode: (input) => input,
  }),
  "patch_api_admin_v1_mail_templates_id_status": defineOperation<AdminOperationInput<"patch_api_admin_v1_mail_templates_id_status">, AdminOperationOutput<"patch_api_admin_v1_mail_templates_id_status">>({
    id: "patch_api_admin_v1_mail_templates_id_status",
    method: "PATCH",
    path: "/api/admin/v1/mail/templates/{id}/status",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_mail_templates_id_status">>(responseDataSchemas["patch_api_admin_v1_mail_templates_id_status"]),
    telemetryName: "admin.patch.api.admin.v1.mail.templates.id.status",
    encode: (input) => input,
  }),
  "patch_api_admin_v1_notification_tasks_id_cancel": defineOperation<AdminOperationInput<"patch_api_admin_v1_notification_tasks_id_cancel">, AdminOperationOutput<"patch_api_admin_v1_notification_tasks_id_cancel">>({
    id: "patch_api_admin_v1_notification_tasks_id_cancel",
    method: "PATCH",
    path: "/api/admin/v1/notification-tasks/{id}/cancel",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_notification_tasks_id_cancel">>(responseDataSchemas["patch_api_admin_v1_notification_tasks_id_cancel"]),
    telemetryName: "admin.patch.api.admin.v1.notification.tasks.id.cancel",
    encode: (input) => input,
  }),
  "patch_api_admin_v1_notifications_id_read": defineOperation<AdminOperationInput<"patch_api_admin_v1_notifications_id_read">, AdminOperationOutput<"patch_api_admin_v1_notifications_id_read">>({
    id: "patch_api_admin_v1_notifications_id_read",
    method: "PATCH",
    path: "/api/admin/v1/notifications/{id}/read",
    auth: "required",
    timeout: "interactive",
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
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_notifications_read">>(responseDataSchemas["patch_api_admin_v1_notifications_read"]),
    telemetryName: "admin.patch.api.admin.v1.notifications.read",
    encode: (input) => input,
  }),
  "patch_api_admin_v1_payment_configs_id_status": defineOperation<AdminOperationInput<"patch_api_admin_v1_payment_configs_id_status">, AdminOperationOutput<"patch_api_admin_v1_payment_configs_id_status">>({
    id: "patch_api_admin_v1_payment_configs_id_status",
    method: "PATCH",
    path: "/api/admin/v1/payment/configs/{id}/status",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_payment_configs_id_status">>(responseDataSchemas["patch_api_admin_v1_payment_configs_id_status"]),
    telemetryName: "admin.patch.api.admin.v1.payment.configs.id.status",
    encode: (input) => input,
  }),
  "patch_api_admin_v1_permissions_id_status": defineOperation<AdminOperationInput<"patch_api_admin_v1_permissions_id_status">, AdminOperationOutput<"patch_api_admin_v1_permissions_id_status">>({
    id: "patch_api_admin_v1_permissions_id_status",
    method: "PATCH",
    path: "/api/admin/v1/permissions/{id}/status",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_permissions_id_status">>(responseDataSchemas["patch_api_admin_v1_permissions_id_status"]),
    telemetryName: "admin.patch.api.admin.v1.permissions.id.status",
    encode: (input) => input,
  }),
  "patch_api_admin_v1_roles_id_default": defineOperation<AdminOperationInput<"patch_api_admin_v1_roles_id_default">, AdminOperationOutput<"patch_api_admin_v1_roles_id_default">>({
    id: "patch_api_admin_v1_roles_id_default",
    method: "PATCH",
    path: "/api/admin/v1/roles/{id}/default",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_roles_id_default">>(responseDataSchemas["patch_api_admin_v1_roles_id_default"]),
    telemetryName: "admin.patch.api.admin.v1.roles.id.default",
    encode: (input) => input,
  }),
  "patch_api_admin_v1_sms_templates_id_status": defineOperation<AdminOperationInput<"patch_api_admin_v1_sms_templates_id_status">, AdminOperationOutput<"patch_api_admin_v1_sms_templates_id_status">>({
    id: "patch_api_admin_v1_sms_templates_id_status",
    method: "PATCH",
    path: "/api/admin/v1/sms/templates/{id}/status",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_sms_templates_id_status">>(responseDataSchemas["patch_api_admin_v1_sms_templates_id_status"]),
    telemetryName: "admin.patch.api.admin.v1.sms.templates.id.status",
    encode: (input) => input,
  }),
  "patch_api_admin_v1_system_settings_id_status": defineOperation<AdminOperationInput<"patch_api_admin_v1_system_settings_id_status">, AdminOperationOutput<"patch_api_admin_v1_system_settings_id_status">>({
    id: "patch_api_admin_v1_system_settings_id_status",
    method: "PATCH",
    path: "/api/admin/v1/system-settings/{id}/status",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_system_settings_id_status">>(responseDataSchemas["patch_api_admin_v1_system_settings_id_status"]),
    telemetryName: "admin.patch.api.admin.v1.system.settings.id.status",
    encode: (input) => input,
  }),
  "patch_api_admin_v1_upload_settings_id_status": defineOperation<AdminOperationInput<"patch_api_admin_v1_upload_settings_id_status">, AdminOperationOutput<"patch_api_admin_v1_upload_settings_id_status">>({
    id: "patch_api_admin_v1_upload_settings_id_status",
    method: "PATCH",
    path: "/api/admin/v1/upload-settings/{id}/status",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_upload_settings_id_status">>(responseDataSchemas["patch_api_admin_v1_upload_settings_id_status"]),
    telemetryName: "admin.patch.api.admin.v1.upload.settings.id.status",
    encode: (input) => input,
  }),
  "patch_api_admin_v1_user_sessions_id_revoke": defineOperation<AdminOperationInput<"patch_api_admin_v1_user_sessions_id_revoke">, AdminOperationOutput<"patch_api_admin_v1_user_sessions_id_revoke">>({
    id: "patch_api_admin_v1_user_sessions_id_revoke",
    method: "PATCH",
    path: "/api/admin/v1/user-sessions/{id}/revoke",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_user_sessions_id_revoke">>(responseDataSchemas["patch_api_admin_v1_user_sessions_id_revoke"]),
    telemetryName: "admin.patch.api.admin.v1.user.sessions.id.revoke",
    encode: (input) => input,
  }),
  "patch_api_admin_v1_user_sessions_revoke": defineOperation<AdminOperationInput<"patch_api_admin_v1_user_sessions_revoke">, AdminOperationOutput<"patch_api_admin_v1_user_sessions_revoke">>({
    id: "patch_api_admin_v1_user_sessions_revoke",
    method: "PATCH",
    path: "/api/admin/v1/user-sessions/revoke",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_user_sessions_revoke">>(responseDataSchemas["patch_api_admin_v1_user_sessions_revoke"]),
    telemetryName: "admin.patch.api.admin.v1.user.sessions.revoke",
    encode: (input) => input,
  }),
  "patch_api_admin_v1_users": defineOperation<AdminOperationInput<"patch_api_admin_v1_users">, AdminOperationOutput<"patch_api_admin_v1_users">>({
    id: "patch_api_admin_v1_users",
    method: "PATCH",
    path: "/api/admin/v1/users",
    auth: "required",
    timeout: "interactive",
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
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"patch_api_admin_v1_users_id_status">>(responseDataSchemas["patch_api_admin_v1_users_id_status"]),
    telemetryName: "admin.patch.api.admin.v1.users.id.status",
    encode: (input) => input,
  }),
  "post_api_admin_v1_ai_agents": defineOperation<AdminOperationInput<"post_api_admin_v1_ai_agents">, AdminOperationOutput<"post_api_admin_v1_ai_agents">>({
    id: "post_api_admin_v1_ai_agents",
    method: "POST",
    path: "/api/admin/v1/ai-agents",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_ai_agents">>(responseDataSchemas["post_api_admin_v1_ai_agents"]),
    telemetryName: "admin.post.api.admin.v1.ai.agents",
    encode: (input) => input,
  }),
  "post_api_admin_v1_ai_agents_id_test": defineOperation<AdminOperationInput<"post_api_admin_v1_ai_agents_id_test">, AdminOperationOutput<"post_api_admin_v1_ai_agents_id_test">>({
    id: "post_api_admin_v1_ai_agents_id_test",
    method: "POST",
    path: "/api/admin/v1/ai-agents/{id}/test",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_ai_agents_id_test">>(responseDataSchemas["post_api_admin_v1_ai_agents_id_test"]),
    telemetryName: "admin.post.api.admin.v1.ai.agents.id.test",
    encode: (input) => input,
  }),
  "post_api_admin_v1_ai_conversations": defineOperation<AdminOperationInput<"post_api_admin_v1_ai_conversations">, AdminOperationOutput<"post_api_admin_v1_ai_conversations">>({
    id: "post_api_admin_v1_ai_conversations",
    method: "POST",
    path: "/api/admin/v1/ai-conversations",
    auth: "required",
    timeout: "interactive",
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
    timeout: "interactive",
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
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_ai_conversations_id_messages_cancel">>(responseDataSchemas["post_api_admin_v1_ai_conversations_id_messages_cancel"]),
    telemetryName: "admin.post.api.admin.v1.ai.conversations.id.messages.cancel",
    encode: (input) => input,
  }),
  "post_api_admin_v1_ai_knowledge_bases": defineOperation<AdminOperationInput<"post_api_admin_v1_ai_knowledge_bases">, AdminOperationOutput<"post_api_admin_v1_ai_knowledge_bases">>({
    id: "post_api_admin_v1_ai_knowledge_bases",
    method: "POST",
    path: "/api/admin/v1/ai-knowledge-bases",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_ai_knowledge_bases">>(responseDataSchemas["post_api_admin_v1_ai_knowledge_bases"]),
    telemetryName: "admin.post.api.admin.v1.ai.knowledge.bases",
    encode: (input) => input,
  }),
  "post_api_admin_v1_ai_knowledge_bases_id_documents": defineOperation<AdminOperationInput<"post_api_admin_v1_ai_knowledge_bases_id_documents">, AdminOperationOutput<"post_api_admin_v1_ai_knowledge_bases_id_documents">>({
    id: "post_api_admin_v1_ai_knowledge_bases_id_documents",
    method: "POST",
    path: "/api/admin/v1/ai-knowledge-bases/{id}/documents",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_ai_knowledge_bases_id_documents">>(responseDataSchemas["post_api_admin_v1_ai_knowledge_bases_id_documents"]),
    telemetryName: "admin.post.api.admin.v1.ai.knowledge.bases.id.documents",
    encode: (input) => input,
  }),
  "post_api_admin_v1_ai_knowledge_bases_id_retrieval_tests": defineOperation<AdminOperationInput<"post_api_admin_v1_ai_knowledge_bases_id_retrieval_tests">, AdminOperationOutput<"post_api_admin_v1_ai_knowledge_bases_id_retrieval_tests">>({
    id: "post_api_admin_v1_ai_knowledge_bases_id_retrieval_tests",
    method: "POST",
    path: "/api/admin/v1/ai-knowledge-bases/{id}/retrieval-tests",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_ai_knowledge_bases_id_retrieval_tests">>(responseDataSchemas["post_api_admin_v1_ai_knowledge_bases_id_retrieval_tests"]),
    telemetryName: "admin.post.api.admin.v1.ai.knowledge.bases.id.retrieval.tests",
    encode: (input) => input,
  }),
  "post_api_admin_v1_ai_knowledge_documents_id_reindex": defineOperation<AdminOperationInput<"post_api_admin_v1_ai_knowledge_documents_id_reindex">, AdminOperationOutput<"post_api_admin_v1_ai_knowledge_documents_id_reindex">>({
    id: "post_api_admin_v1_ai_knowledge_documents_id_reindex",
    method: "POST",
    path: "/api/admin/v1/ai-knowledge-documents/{id}/reindex",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_ai_knowledge_documents_id_reindex">>(responseDataSchemas["post_api_admin_v1_ai_knowledge_documents_id_reindex"]),
    telemetryName: "admin.post.api.admin.v1.ai.knowledge.documents.id.reindex",
    encode: (input) => input,
  }),
  "post_api_admin_v1_ai_providers": defineOperation<AdminOperationInput<"post_api_admin_v1_ai_providers">, AdminOperationOutput<"post_api_admin_v1_ai_providers">>({
    id: "post_api_admin_v1_ai_providers",
    method: "POST",
    path: "/api/admin/v1/ai-providers",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_ai_providers">>(responseDataSchemas["post_api_admin_v1_ai_providers"]),
    telemetryName: "admin.post.api.admin.v1.ai.providers",
    encode: (input) => input,
  }),
  "post_api_admin_v1_ai_providers_id_model_options": defineOperation<AdminOperationInput<"post_api_admin_v1_ai_providers_id_model_options">, AdminOperationOutput<"post_api_admin_v1_ai_providers_id_model_options">>({
    id: "post_api_admin_v1_ai_providers_id_model_options",
    method: "POST",
    path: "/api/admin/v1/ai-providers/{id}/model-options",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_ai_providers_id_model_options">>(responseDataSchemas["post_api_admin_v1_ai_providers_id_model_options"]),
    telemetryName: "admin.post.api.admin.v1.ai.providers.id.model.options",
    encode: (input) => input,
  }),
  "post_api_admin_v1_ai_providers_id_sync_models": defineOperation<AdminOperationInput<"post_api_admin_v1_ai_providers_id_sync_models">, AdminOperationOutput<"post_api_admin_v1_ai_providers_id_sync_models">>({
    id: "post_api_admin_v1_ai_providers_id_sync_models",
    method: "POST",
    path: "/api/admin/v1/ai-providers/{id}/sync-models",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_ai_providers_id_sync_models">>(responseDataSchemas["post_api_admin_v1_ai_providers_id_sync_models"]),
    telemetryName: "admin.post.api.admin.v1.ai.providers.id.sync.models",
    encode: (input) => input,
  }),
  "post_api_admin_v1_ai_providers_id_test": defineOperation<AdminOperationInput<"post_api_admin_v1_ai_providers_id_test">, AdminOperationOutput<"post_api_admin_v1_ai_providers_id_test">>({
    id: "post_api_admin_v1_ai_providers_id_test",
    method: "POST",
    path: "/api/admin/v1/ai-providers/{id}/test",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_ai_providers_id_test">>(responseDataSchemas["post_api_admin_v1_ai_providers_id_test"]),
    telemetryName: "admin.post.api.admin.v1.ai.providers.id.test",
    encode: (input) => input,
  }),
  "post_api_admin_v1_ai_providers_model_options": defineOperation<AdminOperationInput<"post_api_admin_v1_ai_providers_model_options">, AdminOperationOutput<"post_api_admin_v1_ai_providers_model_options">>({
    id: "post_api_admin_v1_ai_providers_model_options",
    method: "POST",
    path: "/api/admin/v1/ai-providers/model-options",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_ai_providers_model_options">>(responseDataSchemas["post_api_admin_v1_ai_providers_model_options"]),
    telemetryName: "admin.post.api.admin.v1.ai.providers.model.options",
    encode: (input) => input,
  }),
  "post_api_admin_v1_ai_tools": defineOperation<AdminOperationInput<"post_api_admin_v1_ai_tools">, AdminOperationOutput<"post_api_admin_v1_ai_tools">>({
    id: "post_api_admin_v1_ai_tools",
    method: "POST",
    path: "/api/admin/v1/ai-tools",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_ai_tools">>(responseDataSchemas["post_api_admin_v1_ai_tools"]),
    telemetryName: "admin.post.api.admin.v1.ai.tools",
    encode: (input) => input,
  }),
  "post_api_admin_v1_ai_tools_generate_draft": defineOperation<AdminOperationInput<"post_api_admin_v1_ai_tools_generate_draft">, AdminOperationOutput<"post_api_admin_v1_ai_tools_generate_draft">>({
    id: "post_api_admin_v1_ai_tools_generate_draft",
    method: "POST",
    path: "/api/admin/v1/ai-tools/generate-draft",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_ai_tools_generate_draft">>(responseDataSchemas["post_api_admin_v1_ai_tools_generate_draft"]),
    telemetryName: "admin.post.api.admin.v1.ai.tools.generate.draft",
    encode: (input) => input,
  }),
  "post_api_admin_v1_auth_forgot_password": defineOperation<AdminOperationInput<"post_api_admin_v1_auth_forgot_password">, AdminOperationOutput<"post_api_admin_v1_auth_forgot_password">>({
    id: "post_api_admin_v1_auth_forgot_password",
    method: "POST",
    path: "/api/admin/v1/auth/forgot-password",
    auth: "public",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_auth_forgot_password">>(responseDataSchemas["post_api_admin_v1_auth_forgot_password"]),
    telemetryName: "admin.post.api.admin.v1.auth.forgot.password",
    encode: (input) => input,
  }),
  "post_api_admin_v1_auth_login": defineOperation<AdminOperationInput<"post_api_admin_v1_auth_login">, AdminOperationOutput<"post_api_admin_v1_auth_login">>({
    id: "post_api_admin_v1_auth_login",
    method: "POST",
    path: "/api/admin/v1/auth/login",
    auth: "public",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_auth_login">>(responseDataSchemas["post_api_admin_v1_auth_login"]),
    telemetryName: "admin.post.api.admin.v1.auth.login",
    encode: (input) => input,
  }),
  "post_api_admin_v1_auth_logout": defineOperation<AdminOperationInput<"post_api_admin_v1_auth_logout">, AdminOperationOutput<"post_api_admin_v1_auth_logout">>({
    id: "post_api_admin_v1_auth_logout",
    method: "POST",
    path: "/api/admin/v1/auth/logout",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_auth_logout">>(responseDataSchemas["post_api_admin_v1_auth_logout"]),
    telemetryName: "admin.post.api.admin.v1.auth.logout",
  }),
  "post_api_admin_v1_auth_platforms": defineOperation<AdminOperationInput<"post_api_admin_v1_auth_platforms">, AdminOperationOutput<"post_api_admin_v1_auth_platforms">>({
    id: "post_api_admin_v1_auth_platforms",
    method: "POST",
    path: "/api/admin/v1/auth-platforms",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_auth_platforms">>(responseDataSchemas["post_api_admin_v1_auth_platforms"]),
    telemetryName: "admin.post.api.admin.v1.auth.platforms",
    encode: (input) => input,
  }),
  "post_api_admin_v1_auth_queue_monitor_grants": defineOperation<AdminOperationInput<"post_api_admin_v1_auth_queue_monitor_grants">, AdminOperationOutput<"post_api_admin_v1_auth_queue_monitor_grants">>({
    id: "post_api_admin_v1_auth_queue_monitor_grants",
    method: "POST",
    path: "/api/admin/v1/auth/queue-monitor-grants",
    auth: "required",
    timeout: "interactive",
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
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_auth_realtime_tickets">>(responseDataSchemas["post_api_admin_v1_auth_realtime_tickets"]),
    telemetryName: "admin.post.api.admin.v1.auth.realtime.tickets",
    encode: (input) => input,
  }),
  "post_api_admin_v1_auth_refresh": defineOperation<AdminOperationInput<"post_api_admin_v1_auth_refresh">, AdminOperationOutput<"post_api_admin_v1_auth_refresh">>({
    id: "post_api_admin_v1_auth_refresh",
    method: "POST",
    path: "/api/admin/v1/auth/refresh",
    auth: "public",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_auth_refresh">>(responseDataSchemas["post_api_admin_v1_auth_refresh"]),
    telemetryName: "admin.post.api.admin.v1.auth.refresh",
  }),
  "post_api_admin_v1_auth_send_code": defineOperation<AdminOperationInput<"post_api_admin_v1_auth_send_code">, AdminOperationOutput<"post_api_admin_v1_auth_send_code">>({
    id: "post_api_admin_v1_auth_send_code",
    method: "POST",
    path: "/api/admin/v1/auth/send-code",
    auth: "public",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_auth_send_code">>(responseDataSchemas["post_api_admin_v1_auth_send_code"]),
    telemetryName: "admin.post.api.admin.v1.auth.send.code",
    encode: (input) => input,
  }),
  "post_api_admin_v1_cron_tasks": defineOperation<AdminOperationInput<"post_api_admin_v1_cron_tasks">, AdminOperationOutput<"post_api_admin_v1_cron_tasks">>({
    id: "post_api_admin_v1_cron_tasks",
    method: "POST",
    path: "/api/admin/v1/cron-tasks",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_cron_tasks">>(responseDataSchemas["post_api_admin_v1_cron_tasks"]),
    telemetryName: "admin.post.api.admin.v1.cron.tasks",
    encode: (input) => input,
  }),
  "post_api_admin_v1_mail_templates": defineOperation<AdminOperationInput<"post_api_admin_v1_mail_templates">, AdminOperationOutput<"post_api_admin_v1_mail_templates">>({
    id: "post_api_admin_v1_mail_templates",
    method: "POST",
    path: "/api/admin/v1/mail/templates",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_mail_templates">>(responseDataSchemas["post_api_admin_v1_mail_templates"]),
    telemetryName: "admin.post.api.admin.v1.mail.templates",
    encode: (input) => input,
  }),
  "post_api_admin_v1_mail_test": defineOperation<AdminOperationInput<"post_api_admin_v1_mail_test">, AdminOperationOutput<"post_api_admin_v1_mail_test">>({
    id: "post_api_admin_v1_mail_test",
    method: "POST",
    path: "/api/admin/v1/mail/test",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_mail_test">>(responseDataSchemas["post_api_admin_v1_mail_test"]),
    telemetryName: "admin.post.api.admin.v1.mail.test",
    encode: (input) => input,
  }),
  "post_api_admin_v1_notification_tasks": defineOperation<AdminOperationInput<"post_api_admin_v1_notification_tasks">, AdminOperationOutput<"post_api_admin_v1_notification_tasks">>({
    id: "post_api_admin_v1_notification_tasks",
    method: "POST",
    path: "/api/admin/v1/notification-tasks",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_notification_tasks">>(responseDataSchemas["post_api_admin_v1_notification_tasks"]),
    telemetryName: "admin.post.api.admin.v1.notification.tasks",
    encode: (input) => input,
  }),
  "post_api_admin_v1_payment_certificates": defineOperation<AdminOperationInput<"post_api_admin_v1_payment_certificates">, AdminOperationOutput<"post_api_admin_v1_payment_certificates">>({
    id: "post_api_admin_v1_payment_certificates",
    method: "POST",
    path: "/api/admin/v1/payment/certificates",
    auth: "required",
    timeout: "upload",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_payment_certificates">>(responseDataSchemas["post_api_admin_v1_payment_certificates"]),
    telemetryName: "admin.post.api.admin.v1.payment.certificates",
    encode: (input) => ({
      ...input,
      body: encode_post_api_admin_v1_payment_certificates_multipart(input.body),
    }),
  }),
  "post_api_admin_v1_payment_configs": defineOperation<AdminOperationInput<"post_api_admin_v1_payment_configs">, AdminOperationOutput<"post_api_admin_v1_payment_configs">>({
    id: "post_api_admin_v1_payment_configs",
    method: "POST",
    path: "/api/admin/v1/payment/configs",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_payment_configs">>(responseDataSchemas["post_api_admin_v1_payment_configs"]),
    telemetryName: "admin.post.api.admin.v1.payment.configs",
    encode: (input) => input,
  }),
  "post_api_admin_v1_payment_configs_id_test": defineOperation<AdminOperationInput<"post_api_admin_v1_payment_configs_id_test">, AdminOperationOutput<"post_api_admin_v1_payment_configs_id_test">>({
    id: "post_api_admin_v1_payment_configs_id_test",
    method: "POST",
    path: "/api/admin/v1/payment/configs/{id}/test",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_payment_configs_id_test">>(responseDataSchemas["post_api_admin_v1_payment_configs_id_test"]),
    telemetryName: "admin.post.api.admin.v1.payment.configs.id.test",
    encode: (input) => input,
  }),
  "post_api_admin_v1_payment_recharges": defineOperation<AdminOperationInput<"post_api_admin_v1_payment_recharges">, AdminOperationOutput<"post_api_admin_v1_payment_recharges">>({
    id: "post_api_admin_v1_payment_recharges",
    method: "POST",
    path: "/api/admin/v1/payment/recharges",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_payment_recharges">>(responseDataSchemas["post_api_admin_v1_payment_recharges"]),
    telemetryName: "admin.post.api.admin.v1.payment.recharges",
    encode: (input) => input,
  }),
  "post_api_admin_v1_payment_recharges_id_pay": defineOperation<AdminOperationInput<"post_api_admin_v1_payment_recharges_id_pay">, AdminOperationOutput<"post_api_admin_v1_payment_recharges_id_pay">>({
    id: "post_api_admin_v1_payment_recharges_id_pay",
    method: "POST",
    path: "/api/admin/v1/payment/recharges/{id}/pay",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_payment_recharges_id_pay">>(responseDataSchemas["post_api_admin_v1_payment_recharges_id_pay"]),
    telemetryName: "admin.post.api.admin.v1.payment.recharges.id.pay",
    encode: (input) => input,
  }),
  "post_api_admin_v1_permissions": defineOperation<AdminOperationInput<"post_api_admin_v1_permissions">, AdminOperationOutput<"post_api_admin_v1_permissions">>({
    id: "post_api_admin_v1_permissions",
    method: "POST",
    path: "/api/admin/v1/permissions",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_permissions">>(responseDataSchemas["post_api_admin_v1_permissions"]),
    telemetryName: "admin.post.api.admin.v1.permissions",
    encode: (input) => input,
  }),
  "post_api_admin_v1_roles": defineOperation<AdminOperationInput<"post_api_admin_v1_roles">, AdminOperationOutput<"post_api_admin_v1_roles">>({
    id: "post_api_admin_v1_roles",
    method: "POST",
    path: "/api/admin/v1/roles",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_roles">>(responseDataSchemas["post_api_admin_v1_roles"]),
    telemetryName: "admin.post.api.admin.v1.roles",
    encode: (input) => input,
  }),
  "post_api_admin_v1_sms_templates": defineOperation<AdminOperationInput<"post_api_admin_v1_sms_templates">, AdminOperationOutput<"post_api_admin_v1_sms_templates">>({
    id: "post_api_admin_v1_sms_templates",
    method: "POST",
    path: "/api/admin/v1/sms/templates",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_sms_templates">>(responseDataSchemas["post_api_admin_v1_sms_templates"]),
    telemetryName: "admin.post.api.admin.v1.sms.templates",
    encode: (input) => input,
  }),
  "post_api_admin_v1_sms_test": defineOperation<AdminOperationInput<"post_api_admin_v1_sms_test">, AdminOperationOutput<"post_api_admin_v1_sms_test">>({
    id: "post_api_admin_v1_sms_test",
    method: "POST",
    path: "/api/admin/v1/sms/test",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_sms_test">>(responseDataSchemas["post_api_admin_v1_sms_test"]),
    telemetryName: "admin.post.api.admin.v1.sms.test",
    encode: (input) => input,
  }),
  "post_api_admin_v1_system_settings": defineOperation<AdminOperationInput<"post_api_admin_v1_system_settings">, AdminOperationOutput<"post_api_admin_v1_system_settings">>({
    id: "post_api_admin_v1_system_settings",
    method: "POST",
    path: "/api/admin/v1/system-settings",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_system_settings">>(responseDataSchemas["post_api_admin_v1_system_settings"]),
    telemetryName: "admin.post.api.admin.v1.system.settings",
    encode: (input) => input,
  }),
  "post_api_admin_v1_upload_drivers": defineOperation<AdminOperationInput<"post_api_admin_v1_upload_drivers">, AdminOperationOutput<"post_api_admin_v1_upload_drivers">>({
    id: "post_api_admin_v1_upload_drivers",
    method: "POST",
    path: "/api/admin/v1/upload-drivers",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_upload_drivers">>(responseDataSchemas["post_api_admin_v1_upload_drivers"]),
    telemetryName: "admin.post.api.admin.v1.upload.drivers",
    encode: (input) => input,
  }),
  "post_api_admin_v1_upload_rules": defineOperation<AdminOperationInput<"post_api_admin_v1_upload_rules">, AdminOperationOutput<"post_api_admin_v1_upload_rules">>({
    id: "post_api_admin_v1_upload_rules",
    method: "POST",
    path: "/api/admin/v1/upload-rules",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_upload_rules">>(responseDataSchemas["post_api_admin_v1_upload_rules"]),
    telemetryName: "admin.post.api.admin.v1.upload.rules",
    encode: (input) => input,
  }),
  "post_api_admin_v1_upload_settings": defineOperation<AdminOperationInput<"post_api_admin_v1_upload_settings">, AdminOperationOutput<"post_api_admin_v1_upload_settings">>({
    id: "post_api_admin_v1_upload_settings",
    method: "POST",
    path: "/api/admin/v1/upload-settings",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_upload_settings">>(responseDataSchemas["post_api_admin_v1_upload_settings"]),
    telemetryName: "admin.post.api.admin.v1.upload.settings",
    encode: (input) => input,
  }),
  "post_api_admin_v1_upload_tokens": defineOperation<AdminOperationInput<"post_api_admin_v1_upload_tokens">, AdminOperationOutput<"post_api_admin_v1_upload_tokens">>({
    id: "post_api_admin_v1_upload_tokens",
    method: "POST",
    path: "/api/admin/v1/upload-tokens",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_upload_tokens">>(responseDataSchemas["post_api_admin_v1_upload_tokens"]),
    telemetryName: "admin.post.api.admin.v1.upload.tokens",
    encode: (input) => input,
  }),
  "post_api_admin_v1_users_export": defineOperation<AdminOperationInput<"post_api_admin_v1_users_export">, AdminOperationOutput<"post_api_admin_v1_users_export">>({
    id: "post_api_admin_v1_users_export",
    method: "POST",
    path: "/api/admin/v1/users/export",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"post_api_admin_v1_users_export">>(responseDataSchemas["post_api_admin_v1_users_export"]),
    telemetryName: "admin.post.api.admin.v1.users.export",
    encode: (input) => input,
  }),
  "put_api_admin_v1_ai_agents_id": defineOperation<AdminOperationInput<"put_api_admin_v1_ai_agents_id">, AdminOperationOutput<"put_api_admin_v1_ai_agents_id">>({
    id: "put_api_admin_v1_ai_agents_id",
    method: "PUT",
    path: "/api/admin/v1/ai-agents/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_ai_agents_id">>(responseDataSchemas["put_api_admin_v1_ai_agents_id"]),
    telemetryName: "admin.put.api.admin.v1.ai.agents.id",
    encode: (input) => input,
  }),
  "put_api_admin_v1_ai_agents_id_knowledge_bases": defineOperation<AdminOperationInput<"put_api_admin_v1_ai_agents_id_knowledge_bases">, AdminOperationOutput<"put_api_admin_v1_ai_agents_id_knowledge_bases">>({
    id: "put_api_admin_v1_ai_agents_id_knowledge_bases",
    method: "PUT",
    path: "/api/admin/v1/ai-agents/{id}/knowledge-bases",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_ai_agents_id_knowledge_bases">>(responseDataSchemas["put_api_admin_v1_ai_agents_id_knowledge_bases"]),
    telemetryName: "admin.put.api.admin.v1.ai.agents.id.knowledge.bases",
    encode: (input) => input,
  }),
  "put_api_admin_v1_ai_agents_id_tools": defineOperation<AdminOperationInput<"put_api_admin_v1_ai_agents_id_tools">, AdminOperationOutput<"put_api_admin_v1_ai_agents_id_tools">>({
    id: "put_api_admin_v1_ai_agents_id_tools",
    method: "PUT",
    path: "/api/admin/v1/ai-agents/{id}/tools",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_ai_agents_id_tools">>(responseDataSchemas["put_api_admin_v1_ai_agents_id_tools"]),
    telemetryName: "admin.put.api.admin.v1.ai.agents.id.tools",
    encode: (input) => input,
  }),
  "put_api_admin_v1_ai_conversations_id": defineOperation<AdminOperationInput<"put_api_admin_v1_ai_conversations_id">, AdminOperationOutput<"put_api_admin_v1_ai_conversations_id">>({
    id: "put_api_admin_v1_ai_conversations_id",
    method: "PUT",
    path: "/api/admin/v1/ai-conversations/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_ai_conversations_id">>(responseDataSchemas["put_api_admin_v1_ai_conversations_id"]),
    telemetryName: "admin.put.api.admin.v1.ai.conversations.id",
    encode: (input) => input,
  }),
  "put_api_admin_v1_ai_knowledge_bases_id": defineOperation<AdminOperationInput<"put_api_admin_v1_ai_knowledge_bases_id">, AdminOperationOutput<"put_api_admin_v1_ai_knowledge_bases_id">>({
    id: "put_api_admin_v1_ai_knowledge_bases_id",
    method: "PUT",
    path: "/api/admin/v1/ai-knowledge-bases/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_ai_knowledge_bases_id">>(responseDataSchemas["put_api_admin_v1_ai_knowledge_bases_id"]),
    telemetryName: "admin.put.api.admin.v1.ai.knowledge.bases.id",
    encode: (input) => input,
  }),
  "put_api_admin_v1_ai_knowledge_documents_id": defineOperation<AdminOperationInput<"put_api_admin_v1_ai_knowledge_documents_id">, AdminOperationOutput<"put_api_admin_v1_ai_knowledge_documents_id">>({
    id: "put_api_admin_v1_ai_knowledge_documents_id",
    method: "PUT",
    path: "/api/admin/v1/ai-knowledge-documents/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_ai_knowledge_documents_id">>(responseDataSchemas["put_api_admin_v1_ai_knowledge_documents_id"]),
    telemetryName: "admin.put.api.admin.v1.ai.knowledge.documents.id",
    encode: (input) => input,
  }),
  "put_api_admin_v1_ai_providers_id": defineOperation<AdminOperationInput<"put_api_admin_v1_ai_providers_id">, AdminOperationOutput<"put_api_admin_v1_ai_providers_id">>({
    id: "put_api_admin_v1_ai_providers_id",
    method: "PUT",
    path: "/api/admin/v1/ai-providers/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_ai_providers_id">>(responseDataSchemas["put_api_admin_v1_ai_providers_id"]),
    telemetryName: "admin.put.api.admin.v1.ai.providers.id",
    encode: (input) => input,
  }),
  "put_api_admin_v1_ai_providers_id_models": defineOperation<AdminOperationInput<"put_api_admin_v1_ai_providers_id_models">, AdminOperationOutput<"put_api_admin_v1_ai_providers_id_models">>({
    id: "put_api_admin_v1_ai_providers_id_models",
    method: "PUT",
    path: "/api/admin/v1/ai-providers/{id}/models",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_ai_providers_id_models">>(responseDataSchemas["put_api_admin_v1_ai_providers_id_models"]),
    telemetryName: "admin.put.api.admin.v1.ai.providers.id.models",
    encode: (input) => input,
  }),
  "put_api_admin_v1_ai_tools_id": defineOperation<AdminOperationInput<"put_api_admin_v1_ai_tools_id">, AdminOperationOutput<"put_api_admin_v1_ai_tools_id">>({
    id: "put_api_admin_v1_ai_tools_id",
    method: "PUT",
    path: "/api/admin/v1/ai-tools/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_ai_tools_id">>(responseDataSchemas["put_api_admin_v1_ai_tools_id"]),
    telemetryName: "admin.put.api.admin.v1.ai.tools.id",
    encode: (input) => input,
  }),
  "put_api_admin_v1_auth_platforms_id": defineOperation<AdminOperationInput<"put_api_admin_v1_auth_platforms_id">, AdminOperationOutput<"put_api_admin_v1_auth_platforms_id">>({
    id: "put_api_admin_v1_auth_platforms_id",
    method: "PUT",
    path: "/api/admin/v1/auth-platforms/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_auth_platforms_id">>(responseDataSchemas["put_api_admin_v1_auth_platforms_id"]),
    telemetryName: "admin.put.api.admin.v1.auth.platforms.id",
    encode: (input) => input,
  }),
  "put_api_admin_v1_cron_tasks_id": defineOperation<AdminOperationInput<"put_api_admin_v1_cron_tasks_id">, AdminOperationOutput<"put_api_admin_v1_cron_tasks_id">>({
    id: "put_api_admin_v1_cron_tasks_id",
    method: "PUT",
    path: "/api/admin/v1/cron-tasks/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_cron_tasks_id">>(responseDataSchemas["put_api_admin_v1_cron_tasks_id"]),
    telemetryName: "admin.put.api.admin.v1.cron.tasks.id",
    encode: (input) => input,
  }),
  "put_api_admin_v1_mail_config": defineOperation<AdminOperationInput<"put_api_admin_v1_mail_config">, AdminOperationOutput<"put_api_admin_v1_mail_config">>({
    id: "put_api_admin_v1_mail_config",
    method: "PUT",
    path: "/api/admin/v1/mail/config",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_mail_config">>(responseDataSchemas["put_api_admin_v1_mail_config"]),
    telemetryName: "admin.put.api.admin.v1.mail.config",
    encode: (input) => input,
  }),
  "put_api_admin_v1_mail_templates_id": defineOperation<AdminOperationInput<"put_api_admin_v1_mail_templates_id">, AdminOperationOutput<"put_api_admin_v1_mail_templates_id">>({
    id: "put_api_admin_v1_mail_templates_id",
    method: "PUT",
    path: "/api/admin/v1/mail/templates/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_mail_templates_id">>(responseDataSchemas["put_api_admin_v1_mail_templates_id"]),
    telemetryName: "admin.put.api.admin.v1.mail.templates.id",
    encode: (input) => input,
  }),
  "put_api_admin_v1_payment_configs_id": defineOperation<AdminOperationInput<"put_api_admin_v1_payment_configs_id">, AdminOperationOutput<"put_api_admin_v1_payment_configs_id">>({
    id: "put_api_admin_v1_payment_configs_id",
    method: "PUT",
    path: "/api/admin/v1/payment/configs/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_payment_configs_id">>(responseDataSchemas["put_api_admin_v1_payment_configs_id"]),
    telemetryName: "admin.put.api.admin.v1.payment.configs.id",
    encode: (input) => input,
  }),
  "put_api_admin_v1_permissions_id": defineOperation<AdminOperationInput<"put_api_admin_v1_permissions_id">, AdminOperationOutput<"put_api_admin_v1_permissions_id">>({
    id: "put_api_admin_v1_permissions_id",
    method: "PUT",
    path: "/api/admin/v1/permissions/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_permissions_id">>(responseDataSchemas["put_api_admin_v1_permissions_id"]),
    telemetryName: "admin.put.api.admin.v1.permissions.id",
    encode: (input) => input,
  }),
  "put_api_admin_v1_profile": defineOperation<AdminOperationInput<"put_api_admin_v1_profile">, AdminOperationOutput<"put_api_admin_v1_profile">>({
    id: "put_api_admin_v1_profile",
    method: "PUT",
    path: "/api/admin/v1/profile",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_profile">>(responseDataSchemas["put_api_admin_v1_profile"]),
    telemetryName: "admin.put.api.admin.v1.profile",
    encode: (input) => input,
  }),
  "put_api_admin_v1_profile_security_email": defineOperation<AdminOperationInput<"put_api_admin_v1_profile_security_email">, AdminOperationOutput<"put_api_admin_v1_profile_security_email">>({
    id: "put_api_admin_v1_profile_security_email",
    method: "PUT",
    path: "/api/admin/v1/profile/security/email",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_profile_security_email">>(responseDataSchemas["put_api_admin_v1_profile_security_email"]),
    telemetryName: "admin.put.api.admin.v1.profile.security.email",
    encode: (input) => input,
  }),
  "put_api_admin_v1_profile_security_password": defineOperation<AdminOperationInput<"put_api_admin_v1_profile_security_password">, AdminOperationOutput<"put_api_admin_v1_profile_security_password">>({
    id: "put_api_admin_v1_profile_security_password",
    method: "PUT",
    path: "/api/admin/v1/profile/security/password",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_profile_security_password">>(responseDataSchemas["put_api_admin_v1_profile_security_password"]),
    telemetryName: "admin.put.api.admin.v1.profile.security.password",
    encode: (input) => input,
  }),
  "put_api_admin_v1_profile_security_phone": defineOperation<AdminOperationInput<"put_api_admin_v1_profile_security_phone">, AdminOperationOutput<"put_api_admin_v1_profile_security_phone">>({
    id: "put_api_admin_v1_profile_security_phone",
    method: "PUT",
    path: "/api/admin/v1/profile/security/phone",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_profile_security_phone">>(responseDataSchemas["put_api_admin_v1_profile_security_phone"]),
    telemetryName: "admin.put.api.admin.v1.profile.security.phone",
    encode: (input) => input,
  }),
  "put_api_admin_v1_roles_id": defineOperation<AdminOperationInput<"put_api_admin_v1_roles_id">, AdminOperationOutput<"put_api_admin_v1_roles_id">>({
    id: "put_api_admin_v1_roles_id",
    method: "PUT",
    path: "/api/admin/v1/roles/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_roles_id">>(responseDataSchemas["put_api_admin_v1_roles_id"]),
    telemetryName: "admin.put.api.admin.v1.roles.id",
    encode: (input) => input,
  }),
  "put_api_admin_v1_sms_config": defineOperation<AdminOperationInput<"put_api_admin_v1_sms_config">, AdminOperationOutput<"put_api_admin_v1_sms_config">>({
    id: "put_api_admin_v1_sms_config",
    method: "PUT",
    path: "/api/admin/v1/sms/config",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_sms_config">>(responseDataSchemas["put_api_admin_v1_sms_config"]),
    telemetryName: "admin.put.api.admin.v1.sms.config",
    encode: (input) => input,
  }),
  "put_api_admin_v1_sms_templates_id": defineOperation<AdminOperationInput<"put_api_admin_v1_sms_templates_id">, AdminOperationOutput<"put_api_admin_v1_sms_templates_id">>({
    id: "put_api_admin_v1_sms_templates_id",
    method: "PUT",
    path: "/api/admin/v1/sms/templates/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_sms_templates_id">>(responseDataSchemas["put_api_admin_v1_sms_templates_id"]),
    telemetryName: "admin.put.api.admin.v1.sms.templates.id",
    encode: (input) => input,
  }),
  "put_api_admin_v1_system_settings_id": defineOperation<AdminOperationInput<"put_api_admin_v1_system_settings_id">, AdminOperationOutput<"put_api_admin_v1_system_settings_id">>({
    id: "put_api_admin_v1_system_settings_id",
    method: "PUT",
    path: "/api/admin/v1/system-settings/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_system_settings_id">>(responseDataSchemas["put_api_admin_v1_system_settings_id"]),
    telemetryName: "admin.put.api.admin.v1.system.settings.id",
    encode: (input) => input,
  }),
  "put_api_admin_v1_upload_drivers_id": defineOperation<AdminOperationInput<"put_api_admin_v1_upload_drivers_id">, AdminOperationOutput<"put_api_admin_v1_upload_drivers_id">>({
    id: "put_api_admin_v1_upload_drivers_id",
    method: "PUT",
    path: "/api/admin/v1/upload-drivers/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_upload_drivers_id">>(responseDataSchemas["put_api_admin_v1_upload_drivers_id"]),
    telemetryName: "admin.put.api.admin.v1.upload.drivers.id",
    encode: (input) => input,
  }),
  "put_api_admin_v1_upload_rules_id": defineOperation<AdminOperationInput<"put_api_admin_v1_upload_rules_id">, AdminOperationOutput<"put_api_admin_v1_upload_rules_id">>({
    id: "put_api_admin_v1_upload_rules_id",
    method: "PUT",
    path: "/api/admin/v1/upload-rules/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_upload_rules_id">>(responseDataSchemas["put_api_admin_v1_upload_rules_id"]),
    telemetryName: "admin.put.api.admin.v1.upload.rules.id",
    encode: (input) => input,
  }),
  "put_api_admin_v1_upload_settings_id": defineOperation<AdminOperationInput<"put_api_admin_v1_upload_settings_id">, AdminOperationOutput<"put_api_admin_v1_upload_settings_id">>({
    id: "put_api_admin_v1_upload_settings_id",
    method: "PUT",
    path: "/api/admin/v1/upload-settings/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_upload_settings_id">>(responseDataSchemas["put_api_admin_v1_upload_settings_id"]),
    telemetryName: "admin.put.api.admin.v1.upload.settings.id",
    encode: (input) => input,
  }),
  "put_api_admin_v1_users_id": defineOperation<AdminOperationInput<"put_api_admin_v1_users_id">, AdminOperationOutput<"put_api_admin_v1_users_id">>({
    id: "put_api_admin_v1_users_id",
    method: "PUT",
    path: "/api/admin/v1/users/{id}",
    auth: "required",
    timeout: "interactive",
    replay: "never",
    responseSchema: schemaCompiler.compile<AdminOperationOutput<"put_api_admin_v1_users_id">>(responseDataSchemas["put_api_admin_v1_users_id"]),
    telemetryName: "admin.put.api.admin.v1.users.id",
    encode: (input) => input,
  }),
} as const
