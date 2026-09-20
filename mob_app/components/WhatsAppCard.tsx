
  import { useCallback, useEffect, useState } from "react";
  import { getUserFriendlyErrorMessage } from "@/utils/errorMessages";
  import type { WhatsAppDraft, ConversationThread } from "@/types/whatsapp";
  import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
  import {
    getPendingDrafts,
    getDraftThread,
    approveDraft,
    rejectDraft,
    sendDraft,
  } from "@/services/whatsappService";



  const POLL_INTERVAL_MS = 8000;

  export default function WhatsAppCard() {
    const [drafts, setDrafts] = useState<WhatsAppDraft[]>([]);
    const [selectedDraft, setSelectedDraft] = useState<WhatsAppDraft | null>(null);
    const [thread, setThread] = useState<ConversationThread | null>(null);
    const [editedText, setEditedText] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [error, setError] = useState("");

    const fetchDrafts = useCallback(async () => {
      try {
        const data = await getPendingDrafts();
        setDrafts(data);
      } catch (error) {

        if (error instanceof Error) {
          setError(
            getUserFriendlyErrorMessage(
              error,
              "Something went wrong. Please try again.",
            ),
          );

        } else {
          setError("Couldn't load drafts.");
        }
      }
    }, []);

    useEffect(() => {
      fetchDrafts();

      const interval = setInterval(
        fetchDrafts,
        POLL_INTERVAL_MS
      );

      return () => clearInterval(interval);
    }, [fetchDrafts]);

    const selectDraft = async (draft: WhatsAppDraft) => {
      setSelectedDraft(draft);
      setEditedText(draft.draft_content);
      setThread(null);
      setError("");
      setIsLoading(true);

      try {
        const threadData = await getDraftThread(draft.id);
        setThread(threadData);
      } catch (error) {

        if (error instanceof Error) {
          setError(
            getUserFriendlyErrorMessage(
              error,
              "Something went wrong. Please try again.",
            ),
          );

        } else {
          setError("Couldn't load conversation history.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    const handleReject = async () => {
      if (!selectedDraft) {
        return;
      }

      setIsBusy(true);
      setError("");

      try {
        await rejectDraft(selectedDraft.id);

        setDrafts((current) =>
          current.filter(
            (draft) => draft.id !== selectedDraft.id
          )
        );

        setSelectedDraft(null);
        setThread(null);
        setEditedText("");
      } catch (error) {

        if (error instanceof Error) {
          setError(
            getUserFriendlyErrorMessage(
              error,
              "Something went wrong. Please try again.",
            ),
          );

        } else {
          setError("Failed to reject draft.");
        }
      } finally {
        setIsBusy(false);
      }
    };

    const handleConfirmSend = async () => {
      if (!selectedDraft) {
        return;
      }

      if (!editedText.trim()) {
        setError("Reply cannot be empty.");
        return;
      }

      setIsBusy(true);
      setError("");

      try {
        const wasEdited =
          editedText.trim() !==
          selectedDraft.draft_content.trim();

        await approveDraft(
          selectedDraft.id,
          wasEdited ? editedText.trim() : null
        );

        await sendDraft(selectedDraft.id);

        setDrafts((current) =>
          current.filter(
            (draft) => draft.id !== selectedDraft.id
          )
        );

        setSelectedDraft(null);
        setThread(null);
        setEditedText("");
      } catch (error) {

        if (error instanceof Error) {
          setError(
            getUserFriendlyErrorMessage(
              error,
              "Something went wrong. Please try again.",
            ),
          );

        } else {
          setError("Failed to send draft.");
        }
      } finally {
        setIsBusy(false);
      }
    };

    return (
      <View className="flex-1 rounded-xl bg-white p-5">
        <Text className="text-2xl font-bold">
          WhatsApp Agent
        </Text>

        <Text className="mt-2 text-gray-600">
          Review and manage pending WhatsApp replies.
        </Text>

        {error ? (
          <View className="mt-4 rounded-lg bg-red-100 p-4">
            <Text className="font-bold text-red-700">
              WhatsApp Error
            </Text>

            <Text className="mt-1 text-red-600">
              {error}
            </Text>
          </View>
        ) : null}

        <View className="mt-5 flex-1">
          <Text className="mb-3 text-lg font-bold">
            Pending Replies
          </Text>

          {drafts.length === 0 ? (
            <Text className="text-gray-500">
              Nothing waiting for review.
            </Text>
          ) : (
            <ScrollView>
              {drafts.map((draft) => (
                <Pressable
                  key={draft.id}
                  onPress={() => selectDraft(draft)}
                  disabled={isBusy}
                  className="mb-3 rounded-lg border p-4"
                >
                  <Text className="font-bold">
                    {draft.customer_name ||
                      draft.customer_phone ||
                      "Unknown customer"}
                  </Text>

                  <Text
                    className="mt-1 text-gray-600"
                    numberOfLines={2}
                  >
                    {draft.draft_content}
                  </Text>

                  <Text className="mt-2 text-xs text-gray-400">
                    {new Date(
                      draft.created_at
                    ).toLocaleTimeString()}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {selectedDraft ? (
            <View className="mt-5 flex-1">
              <Text className="text-lg font-bold">
                Conversation
              </Text>

              {thread ? (
                <ScrollView className="mt-3 max-h-64">
                  {thread.messages.map((message) => (
                    <View
                      key={message.id}
                      className={`mb-2 max-w-[85%] rounded-lg p-3 ${
                        message.direction === "inbound"
                          ? "self-start bg-gray-200"
                          : "self-end bg-green-100"
                      }`}
                    >
                      <Text>
                        {message.content}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              ) : isLoading ? (
                <Text className="mt-3 text-gray-500">
                  Loading conversation...
                </Text>
              ) : null}

              <TextInput
                value={editedText}
                onChangeText={setEditedText}
                editable={!isBusy}
                multiline
                placeholder="Edit reply before sending..."
                className="mt-4 min-h-24 rounded-lg border p-4"
              />

              <View className="mt-3 flex-row gap-3">
                <Pressable
                  onPress={handleReject}
                  disabled={isBusy}
                  className="flex-1 rounded-lg bg-gray-600 p-4"
                >
                  <Text className="text-center font-bold text-white">
                    Reject
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleConfirmSend}
                  disabled={
                    isBusy || !editedText.trim()
                  }
                  className="flex-1 rounded-lg bg-green-600 p-4"
                >
                  <Text className="text-center font-bold text-white">
                    {isBusy
                      ? "Sending..."
                      : "Confirm & Send"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    );
  }