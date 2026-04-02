// Tool definitions in Anthropic API format.
// These are passed directly to the Claude API as the `tools` array.

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const STUDIO_TOOLS: AnthropicTool[] = [
  {
    name: "read_content",
    description:
      "Read a content file from the site repository. Use this to see the current content before making changes.",
    input_schema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description:
            "Path relative to the repo root. Example: content/site.config.json, content/pages/home.data.json",
        },
      },
      required: ["file_path"],
    },
  },

  {
    name: "update_content",
    description:
      "Update specific fields in a JSON content file. Use dot notation for nested paths. This will create a preview branch if one does not exist yet.",
    input_schema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path to the JSON file to update.",
        },
        changes: {
          type: "array",
          description: "List of field changes to apply.",
          items: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description:
                  "Dot notation path to the field. Use [index] for arrays, [id=value] to match by id. " +
                  "Examples: contact.phone, sections[id=hero-principal].data.headline",
              },
              value: {
                description: "The new value to set.",
              },
            },
            required: ["path", "value"],
          },
        },
      },
      required: ["file_path", "changes"],
    },
  },

  {
    name: "add_list_item",
    description: "Add a new item to an array in a JSON content file.",
    input_schema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path to the JSON file to update.",
        },
        list_path: {
          type: "string",
          description:
            "Dot notation path to the array. Example: sections, services.items",
        },
        item: {
          type: "object",
          description: "The item to add to the array.",
        },
        position: {
          type: "string",
          enum: ["start", "end"],
          description:
            "Where to insert the item: 'start' or 'end'. Defaults to 'end'.",
        },
      },
      required: ["file_path", "list_path", "item"],
    },
  },

  {
    name: "remove_list_item",
    description: "Remove an item from an array in a JSON content file.",
    input_schema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path to the JSON file to update.",
        },
        list_path: {
          type: "string",
          description: "Dot notation path to the array.",
        },
        match: {
          type: "object",
          description:
            "Key-value pairs used to identify the item to remove. All pairs must match. " +
            'Example: { "id": "hero-principal" } or { "author": "Maria C." }',
        },
      },
      required: ["file_path", "list_path", "match"],
    },
  },

  {
    name: "reorder_list",
    description: "Reorder items in an array in a JSON content file.",
    input_schema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path to the JSON file to update.",
        },
        list_path: {
          type: "string",
          description: "Dot notation path to the array.",
        },
        new_order: {
          type: "array",
          items: { type: "integer" },
          description:
            "Original indices in the desired new order. " +
            "Example: [2, 0, 1] moves the third item to first position.",
        },
      },
      required: ["file_path", "list_path", "new_order"],
    },
  },

  {
    name: "list_pages",
    description:
      "List all pages available in the site with their slugs and section counts.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },

  {
    name: "get_component_types",
    description:
      "Read the TypeScript interface of a section component to understand its data structure. " +
      "Use this when you need to know what fields a section type accepts.",
    input_schema: {
      type: "object",
      properties: {
        section_type: {
          type: "string",
          description:
            "The section type as used in data JSON files. Examples: hero, features, contact-section, portfolio-preview",
        },
      },
      required: ["section_type"],
    },
  },

  {
    name: "get_session_status",
    description:
      "Get the current edit session status including the preview URL and list of changes made.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
];
