import { Pressable, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { AgentResult } from "@/types/agent";
import * as DocumentPicker from "expo-document-picker";
import { getUserFriendlyErrorMessage } from "@/utils/errorMessages";
import FilePicker from "@/components/FilePicker";
import { AgentStatus } from "@/types/agent";

type AgentCardProps = {
  name: string;
  description: string;
  onRun: (
    query: string,
    file?: DocumentPicker.DocumentPickerAsset
  ) => Promise<AgentResult>;

  supportsFileUpload?: boolean;
};

export default function AgentCard({
  name,
  description,
  onRun,
  supportsFileUpload = false,
}: AgentCardProps) {
  const [status, setStatus] = useState<AgentStatus>("Idle");
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<AgentResult | null>(null);
  const [agentError, setAgentError] = useState("");
  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const handleRun = async () => {
    if (!query.trim()) {
      return;
    }

    setStatus("Running");
    setResponse(null);
    setAgentError("");

    try {
      const result = await onRun(
        query.trim(),
        selectedFile ?? undefined,
    );

      setResponse(result);
      setStatus("Completed");

    } catch (error) {
      if (error instanceof Error) {
        setAgentError(
          getUserFriendlyErrorMessage(
            error,
            "The agent couldn't complete that request. Please try again.",
          ),
        );

      } else {
        setAgentError("Agent failed. Please try again.");
      }

      setStatus("Error");
    }
  };

  return (
    <View className="rounded-xl bg-white p-5">
      <Text className="text-2xl font-bold">
        {name}
      </Text>

      <Text className="mt-2 text-gray-600">
        {description}
      </Text>

      <Text className="mt-4 font-bold">
        Status: {status}
      </Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Ask anything..."
        editable={status !== "Running"}
        className="mt-4 rounded-lg border p-4"
      />

      {supportsFileUpload ? (
        <FilePicker
          onFileSelected={setSelectedFile}
        />
      ) : null}

      {selectedFile ? (
        <Text className="mt-2">
          Selected: {selectedFile.name}
        </Text>
      ) : null}

      {agentError ? (
        <View className="mt-4 rounded-lg bg-red-100 p-4">
          <Text className="font-bold text-red-700">
            Agent Error
          </Text>

          <Text className="mt-2 text-red-600">
            {agentError}
          </Text>
        </View>
      ) : null}

      {response ? (
        <View className="mt-4 rounded-lg bg-gray-100 p-4">
          <Text className="font-bold">
            Response
          </Text>

          <Text className="mt-2">
            {response.answer}
          </Text>
        </View>
      ) : null}

      <Pressable
        onPress={handleRun}
        disabled={status === "Running"}
        className="mt-4 rounded-lg bg-blue-600 p-4"
      >
        <Text className="text-center font-bold text-white">
          {status === "Running"
            ? "Running..."
            : status === "Error"
              ? "Retry Agent"
              : "Run Agent"}
        </Text>
      </Pressable>
    </View>
  );
}

