import { Text, View } from "react-native";
import AgentCard from "@/components/AgentCard";
import { executeRoadQuery } from "@/services/roadService";
import * as DocumentPicker from 'expo-document-picker';


export default function RoadAgent() {
  const handleRoadRequest = async (
    query: string,
    file?: DocumentPicker.DocumentPickerAsset,
  ) => {
    const result = await executeRoadQuery({
      query,
      method: "auto",
      file, 
    });

    console.log("Road response:", result);

    return {
      method: result.method,
      answer: result.answer,
      document: result.document, 
      cost: result.cost,
    };
  };

  return (
    <View className="flex-1 bg-road p-6">
      <Text className="mb-6 text-3xl font-bold">
        Road Agent
      </Text>

      <AgentCard
        name="Road Agent"
        description="Ask the Road Agent questions and receive road-related assistance."
        onRun={handleRoadRequest}
        supportsFileUpload = {true}
      />
    </View>
  );
}